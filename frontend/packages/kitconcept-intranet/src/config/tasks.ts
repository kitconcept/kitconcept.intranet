import type { ConfigType } from '@plone/registry';
import Tasks from '../components/Tasks/Tasks';
import TasksMenu from '../components/Tasks/TasksMenu';

/** Register the application route outside content traversal and mount its menu plug. */
export default function installTasks(config: ConfigType) {
  config.addonRoutes = [
    ...(config.addonRoutes || []),
    { path: ['/tasks', '/**/tasks'], exact: true, component: Tasks },
  ];
  config.settings.nonContentRoutes = [
    ...config.settings.nonContentRoutes,
    '/tasks',
  ];
  config.settings.appExtras = [
    ...(config.settings.appExtras || []),
    { match: { path: '/' }, component: TasksMenu },
  ];
  return config;
}
