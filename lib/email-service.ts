// Email service for sending order summaries to sales team
// This provides a mock implementation that can be easily replaced with real email service

import { formatSummaryForUser } from "./format-summary-for-user";

const FORMSPARK_FORM_ID = process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID || "aOnLwysz5";
const FORMSPARK_URL = `https://submit-form.com/${FORMSPARK_FORM_ID}`;


export interface EmailOrderSummary {
  orderId: string
  completedAt: string
  user: {
    name: string
    company: string
    email: string
  }
  pricingTier: string
  totalPrice: number
  games: Array<{
    gameName: string
    pricingPackage: string
  }>
  environments: Array<{
    environmentName: string
    gameName: string
    pricingPackage: string
  }>
  devices: Array<{
    devicePackage: string
    quantity: number
    eventDays: number
    totalCost: number
  }>
  custom3D: {
    additional3DModels: number
  } | null
  options: Array<{
    optionName: string
    tier: string
  }>
}

export class EmailService {
  static async sendOrderToSales(summary: EmailOrderSummary): Promise<boolean> {
    const FORMSPARK_URL = "https://submit-form.com/aOnLwysz5"; // 🔴 O, ne 0

    const formatPrice = (price: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(price);

    const deviceCosts = summary.devices.reduce((sum, d) => sum + d.totalCost, 0);
    const basePrice = summary.totalPrice - deviceCosts;

    const message = `
🆔 Order ID: ${summary.orderId}
📅 Completed At: ${new Date(summary.completedAt).toLocaleString()} `;

    const formData = new URLSearchParams();

    // Summary
    formData.append("🧾 Message Summary", message);
    formData.append("🆔 Order ID", summary.orderId);
    formData.append("🏷️ Pricing Tier", summary.pricingTier);
    formData.append("💰 Total Price", formatPrice(summary.totalPrice));
    formData.append("📅 Completed At", new Date(summary.completedAt).toLocaleString());

    // User
    formData.append(
      "👤 Customer Info",
      [
        `Name: ${summary.user.name}`,
        `Company: ${summary.user.company}`,
        `Email: ${summary.user.email}`,
      ].join("\n")
    );

    // Games
    formData.append(
      "🎮 Games",
      summary.games.length
        ? summary.games.map((g) => `- ${g.gameName} (${g.pricingPackage})`).join("\n")
        : "- No games selected"
    );

    // Environments
    formData.append(
      "🌍 Environments",
      summary.environments.length
        ? summary.environments.map((e) =>
            `- ${e.environmentName} → ${e.gameName} (${e.pricingPackage})`
          ).join("\n")
        : "- No environments selected"
    );

    // Devices
    formData.append(
      "📦 Devices",
      summary.devices.length
        ? summary.devices.map((d) =>
            `- ${d.devicePackage} ×${d.quantity} @ ${formatPrice(
              d.totalCost / (d.quantity * d.eventDays)
            )}/day for ${d.eventDays} days = ${formatPrice(d.totalCost)}`
          ).join("\n")
        : "- No devices selected"
    );

    // Custom 3D
    formData.append(
      "🧱 Custom 3D",
      summary.custom3D && summary.custom3D.additional3DModels > 0
        ? `- ${summary.custom3D.additional3DModels} additional model(s)`
        : "- No custom 3D models"
    );

    // Options
    formData.append(
      "🧩 Options",
      summary.options.length
        ? summary.options.map((o) => `- ${o.optionName} (${o.tier})`).join("\n")
        : "- No additional options"
    );

    // Price breakdown
    formData.append("📊 Pricing Breakdown", [
      `Base Package: ${formatPrice(basePrice)}`,
      `Device Rental: ${formatPrice(deviceCosts)}`,
      `Total: ${formatPrice(summary.totalPrice)}`,
    ].join("\n"));

    // Email reply address
    formData.append("_replyto", summary.user.email);
    formData.append("_subject", `🟣 VR Configurator – Order ${summary.orderId}`);


    try {
      const res = await fetch(FORMSPARK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      return true;
    } catch (err) {
      console.error("Failed to send via Formspark:", err);
      return false;
    }
  }
}


