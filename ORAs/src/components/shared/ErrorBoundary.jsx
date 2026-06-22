import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleHardReset = () => {
    if (window.confirm("This will clear local settings and log you out. Are you sure?")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 text-center">
          <div className="max-w-md w-full space-y-6 bg-card p-8 rounded-3xl border border-border/50 shadow-2xl">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
              <p className="text-muted-foreground text-sm">
                The application encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-muted/30 p-4 rounded-xl overflow-auto text-xs font-mono max-h-40">
                <p className="text-destructive font-semibold mb-2">{this.state.error.toString()}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={this.handleReset} className="w-full h-12 rounded-xl text-base" size="lg">
                <RefreshCcw className="w-4 h-4 mr-2" /> Reload Application
              </Button>
              <div className="flex gap-3">
                <Button onClick={() => window.location.href = '/'} variant="outline" className="flex-1 h-12 rounded-xl">
                  <Home className="w-4 h-4 mr-2" /> Go Home
                </Button>
                <Button onClick={this.handleHardReset} variant="destructive" className="flex-1 h-12 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  Reset Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
