/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { getVocabularyTokenTitle } from '@plone/volto/actions/vocabularies/vocabularies';
import { convertValueToVocabQuery } from '@plone/volto/components/manage/Widgets/SelectUtils';

const InheritedFieldWrapper = (WrappedComponent, inheritedFieldFunction) => {
  return (props) => {
    const content = useSelector((state) => state.content.data);
    const inheritedField = inheritedFieldFunction(content, props);
    const dispatch = useDispatch();
    const vocabBaseUrl = props.widgetOptions.vocabulary?.['@id'];
    const subrequest = `widget-${props.id}-${props.intl.locale}`;

    // The backend expander walks the acquisition chain starting from the object
    // being edited, so `inheritedField` describes either this content's own
    // value (its `url` points to the current content) or a value truly
    // inherited from an ancestor. It is only inherited when it comes from a
    // different object than the one being edited.
    const currentUrl = content?.['@id']
      ? flattenToAppURL(content['@id'])
      : undefined;
    const isInherited =
      !!inheritedField?.value &&
      !!inheritedField?.url &&
      flattenToAppURL(inheritedField.url) !== currentUrl;

    React.useEffect(() => {
      if (isInherited && !props.value && vocabBaseUrl) {
        const tokensQuery = convertValueToVocabQuery([inheritedField.value]);
        dispatch(
          getVocabularyTokenTitle({
            vocabNameOrURL: vocabBaseUrl,
            subrequest: subrequest,
            ...tokensQuery,
          }),
        );
      }
    }, [
      dispatch,
      isInherited,
      inheritedField,
      vocabBaseUrl,
      props.value,
      subrequest,
    ]);

    const displayNameInheritedField = useSelector(
      (state) =>
        state.vocabularies?.[vocabBaseUrl]?.subrequests?.[subrequest]?.items,
    )?.[0]?.label;

    // When the content has its own value, the wrapped select resolves the label
    // from the vocabulary subrequest cache. That cache persists across
    // client-side navigation and can still hold the previously saved user's
    // token/title, which makes the widget fall back to rendering the raw UUID
    // after the value was changed and saved. The expander already returns the
    // resolved `{ value, title }` for the current value, so hand the widget an
    // already-resolved option to render instead of relying on the stale cache.
    const widgetProps =
      props.value &&
      typeof props.value === 'string' &&
      inheritedField?.value === props.value &&
      inheritedField?.title
        ? {
            ...props,
            value: {
              value: inheritedField.value,
              label: inheritedField.title,
            },
          }
        : props;

    if (props.inheritedField && isInherited && !props.value) {
      const description = (
        <>
          {`Inherited ${props.title}:`}
          <strong style={{ fontSize: '110%' }}>{` ${
            displayNameInheritedField || inheritedField.value
          }`}</strong>
          <br />
          {`from the parent content: `}
          <a
            style={{ fontSize: '110%', color: '#007EB1' }}
            href={inheritedField.url}
          >
            {flattenToAppURL(inheritedField.url)}
          </a>
          <br />
          {props.description}
        </>
      );
      return (
        <>
          <WrappedComponent {...widgetProps} description={description} />
        </>
      );
    }
    return <WrappedComponent {...widgetProps} />;
  };
};

export default InheritedFieldWrapper;
