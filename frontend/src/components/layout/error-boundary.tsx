import { CircleAlert, RotateCcw } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Morning Pulse render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-canvas p-6 text-ink">
          <section className="glass max-w-md rounded-[2rem] p-8 text-center">
            <CircleAlert
              className="mx-auto size-9 text-accent"
              aria-hidden="true"
            />
            <h1 className="mt-5 font-display text-2xl font-bold">
              Your pulse skipped a beat
            </h1>
            <p className="mt-3 leading-6 text-muted">
              Something unexpected happened. A quick refresh should get your
              morning back on track.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-canvas"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Refresh dashboard
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
