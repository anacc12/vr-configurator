// Enhanced pricing service with tier upgrade logic and validation

import { PRICING_TIERS, SILVER_FEATURES, GOLD_FEATURES, calculateStickyPricingTier } from "./database"
import { localDB } from "./local-db"

export interface TierUpgradeInfo {
  shouldUpgrade: boolean
  currentTier: "Bronze" | "Silver" | "Gold"
  newTier: "Bronze" | "Silver" | "Gold"
  newTierPrice: number
  triggerSelection: string
}

export class PricingService {
  static checkTierUpgrade(
    currentTier: "Bronze" | "Silver" | "Gold",
    silverSelections: string[],
    goldSelections: string[],
    newSelection: string,
  ): TierUpgradeInfo {
    const result = calculateStickyPricingTier(currentTier, silverSelections, goldSelections, newSelection)

    const shouldUpgrade = this.getTierLevel(result.tier) > this.getTierLevel(currentTier)

    return {
      shouldUpgrade,
      currentTier,
      newTier: result.tier,
      newTierPrice: PRICING_TIERS[result.tier],
      triggerSelection: newSelection,
    }
  }

  static checkTierDowngrade(
    currentTier: "Bronze" | "Silver" | "Gold",
    silverSelections: string[],
    goldSelections: string[],
    removedSelection: string,
  ): {
    newTier: "Bronze" | "Silver" | "Gold"
    shouldDowngrade: boolean
  } {
    const result = calculateStickyPricingTier(
      currentTier,
      silverSelections,
      goldSelections,
      undefined,
      removedSelection,
    )

    return {
      newTier: result.tier,
      shouldDowngrade: this.getTierLevel(result.tier) < this.getTierLevel(currentTier),
    }
  }

  private static getSelectionTier(selection: string): "Bronze" | "Silver" | "Gold" {
    // Check if selection is a Gold feature
    if (GOLD_FEATURES.some((feature) => selection.includes(feature) || feature.includes(selection))) {
      return "Gold"
    }

    // Check if selection is a Silver feature
    if (SILVER_FEATURES.some((feature) => selection.includes(feature) || feature.includes(selection))) {
      return "Silver"
    }

    return "Bronze"
  }

  private static calculateRequiredTier(selections: string[]): "Bronze" | "Silver" | "Gold" {
    // Check for Gold features first
    const hasGoldFeature = selections.some((selection) =>
      GOLD_FEATURES.some((feature) => selection.includes(feature) || feature.includes(selection)),
    )

    if (hasGoldFeature) return "Gold"

    // Check for Silver features
    const hasSilverFeature = selections.some((selection) =>
      SILVER_FEATURES.some((feature) => selection.includes(feature) || feature.includes(selection)),
    )

    if (hasSilverFeature) return "Silver"

    return "Bronze"
  }

  private static getTierLevel(tier: "Bronze" | "Silver" | "Gold"): number {
    switch (tier) {
      case "Bronze":
        return 1
      case "Silver":
        return 2
      case "Gold":
        return 3
      default:
        return 1
    }
  }

  static async calculateTotalPrice(orderId: string): Promise<number> {
    try {
      const [order, devices] = await Promise.all([localDB.getOrder(orderId), localDB.getOrderDevices(orderId)])

      if (!order) {
        console.warn("Order not found for ID:", orderId)
        return PRICING_TIERS.Bronze
      }

      const basePrice = PRICING_TIERS[order.pricingTier as keyof typeof PRICING_TIERS] || PRICING_TIERS.Bronze

      // If no devices or devices array is empty, return just base price
      if (!devices || devices.length === 0) {
        return basePrice
      }

      const deviceCosts = devices.reduce((sum, device) => {
        const pricePerDay = device.pricePerDay || 0
        const quantity = device.quantity || 0
        const eventDays = device.eventDays || 0
        return sum + pricePerDay * quantity * eventDays
      }, 0)

      return basePrice + deviceCosts
    } catch (error) {
      console.error("Error calculating total price:", error)
      return PRICING_TIERS.Bronze
    }
  }

  static calculateTotalPriceFromData(
    tier: "Bronze" | "Silver" | "Gold",
    devices: Array<{ pricePerDay: number; quantity: number; eventDays: number }> = [],
  ): number {
    const basePrice = PRICING_TIERS[tier]

    if (!devices || devices.length === 0) {
      return basePrice
    }

    const deviceCosts = devices.reduce((sum, device) => {
      const pricePerDay = device.pricePerDay || 0
      const quantity = device.quantity || 0
      const eventDays = device.eventDays || 0
      return sum + pricePerDay * quantity * eventDays
    }, 0)

    return basePrice + deviceCosts
  }

  static shouldShowDevicePricing(currentStep: number): boolean {
    // Show device pricing only after step 4 (when devices are selected)
    return currentStep >= 4
  }

  static formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }
}
