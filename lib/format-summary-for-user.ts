import { EmailOrderSummary } from "./email-service"

export function formatSummaryForUser(summary: EmailOrderSummary): string {
    const formatPrice = (price: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price)
  
    const deviceCosts = summary.devices.reduce((sum, d) => sum + d.totalCost, 0)
    const basePrice = summary.totalPrice - deviceCosts
  
    return `
  VR Configurator Order
  
  Order ID: ${summary.orderId}
  Completed: ${new Date(summary.completedAt).toLocaleString()}
  Pricing Tier: ${summary.pricingTier}
  Total Price: ${formatPrice(summary.totalPrice)}
  
  Customer Details:
  - Name: ${summary.user.name}
  - Company: ${summary.user.company}
  - Email: ${summary.user.email}
  
  Games:
  ${summary.games.map(g => `- ${g.gameName} (${g.pricingPackage})`).join("\n")}
  
  Environments:
  ${summary.environments.map(env => `- ${env.environmentName} → ${env.gameName} (${env.pricingPackage})`).join("\n")}
  
  Devices:
  ${summary.devices.map(d =>
    `- ${d.devicePackage} ×${d.quantity} @ ${formatPrice(d.totalCost / (d.quantity * d.eventDays))}/day (${d.eventDays}d) = ${formatPrice(d.totalCost)}`
  ).join("\n")}
  
  Custom 3D:
  ${summary.custom3D && summary.custom3D.additional3DModels > 0
    ? `- ${summary.custom3D.additional3DModels} additional model(s)` : "- No custom 3D models"}
  
  Options:
  ${summary.options.length ? summary.options.map(o => `- ${o.optionName} (${o.tier})`).join("\n") : "- No additional options"}
  
  Price Breakdown:
  - Base Package: ${formatPrice(basePrice)}
  - Device Rental: ${formatPrice(deviceCosts)}
  - Total: ${formatPrice(summary.totalPrice)}
  
  Thank you!
    `.trim()
  }
  