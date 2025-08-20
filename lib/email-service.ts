// Email service for sending order summaries to sales team
// This provides a mock implementation that can be easily replaced with real email service

const FORMSPARK_FORM_ID = process.env.NEXT_PUBLIC_FORMSPARK_FORM_ID || "a0nLwysz5";
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
  private static formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  private static generateEmailHTML(summary: EmailOrderSummary): string {
    const deviceCosts = summary.devices.reduce((sum, device) => sum + device.totalCost, 0)
    const basePackagePrice = summary.totalPrice - deviceCosts

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New VR Configurator Order</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; }
            .tier-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .tier-silver { background: #6c757d; color: white; }
            .tier-gold { background: #ffc107; color: white; }
            .tier-bronze { background: #fd7e14; color: white; }
            .price { font-size: 18px; font-weight: bold; color: #28a745; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }
            th { background: #f8f9fa; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New VR Configurator Order</h1>
              <p><strong>Order ID:</strong> ${summary.orderId}</p>
              <p><strong>Completed:</strong> ${new Date(summary.completedAt).toLocaleString()}</p>
            </div>

            <div class="section">
              <h2>Customer Details</h2>
              <p><strong>Name:</strong> ${summary.user.name}</p>
              <p><strong>Company:</strong> ${summary.user.company}</p>
              <p><strong>Email:</strong> ${summary.user.email}</p>
            </div>

            <div class="section">
              <h2>Package Summary</h2>
              <p><strong>Pricing Tier:</strong> 
                <span class="tier-badge tier-${summary.pricingTier.toLowerCase()}">${summary.pricingTier}</span>
              </p>
              <p class="price"><strong>Total Price:</strong> ${this.formatPrice(summary.totalPrice)}</p>
            </div>

            <div class="section">
              <h2>Selected Games</h2>
              <table>
                <thead>
                  <tr><th>Game Name</th><th>Tier</th></tr>
                </thead>
                <tbody>
                  ${summary.games
                    .map(
                      (game) => `
                    <tr>
                      <td>${game.gameName}</td>
                      <td><span class="tier-badge tier-${game.pricingPackage.toLowerCase()}">${game.pricingPackage}</span></td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Selected Environments</h2>
              <table>
                <thead>
                  <tr><th>Environment</th><th>For Game</th><th>Tier</th></tr>
                </thead>
                <tbody>
                  ${summary.environments
                    .map(
                      (env) => `
                    <tr>
                      <td>${env.environmentName}</td>
                      <td>${env.gameName}</td>
                      <td><span class="tier-badge tier-${env.pricingPackage.toLowerCase()}">${env.pricingPackage}</span></td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Device Rental</h2>
              <table>
                <thead>
                  <tr><th>Device</th><th>Quantity</th><th>Days</th><th>Total Cost</th></tr>
                </thead>
                <tbody>
                  ${summary.devices
                    .map(
                      (device) => `
                    <tr>
                      <td>${device.devicePackage}</td>
                      <td>${device.quantity}</td>
                      <td>${device.eventDays}</td>
                      <td>${this.formatPrice(device.totalCost)}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            ${
              summary.custom3D && summary.custom3D.additional3DModels > 0
                ? `
              <div class="section">
                <h2>Custom 3D Models</h2>
                <p><strong>Additional 3D Models:</strong> ${summary.custom3D.additional3DModels}</p>
              </div>
            `
                : ""
            }

            ${
              summary.options.length > 0
                ? `
              <div class="section">
                <h2>Additional Options</h2>
                <table>
                  <thead>
                    <tr><th>Option</th><th>Tier</th></tr>
                  </thead>
                  <tbody>
                    ${summary.options
                      .map(
                        (option) => `
                      <tr>
                        <td>${option.optionName}</td>
                        <td><span class="tier-badge tier-${option.tier.toLowerCase()}">${option.tier}</span></td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
                : ""
            }

            <div class="section">
              <h2>Pricing Breakdown</h2>
              <table>
                <tbody>
                  <tr>
                    <td><strong>${summary.pricingTier} Package</strong></td>
                    <td><strong>${this.formatPrice(basePackagePrice)}</strong></td>
                  </tr>
                  <tr>
                    <td>Device Rental</td>
                    <td>${this.formatPrice(deviceCosts)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #333;">
                    <td><strong>Total</strong></td>
                    <td><strong>${this.formatPrice(summary.totalPrice)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section" style="background: #e7f3ff; border-color: #0066cc;">
              <h3 style="color: #0066cc;">Next Steps</h3>
              <p>Please contact the customer within 24 hours to discuss their requirements and finalize the order.</p>
              <p><strong>Customer Contact:</strong> ${summary.user.email}</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // static async sendOrderToSales(summary: EmailOrderSummary): Promise<boolean> {
  //   try {
  //     // In a real implementation, this would use a service like SendGrid, AWS SES, or similar
  //     // For now, we'll simulate the email sending and log the content

  //     const emailHTML = this.generateEmailHTML(summary)
  //     const emailText = this.generateEmailText(summary)

  //     console.log("=== EMAIL TO SALES TEAM ===")
  //     console.log("To: sales@company.com")
  //     console.log("Subject: New VR Configurator Order - " + summary.orderId)
  //     console.log("HTML Content:", emailHTML)
  //     console.log("Text Content:", emailText)
  //     console.log("=== END EMAIL ===")

  //     // Simulate API call delay
  //     await new Promise((resolve) => setTimeout(resolve, 1000))

  //     // In production, replace this with actual email service:
  //     /*
  //     const response = await fetch('/api/send-email', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         to: 'sales@company.com',
  //         subject: `New VR Configurator Order - ${summary.orderId}`,
  //         html: emailHTML,
  //         text: emailText
  //       })
  //     });
  //     return response.ok;
  //     */

  //     return true // Simulate successful send
  //   } catch (error) {
  //     console.error("Failed to send email to sales team:", error)
  //     return false
  //   }
  // }


  static async sendOrderToSales(summary: EmailOrderSummary): Promise<boolean> {
    const FORMSPARK_URL = "https://submit-form.com/a0nLwysz5";
  
    const message = [
      `VR Configurator Order`,
      `Order ID: ${summary.orderId}`,
      `Pricing tier: ${summary.pricingTier}`,
      `Total price: ${EmailService.formatPrice(summary.totalPrice)}`,
      "",
      `— Customer Name: ${summary.user.name}`,
      `Company: ${summary.user.company}`,
      `Email: ${summary.user.email}`,
      "",
      `— Games:`,
      ...summary.games.map((g) => `- ${g.gameName} (${g.pricingPackage})`),
      "",
      `— Environments:`,
      ...summary.environments.map(
        (e) => `- ${e.environmentName} → ${e.gameName} (${e.pricingPackage})`
      ),
      "",
      `— Devices:`,
      ...summary.devices.map(
        (d) => `- ${d.devicePackage} ×${d.quantity} @ $${d.totalCost / d.quantity} (${d.eventDays}d)`
      ),
      "",
      `— Options:`,
      ...summary.options.map((o) => `- ${o.optionName} (${o.tier})`),
      "",
      `JSON payload is attached below in the submission.`,
    ].join(" — ");
  
    const formData = new URLSearchParams();
    formData.append("message", message);
    formData.append("orderId", summary.orderId);
    formData.append("pricingTier", summary.pricingTier);
    formData.append("totalPrice", summary.totalPrice.toString());
    formData.append("currentStep", "7");
    formData.append("_replyto", summary.user.email);
    formData.append("user", JSON.stringify(summary.user));
    formData.append("games", JSON.stringify(summary.games));
    formData.append("environments", JSON.stringify(summary.environments));
    formData.append("devices", JSON.stringify(summary.devices));
    formData.append("custom3D", JSON.stringify(summary.custom3D));
    formData.append("options", JSON.stringify(summary.options));
  
    try {
      const res = await fetch(FORMSPARK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
  
      if (!res.ok) {
        throw new Error("Formspark 404");
      }
  
      return true;
    } catch (err) {
      console.error("Failed to send email (Formspark):", err);
      return false;
    }
  }
  

  private static generateEmailText(summary: EmailOrderSummary): string {
    const deviceCosts = summary.devices.reduce((sum, device) => sum + device.totalCost, 0)
    const basePackagePrice = summary.totalPrice - deviceCosts

    return `
NEW VR CONFIGURATOR ORDER

Order ID: ${summary.orderId}
Completed: ${new Date(summary.completedAt).toLocaleString()}

CUSTOMER DETAILS
Name: ${summary.user.name}
Company: ${summary.user.company}
Email: ${summary.user.email}

PACKAGE SUMMARY
Pricing Tier: ${summary.pricingTier}
Total Price: ${this.formatPrice(summary.totalPrice)}

SELECTED GAMES
${summary.games.map((game) => `- ${game.gameName} (${game.pricingPackage})`).join("\n")}

SELECTED ENVIRONMENTS
${summary.environments.map((env) => `- ${env.environmentName} for ${env.gameName} (${env.pricingPackage})`).join("\n")}

DEVICE RENTAL
${summary.devices.map((device) => `- ${device.devicePackage}: ${device.quantity} units × ${device.eventDays} days = ${this.formatPrice(device.totalCost)}`).join("\n")}

${summary.custom3D && summary.custom3D.additional3DModels > 0 ? `CUSTOM 3D MODELS\nAdditional 3D Models: ${summary.custom3D.additional3DModels}\n` : ""}

${summary.options.length > 0 ? `ADDITIONAL OPTIONS\n${summary.options.map((option) => `- ${option.optionName} (${option.tier})`).join("\n")}\n` : ""}

PRICING BREAKDOWN
${summary.pricingTier} Package: ${this.formatPrice(basePackagePrice)}
Device Rental: ${this.formatPrice(deviceCosts)}
Total: ${this.formatPrice(summary.totalPrice)}

NEXT STEPS
Please contact the customer within 24 hours to discuss their requirements and finalize the order.
Customer Contact: ${summary.user.email}
    `.trim()
  }
}
