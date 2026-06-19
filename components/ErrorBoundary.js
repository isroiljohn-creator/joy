"use client";
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: "fixed",
          inset: 16,
          padding: 24,
          color: "#dc2626",
          background: "#fee2e2",
          fontFamily: "monospace",
          fontSize: 12,
          whiteSpace: "pre-wrap",
          overflowY: "auto",
          borderRadius: 16,
          border: "2px solid #ef4444",
          zIndex: 999999
        }}>
          <h3 style={{ margin: "0 0 10px", color: "#991b1b" }}>React Rendering Error:</h3>
          <p style={{ margin: "0 0 16px", lineHeight: 1.5, fontWeight: "bold" }}>
            {this.state.error?.message || String(this.state.error)}
          </p>
          <pre style={{ margin: 0, fontSize: 10, background: "rgba(0,0,0,0.05)", padding: 10, borderRadius: 8 }}>
            {this.state.error?.stack || "No stack trace available"}
          </pre>
          {this.state.errorInfo && (
            <pre style={{ marginTop: 12, fontSize: 10, background: "rgba(0,0,0,0.05)", padding: 10, borderRadius: 8 }}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Qayta yuklash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
