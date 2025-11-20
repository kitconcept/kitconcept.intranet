import React from 'react';
import SidebarPortal from '@plone/volto/components/manage/Sidebar/SidebarPortal';
import BlockDataForm from '@plone/volto/components/manage/Form/BlockDataForm';
import SolrListingView from './View';
import schema from './schema';

const Edit = (props) => {
  const { selected, onChangeBlock, block, data, blocksConfig } = props;

  return (
    <>
      <SolrListingView {...props} isEditMode />

      <SidebarPortal selected={selected}>
        <BlockDataForm
          schema={schema}
          title={schema.title}
          onChangeField={(id, value) => {
            onChangeBlock(block, {
              ...data,
              [id]: value,
            });
          }}
          formData={data}
          blocksConfig={blocksConfig}
        />
      </SidebarPortal>
    </>
  );
};

export default Edit;
