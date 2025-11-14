import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * WalletErrorBoundary
 * 
 * Error boundary component to catch and handle errors in wallet provider tree.
 * 
 * Features:
 * - Catches errors in child components
 * - Logs errors to console for debugging
 * - Shows user-friendly fallback UI
 * - Provides retry mechanism
 */
export class WalletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[WalletErrorBoundary] Caught error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    });

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to error tracking service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: {
    //       component: 'WalletErrorBoundary',
    //     },
    //     extra: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   });
    // }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/**
 * ErrorFallback
 * 
 * Default fallback UI component shown when an error is caught.
 */
function ErrorFallback({ error, onReset }: ErrorFallbackProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black/95">
      <div className="mx-4 max-w-md rounded-lg border border-red-400/30 bg-red-500/10 p-6 text-center">
        <div className="mb-4 flex justify-center">
          <svg
            className="h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-xl font-bold text-white">
          Wallet Provider Error
        </h2>

        <p className="mb-4 text-sm text-white/70">
          An error occurred while initializing the wallet provider. This might be due to:
        </p>

        <ul className="mb-6 space-y-1 text-left text-sm text-white/60">
          <li>• Wallet extension not installed or disabled</li>
          <li>• Network connectivity issues</li>
          <li>• Browser compatibility problems</li>
          <li>• Corrupted wallet state</li>
        </ul>

        {error && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300">
              Technical Details
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/50 p-2 text-xs text-white/80">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onReset}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Reload Page
          </button>

          <a
            href="/"
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Go to Home
          </a>
        </div>

        <p className="mt-4 text-xs text-white/40">
          If the problem persists, please try refreshing the page or contact support.
        </p>
      </div>
    </div>
  );
}
