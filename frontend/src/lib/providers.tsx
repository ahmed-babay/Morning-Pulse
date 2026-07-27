import * as Tooltip from '@radix-ui/react-tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'

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

  return (
    <QueryClientProvider client={queryClient}>
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
        </Tooltip.Provider>
      </RouterProvider>
    </QueryClientProvider>
  )
}
