import { Component } from 'react'

/**
 * Generic React error boundary — catches render/lifecycle errors thrown by
 * its subtree and renders `fallback` instead of letting the error propagate
 * up and unmount the rest of the page. `<Suspense>` does NOT do this on its
 * own: it only catches thrown promises (loading states), not thrown errors
 * (e.g. a failed asset load that a loader re-throws as a render-time error).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
    this.props.onError?.(error, info)
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null
    return this.props.children
  }
}
