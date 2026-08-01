import * as Dialog from '@radix-ui/react-dialog'
import { Bot, Send, Sparkles, User, X } from 'lucide-react'
import { useState } from 'react'

import { IconButton } from '../../components/ui/primitives'
import { ApiClientError } from '../../lib/api'
import { useChatReply } from './hooks'
import type { ChatMessage } from './types'

function NotConfigured() {
  return (
    <div className="rounded-2xl bg-ink/[0.045] p-5 text-center">
      <Sparkles className="mx-auto size-6 text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm font-bold">Connect an AI provider</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Get a free key from{' '}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-accent-strong hover:underline"
        >
          Google AI Studio
        </a>
        , then set{' '}
        <code className="rounded bg-ink/10 px-1 py-0.5">
          CHAT__GEMINI_API_KEY
        </code>{' '}
        in your <code className="rounded bg-ink/10 px-1 py-0.5">.env</code>.
      </p>
    </div>
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span
        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${
          isUser ? 'bg-accent text-white' : 'bg-ink/5 text-accent'
        }`}
      >
        {isUser ? (
          <User className="size-3.5" aria-hidden="true" />
        ) : (
          <Bot className="size-3.5" aria-hidden="true" />
        )}
      </span>
      <p
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 whitespace-pre-wrap ${
          isUser ? 'bg-accent text-white' : 'bg-ink/[0.045]'
        }`}
      >
        {message.content}
      </p>
    </div>
  )
}

export function ChatPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const mutation = useChatReply()
  const notConfigured =
    mutation.error instanceof ApiClientError &&
    mutation.error.code === 'chat_not_configured'

  function send() {
    const content = input.trim()
    if (!content || mutation.isPending) return
    const next = [...messages, { role: 'user', content } as ChatMessage]
    setMessages(next)
    setInput('')
    mutation.mutate(next, {
      onSuccess: (result) => {
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: result.reply },
        ])
      },
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
        <Dialog.Content className="glass fixed inset-y-0 right-0 z-50 flex w-[min(26rem,100%)] flex-col rounded-l-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-2xl bg-ink/5 text-accent">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div>
                <Dialog.Title className="font-display text-base font-bold">
                  Ask Morning Pulse
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted">
                  Powered by Gemini
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close chat" className="size-8">
                <X className="size-4" />
              </IconButton>
            </Dialog.Close>
          </div>

          <div className="mt-5 flex-1 space-y-4 overflow-y-auto">
            {messages.length === 0 && !notConfigured && (
              <p className="py-8 text-center text-sm text-muted">
                Ask about your weather, the markets, or anything else.
              </p>
            )}
            {messages.map((message, index) => (
              <Bubble key={index} message={message} />
            ))}
            {mutation.isPending && (
              <p className="text-xs text-muted">Thinking…</p>
            )}
            {notConfigured && <NotConfigured />}
            {mutation.isError && !notConfigured && (
              <p role="alert" className="text-xs text-red-600">
                {mutation.error.message}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-panel px-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  send()
                }
              }}
              placeholder="Message the assistant…"
              className="w-full bg-transparent py-3 text-sm outline-none"
              disabled={notConfigured}
            />
            <IconButton
              label="Send message"
              className="size-9 shrink-0"
              onClick={send}
              disabled={!input.trim() || mutation.isPending || notConfigured}
            >
              <Send className="size-4" />
            </IconButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ChatLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open chat assistant"
      className="fixed right-5 bottom-20 z-30 grid size-14 cursor-pointer place-items-center rounded-full bg-ink text-canvas shadow-xl transition hover:-translate-y-0.5 lg:bottom-6"
    >
      <Sparkles className="size-5" aria-hidden="true" />
    </button>
  )
}
