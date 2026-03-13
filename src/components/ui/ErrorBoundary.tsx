import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackPath?: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    fetch('https://api.decacrm.live/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'react',
        message: error.message,
        stack: error.stack?.substring(0, 2000),
        component: info.componentStack?.substring(0, 1000),
      }),
    }).catch(() => {});
  }

  handleGoBack = () => {
    this.setState({ hasError: false });
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="card p-8 text-center max-w-md">
            <AlertTriangle size={36} className="mx-auto text-amber-400 mb-4" />
            <h2 className="text-lg font-semibold text-gray-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              This page ran into an unexpected error. You can go back and try again.
            </p>
            <button
              onClick={this.handleGoBack}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <ArrowLeft size={14} />
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
