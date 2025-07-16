import Edit from './components/Edit';
import View from './components/View';
import AlignWidget from './components/Widgets/AlignWidget';
import circleMenuSVG from '@plone/volto/icons/circle-menu.svg';
import './theme/main.less';

const applyConfig = (config) => {
  config.widgets.widget.inner_align = AlignWidget;
  config.blocks.blocksConfig.__button = {
    id: '__button',
    title: 'Button',
    icon: circleMenuSVG,
    group: 'common',
    view: View,
    edit: Edit,
    restricted: false,
    mostUsed: true,
    sidebarTab: 1,
    category: 'action',
  };
  return config;
};

export default applyConfig;
