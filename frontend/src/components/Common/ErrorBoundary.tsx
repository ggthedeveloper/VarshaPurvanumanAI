import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 p-6 text-center space-y-4 my-4">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">
              {this.props.fallbackTitle || 'Component Rendering Error'}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-md mx-auto">
              {this.props.fallbackMessage ||
                'An unexpected error occurred while rendering this component. Real data and system state remain intact.'}
            </p>
            {this.state.error && (
              <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 mt-2 bg-rose-100/50 dark:bg-rose-950/70 p-2 rounded max-w-lg mx-auto overflow-x-auto text-left">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            <span>Reset & Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
