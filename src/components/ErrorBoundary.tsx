'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-8 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-7 w-7 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Something went wrong</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-600">
            An unexpected error occurred. Please try again, and if the problem persists contact support.
          </p>
          {this.state.error?.message && (
            <p className="mt-2 max-w-sm rounded bg-red-100 px-3 py-1.5 font-mono text-xs text-red-700">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
