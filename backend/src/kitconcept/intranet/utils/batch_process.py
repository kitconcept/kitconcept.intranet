"""Utilities to process content in transactional batches."""

from collections.abc import Callable
from collections.abc import Sequence
from dataclasses import dataclass
from plone import api
from transaction.interfaces import TransientError
from typing import Any

import itertools
import logging
import transaction


logger = logging.getLogger(__name__)


def run_in_transaction(retries=5, retry_callback=None):
    """Decorator to run a function in a transaction.

    If a ConflictError occurs when committing, it will retry up to the specified number of times.
    """

    def wrapper[T, **P](func: Callable[P, T]) -> Callable[P, T]:
        def run_with_retries(*args: P.args, **kw: P.kwargs) -> T:
            portal = api.portal.get()
            if portal._p_jar._registered_objects:
                raise Exception("Beginning new transaction with uncommitted changes!")
            i = retries
            while i > 0:
                try:
                    transaction.begin()
                    res = func(*args, **kw)
                    logger.debug("-- commit --")
                    transaction.commit()
                except TransientError:
                    transaction.abort()
                    i -= 1
                    if i == 0:
                        raise
                    if retry_callback is not None:
                        retry_callback(*args, **kw)
                    logger.info("-- retry after conflict --")
                else:
                    return res
            raise Exception("Unreachable code to satisfy type checker")

        return run_with_retries

    return wrapper


@dataclass
class BatchResult:
    path: str
    result: Any


class BatchProcess:
    """A batch process that applies a function to a sequence of objects
    and commits the result in batches.

    Each batch process has a name, a _collector_ which finds objects,
    and a _processor_ which processes one object.
    """

    def __init__(self, name, collector, processor):
        """
        name: name of the batch process (for logs)
        collector: function which returns an iterable to get all objects
        processor: function which processes one object and (optionally) returns a result

        Note: The iterable returned by the collector must be stable
        even if transactions are committed or aborted.
        """
        self.name = name
        self.collector = collector
        self.processor = processor

    def __repr__(self):
        return f"<BatchProcess {self.name}>"

    @staticmethod
    def collect_via_catalog(**kw):
        """Creates a batch collector which finds content via a catalog query"""

        def collector():
            for brain in api.content.find(unrestricted=True, **kw):
                try:
                    yield brain._unrestrictedGetObject()
                except Exception:  # noqa
                    continue

        return collector

    def run(self, batch_size=100, dry_run=False) -> list:
        """Runs the batch process and returns a list of results.

        Warning: This commits a transaction for each batch.
        """
        process_batch = (
            self._process_batch
            if dry_run
            else run_in_transaction()(self._process_batch)
        )

        logger.info(f"Starting batch process: {self.name}")
        results: list[BatchResult] = []
        for batch in itertools.batched(self.collector(), batch_size):
            results += process_batch(tuple(batch), start=len(results) + 1)
            logger.info(f"Processed {len(results)} items.")
        logger.info(f"Finished batch process: {self.name}\n")
        return results

    def _process_batch(self, batch: Sequence, start: int) -> list[BatchResult]:
        results = []
        for i, obj in enumerate(batch, start=start):
            path = _path(obj)
            logger.debug(f"  {i}: {path}")
            result = self.processor(obj)
            results.append(BatchResult(path, result))
        return results


def _path(obj):
    return "/".join(obj.getPhysicalPath()).replace("/Plone", "")
