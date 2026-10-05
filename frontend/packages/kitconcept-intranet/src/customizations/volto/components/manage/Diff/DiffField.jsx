/**
 * OVERRIDE DiffField.jsx
 * REASON: Render the diff of Wiki Pages (Plate content in
 *         `blocks.__somersault__`) with Plate's own diff (`@platejs/diff`)
 *         instead of Volto's HTML string diff, which shows nothing for Plate
 *         content. Spike for the HISTORY DIFF epic; all other fields and
 *         content types keep the original behaviour.
 * FILE: https://github.com/plone/volto/blob/19.4.1/packages/volto/src/components/manage/Diff/DiffField.jsx
 * FILE VERSION: Volto 19.4.1 (unchanged since 19.3.1)
 * DATE: 2026-09-18
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/639
 * DEVELOPER: @reekitconcept
 */

/**
 * Diff field component.
 * @module components/manage/Diff/DiffField
 */

import React from 'react';
import join from 'lodash/join';
import map from 'lodash/map';
import PropTypes from 'prop-types';
import { Grid } from 'semantic-ui-react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-intl-redux';
import { createBrowserHistory } from 'history';
import { ConnectedRouter } from 'connected-react-router';
import { useSelector } from 'react-redux';
import config from '@plone/volto/registry';
import Api from '@plone/volto/helpers/Api/Api';
import configureStore from '@plone/volto/store';
import RenderBlocks from '@plone/volto/components/theme/View/RenderBlocks';
import { serializeNodes } from '@plone/volto-slate/editor/render';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useIntl } from 'react-intl';
import WikiPageDiff, {
  hasPlateContent,
} from '../../../../../components/PlateDiff/WikiPageDiff';
import { messages as diffMessages } from '../../../../../components/PlateDiff/messages';

const isHtmlTag = (str) => {
  // Match complete HTML tags, including:
  // 1. Opening tags like <div>, <img src="example" />, <svg>...</svg>
  // 2. Self-closing tags like <img />, <br />
  // 3. Closing tags like </div>
  return /^<([a-zA-Z]+[0-9]*)\b[^>]*>|^<\/([a-zA-Z]+[0-9]*)\b[^>]*>$|^<([a-zA-Z]+[0-9]*)\b[^>]*\/>$/.test(
    str,
  );
};

const splitWords = (str) => {
  if (typeof str !== 'string') return str;
  if (!str) return [];

  const result = [];
  let currentWord = '';
  let insideTag = false;
  let insideSpecialTag = false;
  let tagBuffer = '';

  // Special tags that should not be split (e.g., <img />, <svg> ... </svg>)
  const specialTags = ['img', 'svg'];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    // Start of an HTML tag
    if (char === '<') {
      if (currentWord) {
        result.push(currentWord); // Push text before the tag
        currentWord = '';
      }
      insideTag = true;
      tagBuffer += char;
    }
    // End of an HTML tag
    else if (char === '>') {
      tagBuffer += char;
      insideTag = false;

      // Check if the tagBuffer contains a special tag
      const tagNameMatch = tagBuffer.match(/^<\/?([a-zA-Z]+[0-9]*)\b/);
      if (tagNameMatch && specialTags.includes(tagNameMatch[1])) {
        insideSpecialTag =
          tagNameMatch[0].startsWith('<') && !tagNameMatch[0].startsWith('</');
        result.push(tagBuffer); // Push the complete special tag as one unit
        tagBuffer = '';
        continue;
      }

      result.push(tagBuffer); // Push the complete tag
      tagBuffer = '';
    }
    // Inside the tag or special tag
    else if (insideTag || insideSpecialTag) {
      tagBuffer += char;
    }
    // Space outside of tags - push current word
    else if (char === ' ' && !insideTag && !insideSpecialTag) {
      if (currentWord) {
        result.push(currentWord);
        currentWord = '';
      }
      result.push(' ');
    } else if (
      char === ',' &&
      i < str.length - 1 &&
      str[i + 1] !== ' ' &&
      !insideTag &&
      !insideSpecialTag
    ) {
      if (currentWord) {
        result.push(currentWord + char);
        currentWord = '';
      }
      result.push(' ');
    }
    // Accumulate characters outside of tags
    else {
      currentWord += char;
    }
  }

  // Push any remaining text
  if (currentWord) {
    result.push(currentWord);
  }
  if (tagBuffer) {
    result.push(tagBuffer); // Push remaining tagBuffer
  }

  return result;
};

