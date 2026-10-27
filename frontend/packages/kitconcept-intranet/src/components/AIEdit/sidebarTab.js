/**
 * The AI tab of the sidebar (customizations: Sidebar.jsx, and
 * volto-light-theme's block Edit.jsx).
 *
 * Volto switches the sidebar to the Block tab whenever a block is selected,
 * except while the Order tab (index 2) is open. The AI tab is kept open the
 * same way, so the editor can select a block and ask about it. Its index
 * is the one the Sidebar computes (after Document, Block, Order and the
 * settings tab, where shown): the Sidebar reports it here, the block Edit
 * reads it (a code review: a fixed index 3 left the tab on selection when
 * the tabs changed).
 */
import { defineMessages } from 'react-intl';

// The tab's label and tooltip; here, not in the Sidebar override, since
// the i18n extraction skips customizations
export const tabMessages = defineMessages({
  ai: {
    id: 'aiEditTab',
    defaultMessage: 'AI',
  },
  aiTitle: {
    id: 'aiEditTabTitle',
    defaultMessage: 'AI editing assistant',
  },
});

const ORDER_TAB = 2;

let aiTab = null;

/** The Sidebar reports where its AI tab is (null: not shown). */
export const setAiTabIndex = (index) => {
  aiTab = index;
};

/** Does selecting a block keep `tab` open: the Order tab or the AI tab? */
export const keptOnSelection = (tab) =>
  tab === ORDER_TAB || (aiTab !== null && tab === aiTab);
