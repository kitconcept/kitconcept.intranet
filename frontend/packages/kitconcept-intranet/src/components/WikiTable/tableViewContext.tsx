/**
 * Whether wiki tables in a read-only rendering offer sorting and filtering.
 * On in the page view; the history diff switches it off, because a diff
 * must show the stored order.
 */
import * as React from 'react';

export const WikiTableViewContext = React.createContext({ interactive: true });

export function WikiTableViewProvider({
  interactive,
  children,
}: React.PropsWithChildren<{ interactive: boolean }>) {
  const value = React.useMemo(() => ({ interactive }), [interactive]);
  return (
    <WikiTableViewContext.Provider value={value}>
      {children}
    </WikiTableViewContext.Provider>
  );
}
