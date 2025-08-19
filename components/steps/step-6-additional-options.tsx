"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Checkbox } from "../ui/checkbox"
import { localDB } from "@/lib/local-db"
import type { OrderOption } from "@/lib/database"
import { recalculateOrderTier } from "@/lib/database"

interface Step6AdditionalOptionsProps {
  orderId: string
  onDataChange: () => void
  onValidationChange: (isValid: boolean) => void
}

const OPTIONS_DATA = [
  {
    id: "leaderboard",
    name: "Leaderboard",
    tier: "Silver",
    description: "Real-time leaderboard to track participant scores and create friendly competition during your event.",
  },
  {
    id: "live-chat",
    name: "Live chat support during event",
    tier: "Silver",
    description: "Dedicated support team available via live chat throughout your event for immediate assistance.",
  },
  {
    id: "vr-trailer",
    name: "VR game trailer creation",
    tier: "Silver",
    description:
      "We recommend that you show the gameplay of the game at the booth. We will create a full 30-second trailer for your game with your branding.",
  },
  {
    id: "ai-chat",
    name: "24/7 AI chat support",
    tier: "Gold",
    description: "Advanced AI-powered chat support available 24/7 for instant responses to common questions.",
  },
  {
    id: "analytics-basic",
    name: "Analytics Basic",
    tier: "Silver",
    description: "Basic analytics including participant engagement, completion rates, and session duration.",
  },
  {
    id: "analytics-advanced",
    name: "Analytics Advanced",
    tier: "Gold",
    description: "Advanced analytics with detailed heatmaps, user behavior tracking, and comprehensive reporting.",
  },
]

export function Step6AdditionalOptions({ orderId, onDataChange, onValidationChange }: Step6AdditionalOptionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [analyticsChoice, setAnalyticsChoice] = useState<"basic" | "advanced" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const validationCalledRef = useRef(false)
  const lastSavedOptionsRef = useRef<string>("")

  useEffect(() => {
    const loadOptionsData = async () => {
      const options = await localDB.getOrderOptions(orderId)
      const optionIds = new Set(
        options.map((opt) => {
          switch (opt.optionName) {
            case "Leaderboard":
              return "leaderboard"
            case "Live chat support during event":
              return "live-chat"
            case "VR game trailer creation":
              return "vr-trailer"
            case "24/7 AI chat support":
              return "ai-chat"
            case "Analytics Basic":
              setAnalyticsChoice("basic")
              return "analytics-basic"
            case "Analytics Advanced":
              setAnalyticsChoice("advanced")
              return "analytics-advanced"
            default:
              return ""
          }
        }),
      )
      setSelectedOptions(optionIds)
      setIsLoading(false)
    }
    loadOptionsData()
  }, [orderId])

  useEffect(() => {
    validationCalledRef.current = false
  }, [orderId])

  useEffect(() => {
    if (!isLoading) {
      onValidationChange(true)
      validationCalledRef.current = true
    }
  }, [isLoading])

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "Silver":
        return "bg-gray-400 text-white"
      case "Gold":
        return "bg-yellow-500 text-white"
      default:
        return ""
    }
  }

  const handleOptionToggle = async (optionId: string, checked: boolean) => {
    const newSelectedOptions = new Set(selectedOptions)

    if (optionId === "analytics-basic" || optionId === "analytics-advanced") {
      newSelectedOptions.delete("analytics-basic")
      newSelectedOptions.delete("analytics-advanced")
      if (checked) {
        newSelectedOptions.add(optionId)
        setAnalyticsChoice(optionId === "analytics-basic" ? "basic" : "advanced")
      } else {
        setAnalyticsChoice(null)
      }
    } else {
      if (checked) {
        newSelectedOptions.add(optionId)
      } else {
        newSelectedOptions.delete(optionId)
      }
    }

    setSelectedOptions(newSelectedOptions)
    await saveOptionsSelection(newSelectedOptions)
  }

  const saveOptionsSelection = async (options: Set<string>) => {
    const optionsString = Array.from(options).sort().join(",")
    if (lastSavedOptionsRef.current === optionsString) {
      return
    }
    lastSavedOptionsRef.current = optionsString

    const orderOptions: Omit<OrderOption, "orderId">[] = Array.from(options).map((optionId) => {
      const optionData = OPTIONS_DATA.find((opt) => opt.id === optionId)!
      return {
        optionName: optionData.name,
        tier: optionData.tier,
      }
    })

    await localDB.saveOrderOptions(orderId, orderOptions)

    await recalculateOrderTier(orderId)
    onDataChange() // Keep onDataChange for explicit user interactions only
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Additional Options</h2>
      <p className="text-gray-600 mb-8">
        Enhance your VR experience with additional features. All options are optional and can be added to any package.
      </p>

      {selectedOptions.size > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Selected Options:</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedOptions).map((optionId) => {
              const option = OPTIONS_DATA.find((opt) => opt.id === optionId)!
              return (
                <Badge key={optionId} variant="secondary" className="bg-green-100 text-green-800">
                  {option.name}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {OPTIONS_DATA.map((option) => {
          const isAnalytics = option.id.startsWith("analytics")
          const isSelected = selectedOptions.has(option.id)
          const isAnalyticsDisabled =
            isAnalytics && analyticsChoice !== null && !isSelected && analyticsChoice !== option.id.split("-")[1]

          return (
            <Card
              key={option.id}
              className={`transition-all ${isSelected ? "ring-2 ring-black bg-blue-50" : "hover:shadow-lg"} ${
                isAnalyticsDisabled ? "opacity-50" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={option.id}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleOptionToggle(option.id, checked as boolean)}
                      disabled={isAnalyticsDisabled}
                    />
                    <label htmlFor={option.id} className="font-semibold cursor-pointer">
                      {option.name}
                    </label>
                  </div>
                  <Badge className={getTierBadgeColor(option.tier)}>{option.tier}</Badge>
                </div>

                <p className="text-gray-600 text-sm mb-4">{option.description}</p>

                {isAnalytics && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    {option.id === "analytics-basic"
                      ? "Choose Basic OR Advanced analytics"
                      : "Premium analytics package"}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-8 bg-gray-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">About Additional Options</h3>
          <p className="text-gray-600 text-sm mb-2">
            These optional features can enhance your VR event experience. Each option includes setup, configuration, and
            support during your event.
          </p>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>• All options can be added to any pricing tier</li>
            <li>• Analytics options are mutually exclusive (choose Basic OR Advanced)</li>
            <li>• Support options include training for your team</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