const formatDiffPart = (part, value, side) => {
  if (!isHtmlTag(value)) {
    if (part.removed && (side === 'left' || side === 'unified')) {
      return `<span class="deletion">${value}</span>`;
    } else if (part.removed) return '';
    else if (part.added && (side === 'right' || side === 'unified')) {
      return `<span class="addition">${value}</span>`;
    } else if (part.added) return '';
    return value;
  } else {
    if (side === 'unified' && part.added) return value;
    else if (side === 'unified' && part.removed) return '';
    if (part.removed && side === 'left') {
      return value;
    } else if (part.removed) return '';
    else if (part.added && side === 'right') {
      return value;
    } else if (part.added) return '';
    return value;
  }
};

/**
 * Diff field component.
 * @function DiffField
 * @param {*} one Field one
 * @param {*} two Field two
 * @param {Object} schema Field schema
 * @returns {string} Markup of the component.
 */

const DefaultDiffField = ({
  one,
  two,
  contentOne,
  contentTwo,
  view,
  schema,
  diffLib,
}) => {
  const language = useSelector((state) => state.intl.locale);
  const intl = useIntl();
  const readable_date_format = {
    dateStyle: 'full',
    timeStyle: 'short',
  };
  const diffWords = (oneStr, twoStr) => {
    return diffLib.diffArrays(
      splitWords(String(oneStr)),
      splitWords(String(twoStr)),
    );
  };

  let parts, oneArray, twoArray;
  if (schema.widget) {
    switch (schema.widget) {
      case 'richtext':
        parts = diffWords(one?.data, two?.data);
        break;
      case 'datetime': {
        // An unset date must not be rendered as 1 January 1970.
        const formatDate = (value) =>
          value
            ? new Intl.DateTimeFormat(language, readable_date_format)
                .format(new Date(value))
                .replace(' ', ' ')
            : intl.formatMessage(diffMessages.notSet);
        parts = diffWords(formatDate(one), formatDate(two));
        break;
      }
      case 'json': {
        const api = new Api();
        const history = createBrowserHistory();
        const store = configureStore(window.__data, history, api);
        parts = diffWords(
          ReactDOMServer.renderToStaticMarkup(
            <Provider store={store}>
              <ConnectedRouter history={history}>
                <RenderBlocks content={contentOne} />
              </ConnectedRouter>
            </Provider>,
          ),
          ReactDOMServer.renderToStaticMarkup(
            <Provider store={store}>
              <ConnectedRouter history={history}>
                <RenderBlocks content={contentTwo} />
              </ConnectedRouter>
            </Provider>,
          ),
        );
        break;
      }
      case 'slate': {
        const api = new Api();
        const history = createBrowserHistory();
        const store = configureStore(window.__data, history, api);
        parts = diffWords(
          ReactDOMServer.renderToStaticMarkup(
            <Provider store={store}>
              <ConnectedRouter history={history}>
                {serializeNodes(one)}
              </ConnectedRouter>
            </Provider>,
          ),
          ReactDOMServer.renderToStaticMarkup(
            <Provider store={store}>
              <ConnectedRouter history={history}>
                {serializeNodes(two)}
              </ConnectedRouter>
            </Provider>,
          ),
        );
        break;
      }
      case 'textarea':
      default:
        const Widget = config.widgets?.views?.widget?.[schema.widget];

        if (Widget) {
          const api = new Api();
          const history = createBrowserHistory();
          const store = configureStore(window.__data, history, api);
          parts = diffWords(
            ReactDOMServer.renderToStaticMarkup(
              <Provider store={store}>
                <ConnectedRouter history={history}>
                  <Widget value={one} />
                </ConnectedRouter>
              </Provider>,
            ),
            ReactDOMServer.renderToStaticMarkup(
              <Provider store={store}>
                <ConnectedRouter history={history}>
                  <Widget value={two} />
                </ConnectedRouter>
              </Provider>,
            ),
          );
        } else parts = diffWords(one, two);

        break;
    }
  } else if (schema.type === 'object') {
    parts = diffWords(one?.filename || one, two?.filename || two);
  } else if (schema.type === 'array') {
    oneArray = (one || []).map((i) => i?.title || i);
    twoArray = (two || []).map((j) => j?.title || j);
    parts = diffWords(oneArray, twoArray);
  } else {
    parts = diffWords(one?.title || one, two?.title || two);
  }

  return (
    <Grid data-testid="DiffField">
      <Grid.Row>
        <Grid.Column width={12}>{schema.title}</Grid.Column>
      </Grid.Row>

      {view === 'split' && (
        <Grid.Row>
          <Grid.Column width={6} verticalAlign="top">
            <span
              dangerouslySetInnerHTML={{
                __html: join(
                  map(parts, (part) => {
                    let combined = (part.value || []).reduce((acc, value) => {
                      return acc + formatDiffPart(part, value, 'left');
                    }, '');
                    return combined;
                  }),
                  '',
                ),
              }}
            />
          </Grid.Column>
          <Grid.Column width={6} verticalAlign="top">
            <span
              dangerouslySetInnerHTML={{
                __html: join(
                  map(parts, (part) => {
                    let combined = (part.value || []).reduce((acc, value) => {
                      return acc + formatDiffPart(part, value, 'right');
                    }, '');
                    return combined;
                  }),
                  '',
                ),
              }}
            />
          </Grid.Column>
        </Grid.Row>
      )}
      {view === 'unified' && (
        <Grid.Row>
          <Grid.Column width={16} verticalAlign="top">
            <span
              dangerouslySetInnerHTML={{
                __html: join(
                  map(parts, (part) => {
                    let combined = (part.value || []).reduce((acc, value) => {
                      return acc + formatDiffPart(part, value, 'unified');
                    }, '');
                    return combined;
                  }),
                  '',
                ),
              }}
            />
          </Grid.Column>
        </Grid.Row>
      )}
    </Grid>
  );
};

