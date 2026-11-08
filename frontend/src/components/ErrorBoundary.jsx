import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="system-page">
          <h1>Something went wrong</h1>
          <p>Please reload to return to your safety tools.</p>
          <button onClick={() => window.location.reload()}>
            Reload application
          </button>
          <a href="tel:112">Call 112 in an emergency</a>
        </main>
      );
    return this.props.children;
  }
}
