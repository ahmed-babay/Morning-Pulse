import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Sparkles } from 'lucide-react'

import { StatusPill } from '../ui/primitives'

export function GreetingHero() {
  const reduceMotion = useReducedMotion()
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.section
      id="overview"
      className="mb-10 grid gap-6 pt-2 md:grid-cols-[1fr_auto] md:items-end"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        <StatusPill tone="accent">
          <Sparkles className="mr-1.5 size-3" aria-hidden="true" />
          Your morning brief
        </StatusPill>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.98] font-extrabold tracking-[-0.055em] sm:text-6xl lg:text-[5.2rem]">
          {greeting}, <span className="text-accent italic">Ahmed.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          A calm look at what matters today—before the day gets loud.
        </p>
      </div>
      <a
        href="#today"
        className="group inline-flex w-fit items-center gap-2 rounded-full border border-line bg-panel px-4 py-2.5 text-sm font-bold shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-accent/30"
      >
        Explore your day
        <ArrowUpRight
          className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </a>
    </motion.section>
  )
}
