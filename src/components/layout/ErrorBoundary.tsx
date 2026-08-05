import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-3">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
