// Local database implementation using localStorage for development
// This can be easily replaced with Azure SQL Database connection

import type { Order, OrderUser, OrderGame, OrderEnvironment, OrderDevice, OrderCustom3D, OrderOption } from "./database"

class LocalDatabase {
  private getStorageKey(table: string): string {
    return `vr_configurator_${table}`
  }

  private getData<T>(table: string): T[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.getStorageKey(table))
    return data ? JSON.parse(data) : []
  }

  private setData<T>(table: string, data: T[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.getStorageKey(table), JSON.stringify(data))
  }

  // Orders
  async createOrder(): Promise<string> {
    const orderId = crypto.randomUUID()
    const orders = this.getData<Order>("orders")
    const newOrder: Order = {
      orderId,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentStep: 1,
      pricingTier: "Bronze",
      totalPrice: 3499,
    }
    orders.push(newOrder)
    this.setData("orders", orders)

    return orderId
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    const orders = this.getData<Order>("orders")
    const index = orders.findIndex((o) => o.orderId === orderId)
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates, updatedAt: new Date() }
      this.setData("orders", orders)
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const orders = this.getData<Order>("orders")
    return orders.find((o) => o.orderId === orderId) || null
  }

  // User details
  async saveUserDetails(orderUser: OrderUser): Promise<void> {
    const users = this.getData<OrderUser>("order_user")
    const index = users.findIndex((u) => u.orderId === orderUser.orderId)
    if (index !== -1) {
      users[index] = orderUser
    } else {
      users.push(orderUser)
    }
    this.setData("order_user", users)
  }

  async getUserDetails(orderId: string): Promise<OrderUser | null> {
    const users = this.getData<OrderUser>("order_user")
    return users.find((u) => u.orderId === orderId) || null
  }

  // Games
  async saveOrderGames(orderId: string, games: Omit<OrderGame, "orderId">[]): Promise<void> {
    const allGames = this.getData<OrderGame>("order_games")
    // Remove existing games for this order
    const filteredGames = allGames.filter((g) => g.orderId !== orderId)
    // Add new games
    const newGames = games.map((game) => ({ ...game, orderId }))
    this.setData("order_games", [...filteredGames, ...newGames])
  }

  async getOrderGames(orderId: string): Promise<OrderGame[]> {
    const games = this.getData<OrderGame>("order_games")
    return games.filter((g) => g.orderId === orderId)
  }

  // Environments
  async saveOrderEnvironments(orderId: string, environments: Omit<OrderEnvironment, "orderId">[]): Promise<void> {
    const allEnvs = this.getData<OrderEnvironment>("order_environments")
    const filteredEnvs = allEnvs.filter((e) => e.orderId !== orderId)
    const newEnvs = environments.map((env) => ({ ...env, orderId }))
    this.setData("order_environments", [...filteredEnvs, ...newEnvs])
  }

  async getOrderEnvironments(orderId: string): Promise<OrderEnvironment[]> {
    const environments = this.getData<OrderEnvironment>("order_environments")
    return environments.filter((e) => e.orderId === orderId)
  }

  // Devices
  async saveOrderDevices(orderId: string, devices: Omit<OrderDevice, "orderId">[]): Promise<void> {
    const allDevices = this.getData<OrderDevice>("order_devices")
    const filteredDevices = allDevices.filter((d) => d.orderId !== orderId)
    const newDevices = devices.map((device) => ({ ...device, orderId }))
    this.setData("order_devices", [...filteredDevices, ...newDevices])
  }

  async getOrderDevices(orderId: string): Promise<OrderDevice[]> {
    const devices = this.getData<OrderDevice>("order_devices")
    return devices.filter((d) => d.orderId === orderId)
  }

  // Custom 3D
  async saveOrderCustom3D(orderCustom3D: OrderCustom3D): Promise<void> {
    const allCustom3D = this.getData<OrderCustom3D>("order_custom_3d")
    const index = allCustom3D.findIndex((c) => c.orderId === orderCustom3D.orderId)
    if (index !== -1) {
      allCustom3D[index] = orderCustom3D
    } else {
      allCustom3D.push(orderCustom3D)
    }
    this.setData("order_custom_3d", allCustom3D)
  }

  async getOrderCustom3D(orderId: string): Promise<OrderCustom3D | null> {
    const custom3D = this.getData<OrderCustom3D>("order_custom_3d")
    return custom3D.find((c) => c.orderId === orderId) || null
  }

  // Options
  async saveOrderOptions(orderId: string, options: Omit<OrderOption, "orderId">[]): Promise<void> {
    const allOptions = this.getData<OrderOption>("order_options")
    const filteredOptions = allOptions.filter((o) => o.orderId !== orderId)
    const newOptions = options.map((option) => ({ ...option, orderId }))
    this.setData("order_options", [...filteredOptions, ...newOptions])
  }

  async getOrderOptions(orderId: string): Promise<OrderOption[]> {
    const options = this.getData<OrderOption>("order_options")
    return options.filter((o) => o.orderId === orderId)
  }

  // Get complete order data
  async getCompleteOrder(orderId: string) {
    const [order, user, games, environments, devices, custom3D, options] = await Promise.all([
      this.getOrder(orderId),
      this.getUserDetails(orderId),
      this.getOrderGames(orderId),
      this.getOrderEnvironments(orderId),
      this.getOrderDevices(orderId),
      this.getOrderCustom3D(orderId),
      this.getOrderOptions(orderId),
    ])

    return {
      order,
      user,
      games,
      environments,
      devices,
      custom3D,
      options,
    }
  }
}

export const localDB = new LocalDatabase()
