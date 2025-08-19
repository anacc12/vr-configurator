"use client"

import { Step1UserDetails } from "./steps/step-1-user-details"
import { Step2ChooseGame } from "./steps/step-2-choose-game"
import { Step3ChooseEnvironment } from "./steps/step-3-choose-environment"
import { Step4ChooseDevice } from "./steps/step-4-choose-device"
import { Step5Custom3D, type Step5ValidationRef } from "./steps/step-5-custom-3d"
import { Step6AdditionalOptions } from "./steps/step-6-additional-options"
import { Step7OrderOverview } from "./steps/step-7-order-overview"
import { AccessibilitySkipLink } from "./ui/accessibility-skip-link"
import { useState, useEffect, useRef } from "react"

interface StepContentProps {
  orderId: string
  currentStep: number
  onDataChange: () => void
  onValidationChange?: (isValid: boolean) => void
  onStepChange?: (step: number) => void
}

export function StepContent({
  orderId,
  currentStep,
  onDataChange,
  onValidationChange,
  onStepChange,
}: StepContentProps) {
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({})
  const prevValidationRef = useRef<boolean | null>(null)

  const step5Ref = useRef<Step5ValidationRef>(null)

  const handleValidationChange = (step: number, isValid: boolean) => {
    setStepValidation((prev) => ({ ...prev, [step]: isValid }))
  }

  useEffect(() => {
    let currentStepValid = currentStep === 5 ? true : (stepValidation[currentStep] ?? false)

    if (currentStep === 5 && step5Ref.current) {
      currentStepValid = step5Ref.current.isValid()
    }

    if (prevValidationRef.current !== currentStepValid) {
      prevValidationRef.current = currentStepValid
      onValidationChange?.(currentStepValid)
    }
  }, [stepValidation, currentStep])

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1UserDetails
            orderId={orderId}
            onDataChange={onDataChange}
            onValidationChange={(isValid) => handleValidationChange(1, isValid)}
          />
        )
      case 2:
        return (
          <Step2ChooseGame
            orderId={orderId}
            onDataChange={onDataChange}
            onValidationChange={(isValid) => handleValidationChange(2, isValid)}
          />
        )
      case 3:
        return (
          <Step3ChooseEnvironment
            orderId={orderId}
            onDataChange={onDataChange}
            onValidationChange={(isValid) => handleValidationChange(3, isValid)}
          />
        )
      case 4:
        return (
          <Step4ChooseDevice
            orderId={orderId}
            onDataChange={onDataChange}
            onValidationChange={(isValid) => handleValidationChange(4, isValid)}
          />
        )
      case 5:
        return <Step5Custom3D ref={step5Ref} orderId={orderId} onDataChange={onDataChange} />
      case 6:
        return (
          <Step6AdditionalOptions
            orderId={orderId}
            onDataChange={onDataChange}
            onValidationChange={(isValid) => handleValidationChange(6, isValid)}
          />
        )
      case 7:
        return (
          <Step7OrderOverview
            orderId={orderId}
            onDataChange={onDataChange}
            onValidationChange={(isValid) => handleValidationChange(7, isValid)}
            onStepChange={onStepChange || (() => {})}
          />
        )
      default:
        return (
          <div className="text-center py-12">
            <div className="text-destructive mb-4 text-lg font-serif">Invalid step: {currentStep}</div>
            <button
              onClick={() => onStepChange?.(1)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Step 1
            </button>
          </div>
        )
    }
  }

  return (
    <div className="w-full">
      <AccessibilitySkipLink />
      <main id="main-content" className="focus:outline-none" tabIndex={-1}>
        {renderStepContent()}
      </main>
    </div>
  )
}