/**
 * Wiki Pages store their Plate content in `blocks.__somersault__`; the HTML
 * string diff cannot render it (lazy-loaded renderer), so those go to the
 * Plate-based diff. Everything else keeps the default behaviour.
 *
 * The Plate document also carries the page title as its first node, so a
 * title change would show twice: as the title field diff and inside the
 * Plate diff. The field diff is skipped for Plate content; the Plate diff
 * shows the change in context. Field diffs only get their own two values,
 * so both versions are read from the diff state to recognise the title.
 */
const DiffField = (props) => {
  const { one, two, contentOne, contentTwo, schema, view } = props;
  const versions = useSelector((state) => state.diff?.data);
  const versionOne = contentOne ?? versions?.[0];
  const versionTwo = contentTwo ?? versions?.[1];
  const isPlate = hasPlateContent(versionOne) || hasPlateContent(versionTwo);

  if (
    isPlate &&
    schema?.widget !== 'json' &&
    schema?.type === 'string' &&
    one === versionOne?.title &&
    two === versionTwo?.title
  ) {
    return null;
  }

  if (schema?.widget === 'json' && isPlate) {
    return (
      <Grid data-testid="DiffField">
        <Grid.Row>
          <Grid.Column width={12}>{schema.title}</Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={16}>
            <WikiPageDiff one={contentOne} two={contentTwo} view={view} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    );
  }
  return <DefaultDiffField {...props} />;
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
DiffField.propTypes = {
  one: PropTypes.any.isRequired,
  two: PropTypes.any.isRequired,
  contentOne: PropTypes.any,
  contentTwo: PropTypes.any,
  view: PropTypes.string.isRequired,
  schema: PropTypes.shape({
    widget: PropTypes.string,
    type: PropTypes.string,
    title: PropTypes.string,
  }).isRequired,
};

export default injectLazyLibs('diffLib')(DiffField);
