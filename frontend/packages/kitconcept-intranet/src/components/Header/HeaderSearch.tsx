import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { defineMessages, useIntl } from 'react-intl';
import { Button, Dialog, Modal, ModalOverlay } from 'react-aria-components';
import { Menu, MenuItem, MenuTrigger } from '@plone/components';
import { ChevrondownIcon } from '@plone/components/Icons';

import Icon from '@plone/volto/components/theme/Icon/Icon';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import zoomSVG from '@plone/volto/icons/zoom.svg';
import calendarSVG from '@plone/volto/icons/calendar.svg';
import checkSVG from '@plone/volto/icons/check.svg';
import fileSVG from '@plone/volto/icons/file.svg';
import folderSVG from '@plone/volto/icons/folder.svg';
import globeSVG from '@plone/volto/icons/globe.svg';
import imageSVG from '@plone/volto/icons/image.svg';
import linkSVG from '@plone/volto/icons/link.svg';
import newsSVG from '@plone/volto/icons/news.svg';
import pageSVG from '@plone/volto/icons/page.svg';
import userSVG from '@plone/volto/icons/user.svg';
import {
  ragSearch,
  resetRagSearch,
  solrSearchSuggestions,
} from '@kitconcept/volto-solr/actions';
import { useWorkspaceSwitcher } from '../NavigationTree/useWorkspaceSwitcher';
import type { SearchItem } from '../NavigationTree/useNavigationTree';

const messages = defineMessages({
  searchWorkspace: {
    id: 'Search workspace',
    defaultMessage: 'Search workspace',
  },
  searchPlaceholder: {
    id: 'Search…',
    defaultMessage: 'Search…',
  },
  search: {
    id: 'Search',
    defaultMessage: 'Search',
  },
  typeToSearch: {
    id: 'Start typing to search…',
    defaultMessage: 'Start typing to search…',
  },
  noResultsFor: {
    id: 'No results for “{term}”.',
    defaultMessage: 'No results for “{term}”.',
  },
  noResultsInScope: {
    id: 'No results in “{scope}”.',
    defaultMessage: 'No results in “{scope}”.',
  },
  searchEverywhere: {
    id: 'Search everywhere',
    defaultMessage: 'Search everywhere',
  },
  askAI: {
    id: 'Ask AI',
    defaultMessage: 'Ask AI',
  },
  aiOverview: {
    id: 'AI Overview',
    defaultMessage: 'AI Overview',
  },
  aiBeta: {
    id: 'Beta',
    defaultMessage: 'Beta',
  },
  aiLoading: {
    id: 'Generating answer…',
    defaultMessage: 'Generating answer…',
  },
  aiNoAnswer: {
    id: 'No answer — no matching documents found.',
    defaultMessage: 'No answer — no matching documents found.',
  },
  aiError: {
    id: 'The AI answer is currently unavailable. Please try again.',
    defaultMessage: 'The AI answer is currently unavailable. Please try again.',
  },
  aiSources: {
    id: 'Sources',
    defaultMessage: 'Sources',
  },
  aiFollowUp: {
    id: 'Ask a follow-up…',
    defaultMessage: 'Ask a follow-up…',
  },
  aiDisclaimer: {
    id: 'AI-generated answer. It may contain errors.',
    defaultMessage: 'AI-generated answer. It may contain errors.',
  },
  filterWorkspace: {
    id: 'Workspace',
    defaultMessage: 'Workspace',
  },
  filterType: {
    id: 'Type',
    defaultMessage: 'Type',
  },
  filterCreator: {
    id: 'Created by',
    defaultMessage: 'Created by',
  },
  filterUpdated: {
    id: 'Updated',
    defaultMessage: 'Updated',
  },
  filterStatus: {
    id: 'Status',
    defaultMessage: 'Status',
  },
  intranetPortal: {
    id: 'Intranet Portal',
    defaultMessage: 'Intranet Portal',
  },
  everywhere: {
    id: 'Everywhere',
    defaultMessage: 'Everywhere',
  },
  everywhereHint: {
    id: 'Search in all areas',
    defaultMessage: 'Search in all areas',
  },
  allTypes: {
    id: 'All types',
    defaultMessage: 'All types',
  },
  typePage: {
    id: 'Page',
    defaultMessage: 'Page',
  },
  typeNews: {
    id: 'News Item',
    defaultMessage: 'News Item',
  },
  typeFolder: {
    id: 'Folder',
    defaultMessage: 'Folder',
  },
  typeFile: {
    id: 'File',
    defaultMessage: 'File',
  },
  typeImage: {
    id: 'Image',
    defaultMessage: 'Image',
  },
  typeEvent: {
    id: 'Event',
    defaultMessage: 'Event',
  },
  typePerson: {
    id: 'Person',
    defaultMessage: 'Person',
  },
  creatorAll: {
    id: 'All',
    defaultMessage: 'All',
  },
  anyTime: {
    id: 'Any time',
    defaultMessage: 'Any time',
  },
  today: {
    id: 'Today',
    defaultMessage: 'Today',
  },
  last7Days: {
    id: 'Last 7 days',
    defaultMessage: 'Last 7 days',
  },
  last30Days: {
    id: 'Last 30 days',
    defaultMessage: 'Last 30 days',
  },
  last3Months: {
    id: 'Last 3 months',
    defaultMessage: 'Last 3 months',
  },
  lastYear: {
    id: 'Last year',
    defaultMessage: 'Last year',
  },
  allStatuses: {
    id: 'All statuses',
    defaultMessage: 'All statuses',
  },
  statusPublished: {
    id: 'Published',
    defaultMessage: 'Published',
  },
  statusInReview: {
    id: 'In review',
    defaultMessage: 'In review',
  },
  statusPrivate: {
    id: 'Private',
    defaultMessage: 'Private',
  },
  chipTitleOnly: {
    id: 'Search titles only',
    defaultMessage: 'Search titles only',
  },
  chipArchived: {
    id: 'Show archived content',
    defaultMessage: 'Show archived content',
  },
});

