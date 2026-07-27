import { motion } from 'framer-motion'
import { Copy, Heart, Lightbulb, Quote, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { PreviewCard } from '../../components/dashboard/preview-card'
import { IconButton } from '../../components/ui/primitives'
import { dailyItem, developerTips, quotes } from '../../data/daily-content'
import { useFavoritesStore } from '../../stores/favorites-store'

async function share(title: string, text: string) {
  if (navigator.share) await navigator.share({ title, text })
  else {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }
}

export function DailyContentWidgets() {
  const quote = dailyItem(quotes)
  const tip = dailyItem(developerTips)
  const toggle = useFavoritesStore((state) => state.toggle)
  return (
    <>
      <PreviewCard
        id="quote"
        title="A thought for today"
        eyebrow="Daily quote"
        icon={Quote}
        delay={0.34}
        className="xl:col-span-7"
      >
        <motion.blockquote
          key={quote.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-2xl font-semibold leading-snug sm:text-3xl"
        >
          “{quote.text}”
        </motion.blockquote>
        <p className="mt-4 text-sm font-bold text-muted">— {quote.author}</p>
        <div className="mt-4 flex gap-2">
          <IconButton
            label="Copy quote"
            onClick={() =>
              void navigator.clipboard
                .writeText(`${quote.text} — ${quote.author}`)
                .then(() => toast.success('Quote copied'))
            }
          >
            <Copy className="size-4" />
          </IconButton>
          <IconButton
            label="Share quote"
            onClick={() => void share('Morning quote', quote.text)}
          >
            <Share2 className="size-4" />
          </IconButton>
          <IconButton
            label="Save quote"
            onClick={() =>
              toggle({
                id: `quote:${quote.text}`,
                kind: 'quote',
                title: quote.text,
                subtitle: quote.author,
              })
            }
          >
            <Heart className="size-4" />
          </IconButton>
        </div>
      </PreviewCard>
      <PreviewCard
        id="tip"
        title={tip.title}
        eyebrow="Developer tip"
        icon={Lightbulb}
        delay={0.38}
        className="xl:col-span-5"
      >
        <motion.p
          key={tip.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-base leading-7 text-muted"
        >
          {tip.text}
        </motion.p>
        <div className="mt-4 flex gap-2">
          <IconButton
            label="Copy tip"
            onClick={() =>
              void navigator.clipboard
                .writeText(tip.text)
                .then(() => toast.success('Tip copied'))
            }
          >
            <Copy className="size-4" />
          </IconButton>
          <IconButton
            label="Share tip"
            onClick={() => void share(tip.title, tip.text)}
          >
            <Share2 className="size-4" />
          </IconButton>
          <IconButton
            label="Save tip"
            onClick={() =>
              toggle({
                id: `tip:${tip.text}`,
                kind: 'tip',
                title: tip.title,
                subtitle: tip.text,
              })
            }
          >
            <Heart className="size-4" />
          </IconButton>
        </div>
      </PreviewCard>
    </>
  )
}
