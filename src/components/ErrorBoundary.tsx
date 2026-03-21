import React, { Component, ErrorInfo, ReactNode } from "react";
import { Container, Alert, Button } from "react-bootstrap";
import SiteNavbar from "./SiteNavbar";
import SiteFooter from "./SiteFooter";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column">
            <header>
                <SiteNavbar />
            </header>
            <main className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
                <Container style={{ maxWidth: '800px' }}>
                    <Alert variant="danger" className="bg-dark border-danger text-light p-4 shadow-lg rounded-4">
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="rounded-circle bg-danger bg-opacity-25 d-flex align-items-center justify-content-center fw-bold" style={{ width: '50px', height: '50px', fontSize: '1.5rem', color: '#ff4444' }}>!</div>
                            <div>
                                <h4 className="fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.1em', color: '#ff4444' }}>Application Error</h4>
                                <p className="mb-0 text-muted">A critical error occurred while rendering this page.</p>
                            </div>
                        </div>
                        
                        <div className="bg-black p-3 rounded-3 mb-4 font-monospace small" style={{ border: '1px solid rgba(255, 68, 68, 0.2)', overflowX: 'auto' }}>
                            <div className="text-danger fw-bold mb-2">{this.state.error?.toString()}</div>
                            <div className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{this.state.errorInfo?.componentStack}</div>
                        </div>

                        <div className="d-flex gap-3">
                            <Button variant="danger" onClick={() => window.location.reload()}>
                                Reload Page
                            </Button>
                            <Button variant="outline-light" onClick={() => window.location.href = '/'}>
                                Go Home
                            </Button>
                        </div>
                    </Alert>
                </Container>
            </main>
            <SiteFooter />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
