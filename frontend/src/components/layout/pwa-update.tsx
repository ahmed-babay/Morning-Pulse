import { useEffect } from 'react'
import { toast } from 'sonner'

export function PwaUpdate() {
  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    void import('virtual:pwa-register').then(({ registerSW }) => {
      const update = registerSW({
        immediate: true,
        onNeedRefresh() {
          toast('A new Morning Pulse is ready', {
            duration: Infinity,
            action: {
              label: 'Update',
              onClick: () => void update(true),
            },
          })
        },
        onOfflineReady() {
          toast.success('Morning Pulse is ready offline')
        },
        onRegisterError() {
          toast.error('Offline mode could not be enabled')
        },
      })
    })
  }, [])
  return null
}
