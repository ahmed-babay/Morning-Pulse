import { useRef, useState } from 'react'

import { ApiClientError, apiPostStream } from '../../lib/api'
import type { ChatMessage } from './types'

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function send(content: string) {
    const trimmed = content.trim()
    if (!trimmed || streaming) return

    setError(null)
    const history = [
      ...messages,
      { role: 'user', content: trimmed } as ChatMessage,
    ]
    setMessages([...history, { role: 'assistant', content: '' }])
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller
    let received = ''

    try {
      await apiPostStream(
        '/chat',
        { messages: history },
        (chunk) => {
          received += chunk
          setMessages((current) => {
            const next = [...current]
            next[next.length - 1] = { role: 'assistant', content: received }
            return next
          })
        },
        controller.signal,
      )
      if (!received) {
        throw new ApiClientError(
          'Chat is temporarily unavailable',
          'chat_provider_error',
        )
      }
    } catch (err) {
      setMessages((current) => current.slice(0, -1))
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err : new Error('Something went wrong'))
      }
    } finally {
      setStreaming(false)
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  return { messages, streaming, error, send, stop }
}
