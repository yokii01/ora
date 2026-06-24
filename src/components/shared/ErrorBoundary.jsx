import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ORAs ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          color: '#e5e5e5',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}>
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: '#737373', maxWidth: 320, marginBottom: 24, lineHeight: 1.5 }}>
            An unexpected error occurred. Your data is safe — try reloading the app.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 9999,
              backgroundColor: '#7c3aed', color: 'white',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            <RefreshCw size={16} />
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
