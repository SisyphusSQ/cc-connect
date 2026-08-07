import { createContext, useContext, useEffect, useMemo, type Dispatch, type ReactNode, type SetStateAction } from 'react';

export interface AppHeaderState {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  details?: ReactNode;
  actions?: ReactNode;
  immersive?: boolean;
}

interface AppHeaderContextValue {
  setHeader: Dispatch<SetStateAction<AppHeaderState | null>>;
}

export const AppHeaderContext = createContext<AppHeaderContextValue | null>(null);

export function useAppHeader(header: AppHeaderState) {
  const context = useContext(AppHeaderContext);

  useEffect(() => {
    context?.setHeader(header);
    return () => {
      context?.setHeader((current) => current?.id === header.id ? null : current);
    };
  }, [context, header]);
}

export function useAppHeaderContextValue(setHeader: AppHeaderContextValue['setHeader']) {
  return useMemo(() => ({ setHeader }), [setHeader]);
}
