import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Component, Suspense, type ReactNode } from "react";

type BoundaryProps = {
  children: ReactNode;
  errorTitle: string;
  onReset: () => void;
};

type BoundaryState = { failed: boolean };

class SectionErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  private retry = () => {
    this.props.onReset();
    this.setState({ failed: false });
  };

  override render() {
    if (this.state.failed) {
      return (
        <div className="surface px-6 py-10 text-center" role="alert">
          <p className="font-medium text-forest">{this.props.errorTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check the connection and try loading this section again.
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="mt-5 rounded-[2px] border border-input bg-background px-4 py-2 text-sm font-medium text-forest hover:bg-secondary"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function QuerySection({
  children,
  fallback,
  errorTitle,
}: {
  children: ReactNode;
  fallback: ReactNode;
  errorTitle: string;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <SectionErrorBoundary errorTitle={errorTitle} onReset={reset}>
          <Suspense fallback={fallback}>{children}</Suspense>
        </SectionErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
