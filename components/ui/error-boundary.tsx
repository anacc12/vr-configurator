"use client"

import { Component, type ReactNode } from "react"
import { Button } from "./button"
import { Card, CardContent } from "./card"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-xl">⚠</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-600 text-sm mb-4">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="text-left text-xs text-gray-500 bg-gray-50 p-2 rounded mb-4">
                    <summary className="cursor-pointer">Error Details</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  </details>
                )}
              </div>
              <Button onClick={() => window.location.reload()} className="w-full bg-black text-white hover:bg-gray-800">
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
