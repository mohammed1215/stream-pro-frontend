import { Component, type ReactNode } from "react"
import { Link } from "react-router-dom"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown): void {
    // Intentionally minimal: global API toasts already surface network
    // errors. Keep console.error so crashes are still diagnosable in prod
    // tooling without adding a logging dependency.
    console.error(error)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              Please refresh the page or go back home.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Refresh
              </button>
              <Link
                to="/"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Go home
              </Link>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
