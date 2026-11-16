import { useSelector } from 'react-redux';

export const ENABLED_SETTING = 'kitconcept.intranet.enable_notification_center';

/** Whether the notification center is on in the Intranet Settings. */
export function useNotificationsEnabled(): boolean {
  return useSelector((state: any) =>
    Boolean(state.site?.data?.[ENABLED_SETTING]),
  );
}
