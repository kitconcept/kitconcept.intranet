import PropTypes from 'prop-types';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import Comments from '@plone/volto/components/theme/Comments/Comments';

const CommentsSlot = ({ content }) => (
  <Comments inFooterSlot pathname={flattenToAppURL(content?.['@id']) || ''} />
);

CommentsSlot.propTypes = {
  content: PropTypes.object.isRequired,
};

export default CommentsSlot;
