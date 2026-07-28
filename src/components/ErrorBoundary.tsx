import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public props!: Props;
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

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    if (confirm('Reset application data to clear corrupt state?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFCF8] text-[#2D2A26] flex items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-[#E8E2D2] shadow-xl space-y-4">
            <div className="w-12 h-12 bg-[#C5A059]/20 text-[#C5A059] rounded-full flex items-center justify-center mx-auto text-xl font-bold font-serif">
              易
            </div>
            <h2 className="text-xl font-bold text-[#3E4A3E] font-serif">
              易阁 YiGa - Application Notice
            </h2>
            <p className="text-xs text-[#7C776B] leading-relaxed">
              An unexpected display or state error occurred on startup. Click below to reload or reset local app cache.
            </p>
            {this.state.error && (
              <div className="p-3 bg-[#F5F2EA] rounded-xl text-[11px] font-mono text-[#A3483B] text-left overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-[#5A6D5B] text-white text-xs font-semibold rounded-xl hover:bg-[#485749] transition-colors"
              >
                Reload App
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#F5F2EA] text-[#6B6559] text-xs font-semibold rounded-xl hover:bg-[#E8E2D2] transition-colors border border-[#E8E2D2]"
              >
                Reset App Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
