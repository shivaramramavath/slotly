'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI error caught by boundary:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0A0A] text-[#FAFAFA]">
          <Card className="max-w-md w-full border-[#EF4444]/40">
            <CardHeader>
              <CardTitle className="text-[#EF4444]">Application Error</CardTitle>
              <CardDescription>
                An unexpected interface error occurred.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-3 rounded bg-[#181818] border border-[#232323] text-xs font-mono text-[#8A8A8A] overflow-auto">
                {this.state.error?.message || 'Unknown runtime error'}
              </pre>
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
              >
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
