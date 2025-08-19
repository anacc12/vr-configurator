export interface PricingData {
  // Step 1: User details (no pricing impact)

  // Step 2: Games
  selectedGames: string[]
  selectOneMoreGame: boolean

  // Step 3: Environments
  selectedEnvironments: { [gameName: string]: string }

  // Step 4: Devices
  devices: { [deviceType: string]: number }
  eventDays: number

  // Step 5: Custom 3D
  wantsCustom3D: boolean
  custom3DCount: number

  // Step 6: Additional options
  selectedOptions: string[]
}

export interface PricingResult {
  tier: "Bronze" | "Silver" | "Gold"
  basePrice: number
  devicePrice: number
  totalPrice: number
  tierReasons: string[]
}

export class PricingCalculator {
  private static readonly BASE_PRICES = {
    Bronze: 3499,
    Silver: 5999,
    Gold: 9999,
  }

  private static readonly DEVICE_PRICES = {
    "Meta Quest 3s standard device package": 30,
    "Meta Quest 3 standard device package": 55,
  }

  private static readonly SILVER_SELECTIONS = [
    "Product Inspection",
    "Build the product",
    "Meta Quest 3 standard device package",
    "Leaderboard",
    "Live chat support during event",
    "Analytics Basic",
  ]

  private static readonly GOLD_SELECTIONS = [
    "Branded objects hunt",
    "Wheel of fortune",
    "Ancient Temple",
    "24/7 AI chat support",
    "Analytics Advanced",
  ]

  static calculateTier(data: PricingData): "Bronze" | "Silver" | "Gold" {
    const reasons: string[] = []

    // Check for Gold tier conditions
    if (data.selectOneMoreGame) {
      reasons.push("Multiple games selected")
      return "Gold"
    }

    if (data.selectedGames.some((game) => this.GOLD_SELECTIONS.includes(game))) {
      reasons.push("Gold game selected")
      return "Gold"
    }

    if (Object.values(data.selectedEnvironments).some((env) => this.GOLD_SELECTIONS.includes(env))) {
      reasons.push("Gold environment selected")
      return "Gold"
    }

    const totalDevices = Object.values(data.devices).reduce((sum, count) => sum + count, 0)
    if (totalDevices >= 3) {
      reasons.push("3+ devices selected")
      return "Gold"
    }

    if (data.wantsCustom3D && data.custom3DCount >= 6) {
      reasons.push("6+ custom 3D models")
      return "Gold"
    }

    if (data.selectedOptions.some((option) => this.GOLD_SELECTIONS.includes(option))) {
      reasons.push("Gold option selected")
      return "Gold"
    }

    // Check for Silver tier conditions
    if (data.selectedGames.some((game) => this.SILVER_SELECTIONS.includes(game))) {
      reasons.push("Silver game selected")
      return "Silver"
    }

    if (Object.keys(data.devices).some((device) => this.SILVER_SELECTIONS.includes(device))) {
      reasons.push("Silver device selected")
      return "Silver"
    }

    if (totalDevices === 2) {
      reasons.push("2 devices selected")
      return "Silver"
    }

    if (data.wantsCustom3D && data.custom3DCount >= 1 && data.custom3DCount <= 5) {
      reasons.push("1-5 custom 3D models")
      return "Silver"
    }

    if (data.selectedOptions.some((option) => this.SILVER_SELECTIONS.includes(option))) {
      reasons.push("Silver option selected")
      return "Silver"
    }

    return "Bronze"
  }

  static calculatePricing(data: PricingData): PricingResult {
    const tier = this.calculateTier(data)
    const basePrice = this.BASE_PRICES[tier]

    let devicePrice = 0
    for (const [deviceType, quantity] of Object.entries(data.devices)) {
      const pricePerDay = this.DEVICE_PRICES[deviceType as keyof typeof this.DEVICE_PRICES] || 0
      devicePrice += pricePerDay * quantity * data.eventDays
    }

    return {
      tier,
      basePrice,
      devicePrice,
      totalPrice: basePrice + devicePrice,
      tierReasons: [],
    }
  }
}
