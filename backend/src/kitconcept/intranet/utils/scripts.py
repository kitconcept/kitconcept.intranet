from pathlib import Path

import json


truthy = frozenset(("t", "true", "y", "yes", "on", "1"))


def asbool(s):
    """Return the boolean value ``True`` if the case-lowered value of string
    input ``s`` is a :term:`truthy string`. If ``s`` is already one of the
    boolean values ``True`` or ``False``, return it."""
    if s is None:
        return False
    if isinstance(s, bool):
        return s
    s = str(s).strip()
    return s.lower() in truthy


def parse_answers(answers_file: Path, answers_env: dict) -> dict:
    answers = json.loads(answers_file.read_text())
    for key in answers:
        env_value = answers_env.get(key, "")
        if key == "setup_content" and env_value.strip():
            env_value = asbool(env_value)
        elif not env_value:
            continue
        # Override answers_file value
        answers[key] = env_value
    return answers
