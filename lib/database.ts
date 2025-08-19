// Database utilities and types for the VR Configurator
// This provides a local database solution that can be easily migrated to Azure

export interface Order {
  orderId: string
  createdAt: Date
  updatedAt: Date
  currentStep: number
  pricingTier: "Bronze" | "Silver" | "Gold"
  totalPrice: number
}

export interface OrderUser {
  orderId: string
  name: string
  company: string
  email: string
}

export interface OrderGame {
  id?: number
  orderId: string
  gameName: string
  pricingPackage: string
  compatibleEnvironments: string
  custom3DModels: number
  unique2DSlots: number
}

export interface OrderEnvironment {
  id?: number
  orderId: string
  gameName: string
  environmentName: string
  slots1x1: number
  slots9x16: number
  slots16x9: number
  pricingPackage: string
}

export interface OrderDevice {
  id?: number
  orderId: string
  devicePackage: string
  pricePerDay: number
  quantity: number
  eventDays: number
}

export interface OrderCustom3D {
  orderId: string
  additional3DModels: number
}

export interface OrderOption {
  id?: number
  orderId: string
  optionName: string
  tier: string
}

export interface GameReference {
  id: number
  gameName: string
  compatibleEnvironments: string
  pricingPackage: string
  custom3DModels: number
  unique2DSlots: number
}

export interface EnvironmentReference {
  id: number
  environmentName: string
  slots1x1: number
  slots9x16: number
  slots16x9: number
  pricingPackage: string
}

export interface OrderTierHistory {
  orderId: string
  currentTier: "Bronze" | "Silver" | "Gold"
  silverSelections: string[]
  goldSelections: string[]
  allSelections: string[]
}

// Pricing constants
export const PRICING_TIERS = {
  Bronze: 3499,
  Silver: 5999,
  Gold: 9999,
} as const

// Silver and Gold features for automatic tier upgrades
export const SILVER_FEATURES = [
  "Product Inspection",
  "Build the product",
  "Meta Quest 3 standard device package",
  "Custom 3D Models (1-5)",
  "Leaderboard",
  "Live chat support during event",
  "Analytics Basic",
]

export const GOLD_FEATURES = [
  "Branded objects hunt",
  "Wheel of fortune",
  "Ancient Temple",
  "Select one more game",
  "Custom 3D Models (6-10)",
  "24/7 AI chat support",
  "Analytics Advanced",
]

// Free email domains to reject
export const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yandex.com",
  "yahoo.com",
  "aol.com",
  "protonmail.com",
]

// Utility function to check if email is from free domain
export function isWorkEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase()
  return domain ? !FREE_EMAIL_DOMAINS.includes(domain) : false
}

// Utility function to determine pricing tier based on selections
export async function calculateTierFromCurrentData(orderId: string): Promise<"Bronze" | "Silver" | "Gold"> {
  const { PricingCalculator } = await import("./pricing-calculator")
  const { localDB } = await import("./local-db")

  const completeOrder = await localDB.getCompleteOrder(orderId)

  const pricingData = {
    selectedGames: completeOrder.games?.map((g) => g.gameName) || [],
    selectOneMoreGame: (completeOrder.games?.length || 0) > 1,
    selectedEnvironments:
      completeOrder.environments?.reduce(
        (acc, env) => {
          acc[env.gameName] = env.environmentName
          return acc
        },
        {} as { [gameName: string]: string },
      ) || {},
    devices:
      completeOrder.devices?.reduce(
        (acc, device) => {
          acc[device.devicePackage] = device.quantity
          return acc
        },
        {} as { [deviceType: string]: number },
      ) || {},
    eventDays: completeOrder.devices?.[0]?.eventDays || 1,
    wantsCustom3D: (completeOrder.custom3D?.additional3DModels || 0) > 0,
    custom3DCount: completeOrder.custom3D?.additional3DModels || 0,
    selectedOptions: completeOrder.options?.map((o) => o.optionName) || [],
  }

  return PricingCalculator.calculateTier(pricingData)
}

