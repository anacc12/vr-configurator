"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ProgressBar } from "./progress-bar"
import { OrderSummary } from "./order-summary"
import { StepContent } from "./step-content"
import { NavigationButtons } from "./navigation-buttons"
import { Button } from "./ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { localDB } from "@/lib/local-db"
import { PricingService } from "@/lib/pricing-service"
import type { Order } from "@/lib/database"

interface ConfiguratorLayoutProps {
  orderId: string
  currentStep: number
  onStepChange: (step: number) => void
}

export function ConfiguratorLayout({ orderId, currentStep, onStepChange }: ConfiguratorLayoutProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isMobileOrderOpen, setIsMobileOrderOpen] = useState(false)
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">("desktop")
  const [canProceed, setCanProceed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const validationRef = useRef<boolean>(false)
  const orderIdRef = useRef(orderId)
  orderIdRef.current = orderId

  const handleDataChange = useCallback(async () => {
    try {
      const orderData = await localDB.getOrder(orderIdRef.current)
      if (orderData) {
        const totalPrice = await PricingService.calculateTotalPrice(orderIdRef.current)
        const updatedOrder = { ...orderData, totalPrice }
        await localDB.updateOrder(orderIdRef.current, { totalPrice })
        setOrder(updatedOrder)
      }
    } catch (error) {
      // Error handling will be implemented with proper error reporting service
    }
  }, [])

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize("mobile")
      } else if (width < 1024) {
        setScreenSize("tablet")
      } else {
        setScreenSize("desktop")
      }
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderData = await localDB.getOrder(orderId)
        if (orderData) {
          const totalPrice = await PricingService.calculateTotalPrice(orderId)
          const updatedOrder = { ...orderData, totalPrice }
          await localDB.updateOrder(orderId, { totalPrice })
          setOrder(updatedOrder)
        }
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }
    loadOrder()
  }, [orderId])

  const handleNext = async () => {
    if (currentStep < 7 && (canProceed || currentStep === 5)) {
      try {
        const nextStep = currentStep + 1
        await localDB.updateOrder(orderId, { currentStep: nextStep })
        onStepChange(nextStep)

        if (screenSize === "mobile") {
          setIsMobileOrderOpen(false)
        }
      } catch (error) {}
    }
  }

  const handleBack = async () => {
    if (currentStep > 1) {
      try {
        const prevStep = currentStep - 1
        await localDB.updateOrder(orderId, { currentStep: prevStep })
        onStepChange(prevStep)
        setCanProceed(true)

        if (screenSize === "mobile") {
          setIsMobileOrderOpen(false)
        }
      } catch (error) {}
    }
  }

  const handleValidationChange = useCallback(
    (isValid: boolean) => {
      if (validationRef.current !== isValid) {
        validationRef.current = isValid
        setCanProceed(isValid)
      }
    },
    [], // Empty dependency array to prevent callback recreation
  )

  const handleStepChange = useCallback(
    async (step: number) => {
      try {
        await localDB.updateOrder(orderId, { currentStep: step })
        onStepChange(step)

        if (screenSize === "mobile") {
          setIsMobileOrderOpen(false)
        }
      } catch (error) {}
    },
    [orderId, onStepChange, screenSize],
  )

  const getLeftPanelWidth = () => {
    switch (screenSize) {
      case "mobile":
        return "w-0"
      case "tablet":
        return "w-80"
      case "desktop":
        return "w-96"
      default:
        return "w-96"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
          <h2 className="text-xl font-serif font-black text-foreground mb-2">Loading Experience</h2>
          <p className="text-muted-foreground">Preparing your VR configurator...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar - Sticky at top */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <ProgressBar currentStep={currentStep} />
        <div
          className="h-1 w-full"
          style={{
            background: "linear-gradient(to right, #ff7875, #e91e63)",
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Desktop/Tablet Order Summary - Left Panel */}
        {screenSize !== "mobile" && (
          <div className={`${getLeftPanelWidth()} border-r border-border bg-card/50 flex-shrink-0`}>
            <div className="sticky top-20 h-[calc(100vh-10rem)] overflow-y-auto p-4">
              <OrderSummary orderId={orderId} order={order} />
            </div>
          </div>
        )}

        {/* Mobile Order Summary - Collapsible */}
        {screenSize === "mobile" && (
          <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-lg">
            <Button
              variant="ghost"
              className="w-full justify-between p-6 h-auto text-left hover:bg-muted/50 rounded-none"
              onClick={() => setIsMobileOrderOpen(!isMobileOrderOpen)}
            >
              <div className="flex items-center gap-3">
                <h3 className="font-serif font-black text-lg">Order Summary</h3>
                {order && (
                  <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {order.pricingTier} - ${order.totalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {isMobileOrderOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
            {isMobileOrderOpen && (
              <div className="border-t border-border bg-card/50 max-h-80 overflow-y-auto">
                <OrderSummary orderId={orderId} order={order} />
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col min-w-0 ${screenSize === "mobile" ? "mt-16" : ""}`}>
          <div className="flex-1 p-6 sm:p-8 lg:p-12 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <StepContent
                orderId={orderId}
                currentStep={currentStep}
                onDataChange={handleDataChange}
                onValidationChange={handleValidationChange}
                onStepChange={handleStepChange}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="border-t border-border bg-background/95 backdrop-blur-sm p-6 sm:p-8 flex-shrink-0">
            <div className="max-w-5xl mx-auto">
              <NavigationButtons
                currentStep={currentStep}
                canProceed={canProceed}
                onNext={handleNext}
                onBack={handleBack}
                screenSize={screenSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
