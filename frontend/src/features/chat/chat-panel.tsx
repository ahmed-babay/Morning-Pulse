import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  CloudSun,
  Newspaper,
  Send,
  Sparkles,
  Square,
  TrendingUp,
  User,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { IconButton } from '../../components/ui/primitives'
import { ApiClientError } from '../../lib/api'
import { useChatStream } from './hooks'
import { Markdown } from './markdown'
import type { ChatMessage } from './types'

const SUGGESTIONS = [
  { icon: CloudSun, label: "What's the weather like today?" },
  { icon: TrendingUp, label: 'How are the crypto markets doing?' },
  { icon: Sparkles, label: 'Any big stock movers today?' },
  { icon: Newspaper, label: "What's happening in the news?" },
]

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

function TypingDots() {
  return (
    <div
      className="flex items-center gap-1 px-1 py-2"
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-1.5 rounded-full bg-accent"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            repeat: Infinity,
            duration: 0.9,
            delay: index * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

function StreamingCursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-current align-middle motion-reduce:animate-none"
    />
  )
}

type AssistantState = 'idle' | 'thinking' | 'answering'

function AssistantAvatar({ state }: { state: AssistantState }) {
  const active = state !== 'idle'
  const ringDuration = state === 'thinking' ? 3.2 : 1.5
  const pulseDuration = state === 'thinking' ? 1.8 : 0.9
  return (
    <div className="relative mt-0.5 grid size-7 shrink-0 place-items-center">
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'repeating-conic-gradient(color-mix(in srgb, var(--accent) 50%, transparent) 0deg 12deg, transparent 12deg 30deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: ringDuration,
            ease: 'linear',
          }}
        />
      )}
      <motion.span
        className="relative grid size-6 place-items-center rounded-full bg-gradient-to-br from-accent/25 to-[var(--sun)]/25 text-accent-strong"
        animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={
          active
            ? { repeat: Infinity, duration: pulseDuration, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
      >
        <Bot className="size-3.5" aria-hidden="true" />
      </motion.span>
    </div>
  )
}

function Bubble({
  message,
  streaming,
}: {
  message: ChatMessage
  streaming?: boolean
}) {
  const isUser = message.role === 'user'
  const assistantState: AssistantState = !streaming
    ? 'idle'
    : message.content
      ? 'answering'
      : 'thinking'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {isUser ? (
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent text-white">
          <User className="size-3.5" aria-hidden="true" />
        </span>
      ) : (
        <AssistantAvatar state={assistantState} />
      )}
      {!isUser && streaming && !message.content ? (
        <div className="rounded-2xl bg-ink/[0.045] px-1">
          <TypingDots />
        </div>
      ) : (
        <div
          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
            isUser
              ? 'bg-accent whitespace-pre-wrap text-white'
              : 'bg-ink/[0.045]'
          }`}
        >
          {isUser ? (
            message.content
          ) : (
            <>
              <Markdown text={message.content} />
              {streaming && <StreamingCursor />}
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

function WelcomeIntro({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
      }}
      className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.8 },
          show: { opacity: 1, scale: 1 },
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid size-16 place-items-center rounded-full"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--sun) 30%, transparent), transparent 70%)',
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'repeating-conic-gradient(color-mix(in srgb, var(--accent) 30%, transparent) 0deg 10deg, transparent 10deg 24deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
        />
        <Sparkles
          className="relative size-6 text-accent-strong"
          aria-hidden="true"
        />
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 8 },
          show: { opacity: 1, y: 0 },
        }}
      >
        <p className="font-display text-lg font-bold">
          Hey, I'm your Pulse assistant
        </p>
        <p className="mt-1.5 max-w-[19rem] text-sm text-muted">
          Ask about your weather, the markets, or today's news — or pick a
          suggestion below.
        </p>
      </motion.div>

      <div className="grid w-full gap-2">
        {SUGGESTIONS.map(({ icon: Icon, label }) => (
          <motion.button
            key={label}
            type="button"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
            onClick={() => onPick(label)}
            className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-line bg-panel px-3.5 py-2.5 text-left text-xs font-semibold transition hover:-translate-y-0.5 hover:border-accent/30 hover:bg-ink/[0.03]"
          >
            <Icon className="size-4 shrink-0 text-accent" aria-hidden="true" />
            {label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

export function ChatPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [input, setInput] = useState('')
  const { messages, streaming, error, send, stop } = useChatStream()
  const scrollRef = useRef<HTMLDivElement>(null)
  const notConfigured =
    error instanceof ApiClientError && error.code === 'chat_not_configured'

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  function submit() {
    void send(input)
    setInput('')
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
        <Dialog.Content className="glass fixed inset-y-0 right-0 z-50 flex w-[min(26rem,100%)] flex-col rounded-l-3xl p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-accent/20 to-[var(--sun)]/20 text-accent-strong">
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

          <div
            ref={scrollRef}
            className="mt-5 flex flex-1 flex-col space-y-4 overflow-y-auto"
          >
            {messages.length === 0 && !notConfigured && (
              <WelcomeIntro onPick={(prompt) => void send(prompt)} />
            )}
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <Bubble
                  key={index}
                  message={message}
                  streaming={streaming && index === messages.length - 1}
                />
              ))}
            </AnimatePresence>
            {notConfigured && <NotConfigured />}
            {error && !notConfigured && (
              <p role="alert" className="text-xs text-red-600">
                {error.message}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-panel px-3 transition focus-within:border-accent/40">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  submit()
                }
              }}
              placeholder="Message the assistant…"
              className="w-full bg-transparent py-3 text-sm outline-none"
              disabled={notConfigured}
            />
            {streaming ? (
              <IconButton
                label="Stop generating"
                className="size-9 shrink-0"
                onClick={stop}
              >
                <Square className="size-3.5 fill-current" />
              </IconButton>
            ) : (
              <IconButton
                label="Send message"
                className="size-9 shrink-0"
                onClick={submit}
                disabled={!input.trim() || notConfigured}
              >
                <Send className="size-4" />
              </IconButton>
            )}
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
