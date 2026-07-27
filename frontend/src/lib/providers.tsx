import * as Tooltip from '@radix-ui/react-tooltip'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { MotionConfig } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'

import { PwaUpdate } from '../components/layout/pwa-update'
import { RouterProvider } from './router'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: window.localStorage,
      key: 'morning-pulse-query-cache',
    }),
  )

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60_000,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' &&
            !String(query.queryKey[0]).includes('search'),
        },
      }}
    >
      <RouterProvider>
        <Tooltip.Provider delayDuration={350}>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--panel-solid)',
                color: 'var(--ink)',
                borderColor: 'var(--line)',
              },
            }}
          />
          <PwaUpdate />
        </Tooltip.Provider>
      </RouterProvider>
    </PersistQueryClientProvider>
  )
}
