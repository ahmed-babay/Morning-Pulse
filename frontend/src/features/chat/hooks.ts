import { useMutation } from '@tanstack/react-query'

import { apiPost } from '../../lib/api'
import type { ChatMessage, ChatReply } from './types'

export function useChatReply() {
  return useMutation({
    mutationFn: (messages: ChatMessage[]) =>
      apiPost<ChatReply>('/chat', { messages }),
  })
}
