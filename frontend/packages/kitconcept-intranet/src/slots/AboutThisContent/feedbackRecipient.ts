export type CLMPersonData = {
  value?: string;
  person_url?: string;
  title?: string;
  username?: string;
};

type CLMData = {
  feedback_person?: CLMPersonData;
  responsible_person?: CLMPersonData;
};

export const getFeedbackRecipient = (
  clm: CLMData | undefined,
): CLMPersonData | undefined =>
  clm?.feedback_person?.value ? clm.feedback_person : clm?.responsible_person;
