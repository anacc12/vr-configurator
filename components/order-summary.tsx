"use client"

import { useEffect, useState } from "react"
import { localDB } from "@/lib/local-db"
import { PricingCalculator } from "@/lib/pricing-calculator"
import type { Order, OrderGame, OrderEnvironment, OrderDevice, OrderCustom3D, OrderOption } from "@/lib/database"

interface OrderSummaryProps {
  orderId: string
  order: Order | null
}

export function OrderSummary({ orderId, order }: OrderSummaryProps) {
  const [orderData, setOrderData] = useState<{
    games: OrderGame[]
    environments: OrderEnvironment[]
    devices: OrderDevice[]
    custom3D: OrderCustom3D | null
    options: OrderOption[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderId) return

      setIsLoading(true)

      try {
        const completeOrder = await localDB.getCompleteOrder(orderId)
        setOrderData({
          games: completeOrder.games || [],
          environments: completeOrder.environments || [],
          devices: completeOrder.devices || [],
          custom3D: completeOrder.custom3D,
          options: completeOrder.options || [],
        })
      } catch (error) {
        console.error("Failed to load order data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrderData()
  }, [orderId, order?.updatedAt])

  const getPricingResult = () => {
    if (!orderData || !order) return null

    const pricingData = {
      selectedGames: orderData.games.map((g) => g.gameName),
      selectOneMoreGame: orderData.games.length > 1,
      selectedEnvironments: orderData.environments.reduce(
        (acc, env) => {
          acc[env.gameName] = env.environmentName
          return acc
        },
        {} as { [gameName: string]: string },
      ),
      devices: orderData.devices.reduce(
        (acc, device) => {
          acc[device.devicePackage] = device.quantity
          return acc
        },
        {} as { [deviceType: string]: number },
      ),
      eventDays: orderData.devices[0]?.eventDays || 1,
      wantsCustom3D: (orderData.custom3D?.additional3DModels || 0) > 0,
      custom3DCount: orderData.custom3D?.additional3DModels || 0,
      selectedOptions: orderData.options.map((o) => o.optionName),
    }

    return PricingCalculator.calculatePricing(pricingData)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Bronze":
        return (
          "border-2 bg-gradient-to-br from-amber-900/10 to-orange-900/5 shadow-lg shadow-amber-800/20 border-transparent bg-clip-padding" +
          " before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r before:from-amber-800 before:via-orange-700 before:via-amber-900 before:to-orange-800 before:rounded-xl before:-z-10 relative" +
          " after:absolute after:inset-[2px] after:bg-gradient-to-br after:from-white/95 after:to-white/90 after:rounded-[10px] after:-z-[1]"
        )
      case "Silver":
        return (
          "border-2 bg-gradient-to-br from-gray-50/20 to-gray-100/10 shadow-lg shadow-gray-200/30 border-transparent bg-clip-padding" +
          " before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r before:from-gray-300 before:via-gray-400 before:via-gray-600 before:to-gray-300 before:rounded-xl before:-z-10 relative" +
          " after:absolute after:inset-[2px] after:bg-gradient-to-br after:from-white/95 after:to-white/90 after:rounded-[10px] after:-z-[1]"
        )
      case "Gold":
        return (
          "border-2 bg-gradient-to-br from-yellow-50/20 to-yellow-100/10 shadow-lg shadow-yellow-200/30 border-transparent bg-clip-padding" +
          " before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r before:from-yellow-300 before:via-yellow-500 before:via-yellow-600 before:to-yellow-400 before:rounded-xl before:-z-10 relative" +
          " after:absolute after:inset-[2px] after:bg-gradient-to-br after:from-white/95 after:to-white/90 after:rounded-[10px] after:-z-[1]"
        )
      default:
        return "border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/50"
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "Silver":
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md"
      case "Gold":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md"
      default:
        return "bg-gradient-to-r from-amber-800 to-orange-700 text-white shadow-md"
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const pricingResult = getPricingResult()
  const currentTier = pricingResult?.tier || order?.pricingTier || "Bronze"

  const getDisplayPrice = () => {
    if (!pricingResult) return 3499

    // Before step 4: show only base package price
    if (!order || order.currentStep < 4) {
      return pricingResult.basePrice
    }

    // After step 4: show total price
    return pricingResult.totalPrice
  }

  const getPriceLabel = () => {
    if (!order || order.currentStep < 4) {
      return `${currentTier} Package`
    }
    return "Total Price"
  }

  if (isLoading) {
    return (
      <div className="p-4 h-full border-gray-300 bg-gray-50 border-2">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`sticky top-4 p-6 h-fit rounded-xl ${getTierColor(currentTier)} backdrop-blur-sm relative`}>
      {currentTier !== "Bronze" && (
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierBadgeColor(currentTier)}`}>
            {currentTier}
          </span>
        </div>
      )}

      <div className="space-y-4">
        {/* Pricing Tier */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Pricing Tier</h3>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{currentTier}</span>
          </div>
        </div>

        {/* Selected Games */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Selected Games</h3>
          {orderData?.games && orderData.games.length > 0 ? (
            <div className="space-y-1">
              {orderData.games.map((game, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{game.gameName}</span>
                  {game.pricingPackage !== "Bronze" && (
                    <span className={`px-1 py-0.5 rounded-full text-xs ${getTierBadgeColor(game.pricingPackage)}`}>
                      {game.pricingPackage}
                    </span>
                  )}
                </div>
              ))}
              {orderData.games.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm italic">Multiple games selected</span>
                  <span className={`px-1 py-0.5 rounded-full text-xs ${getTierBadgeColor("Gold")}`}>Gold</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">None selected</span>
          )}
        </div>

        {/* Selected Environments */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Selected Environments</h3>
          {orderData?.environments && orderData.environments.length > 0 ? (
            <div className="space-y-1">
              {orderData.environments.map((env, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{env.environmentName}</span>
                  {env.pricingPackage !== "Bronze" && (
                    <span className={`px-1 py-0.5 rounded-full text-xs ${getTierBadgeColor(env.pricingPackage)}`}>
                      {env.pricingPackage}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400">None selected</span>
          )}
        </div>

        {/* 3D Models */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-1">3D Models</h3>
          <span className="text-sm">
            {(() => {
              const gameModels = orderData?.games?.reduce((total, game) => total + game.custom3DModels, 0) || 0
              const customModels = orderData?.custom3D?.additional3DModels || 0
              const totalModels = gameModels + customModels

              if (totalModels === 0) return "None selected"

              const parts = []
              if (gameModels > 0) parts.push(`${gameModels} from games`)
              if (customModels > 0) parts.push(`${customModels} custom`)

              return `${totalModels} total (${parts.join(", ")})`
            })()}
          </span>
        </div>

        {/* Additional Options */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Additional Options</h3>
          {orderData?.options && orderData.options.length > 0 ? (
            <div className="space-y-1">
              {orderData.options.map((option, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{option.optionName}</span>
                  {option.tier !== "Bronze" && (
                    <span className={`px-1 py-0.5 rounded-full text-xs ${getTierBadgeColor(option.tier)}`}>
                      {option.tier}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400">None selected</span>
          )}
        </div>

        {/* Devices */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Devices</h3>
          {orderData?.devices && orderData.devices.length > 0 ? (
            <div className="space-y-1">
              {orderData.devices.map((device, index) => (
                <div key={index} className="text-sm">
                  <div>{device.devicePackage}</div>
                  <div className="text-gray-500">Qty: {device.quantity}</div>
                </div>
              ))}
              <div className="text-sm font-medium pt-1 border-t border-gray-300">
                Total: {orderData.devices.reduce((total, device) => total + device.quantity, 0)} devices
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400">None selected</span>
          )}
        </div>

        {/* Event Days */}
        <div>
          <h3 className="font-semibold text-sm text-gray-600 mb-1">Event Days</h3>
          <span className="text-sm">
            {orderData?.devices && orderData.devices.length > 0
              ? `${orderData.devices[0].eventDays} days`
              : "Not specified"}
          </span>
        </div>

        {/* Total Price */}
        <div className="pt-2 border-t border-gray-300">
          <h3 className="font-semibold text-sm text-gray-600 mb-1">{getPriceLabel()}</h3>
          <span className="font-bold text-xl">{formatPrice(getDisplayPrice())}</span>
          {pricingResult && order && order.currentStep >= 4 && pricingResult.devicePrice > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Base: {formatPrice(pricingResult.basePrice)} + Devices: {formatPrice(pricingResult.devicePrice)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