const typeIcons: Record<string, string> = {
  Folder: folderSVG,
  Document: pageSVG,
  'News Item': newsSVG,
  Event: calendarSVG,
  File: fileSVG,
  Image: imageSVG,
  Link: linkSVG,
  Person: userSVG,
  Member: userSVG,
};

type SuggestionItem = {
  '@id': string;
  '@type': string;
  title: string;
  effective?: string | null;
};

const SparkleIcon = () => (
  <svg
    className="header-search-sparkle"
    viewBox="0 0 24 24"
    width="15"
    height="15"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M12 2l2.09 5.66L20 9.75l-5.91 2.09L12 17.5l-2.09-5.66L4 9.75l5.91-2.09L12 2zm7 11l1.19 3.22L23.5 17.4l-3.31 1.18L19 21.8l-1.19-3.22-3.31-1.18 3.31-1.18L19 13z"
    />
  </svg>
);

// The filter chips mirror the approved design (ticket #426). The
// dropdowns open and remember a selection so they look and feel real,
// but they do not filter the results: the backing facets are not
// available on the backend yet, deferring them was accepted for the
// demo scope. The option lists are static demo data from the design.
const FilterChip = ({
  label,
  options,
  selected,
  onSelect,
  isActive,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  isActive: boolean;
}) => (
  <MenuTrigger>
    <Button
      className={`header-search-chip${isActive ? ' is-active' : ''}`}
      type="button"
    >
      {label}: {selected}
      <ChevrondownIcon aria-hidden="true" size="xs" />
    </Button>
    <Menu
      className="header-search-chip-menu"
      aria-label={label}
      onAction={(key) => onSelect(String(key))}
    >
      {options.map((option) => (
        <MenuItem key={option} id={option}>
          {option}
        </MenuItem>
      ))}
    </Menu>
  </MenuTrigger>
);

// Search scope selection (ticket #570). 'current' is the workspace
// the dialog was opened in (resolved from content context, so it
// follows navigation); a picked entry carries its own path/title;
// 'everywhere' searches without a path filter. The "Intranet Portal"
// (portal-without-workspaces) option needs backend exclusion support
// and was descoped to a later ticket.
type SearchScope =
  | { kind: 'everywhere' }
  | { kind: 'current' }
  | { kind: 'workspace'; path: string; title: string };

