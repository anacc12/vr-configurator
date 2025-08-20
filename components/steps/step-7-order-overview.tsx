"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { localDB } from "@/lib/local-db"
import { EmailService, type EmailOrderSummary } from "@/lib/email-service"
// import { sendOrderToFormspark } from "@/lib/formspark"

import type {
  Order,
  OrderUser,
  OrderGame,
  OrderEnvironment,
  OrderDevice,
  OrderCustom3D,
  OrderOption,
} from "@/lib/database"
import { generateOrderSummaryPDF } from "@/lib/pdf-summary"

interface Step7OrderOverviewProps {
  orderId: string
  onDataChange: () => void
  onValidationChange: (isValid: boolean) => void
  onStepChange: (step: number) => void
}

export function Step7OrderOverview({
  orderId,
  onDataChange,
  onValidationChange,
  onStepChange,
}: Step7OrderOverviewProps) {
  const [orderData, setOrderData] = useState<{
    order: Order | null
    user: OrderUser | null
    games: OrderGame[]
    environments: OrderEnvironment[]
    devices: OrderDevice[]
    custom3D: OrderCustom3D | null
    options: OrderOption[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showThankYou, setShowThankYou] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Load all order data
    const loadCompleteOrder = async () => {
      const completeOrder = await localDB.getCompleteOrder(orderId)
      setOrderData(completeOrder)
      setIsLoading(false)
    }
    loadCompleteOrder()
  }, [orderId])

  useEffect(() => {
    // Always valid - this is the final step
    onValidationChange(true)
  }, []) // Removed onValidationChange from dependencies to prevent infinite loop

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleEditSection = (step: number) => {
    onStepChange(step)
  }

  // const handleFinishConfiguration = async () => {
  //   if (!orderData?.order || !orderData?.user) return

  //   setIsSubmitting(true)

  //   try {
  //     // Save final order summary
  //     const completedAt = new Date().toISOString()
  //     await localDB.updateOrder(orderId, { currentStep: 7 })

  //     // Prepare email summary
  //     const emailSummary: EmailOrderSummary = {
  //       orderId,
  //       completedAt,
  //       user: {
  //         name: orderData.user.name,
  //         company: orderData.user.company,
  //         email: orderData.user.email,
  //       },
  //       pricingTier: orderData.order.pricingTier,
  //       totalPrice: orderData.order.totalPrice,
  //       games: orderData.games.map((game) => ({
  //         gameName: game.gameName,
  //         pricingPackage: game.pricingPackage,
  //       })),
  //       environments: orderData.environments.map((env) => ({
  //         environmentName: env.environmentName,
  //         gameName: env.gameName,
  //         pricingPackage: env.pricingPackage,
  //       })),
  //       devices: orderData.devices.map((device) => ({
  //         devicePackage: device.devicePackage,
  //         quantity: device.quantity,
  //         eventDays: device.eventDays,
  //         totalCost: device.pricePerDay * device.quantity * device.eventDays,
  //       })),
  //       custom3D: orderData.custom3D,
  //       options: orderData.options,
  //     }

  //     // Send email to sales team
  //     const emailSent = await EmailService.sendOrderToSales(emailSummary)

  //     if (emailSent) {
  //       console.log("Order summary sent to sales team successfully")
  //     } else {
  //       console.warn("Failed to send order summary to sales team")
  //     }

  //     setShowThankYou(true)
  //   } catch (error) {
  //     console.error("Error finishing configuration:", error)
  //   } finally {
  //     setIsSubmitting(false)
  //   }
  // }

  const handleFinishConfiguration = async () => {
    if (!orderData?.order || !orderData?.user) return

    setIsSubmitting(true)
    try {
      const completedAt = new Date().toISOString()

      const summary: EmailOrderSummary = {
        orderId,
        completedAt,
        user: {
          name: orderData.user.name,
          company: orderData.user.company,
          email: orderData.user.email,
        },
        pricingTier: orderData.order.pricingTier,
        totalPrice: orderData.order.totalPrice,
        games: orderData.games,
        environments: orderData.environments,
        devices: orderData.devices.map((d) => ({
          ...d,
          totalCost: d.pricePerDay * d.quantity * d.eventDays,
        })),
        custom3D: orderData.custom3D,
        options: orderData.options,
      }

      const ok = await EmailService.sendOrderToSales(summary)
      setShowThankYou(true)
    } catch (err) {
      // Logiraj za developera, ali bez prikazivanja errora useru
      console.warn("Formspark submission failed silently:", err)

      // Ako baš želiš, možeš dodat fallback:
      // alert("There was a problem submitting the form. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleReturnHome = () => {
    // Clear current order and return to start
    localStorage.removeItem("vr_configurator_current_order")
    window.location.reload()
  }

  const downloadOrderSummary = async () => {
    if (!orderData) return
  
    const summary: EmailOrderSummary = {
      orderId,
      completedAt: new Date().toISOString(),
      user: {
        name: orderData.user? orderData.user.name : "Name undefined",
        company: orderData.user? orderData.user.company : "Company undefined",
        email: orderData.user? orderData.user.email : "Email undefined",
      },
      pricingTier: orderData.order!.pricingTier,
      totalPrice: orderData.order!.totalPrice,
      games: orderData.games,
      environments: orderData.environments,
      devices: orderData.devices.map((d) => ({
        ...d,
        totalCost: d.pricePerDay * d.quantity * d.eventDays,
      })),
      custom3D: orderData.custom3D,
      options: orderData.options,
    }
  
    const pdfBytes = await generateOrderSummaryPDF(summary)
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
  
    const a = document.createElement("a")
    a.href = url
    a.download = `vr-configurator-order-${orderId.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (showThankYou) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4">Thank You!</h2>
          <p className="text-green-700 mb-6">
            Based on your choices, we think the <strong>{orderData?.order?.pricingTier}</strong> package would be best
            for you. Your total order price would be <strong>{formatPrice(orderData?.order?.totalPrice || 0)}</strong>.
          </p>
          <p className="text-green-700 mb-8">
            Your configuration has been sent to our sales team who will contact you within 24 hours.
          </p>
          <div className="space-y-4">
            <Button onClick={downloadOrderSummary} variant="outline" className="w-full bg-transparent">
              Download Order Summary
            </Button>
            <Button onClick={handleReturnHome} className="w-full bg-black text-white hover:bg-gray-800">
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!orderData?.order) {
    return <div className="text-center py-8">No order data found</div>
  }

  return (
    <div className="max-w-6xl">
      <h2 className="text-2xl font-bold mb-6">Order Overview</h2>
      <p className="text-gray-600 mb-8">
        Review your configuration and finalize your order. Click on any section to make changes.
      </p>

      <div className="space-y-6">


        {/* User Details */}
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => handleEditSection(1)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Details</h3>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            {orderData.user && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Name:</strong> {orderData.user.name}
                </div>
                <div>
                  <strong>Company:</strong> {orderData.user.company}
                </div>
                <div>
                  <strong>Email:</strong> {orderData.user.email}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Games */}
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => handleEditSection(2)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Selected Games</h3>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <div className="space-y-2">
              {orderData.games.map((game, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{game.gameName}</span>
                  {game.pricingPackage !== "Bronze" && (
                    <Badge className={getTierBadgeColor(game.pricingPackage)}>{game.pricingPackage}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Environments */}
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => handleEditSection(3)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Selected Environments</h3>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <div className="space-y-2">
              {orderData.environments.map((env, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>
                    {env.environmentName} (for {env.gameName})
                  </span>
                  {env.pricingPackage !== "Bronze" && (
                    <Badge className={getTierBadgeColor(env.pricingPackage)}>{env.pricingPackage}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Devices */}
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => handleEditSection(4)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Selected Devices</h3>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <div className="space-y-2">
              {orderData.devices.map((device, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{device.devicePackage}</span>
                    {device.devicePackage.includes("Meta Quest 3 ") && (
                      <Badge className={getTierBadgeColor("Silver")}>Silver</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Quantity: {device.quantity} × {device.eventDays} days ={" "}
                    {formatPrice(device.pricePerDay * device.quantity * device.eventDays)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom 3D Models */}
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => handleEditSection(5)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Custom 3D Models</h3>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span>
                {orderData.custom3D && orderData.custom3D.additional3DModels > 0
                  ? `${orderData.custom3D.additional3DModels} custom 3D models`
                  : "No custom 3D models"}
              </span>
              {orderData.custom3D && orderData.custom3D.additional3DModels > 0 && (
                <Badge className={getTierBadgeColor(orderData.custom3D.additional3DModels >= 6 ? "Gold" : "Silver")}>
                  {orderData.custom3D.additional3DModels >= 6 ? "Gold" : "Silver"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Options */}
        <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => handleEditSection(6)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Additional Options</h3>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
            {orderData.options.length > 0 ? (
              <div className="space-y-2">
                {orderData.options.map((option, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{option.optionName}</span>
                    <Badge className={getTierBadgeColor(option.tier)}>{option.tier}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">No additional options selected</span>
            )}
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pricing Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Package Tier:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{orderData.order.pricingTier}</span>
                  {orderData.order.pricingTier !== "Bronze" && (
                    <Badge className={getTierBadgeColor(orderData.order.pricingTier)}>
                      {orderData.order.pricingTier}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xl font-bold">
                <span>Total Price:</span>
                <span>{formatPrice(orderData.order.totalPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Finish Button */}
        <div className="pt-6">
          <Button
            onClick={handleFinishConfiguration}
            disabled={isSubmitting}
            className="w-full bg-black text-white hover:bg-gray-800 text-lg py-6"
          >
            {isSubmitting ? "Sending to Sales Team..." : "Finish Configuration"}
          </Button>
        </div>
      </div>
    </div>
  )
}
