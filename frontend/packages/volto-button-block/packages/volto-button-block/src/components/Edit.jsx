import React from 'react';
import SidebarPortal from '@plone/volto/components/manage/Sidebar/SidebarPortal';
import Sidebar from './Sidebar';
import View from './View';

const Edit = (props) => {
  const { data, block, onChangeBlock, selected } = props;

  return (
    <>
      <View {...props} isEditMode />
      <SidebarPortal selected={selected}>
        <Sidebar
          {...props}
          data={data}
          block={block}
          onChangeBlock={onChangeBlock}
        />
      </SidebarPortal>
    </>
  );
};

export default Edit;
