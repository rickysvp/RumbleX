import React from 'react';

interface Props {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public state: State;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { fallback, children } = (this as any).props;
    if (this.state.hasError) {
      return fallback || (
        <div className="h-screen w-full bg-[#0A0A0A] flex items-center justify-center p-10 font-app-mono">
          <div className="max-w-xl w-full border border-red-500/30 bg-red-500/5 p-8">
            <h1 className="text-red-500 font-app-bold text-[24px] uppercase tracking-tighter mb-4">
              CRITICAL_FAULTS_DETECTED
            </h1>
            <p className="text-app-muted text-[14px] uppercase tracking-widest leading-relaxed mb-6">
              The neural link has experienced a fatal disconnect. Diagnostic data has been logged to the terminal.
            </p>
            <div className="bg-black/40 border border-[#222] p-4 mb-6">
               <code className="text-red-400/80 text-[12px] break-all">
                 {this.state.error?.message}
               </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-500 text-black font-app-bold text-[12px] uppercase tracking-widest hover:bg-white transition-colors"
            >
              Restart Protocol
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