export async function recalculateOrderTier(orderId: string): Promise<void> {
  const { PricingCalculator } = await import("./pricing-calculator")
  const { localDB } = await import("./local-db")

  const completeOrder = await localDB.getCompleteOrder(orderId)

  const pricingData = {
    selectedGames: completeOrder.games?.map((g) => g.gameName) || [],
    selectOneMoreGame: (completeOrder.games?.length || 0) > 1,
    selectedEnvironments:
      completeOrder.environments?.reduce(
        (acc, env) => {
          acc[env.gameName] = env.environmentName
          return acc
        },
        {} as { [gameName: string]: string },
      ) || {},
    devices:
      completeOrder.devices?.reduce(
        (acc, device) => {
          acc[device.devicePackage] = device.quantity
          return acc
        },
        {} as { [deviceType: string]: number },
      ) || {},
    eventDays: completeOrder.devices?.[0]?.eventDays || 1,
    wantsCustom3D: (completeOrder.custom3D?.additional3DModels || 0) > 0,
    custom3DCount: completeOrder.custom3D?.additional3DModels || 0,
    selectedOptions: completeOrder.options?.map((o) => o.optionName) || [],
  }

  const result = PricingCalculator.calculatePricing(pricingData)

  await localDB.updateOrder(orderId, {
    pricingTier: result.tier,
    totalPrice: result.totalPrice,
  })
}

export function updateOrderTier(
  currentTier: "Bronze" | "Silver" | "Gold",
  newSelection: string,
): "Bronze" | "Silver" | "Gold" {
  // Check if new selection is Gold tier
  if (newSelection === "Gold") {
    return "Gold"
  }

  if (currentTier === "Gold") {
    return "Gold"
  }

  // Check if new selection is Silver tier
  if (newSelection === "Silver") {
    return "Silver"
  }

  if (currentTier === "Silver") {
    return "Silver"
  }

  return "Bronze"
}

export function calculateStickyPricingTier(
  currentTier: "Bronze" | "Silver" | "Gold",
  silverSelections: string[],
  goldSelections: string[],
  newSelection?: string,
  removedSelection?: string,
): {
  tier: "Bronze" | "Silver" | "Gold"
  silverSelections: string[]
  goldSelections: string[]
} {
  let updatedSilverSelections = [...silverSelections]
  let updatedGoldSelections = [...goldSelections]

  // Handle new selection
  if (newSelection) {
    const isGoldFeature = GOLD_FEATURES.some(
      (feature) => newSelection.includes(feature) || feature.includes(newSelection),
    )
    const isSilverFeature = SILVER_FEATURES.some(
      (feature) => newSelection.includes(feature) || feature.includes(newSelection),
    )

    if (isGoldFeature && !updatedGoldSelections.includes(newSelection)) {
      updatedGoldSelections.push(newSelection)
    } else if (isSilverFeature && !updatedSilverSelections.includes(newSelection)) {
      updatedSilverSelections.push(newSelection)
    }
  }

  // Handle removed selection
  if (removedSelection) {
    updatedGoldSelections = updatedGoldSelections.filter(
      (sel) => !removedSelection.includes(sel) && !sel.includes(removedSelection),
    )
    updatedSilverSelections = updatedSilverSelections.filter(
      (sel) => !removedSelection.includes(sel) && !sel.includes(removedSelection),
    )
  }

  // Determine tier based on sticky logic
  let finalTier: "Bronze" | "Silver" | "Gold" = "Bronze"

  if (updatedGoldSelections.length > 0) {
    finalTier = "Gold"
  } else if (updatedSilverSelections.length > 0) {
    finalTier = "Silver"
  }

  return {
    tier: finalTier,
    silverSelections: updatedSilverSelections,
    goldSelections: updatedGoldSelections,
  }
}
