import logging
from plone.app.discussion.interfaces import IConversation

logger = logging.getLogger("kitconcept.intranet")


def increase_comment_count(event):
    """Increase the Comment Count on an Object after a Comment has been added"""
    conversation = IConversation(event.object)
    comments = conversation.getComments() if conversation else []
    comments_total = [comment for comment in comments]
    comments_total = len(comments_total)
    value = comments_total
    value + 1
    event.object.comment_count = value
    logger.debug(f"Object {event.object.title} has comment_count of {value}")


def decrease_comment_count_and_set_deleted_flag(event):
    """Decrease the Comment Count on an Object after a Comment has been removed"""
    conversation = IConversation(event.object)
    comments = conversation.getComments() if conversation else []
    comments_total = [comment for comment in comments]
    comments_total = len(comments_total)
    value = comments_total
    if value != 0:
        value - 1
    event.object.comment_count = value
    event.object.has_deleted_comments = True
    logger.debug(f"Object {event.object.title} has comment_count of {value}")
