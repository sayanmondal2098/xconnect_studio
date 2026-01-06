import React from "react";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any) {
    // eslint-disable-next-line no-console
    console.error("UI crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl2 bg-panel border border-border shadow-soft p-4">
            <div className="font-semibold text-danger">Canvas crashed</div>
            <div className="text-sm text-muted mt-1">
              ReactFlow had a moment. Reset the workflow state from Settings or reload the page.
            </div>
          </div>
        )
      );
    }
    return this.props.children as any;
  }
}
