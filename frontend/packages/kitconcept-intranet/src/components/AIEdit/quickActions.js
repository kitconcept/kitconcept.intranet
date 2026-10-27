/**
 * Default quick actions of the AI assistant panel (POC, see AI_EDIT_PLAN.md):
 * predefined requests shown as chips. Registered in
 * `config.settings.aiEdit.quickActions` (config/aiEdit.ts), so add-ons
 * can add or replace them; prompts managed in a control panel can be added
 * there later.
 *
 * A quick action is `{id, label, prompt}`. `label` and `prompt` are message
 * descriptors (translated) or plain strings (e.g. from a control panel). The
 * prompt is sent as the user's request; the answer language is the UI
 * language either way (see AIEditPanel).
 */
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  assess: { id: 'aiEditAssess', defaultMessage: 'Assess this page' },
  assessPrompt: {
    id: 'aiEditAssessPrompt',
    defaultMessage:
      'Assess this page: is it clear, well structured and complete? List the most important improvements. Do not change anything yet.',
  },
  improveTitle: {
    id: 'aiEditImproveTitle',
    defaultMessage: 'Improve title and description',
  },
  improveTitlePrompt: {
    id: 'aiEditImproveTitlePrompt',
    defaultMessage: 'Propose a better title and description for this page.',
  },
  shorten: { id: 'aiEditShorten', defaultMessage: 'Shorten the text' },
  shortenPrompt: {
    id: 'aiEditShortenPrompt',
    defaultMessage:
      'Make the text of this page shorter and easier to read without losing information. Go through every block.',
  },
  improveAll: {
    id: 'aiEditImproveAll',
    defaultMessage: 'Improve the whole page',
  },
  improveAllPrompt: {
    id: 'aiEditImproveAllPrompt',
    defaultMessage:
      'Improve the whole page in one proposal: a better title, a better description, and clearer, well structured text in every block that needs it. Keep all facts and links.',
  },
});

export const QUICK_ACTIONS = [
  { id: 'assess', label: messages.assess, prompt: messages.assessPrompt },
  {
    id: 'improveTitle',
    label: messages.improveTitle,
    prompt: messages.improveTitlePrompt,
  },
  { id: 'shorten', label: messages.shorten, prompt: messages.shortenPrompt },
  {
    id: 'improveAll',
    label: messages.improveAll,
    prompt: messages.improveAllPrompt,
  },
];

/** A label or prompt: a message descriptor or a plain string. */
export const formatText = (intl, text) =>
  typeof text === 'string' ? text : intl.formatMessage(text);
