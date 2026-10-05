import { describe, expect, it } from 'vitest';
import { getFeedbackRecipient } from './feedbackRecipient';

describe('getFeedbackRecipient', () => {
  const responsiblePerson = {
    value: 'responsible-uid',
    title: 'Responsible Person',
    username: 'responsible',
  };

  it('uses the responsible person by default', () => {
    expect(
      getFeedbackRecipient({ responsible_person: responsiblePerson }),
    ).toEqual(responsiblePerson);
  });

  it('prefers the configured feedback person', () => {
    const feedbackPerson = {
      value: 'feedback-uid',
      title: 'Feedback Person',
      username: 'feedback',
    };

    expect(
      getFeedbackRecipient({
        feedback_person: feedbackPerson,
        responsible_person: responsiblePerson,
      }),
    ).toEqual(feedbackPerson);
  });
});
