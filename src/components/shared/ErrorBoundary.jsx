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
    this.setState({ errorInfo });
    console.error('[ORAs ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError)        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505]">
                <div className="max-w-md w-full">
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {this.state.error?.toString()}
                            </p>
                            <pre className="text-left text-xs text-red-400 bg-black p-4 rounded overflow-auto max-h-40">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>
                        <div className="pt-6">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reload App
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    return this.props.children;
  }
}
