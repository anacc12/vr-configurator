"use client"

import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface NavigationButtonsProps {
  currentStep: number
  canProceed: boolean
  onNext: () => void
  onBack: () => void
  screenSize?: "mobile" | "tablet" | "desktop"
}

export function NavigationButtons({
  currentStep,
  canProceed,
  onNext,
  onBack,
  screenSize = "desktop",
}: NavigationButtonsProps) {
  const isMobile = screenSize === "mobile"
  const isStep5AlwaysValid = currentStep === 5
  const effectiveCanProceed = isStep5AlwaysValid || canProceed
  const isDisabled = !effectiveCanProceed || currentStep === 7

  const handleNextClick = () => {
    console.log("[v0] Next button clicked", { currentStep, effectiveCanProceed, isDisabled })
    if (currentStep === 5) {
      // Force Step 5 to always proceed
      console.log("[v0] Step 5 - forcing proceed")
      onNext()
      return
    }
    if (effectiveCanProceed && currentStep !== 7) {
      onNext()
    }
  }

  return (
    <div className={`flex ${isMobile ? "flex-col gap-4" : "justify-between items-center"} w-full`}>
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 1}
        className={`flex items-center gap-2 border-border hover:bg-muted ${isMobile ? "w-full justify-center" : ""}`}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>

      <Button
        onClick={handleNextClick}
        disabled={currentStep === 7 ? true : currentStep === 5 ? false : isDisabled}
        className={`flex items-center gap-2 min-w-[140px] bg-primary hover:bg-primary/90 text-primary-foreground ${isMobile ? "w-full justify-center" : ""} ${currentStep === 5 ? "cursor-pointer" : ""}`}
      >
        {currentStep === 7 ? "Complete Configuration" : "Continue"}
        {currentStep !== 7 && <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  )
}
