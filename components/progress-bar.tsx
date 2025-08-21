"use client"

import { useState, useEffect } from "react"

interface ProgressBarProps {
  currentStep: number
}

const STEPS = [
  { number: 1, title: "Details", shortTitle: "Details" },
  { number: 2, title: "Games", shortTitle: "Game" },
  { number: 3, title: "Environments", shortTitle: "Environment" },
  { number: 4, title: "Devices", shortTitle: "Device" },
  { number: 5, title: "Custom", shortTitle: "3D Models" },
  { number: 6, title: "Additional", shortTitle: "Options" },
  { number: 7, title: "Overview", shortTitle: "Overview" },
]

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="w-full px-2 sm:px-4 py-3 sm:py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200
                  ${
                    step.number === currentStep
                      ? "bg-black text-white border-black scale-110"
                      : step.number < currentStep
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-400 border-gray-300"
                  }
                `}
              >
                {step.number}
              </div>
              <div
                className={`
                  mt-1 sm:mt-2 text-xs text-center max-w-16 sm:max-w-20 leading-tight
                  ${
                    step.number === currentStep
                      ? "text-black font-medium"
                      : step.number < currentStep
                        ? "text-gray-800"
                        : "text-gray-400"
                  }
                `}
              >
                {isMobile ? step.shortTitle : step.title}
              </div>
            </div>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div
                className={`
                  h-0.5 w-4 sm:w-8 lg:w-12 mx-1 sm:mx-2 mt-[-20px] sm:mt-[-24px] transition-all duration-200
                  ${step.number < currentStep ? "bg-gray-800" : "bg-gray-300"}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
