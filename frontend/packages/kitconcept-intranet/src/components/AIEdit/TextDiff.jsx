/**
 * Side-by-side diff of two HTML values (diffHtml.js), laid out like
 * Volto's DiffField so the review's styles apply.
 */
import { useMemo } from 'react';
import { Grid } from 'semantic-ui-react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { sides, tokens } from './diffHtml';

const TextDiff = ({ one, two, diffLib }) => {
  const { left, right } = useMemo(
    () => sides(diffLib.diffArrays(tokens(one), tokens(two))),
    [one, two, diffLib],
  );
  return (
    <Grid>
      <Grid.Row>
        <Grid.Column width={6} verticalAlign="top">
          <span dangerouslySetInnerHTML={{ __html: left }} />
        </Grid.Column>
        <Grid.Column width={6} verticalAlign="top">
          <span dangerouslySetInnerHTML={{ __html: right }} />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default injectLazyLibs('diffLib')(TextDiff);