// Letter avatar for a workspace, tinted deterministically by title so
// a workspace keeps its color across renders and sessions (the design
// shows colored initials, there is no image avatar on Workspace).
const AVATAR_TONES = 6;

const avatarTone = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) % AVATAR_TONES;
  }
  return hash;
};

const WorkspaceAvatar = ({ title }: { title: string }) => (
  <span
    className={`header-search-scope-avatar tone-${avatarTone(title)}`}
    aria-hidden="true"
  >
    {title.charAt(0).toUpperCase()}
  </span>
);

// The Workspace chip: unlike the demo FilterChips this is a real
// control - it selects the search scope from "everywhere" plus the
// list of workspaces the user can access (same data as the navigation
// tree's workspace switcher, security-trimmed by the backend).
const ScopeChip = ({
  scope,
  scopeTitle,
  currentWorkspacePath,
  workspaces,
  onScopeChange,
}: {
  scope: SearchScope;
  scopeTitle: string;
  currentWorkspacePath: string | null;
  workspaces: SearchItem[];
  onScopeChange: (scope: SearchScope) => void;
}) => {
  const intl = useIntl();
  const selectedPath =
    scope.kind === 'current'
      ? currentWorkspacePath
      : scope.kind === 'workspace'
        ? scope.path
        : null;
  return (
    <MenuTrigger>
      <Button
        className={`header-search-chip${
          scope.kind !== 'everywhere' ? ' is-active' : ''
        }`}
        type="button"
      >
        {intl.formatMessage(messages.filterWorkspace)}: {scopeTitle}
        <ChevrondownIcon aria-hidden="true" size="xs" />
      </Button>
      <Menu
        className="header-search-chip-menu header-search-scope-menu"
        aria-label={intl.formatMessage(messages.filterWorkspace)}
        onAction={(key) => {
          if (key === 'everywhere') {
            onScopeChange({ kind: 'everywhere' });
            return;
          }
          const path = String(key);
          if (path === currentWorkspacePath) {
            onScopeChange({ kind: 'current' });
            return;
          }
          const workspace = workspaces.find(
            (item) => flattenToAppURL(item['@id']) === path,
          );
          if (workspace) {
            onScopeChange({ kind: 'workspace', path, title: workspace.title });
          }
        }}
      >
        <MenuItem
          id="everywhere"
          className="react-aria-MenuItem header-search-scope-item is-everywhere"
        >
          <Icon name={globeSVG} size="18px" />
          <span className="header-search-scope-text">
            {intl.formatMessage(messages.everywhere)}
            <span className="header-search-scope-hint">
              {intl.formatMessage(messages.everywhereHint)}
            </span>
          </span>
          {scope.kind === 'everywhere' ? (
            <Icon
              name={checkSVG}
              size="16px"
              className="header-search-scope-check"
            />
          ) : null}
        </MenuItem>
        {workspaces.map((item) => {
          const path = flattenToAppURL(item['@id']);
          return (
            <MenuItem
              key={path}
              id={path}
              className="react-aria-MenuItem header-search-scope-item"
            >
              <WorkspaceAvatar title={item.title} />
              <span className="header-search-scope-text">{item.title}</span>
              {selectedPath === path ? (
                <Icon
                  name={checkSVG}
                  size="16px"
                  className="header-search-scope-check"
                />
              ) : null}
            </MenuItem>
          );
        })}
      </Menu>
    </MenuTrigger>
  );
};

