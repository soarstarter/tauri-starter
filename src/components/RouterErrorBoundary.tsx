import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation, useNavigate, type Location, type NavigateFunction } from 'react-router'
import { logRendererError } from '@/utils/renderer-logger'

interface InnerProps {
  children: ReactNode
  navigate: NavigateFunction
  location: Location
}

interface InnerState {
  hasError: boolean
}

/**
 * Catches render errors thrown by routed pages and redirects to the `/error`
 * route (rendered under the shell-less layout), preserving the error in router
 * state. Lives inside the router so it can navigate; the top-level
 * `ErrorBoundary` in renderer.tsx remains the last-resort fallback for failures
 * that happen before/around the router itself.
 */
class RouterErrorBoundaryInner extends Component<InnerProps, InnerState> {
  state: InnerState = { hasError: false }

  static getDerivedStateFromError(): InnerState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logRendererError(error, {
      source: 'router-error-boundary',
      componentStack: info.componentStack ?? '',
    })
    this.props.navigate('/error', {
      replace: true,
      state: { message: error.message, stack: error.stack },
    })
  }

  componentDidUpdate(prevProps: InnerProps): void {
    // Once the redirect to /error lands, clear the error so the routed children
    // (now matching /error) render again.
    if (this.state.hasError && prevProps.location.key !== this.props.location.key) {
      this.setState({ hasError: false })
    }
  }

  render(): ReactNode {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export const RouterErrorBoundary = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <RouterErrorBoundaryInner navigate={navigate} location={location}>
      {children}
    </RouterErrorBoundaryInner>
  )
}
