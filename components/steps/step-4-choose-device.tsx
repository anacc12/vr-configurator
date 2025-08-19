"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { localDB } from "@/lib/local-db"
import type { OrderDevice } from "@/lib/database"
import { recalculateOrderTier } from "@/lib/database"

interface Step4ChooseDeviceProps {
  orderId: string
  onDataChange: () => void
  onValidationChange: (isValid: boolean) => void
}

const DEVICES_DATA = [
  {
    name: "Meta Quest 3s standard device package",
    pricePerDay: 30,
    pricingPackage: "Bronze",
    description:
      "Included:\n- Premium head strap with external battery\n- Silicone eye mask + disinfectant wipes\n- Premium hard case for easy transport\n- Charger",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Meta%20Quest%203s%20standard%20package-UdYjSvcGt4BJJXAf47qYNsoXlZLEso.png",
  },
  {
    name: "Meta Quest 3 standard device package",
    pricePerDay: 55,
    pricingPackage: "Silver",
    description:
      "Included:\n- Premium head strap with external battery\n- Silicone eye mask + disinfectant wipes\n- Premium hard case for easy transport\n- Charger",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Meta%20Quest%203%20standard%20package-p1uyjzrWtHLVR7HE9IkwpA2zzFny13.webp",
  },
]

export function Step4ChooseDevice({ orderId, onDataChange, onValidationChange }: Step4ChooseDeviceProps) {
  const [selectedDevices, setSelectedDevices] = useState<Record<string, number>>({})
  const [eventDays, setEventDays] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const lastValidationRef = useRef<boolean | null>(null)

  const saveDeviceSelections = useCallback(
    async (devices: Record<string, number>, days: number) => {
      console.log("[v0] Saving device selections:", {
        devices,
        days,
        totalDevices: Object.values(devices).reduce((sum, qty) => sum + qty, 0),
      })

      const orderDevices: Omit<OrderDevice, "orderId">[] = Object.entries(devices).map(([deviceName, quantity]) => {
        const deviceData = DEVICES_DATA.find((d) => d.name === deviceName)!
        return {
          devicePackage: deviceName,
          pricePerDay: deviceData.pricePerDay,
          quantity,
          eventDays: days,
        }
      })

      await localDB.saveOrderDevices(orderId, orderDevices)

      await recalculateOrderTier(orderId)

      onDataChange()
    },
    [orderId, onDataChange],
  )

  useEffect(() => {
    // Load existing device selections
    const loadDeviceData = async () => {
      const devices = await localDB.getOrderDevices(orderId)

      if (devices.length > 0) {
        const deviceMap: Record<string, number> = {}
        devices.forEach((device) => {
          deviceMap[device.devicePackage] = device.quantity
        })
        setSelectedDevices(deviceMap)
        setEventDays(devices[0]?.eventDays || 1)
      }

      setIsLoading(false)
    }
    loadDeviceData()
  }, [orderId])

  const totalDevices = useMemo(() => {
    return Object.values(selectedDevices).reduce((sum, qty) => sum + qty, 0)
  }, [selectedDevices])

  useEffect(() => {
    // Validate selection and notify parent only when validation actually changes
    const isValid = totalDevices > 0 && eventDays > 0
    if (lastValidationRef.current !== isValid) {
      lastValidationRef.current = isValid
      onValidationChange(isValid)
    }
  }, [totalDevices, eventDays]) // Removed onValidationChange from dependencies to prevent infinite loop

  const getTierBadgeColor = useCallback((tier: string) => {
    switch (tier) {
      case "Silver":
        return "bg-gray-400 text-white"
      case "Gold":
        return "bg-yellow-500 text-white"
      default:
        return ""
    }
  }, [])

  const getTierForDeviceCount = useCallback((count: number) => {
    if (count >= 3) return "Gold"
    if (count >= 2) return "Silver"
    return "Bronze"
  }, [])

  const currentTier = useMemo(() => getTierForDeviceCount(totalDevices), [totalDevices, getTierForDeviceCount])

  const handleDeviceQuantityChange = useCallback(
    async (deviceName: string, quantity: number) => {
      const newSelectedDevices = {
        ...selectedDevices,
        [deviceName]: quantity,
      }

      // Remove devices with 0 quantity
      if (quantity === 0) {
        delete newSelectedDevices[deviceName]
      }

      setSelectedDevices(newSelectedDevices)
      await saveDeviceSelections(newSelectedDevices, eventDays)
    },
    [selectedDevices, eventDays, saveDeviceSelections],
  )

  const handleEventDaysChange = useCallback(
    async (days: number) => {
      setEventDays(days)
      await saveDeviceSelections(selectedDevices, days)
    },
    [selectedDevices, saveDeviceSelections],
  )

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }, [])

  const QuantitySelector = useCallback(
    ({
      deviceName,
      currentQuantity,
      maxAllowed,
    }: {
      deviceName: string
      currentQuantity: number
      maxAllowed: number
    }) => {
      const quantities = [0, 1, 2, 3, 4].filter((num) => num <= maxAllowed)

      return (
        <div className="space-y-2">
          <Label>Quantity (Max 4 total devices)</Label>
          <div className="flex flex-wrap gap-2">
            {quantities.map((num) => {
              const newTotal = totalDevices - currentQuantity + num
              const tierForCount = getTierForDeviceCount(newTotal)
              const isSelected = currentQuantity === num

              return (
                <Button
                  key={num}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDeviceQuantityChange(deviceName, num)}
                  className={`flex items-center gap-2 ${isSelected ? "bg-black text-white" : ""}`}
                >
                  <span>{num}</span>
                  {num > 0 && tierForCount !== "Bronze" && (
                    <Badge className={`${getTierBadgeColor(tierForCount)} text-xs`}>{tierForCount}</Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      )
    },
    [totalDevices, getTierForDeviceCount, getTierBadgeColor, handleDeviceQuantityChange],
  )

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Choose Your Device</h2>
      <p className="text-gray-600 mb-8">Select the VR headsets for your event and specify the number of event days.</p>

      {/* Event Days Selection */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <Label htmlFor="eventDays" className="text-base font-semibold mb-2 block">
          Number of Event Days
        </Label>
        <Input
          id="eventDays"
          type="number"
          min="1"
          max="30"
          value={eventDays}
          onChange={(e) => handleEventDaysChange(Number.parseInt(e.target.value) || 1)}
          className="w-32"
        />
        <p className="text-sm text-gray-600 mt-1">Device rental pricing is calculated per day.</p>
      </div>

      {/* Device Tier Information */}
      {totalDevices > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Total Devices: {totalDevices}</span>
            {currentTier !== "Bronze" && <Badge className={getTierBadgeColor(currentTier)}>{currentTier} Tier</Badge>}
          </div>
          <p className="text-sm text-blue-700 mt-1">
            {totalDevices === 1 && "Select 1 more device to upgrade to Silver tier"}
            {totalDevices === 2 && "Add 1-2 more devices to upgrade to Gold tier"}
            {totalDevices >= 3 && "Gold tier activated with 3+ devices"}
          </p>
        </div>
      )}

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {DEVICES_DATA.map((device) => {
          const currentQuantity = selectedDevices[device.name] || 0
          const otherDevicesTotal = Object.entries(selectedDevices)
            .filter(([name]) => name !== device.name)
            .reduce((sum, [, qty]) => sum + qty, 0)
          const maxAllowed = Math.min(4 - otherDevicesTotal, 4)

          return (
            <Card key={device.name} className="transition-all hover:shadow-lg">
              <CardContent className="p-6">
                {/* Device Image Placeholder */}
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <img
                    src={
                      device.imageUrl ||
                      `/abstract-geometric-shapes.png?height=150&width=200&query=${encodeURIComponent(device.name + " VR headset") || "/placeholder.svg"}`
                    }
                    alt={device.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Device Title and Badge */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg leading-tight">{device.name}</h3>
                  {device.pricingPackage !== "Bronze" && (
                    <Badge className={getTierBadgeColor(device.pricingPackage)}>{device.pricingPackage}</Badge>
                  )}
                </div>

                {/* Price */}
                <div className="text-xl font-bold text-green-600 mb-2">{formatPrice(device.pricePerDay)}/day</div>

                {/* Device Description */}
                <p className="text-gray-600 text-sm mb-4 whitespace-pre-line">{device.description}</p>

                {/* Quantity Selection */}
                <QuantitySelector deviceName={device.name} currentQuantity={currentQuantity} maxAllowed={maxAllowed} />

                {currentQuantity > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Total: {formatPrice(device.pricePerDay * currentQuantity * eventDays)}
                  </div>
                )}

                {/* Learn More Button */}
                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  Learn more about this device
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Total Cost Summary */}
      {totalDevices > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Device Rental Summary</h3>
          <div className="space-y-1 text-sm">
            {Object.entries(selectedDevices).map(([deviceName, quantity]) => {
              const device = DEVICES_DATA.find((d) => d.name === deviceName)!
              const totalCost = device.pricePerDay * quantity * eventDays
              return (
                <div key={deviceName} className="flex justify-between">
                  <span>
                    {deviceName} (×{quantity})
                  </span>
                  <span>{formatPrice(totalCost)}</span>
                </div>
              )
            })}
            <div className="border-t border-green-300 pt-1 font-semibold flex justify-between">
              <span>Total Device Cost ({eventDays} days)</span>
              <span>
                {formatPrice(
                  Object.entries(selectedDevices).reduce((sum, [deviceName, quantity]) => {
                    const device = DEVICES_DATA.find((d) => d.name === deviceName)!
                    return sum + device.pricePerDay * quantity * eventDays
                  }, 0),
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