const FilterChips = ({
  scope,
  scopeTitle,
  currentWorkspacePath,
  workspaces,
  onScopeChange,
}: {
  scope: SearchScope;
  scopeTitle: string;
  currentWorkspacePath: string | null;
  workspaces: SearchItem[];
  onScopeChange: (scope: SearchScope) => void;
}) => {
  const intl = useIntl();
  const filters: Array<{
    id: string;
    label: string;
    options: string[];
  }> = [
    {
      id: 'type',
      label: intl.formatMessage(messages.filterType),
      options: [
        intl.formatMessage(messages.allTypes),
        intl.formatMessage(messages.typePage),
        intl.formatMessage(messages.typeNews),
        intl.formatMessage(messages.typeFolder),
        intl.formatMessage(messages.typeFile),
        intl.formatMessage(messages.typeImage),
        intl.formatMessage(messages.typeEvent),
        intl.formatMessage(messages.typePerson),
      ],
    },
    {
      id: 'creator',
      label: intl.formatMessage(messages.filterCreator),
      options: [
        intl.formatMessage(messages.creatorAll),
        'Dr. Sascha Köhler',
        'Markus Thaler',
        'Eva Lemke',
        'Lukas Brandt',
        'Julia Wagner',
      ],
    },
    {
      id: 'updated',
      label: intl.formatMessage(messages.filterUpdated),
      options: [
        intl.formatMessage(messages.anyTime),
        intl.formatMessage(messages.today),
        intl.formatMessage(messages.last7Days),
        intl.formatMessage(messages.last30Days),
        intl.formatMessage(messages.last3Months),
        intl.formatMessage(messages.lastYear),
      ],
    },
    {
      id: 'status',
      label: intl.formatMessage(messages.filterStatus),
      options: [
        intl.formatMessage(messages.allStatuses),
        intl.formatMessage(messages.statusPublished),
        intl.formatMessage(messages.statusInReview),
        intl.formatMessage(messages.statusPrivate),
      ],
    },
  ];
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const toggleLabels: Array<{ id: string; label: string }> = [
    { id: 'titleOnly', label: intl.formatMessage(messages.chipTitleOnly) },
    { id: 'archived', label: intl.formatMessage(messages.chipArchived) },
  ];
  return (
    <div className="header-search-filters">
      <div className="header-search-chips">
        {/* The Workspace chip is the real scope switch; the other
            chips are inert demo data (facets deferred). */}
        <ScopeChip
          scope={scope}
          scopeTitle={scopeTitle}
          currentWorkspacePath={currentWorkspacePath}
          workspaces={workspaces}
          onScopeChange={onScopeChange}
        />
        {filters.map((filter) => {
          const selected = selection[filter.id] || filter.options[0];
          return (
            <FilterChip
              key={filter.id}
              label={filter.label}
              options={filter.options}
              selected={selected}
              onSelect={(value) =>
                setSelection((current) => ({
                  ...current,
                  [filter.id]: value,
                }))
              }
              isActive={selected !== filter.options[0]}
            />
          );
        })}
      </div>
      <div className="header-search-chip-toggles">
        {toggleLabels.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="header-search-chip-toggle"
            aria-pressed={Boolean(toggles[id])}
            onClick={() =>
              setToggles((current) => ({ ...current, [id]: !current[id] }))
            }
          >
            <span
              className={`header-search-chip-checkbox${
                toggles[id] ? ' is-checked' : ''
              }`}
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

const SuggestionRow = ({
  item,
  location,
  onSelect,
}: {
  item: SuggestionItem;
  location: string | null;
  onSelect: (item: SuggestionItem) => void;
}) => {
  const intl = useIntl();
  const effectiveDate =
    item.effective && new Date(item.effective).getFullYear() > 1970
      ? intl.formatDate(item.effective, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : null;
  return (
    <button
      type="button"
      className="header-search-result"
      onClick={() => onSelect(item)}
    >
      <Icon name={typeIcons[item['@type']] || pageSVG} size="21px" />
      <span className="header-search-result-title">{item.title}</span>
      {effectiveDate ? (
        <span className="header-search-result-date">{effectiveDate}</span>
      ) : null}
      {location ? (
        <span className="header-search-result-location">{location}</span>
      ) : null}
    </button>
  );
};

// The LLM answers use markdown inline emphasis (**bold**, *italic*).
// Render just those instead of pulling in a markdown library: the
// prompt asks for plain text, emphasis is all that shows up in
// practice, and raw asterisks look broken in the answer panel.
const emphasizeAnswer = (text: string) =>
  text
    .split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      return part;
    });

type RagState = {
  answer: string | null;
  sources: Array<{ UID: string; '@id': string; title: string }>;
  error: string | null;
  loading: boolean;
  loaded: boolean;
};

// Reveal the answer progressively ("AI is typing"): the backend
// returns the full answer in one response, this is presentation only.
// Sources and the follow-up field appear once the reveal is done.
// Honors prefers-reduced-motion by showing the text at once.
const TYPEWRITER_CHARS_PER_TICK = 3;
const TYPEWRITER_TICK_MS = 15;

const useTypewriter = (text: string | null) => {
  const [position, setPosition] = useState(0);
  const length = text?.length ?? 0;

  useEffect(() => {
    setPosition(0);
    if (!length) {
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPosition(length);
      return;
    }
    const interval = window.setInterval(() => {
      setPosition((current) => {
        const next = current + TYPEWRITER_CHARS_PER_TICK;
        if (next >= length) {
          window.clearInterval(interval);
          return length;
        }
        return next;
      });
    }, TYPEWRITER_TICK_MS);
    return () => window.clearInterval(interval);
  }, [text, length]);

  return {
    visibleText: text ? text.slice(0, position) : '',
    done: position >= length,
  };
};

const AiOverview = ({
  rag,
  onSelectSource,
}: {
  rag: RagState;
  onSelectSource: (url: string) => void;
}) => {
  const intl = useIntl();
  useEffect(() => {
    if (rag.error) {
      // eslint-disable-next-line no-console
      console.warn('AI search error:', rag.error);
    }
  }, [rag.error]);
  const typed = useTypewriter(rag.answer);
  return (
    <div className="header-search-ai">
      <div className="header-search-ai-header">
        <span className="header-search-ai-title">
          <SparkleIcon />
          {intl.formatMessage(messages.aiOverview)}
        </span>
        <span className="header-search-ai-beta">
          {intl.formatMessage(messages.aiBeta)}
        </span>
      </div>
      {rag.loading ? (
        <p className="header-search-ai-loading">
          {intl.formatMessage(messages.aiLoading)}
        </p>
      ) : null}
      {/* Always show a friendly message instead of rag.error: the raw
          backend message is technical (e.g. "timeout after 30.0s calling
          /ollama/api/embed" when concurrent generations queue up on the
          LLM server, see intranet ticket #515) and must not surface to
          users. The technical detail goes to the console for debugging. */}
      {rag.error ? (
        <p className="header-search-ai-error">
          {intl.formatMessage(messages.aiError)}
        </p>
      ) : null}
      {rag.answer ? (
        <p className="header-search-ai-answer">
          {emphasizeAnswer(typed.visibleText)}
        </p>
      ) : null}
      {rag.loaded && !rag.answer && !rag.error ? (
        <p className="header-search-ai-answer">
          {intl.formatMessage(messages.aiNoAnswer)}
        </p>
      ) : null}
      {typed.done && (rag.sources || []).length > 0 ? (
        <div className="header-search-ai-sources">
          <span className="header-search-ai-sources-label">
            {intl.formatMessage(messages.aiSources)}
          </span>
          {rag.sources.map((source) => (
            <button
              key={source.UID}
              type="button"
              className="header-search-ai-source"
              onClick={() => onSelectSource(flattenToAppURL(source['@id']))}
            >
              <Icon name={pageSVG} size="16px" />
              {source.title}
            </button>
          ))}
        </div>
      ) : null}
      {rag.loaded && typed.done ? (
        <>
          {/* Follow-up questions need a multi-turn backend (not in the
              single-turn MVP): the field is part of the approved design
              but stays inactive for now. */}
          <div className="header-search-ai-followup">
            <input
              type="text"
              disabled
              placeholder={intl.formatMessage(messages.aiFollowUp)}
            />
            <span className="header-search-ai-followup-send" />
          </div>
          <p className="header-search-ai-disclaimer">
            {intl.formatMessage(messages.aiDisclaimer)}
          </p>
        </>
      ) : null}
    </div>
  );
};

const HeaderSearch = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [aiAsked, setAiAsked] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const history = useHistory();
  const dispatch = useDispatch();
  const intl = useIntl();

  const suggestions: SuggestionItem[] = useSelector(
    (state: any) => state.solrSearchSuggestions?.items || [],
  );
  const rag: RagState = useSelector((state: any) => state.ragsearch || {});
  const ragAvailable: boolean = useSelector(
    (state: any) =>
      state?.site?.data?.['kitconcept.solr.rag_available'] === true,
  );
  const workspace: { title: string; path: string | null } = useSelector(
    (state: any) => {
      const from =
        state.content?.data?.['@components']?.inherit?.[
          'kitconcept.plate.workspace'
        ]?.from;
      return {
        title: from?.title || '…',
        path: from?.['@id'] ? flattenToAppURL(from['@id']) : null,
      };
    },
    // Value based comparison: the selector builds a fresh object on
    // every run, so reference equality would re-render on every store
    // change.
    (a: any, b: any) => a.title === b.title && a.path === b.path,
  );
  // The Workspace chip switches the scope: the current workspace
  // (default), any other workspace from the list, or everywhere. All
  // three searches - livesearch, Ask AI and the Enter results page -
  // follow it (see tickets #426/#570, kitconcept.solr local scoping).
  const [scope, setScope] = useState<SearchScope>({ kind: 'current' });
  // Workspace list for the scope dropdown; fetched once the dialog
  // opens (the header itself is on every page, the list is not).
  const { workspaces } = useWorkspaceSwitcher({ enabled: isSearchOpen });
  const scopePath =
    scope.kind === 'current'
      ? workspace.path
      : scope.kind === 'workspace'
        ? scope.path
        : null;
  const scopeTitle =
    scope.kind === 'current'
      ? workspace.title
      : scope.kind === 'workspace'
        ? scope.title
        : intl.formatMessage(messages.everywhere);

  const term = searchText.trim();
  const showResults = term.length >= 2;

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  // Cmd+K / Ctrl+K opens the search dialog - but not from editable
  // contexts: in editors the same shortcut means "insert link" (e.g.
  // the Plate editor's floating link input), which must keep working.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        const target = event.target as HTMLElement | null;
        if (
          target &&
          (target.isContentEditable ||
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA')
        ) {
          return;
        }
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Live search: debounced suggestions for the current term.
  useEffect(() => {
    if (!isSearchOpen || term.length < 2) {
      return;
    }
    const timeout = window.setTimeout(() => {
      dispatch(solrSearchSuggestions(encodeURIComponent(term), scopePath));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [dispatch, isSearchOpen, term, scopePath]);

  const resetAi = useCallback(() => {
    setAiAsked(false);
    dispatch(resetRagSearch());
  }, [dispatch]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchText('');
    setScope({ kind: 'current' });
    resetAi();
  }, [resetAi]);

  const onOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setIsSearchOpen(true);
    } else {
      closeSearch();
    }
  };

  const onScopeChange = (nextScope: SearchScope) => {
    setScope(nextScope);
    if (aiAsked) {
      // The AI answer was grounded in the previous scope.
      resetAi();
    }
  };

  const onChangeText = (text: string) => {
    setSearchText(text);
    if (aiAsked) {
      resetAi();
    }
  };

  const navigateTo = (url: string) => {
    closeSearch();
    history.push(url);
  };

  // Location label per result row (design #570): the workspace the
  // item lives in, or "Intranet Portal" for anything outside the
  // workspaces. Resolved against the same list the dropdown shows.
  const locationForItem = (item: SuggestionItem): string => {
    const path = flattenToAppURL(item['@id']);
    const home = workspaces.find((candidate) => {
      const workspacePath = flattenToAppURL(candidate['@id']);
      return path === workspacePath || path.startsWith(`${workspacePath}/`);
    });
    return home ? home.title : intl.formatMessage(messages.intranetPortal);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Enter goes to the workspace-scoped search page: the nested
    // @@search route plus local=true restricts the classic results
    // (and, through the page's own wiring, the AI retrieval) to the
    // workspace subtree. Without a workspace path, plain global search.
    // is_multilingual=false: the intranet is monolingual, and the
    // backend's multilingual path handling would neutralize the
    // path_prefix filter on a site without plone.app.multilingual.
    if (scopePath) {
      const query = term
        ? `?SearchableText=${encodeURIComponent(term)}&local=true` +
          `&path_prefix=${encodeURIComponent(`${scopePath}/`)}` +
          `&is_multilingual=false`
        : '';
      navigateTo(`${scopePath}/@@search${query}`);
    } else {
      navigateTo(
        term ? `/search?SearchableText=${encodeURIComponent(term)}` : '/search',
      );
    }
  };

  const onAskAI = () => {
    if (!term || rag.loading) {
      return;
    }
    // Clear the previous answer first: the reducer keeps the last
    // result during a pending request, which would show the stale
    // answer below the loading indicator.
    dispatch(resetRagSearch());
    setAiAsked(true);
    dispatch(ragSearch('', term, scopePath || undefined));
  };

  return (
    <>
      <Button
        className="header-search-button"
        type="button"
        aria-label={intl.formatMessage(messages.searchWorkspace)}
        onPress={() => setIsSearchOpen(true)}
      >
        <Icon name={zoomSVG} size="24px" />
        <span className="header-search-button-label">
          {intl.formatMessage(messages.searchWorkspace)}
        </span>
        <span className="header-search-button-kbd">⌘K</span>
      </Button>

      <ModalOverlay
        className="header-search-modal-backdrop"
        isDismissable
        isOpen={isSearchOpen}
        onOpenChange={onOpenChange}
      >
        <Modal className="header-search-modal">
          <Dialog
            className="header-search-dialog"
            role="dialog"
            aria-label={intl.formatMessage(messages.search)}
          >
            <form onSubmit={submitSearch}>
              <div className="header-search-input-row">
                <Icon name={zoomSVG} size="24px" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchText}
                  aria-label={intl.formatMessage(messages.search)}
                  placeholder={intl.formatMessage(messages.searchPlaceholder)}
                  onChange={(event) => onChangeText(event.target.value)}
                />
                {ragAvailable && term ? (
                  <Button
                    className="header-search-ask-ai"
                    type="button"
                    onPress={onAskAI}
                  >
                    <SparkleIcon />
                    {intl.formatMessage(messages.askAI)}
                  </Button>
                ) : null}
              </div>
            </form>

            <FilterChips
              scope={scope}
              scopeTitle={scopeTitle}
              currentWorkspacePath={workspace.path}
              workspaces={workspaces}
              onScopeChange={onScopeChange}
            />

            {showResults ? (
              <div className="header-search-results">
                {aiAsked ? (
                  <AiOverview rag={rag} onSelectSource={navigateTo} />
                ) : null}
                {suggestions.length > 0 ? (
                  suggestions.map((item) => (
                    <SuggestionRow
                      key={item['@id']}
                      item={item}
                      location={locationForItem(item)}
                      onSelect={(selected) =>
                        navigateTo(flattenToAppURL(selected['@id']))
                      }
                    />
                  ))
                ) : scopePath ? (
                  // Scoped search came up empty: name the scope and
                  // offer the one-click escape to search everywhere
                  // (the most common miss is content living outside
                  // the current workspace, design #570).
                  <div className="header-search-no-results">
                    {intl.formatMessage(messages.noResultsInScope, {
                      scope: scopeTitle,
                    })}
                    <button
                      type="button"
                      className="header-search-widen"
                      onClick={() => onScopeChange({ kind: 'everywhere' })}
                    >
                      {intl.formatMessage(messages.searchEverywhere)}
                    </button>
                  </div>
                ) : (
                  <div className="header-search-no-results">
                    {intl.formatMessage(messages.noResultsFor, { term })}
                  </div>
                )}
              </div>
            ) : (
              <div className="header-search-empty">
                {intl.formatMessage(messages.typeToSearch)}
              </div>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
};

export default HeaderSearch;
