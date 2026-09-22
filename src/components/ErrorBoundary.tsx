import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere below it.
 *
 * Without this, a single thrown error unmounts the whole React tree and the
 * user is left staring at an empty page with nothing to act on and nothing in
 * the UI to report. This turns that into a visible message plus a way out.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the stack in the console so it is still available in production.
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHome = () => {
    window.location.assign("/");
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="dark flex min-h-screen items-center justify-center bg-gradient-hero px-6">
        <div className="w-full max-w-md rounded-2xl border border-border/20 bg-card p-8 text-center shadow-2xl">
          <h1 className="font-display text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page hit an unexpected error. Reloading usually fixes it.
          </p>

          <p className="mt-4 break-words rounded-lg bg-muted/40 p-3 text-left font-mono text-xs text-muted-foreground">
            {error.message || String(error)}
          </p>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex-1 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-navy hover:opacity-90"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="flex-1 rounded-lg border border-border/40 px-4 py-2 text-sm font-semibold hover:bg-muted/40"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
