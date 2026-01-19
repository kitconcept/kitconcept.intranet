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
    
    React.useEffect(() => {
      if (inheritedField && !props.value && vocabBaseUrl) {
        const tokensQuery = convertValueToVocabQuery([inheritedField.value]);
        dispatch(
          getVocabularyTokenTitle({
            vocabNameOrURL: vocabBaseUrl,
            subrequest: subrequest,
            ...tokensQuery,
          }),
        );
      }
    }, [dispatch, inheritedField, vocabBaseUrl, props.value, subrequest]);

    const displayNameInheritedField = useSelector(
      (state) =>
        state.vocabularies?.[vocabBaseUrl]?.subrequests?.[subrequest]?.items,
    )?.[0]?.label;

    if (props.inheritedField && inheritedField?.value && !props.value) {
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
          <WrappedComponent {...props} description={description} />
        </>
      );
    }
    return <WrappedComponent {...props} />;
  };
};

export default InheritedFieldWrapper;
