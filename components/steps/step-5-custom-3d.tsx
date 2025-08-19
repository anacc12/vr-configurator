"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { localDB } from "@/lib/local-db"
import type { OrderCustom3D } from "@/lib/database"
import { recalculateOrderTier } from "@/lib/database"

interface Step5Custom3DProps {
  orderId: string
  onDataChange: () => void
}

export interface Step5ValidationRef {
  isValid: () => boolean
  getValidationError: () => string
}

export const Step5Custom3D = forwardRef<Step5ValidationRef, Step5Custom3DProps>(({ orderId, onDataChange }, ref) => {
  const [wantsCustom3D, setWantsCustom3D] = useState<boolean | null>(null)
  const [modelCount, setModelCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const lastSavedData = useRef<string>("")

  useImperativeHandle(ref, () => ({
    isValid: () => {
      return true
    },
    getValidationError: () => {
      if (wantsCustom3D === true && modelCount === 0) {
        return "Please select the number of 3D models you want to showcase"
      }
      return ""
    },
  }))

  useEffect(() => {
    // Load existing data
    const loadCustom3DData = async () => {
      const custom3D = await localDB.getOrderCustom3D(orderId)
      if (custom3D) {
        setWantsCustom3D(custom3D.additional3DModels > 0)
        setModelCount(custom3D.additional3DModels)
      } else {
        setWantsCustom3D(false)
      }
      setIsLoading(false)
    }
    loadCustom3DData()
  }, [orderId])

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

  const getTierForModelCount = (count: number) => {
    if (count >= 6) return "Gold"
    if (count >= 1) return "Silver"
    return "Bronze"
  }

  const handleWantsCustom3DChange = async (wants: boolean) => {
    setWantsCustom3D(wants)
    if (!wants) {
      setModelCount(0)
      await saveCustom3DSelection(0)
    } else {
      if (modelCount === 0) {
        setModelCount(1)
        await saveCustom3DSelection(1)
      }
    }
  }

  const handleModelCountChange = async (count: number) => {
    setModelCount(count)
    await saveCustom3DSelection(count)
  }

  const saveCustom3DSelection = async (count: number) => {
    const currentData = `${count}`
    if (lastSavedData.current === currentData) {
      return
    }
    lastSavedData.current = currentData

    const custom3D: OrderCustom3D = {
      orderId,
      additional3DModels: count,
    }

    await localDB.saveOrderCustom3D(custom3D)

    await recalculateOrderTier(orderId)
    onDataChange()
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  const validationError =
    wantsCustom3D === true && modelCount === 0 ? "Please select the number of 3D models you want to showcase" : ""

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-bold mb-6">Custom 3D Models</h2>
      <p className="text-gray-600 mb-8">Add custom 3D models of your products to showcase in VR.</p>

      {validationError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm font-medium">{validationError}</p>
          <p className="text-yellow-600 text-xs mt-1">
            You can still proceed to the next step and complete this later.
          </p>
        </div>
      )}

      {/* Yes/No Question */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold">
              Do you want additional unique 3D models of your products showcased?
            </h3>
            <Badge className={getTierBadgeColor("Silver")}>Silver</Badge>
          </div>

          <div className="flex gap-4">
            <Button
              variant={wantsCustom3D === true ? "default" : "outline"}
              onClick={() => handleWantsCustom3DChange(true)}
              className={wantsCustom3D === true ? "bg-black text-white" : ""}
            >
              Yes
            </Button>
            <Button
              variant={wantsCustom3D === false ? "default" : "outline"}
              onClick={() => handleWantsCustom3DChange(false)}
              className={wantsCustom3D === false ? "bg-black text-white" : ""}
            >
              No
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Count Selection */}
      {wantsCustom3D === true && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Label htmlFor="modelCount" className="text-base font-semibold">
                How many products do you want to showcase?
              </Label>

              <Select
                value={modelCount.toString()}
                onValueChange={(value) => handleModelCountChange(Number.parseInt(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select number of models" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                    const tier = getTierForModelCount(num)
                    return (
                      <SelectItem key={num} value={num.toString()}>
                        <div className="flex items-center gap-2">
                          <span>
                            {num} model{num > 1 ? "s" : ""}
                          </span>
                          <Badge className={getTierBadgeColor(tier)}>{tier}</Badge>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {modelCount > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">
                      Selected: {modelCount} custom 3D model{modelCount > 1 ? "s" : ""}
                    </span>
                    <Badge className={getTierBadgeColor(getTierForModelCount(modelCount))}>
                      {getTierForModelCount(modelCount)}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700">
                    {modelCount <= 5
                      ? "1-5 models qualify for Silver tier pricing"
                      : "6-10 models qualify for Gold tier pricing"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="mt-6 bg-gray-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">About Custom 3D Models</h3>
          <p className="text-gray-600 text-sm">
            If you have chosen the Product Inspection or Build the product game, you already have 3 models of your
            products included.
          </p>
        </CardContent>
      </Card>
    </div>
  )
})

Step5Custom3D.displayName = "Step5Custom3D"
