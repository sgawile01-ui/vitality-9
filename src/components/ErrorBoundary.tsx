import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="p-6">
        <h1 className="text-xl font-bold">Unable to load this page</h1>
        <p role="alert">Please reload and try again. If this continues, contact support.</p>
        <button className="mt-4 underline" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
