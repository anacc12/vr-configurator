"use client"

import { useState, useEffect } from "react"
import { ConfiguratorLayout } from "@/components/configurator-layout"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { localDB } from "@/lib/local-db"

export default function ConfiguratorPage() {
  const [orderId, setOrderId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize or get existing order
    const initializeOrder = async () => {
      try {
        const existingOrderId = localStorage.getItem("vr_configurator_current_order")

        if (existingOrderId) {
          const order = await localDB.getOrder(existingOrderId)
          if (order) {
            setOrderId(existingOrderId)
            setCurrentStep(order.currentStep)
            setIsLoading(false)
            return
          }
        }

        // Create new order
        const newOrderId = await localDB.createOrder()
        localStorage.setItem("vr_configurator_current_order", newOrderId)
        setOrderId(newOrderId)
        setCurrentStep(1)
      } catch (err) {
        console.error("Failed to initialize order:", err)
        setError("Failed to initialize configurator. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }

    initializeOrder()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <div className="text-lg font-medium">Initializing configurator...</div>
          <div className="text-sm text-gray-500 mt-2">Setting up your VR experience</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Unable to create order</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ConfiguratorLayout orderId={orderId} currentStep={currentStep} onStepChange={setCurrentStep} />
    </ErrorBoundary>
  )
}
