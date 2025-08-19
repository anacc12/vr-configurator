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
      "- Premium head strap with external battery\n- Silicone eye mask + disinfectant wipes\n- Premium hard case for easy transport\n- Charger",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Meta%20Quest%203s%20standard%20package-UdYjSvcGt4BJJXAf47qYNsoXlZLEso.png",
  },
  {
    name: "Meta Quest 3 standard device package",
    pricePerDay: 55,
    pricingPackage: "Silver",
    description:
      "- Premium head strap with external battery\n- Silicone eye mask + disinfectant wipes\n- Premium hard case for easy transport\n- Charger",
    imageUrl:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Meta%20Quest%203%20standard%20package-p1uyjzrWtHLVR7HE9IkwpA2zzFny13.webp",
  },
]

const RIGHT_DEVICE_NAME = "Meta Quest 3 standard device package"


export function Step4ChooseDevice({ orderId, onDataChange, onValidationChange }: Step4ChooseDeviceProps) {
  const [selectedDevices, setSelectedDevices] = useState<Record<string, number>>({})
  const [eventDays, setEventDays] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const lastValidationRef = useRef<boolean | null>(null)

  type PricingTier = "Bronze" | "Silver" | "Gold"



  const hasAnyNonBronze = useMemo(
    () =>
      Object.entries(selectedDevices).some(([name, qty]) => {
        if (!qty) return false
        const d = DEVICES_DATA.find(x => x.name === name)
        return d?.pricingPackage !== "Bronze"
      }),
    [selectedDevices]
  )

  const tierRank = (t: PricingTier): number =>
    t === "Gold" ? 3 : t === "Silver" ? 2 : 1

  const maxTier = (a: PricingTier, b: PricingTier): PricingTier =>
    tierRank(a) >= tierRank(b) ? a : b


  const [prevOrderTier, setPrevOrderTier] = useState<"Bronze" | "Silver" | "Gold">("Bronze")

  useEffect(() => {
    const fetch = async () => {
      const o = await localDB.getOrder(orderId)
      if (o?.pricingTier === "Silver" || o?.pricingTier === "Gold") {
        setPrevOrderTier(o.pricingTier)
      }
    }
    fetch()
  }, [orderId])


  // const saveDeviceSelections = useCallback(
  //   async (devices: Record<string, number>, days: number) => {
  //     console.log("[v0] Saving device selections:", {
  //       devices,
  //       days,
  //       totalDevices: Object.values(devices).reduce((sum, qty) => sum + qty, 0),
  //     })

  //     const orderDevices: Omit<OrderDevice, "orderId">[] = Object.entries(devices).map(([deviceName, quantity]) => {
  //       const deviceData = DEVICES_DATA.find((d) => d.name === deviceName)!
  //       return {
  //         devicePackage: deviceName,
  //         pricePerDay: deviceData.pricePerDay,
  //         quantity,
  //         eventDays: days,
  //       }
  //     })

  //     await localDB.saveOrderDevices(orderId, orderDevices)

  //     await recalculateOrderTier(orderId)

  //     onDataChange()
  //   },
  //   [orderId, onDataChange],
  // )

  const saveDeviceSelections = useCallback(
    async (devices: Record<string, number>, days: number) => {
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

      const count = Object.values(devices).reduce((s, n) => s + n, 0)

      let nextDevicesTier: PricingTier = "Bronze"
      if (count >= 3) {
        nextDevicesTier = "Gold"
      } else if (count === 2) {
        nextDevicesTier = "Silver"
      } else if (count === 1) {
        const only = Object.entries(devices).find(([, q]) => q > 0)?.[0]
        nextDevicesTier = only === RIGHT_DEVICE_NAME ? "Silver" : "Bronze"
      }


      const current = await localDB.getOrder(orderId)
      const currentTier: PricingTier =
        (current?.pricingTier as PricingTier) || "Bronze"

      const finalTier: PricingTier = maxTier(currentTier, nextDevicesTier)

      await localDB.updateOrder(orderId, { pricingTier: finalTier })


      onDataChange()
    },
    [orderId, onDataChange]
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

  const devicesTier: "Bronze" | "Silver" | "Gold" =
    totalDevices >= 3 ? "Gold" :
      totalDevices >= 2 ? "Silver" :
        hasAnyNonBronze ? "Silver" : "Bronze"



  const shouldShowTierBadge = useMemo(() => {
    switch (prevOrderTier) {
      case "Gold":
        // već si Gold – ništa ne prikazuj
        return false
      case "Silver":
        // nemoj prikazivati Bronze ni Silver; prikaži samo ako si ovim izborom stigao do Gold
        return devicesTier === "Gold"
      case "Bronze":
      default:
        // u Bronze prikazuj kad god se digneš iznad Bronze
        return devicesTier !== "Bronze"
    }
  }, [prevOrderTier, devicesTier])


  const effectiveTier = useMemo(
    () => maxTier(prevOrderTier, devicesTier),
    [prevOrderTier, devicesTier]
  )


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

  // const QuantitySelector = useCallback(
  //   ({
  //     deviceName,
  //     currentQuantity,
  //     maxAllowed,
  //   }: {
  //     deviceName: string
  //     currentQuantity: number
  //     maxAllowed: number
  //   }) => {
  //     const quantities = [0, 1, 2, 3, 4].filter((num) => num <= maxAllowed)

  //     return (
  //       <div className="space-y-2">
  //         <Label>Quantity (Max 4 total devices)</Label>
  //         <div className="flex flex-wrap gap-2">
  //           {quantities.map((num) => {
  //             const newTotal = totalDevices - currentQuantity + num
  //             const tierForCount = getTierForDeviceCount(newTotal)
  //             const isSelected = currentQuantity === num

  //             return (
  //               <Button
  //                 key={num}
  //                 variant={isSelected ? "default" : "outline"}
  //                 size="sm"
  //                 onClick={() => handleDeviceQuantityChange(deviceName, num)}
  //                 className={`flex items-center gap-2 ${isSelected ? "bg-black text-white" : ""}`}
  //               >
  //                 <span>{num}</span>
  //                 {num > 0 && tierForCount !== "Bronze" && (
  //                   <Badge className={`${getTierBadgeColor(tierForCount)} text-xs`}>{tierForCount}</Badge>
  //                 )}
  //               </Button>
  //             )
  //           })}
  //         </div>
  //       </div>
  //     )
  //   },
  //   [totalDevices, getTierForDeviceCount, getTierBadgeColor, handleDeviceQuantityChange],
  // )

  const QuantitySelector = ({
    deviceName,
    currentQuantity,
    maxAllowed,
  }: {
    deviceName: string
    currentQuantity: number
    maxAllowed: number
  }) => {
    const canDecrement = currentQuantity > 0
    const canIncrement = totalDevices < 4 // tvrdi cap 4 ukupno

    const dec = () => {
      if (!canDecrement) return
      handleDeviceQuantityChange(deviceName, currentQuantity - 1)
    }

    const inc = () => {
      if (!canIncrement) return
      handleDeviceQuantityChange(deviceName, currentQuantity + 1)
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm">Quantity</Label>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={dec} disabled={!canDecrement} className="h-8 w-8">
            −
          </Button>

          <div className="min-w-9 h-8 rounded-full border bg-muted/50 flex items-center justify-center text-sm font-medium">
            {currentQuantity}
          </div>

          <Button variant="outline" size="icon" onClick={inc} disabled={!canIncrement} className="h-8 w-8 rounded-full">
            +
          </Button>

          <span className="ml-3 text-xs text-muted-foreground">
            Remaining: {Math.max(0, 4 - totalDevices)}
          </span>
        </div>

        {/* diskretan hint o tieru za NOVI total nakon ovog uređaja */}
        <div className="text-[11px] text-muted-foreground">
          {totalDevices === 0 && "Add devices to reach Silver at 2, Gold at 3+"}
          {totalDevices === 1 && "Add 1 more device to reach Silver"}
          {totalDevices === 2 && "Add 1+ more to reach Gold"}
        </div>
      </div>
    )
  }


  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-6xl">
      <div className="!sticky !top-25 z-[40] bg-white border-null b-0 pt-4 pb-4 w-full">
        <div className="flex items-center mb-3 justify-between" >
          <h2 className="text-2xl font-bold">Choose Your Device</h2>
          {/* Event Days Selection */}
          <div className="flex gap-2 items-center">
            <Label className="text-sm">Number of Days</Label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={eventDays <= 1}
                onClick={() => handleEventDaysChange(eventDays - 1)}
                className="h-8 w-8"
              >
                −
              </Button>

              <div className="min-w-9 h-8 rounded-full flex items-center justify-center text-md font-medium">
                {eventDays}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={eventDays >= 30}
                onClick={() => handleEventDaysChange(eventDays + 1)}
                className="bg-black text-white hover:bg-black/90"
              >
                +
              </Button>
            </div>
          </div>
        </div>



        {/* Device Tier Information */}
        <div className="flex justify-between gap-2 items-center p-2 px-3 bg-[#f6f6f6] rounded-full">
          <div className="flex gap-2 items-center">
            <p className="font-medium text-xs text-[#1f1f1f]">Total Devices Selected: {totalDevices}</p>


            {shouldShowTierBadge && (
              <Badge className={getTierBadgeColor(devicesTier)}>{devicesTier} Tier</Badge>
            )}
          </div>

          <p className="font-medium text-xs text-[#1f1f1f]">Total Cost: {formatPrice(
            Object.entries(selectedDevices).reduce((sum, [deviceName, quantity]) => {
              const device = DEVICES_DATA.find((d) => d.name === deviceName)!
              return sum + device.pricePerDay * quantity * eventDays
            }, 0),
          )}</p>

        </div>

        {/* Device Tier Information */}
        {/* {totalDevices > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Total Devices: {totalDevices}</span>
              {devicesTier !== "Bronze" && (
                <Badge className={getTierBadgeColor(devicesTier)}>{devicesTier} Tier</Badge>
              )}
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {effectiveTier === devicesTier && (
                <>
                  {totalDevices === 1 && (() => {
                    const only = Object.entries(selectedDevices).find(([, q]) => q > 0)?.[0]
                    return only === RIGHT_DEVICE_NAME
                      ? "Silver unlocked with Meta Quest 3. Add 1–2 more to reach Gold."
                      : "Add 1 more device to reach Silver."
                  })()}
                  {totalDevices === 2 && "Add 1+ more to reach Gold."}
                  {totalDevices >= 3 && "Gold tier activated with 3+ devices."}
                </>
              )}
            </p>
          </div>
        )} */}

      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 px-2 mt-2">
        {DEVICES_DATA.map((device) => {
          const currentQuantity = selectedDevices[device.name] || 0
          const otherDevicesTotal = Object.entries(selectedDevices)
            .filter(([name]) => name !== device.name)
            .reduce((sum, [, qty]) => sum + qty, 0)
          const maxAllowed = Math.min(4 - otherDevicesTotal, 4)

          return (
            <Card key={device.name} className="transition-all hover:shadow-lg !pt-0">
              <CardContent className="p-6 relative">
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
                <div className="text-xs flex items-center align-center px-2 py-1 font-medium text-white bg-black absolute top-8 left-8 rounded-full">{formatPrice(device.pricePerDay)}/day</div>

                {/* Device Description */}
                <p className="text-gray-600 text-sm mb-4 whitespace-pre-line">{device.description}</p>

                {/* Quantity Selection */}
                {/* <QuantitySelector deviceName={device.name} currentQuantity={currentQuantity} maxAllowed={maxAllowed} /> */}

                {/* Quantity stepper – nema više tagova */}
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={currentQuantity === 0}
                      onClick={() => handleDeviceQuantityChange(device.name, currentQuantity - 1)}
                      aria-label={`Decrease ${device.name} quantity`}
                    >
                      –
                    </Button>

                    <div className="min-w-[3rem] text-center text-base font-semibold">
                      {currentQuantity}
                    </div>

                    <Button
                      type="button"
                      variant="default"
                      size="icon"
                      disabled={totalDevices >= 4}
                      onClick={() => handleDeviceQuantityChange(device.name, currentQuantity + 1)}
                      aria-label={`Increase ${device.name} quantity`}
                      className="bg-black text-white hover:bg-black/90"
                    >
                      +
                    </Button>
                  </div>

                  {/* Per-card total */}
                  <div className="text-sm text-muted-foreground">
                    {currentQuantity > 0 ? (
                      <>Total: <span className="font-medium text-foreground">
                        {formatPrice(device.pricePerDay * currentQuantity * eventDays)}
                      </span></>
                    ) : <span className="opacity-70">Not selected</span>}
                  </div>
                </div>

                {/* Hint (opcionalno) */}
                <div className="mb-4 text-xs text-muted-foreground">
                  {totalDevices === 0 && "Add devices to reach Silver at 2, Gold at 3+"}
                  {totalDevices === 1 && (() => {
                    const only = Object.entries(selectedDevices).find(([, q]) => q > 0)?.[0]
                    return only === RIGHT_DEVICE_NAME
                      ? "You’re at Silver with Meta Quest 3. Add 1–2 more to reach Gold."
                      : "Add 1 more device to reach Silver."
                  })()}
                  {totalDevices === 2 && "Add 1+ more device to reach Gold."}
                  {totalDevices >= 3 && `Gold active. You can add ${Math.max(0, 4 - totalDevices)} more.`}
                </div>



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
        <div className="p-4 bg-[#f6f6f6] border-1 border-[#e6e6e6] rounded-lg">
          <div className="space-y-1 text-sm mb-2">
            {Object.entries(selectedDevices).map(([deviceName, quantity]) => {
              const device = DEVICES_DATA.find((d) => d.name === deviceName)!
              const totalCost = device.pricePerDay * quantity * eventDays
              return (
                <div key={deviceName} className="flex justify-between mb-4">
                  <span className="text-black text-opacity-60	">
                    {deviceName} (×{quantity})
                  </span>
                  <span className="text-black text-opacity-60	">{formatPrice(totalCost)}</span>
                </div>
              )
            })}
            <div className="border-t border-[#e6e6e6] pt-1 font-semibold flex justify-between">
              <span className="text-black text-opacity-60 mt-2	">Total Device Cost ({eventDays} days)</span>
              <span className="text-black text-opacity-60	">
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
