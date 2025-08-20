import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import type { EmailOrderSummary } from "./email-service"

export async function generateOrderSummaryPDF(summary: EmailOrderSummary): Promise<Uint8Array> {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)

  const doc = await PDFDocument.create()
  let page = doc.addPage([600, 800])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const { width, height } = page.getSize()


  page.drawRectangle({
    x: 0,
    y: height - 60,
    width,
    height: 60,
    color: rgb(0, 0, 0),
  })
  
  // 2. Naslov u sredini
  const titleFontSize = 16
  const titleText = "VR For Events – Order Summary"
  const textWidth = font.widthOfTextAtSize(titleText, titleFontSize)
  page.drawText(titleText, {
    x: (width - textWidth) / 2,
    y: height - 40, // malo dolje da ne bude zalijepljeno gore
    size: titleFontSize,
    font,
    color: rgb(1, 1, 1), // bijeli tekst
  })


  let y = height - 80
  const lineHeight = 18

  const margin = 40
  const pageHeight = 800 // ili page.getSize().height
  const usableHeight = margin // donja margina
  
  const addLine = (text: string = "") => {
    if (y < usableHeight) {
      page = doc.addPage([600, pageHeight])
      y = pageHeight - margin
      page.setFont(font)
    }
  
    page.drawText(text, { x: margin, y, size: 12, font, color: rgb(0, 0, 0) })
    y -= lineHeight
  }

  const drawDivider = () => {
    y -= 0 // malo razmaka prije crte
    page.drawLine({
      start: { x: 40, y },
      end: { x: width - 40, y },
      thickness: 1,
      color: rgb(230 / 255, 230 / 255, 230 / 255),
    })
    y -= 28 // malo razmaka nakon crte
  }  

  addLine("VR Configurator Order")

  
  drawDivider()
  

  addLine(`Order ID: ${summary.orderId}`)
  addLine(`Pricing Tier: ${summary.pricingTier}`)
  addLine(`Total Price: ${formatPrice(summary.totalPrice)}`)
  addLine(`Completed At: ${new Date(summary.completedAt).toLocaleString()}`)
  
  
  drawDivider()
  

  addLine("Customer Info:")
  addLine(`- Name: ${summary.user.name}`)
  addLine(`- Company: ${summary.user.company}`)
  addLine(`- Email: ${summary.user.email}`)
  
  
  drawDivider()
  

  addLine("Games:")
  summary.games.forEach((g) => addLine(`- ${g.gameName} (${g.pricingPackage})`))
  
  
  drawDivider()
  

  addLine("Environments:")
  summary.environments.forEach((e) =>
    addLine(`- ${e.environmentName} : ${e.gameName} (${e.pricingPackage})`)
  )
  
  
  drawDivider()
  

  addLine("Devices:")
  summary.devices.forEach((d) =>
    addLine(
      `- ${d.devicePackage} :${d.quantity} @ ${formatPrice(
        d.totalCost / (d.quantity * d.eventDays)
      )}/day for ${d.eventDays} days = ${formatPrice(d.totalCost)}`
    )
  )
 
  
  drawDivider()
  

  addLine("Custom 3D:")
  if (summary.custom3D?.additional3DModels) {
    addLine(`- ${summary.custom3D.additional3DModels} additional model(s)`)
  } else {
    addLine("- No custom 3D models")
  }
  
  
  drawDivider()
  

  addLine("Options:")
  if (summary.options.length > 0) {
    summary.options.forEach((o) => addLine(`- ${o.optionName} (${o.tier})`))
  } else {
    addLine("- No additional options")
  }
  
  drawDivider()

  const deviceCosts = summary.devices.reduce((sum, d) => sum + d.totalCost, 0)
  const basePrice = summary.totalPrice - deviceCosts
  addLine("Pricing Breakdown:")
  addLine(`- Base Package: ${formatPrice(basePrice)}`)
  addLine(`- Device Rental: ${formatPrice(deviceCosts)}`)
  addLine(`- Total: ${formatPrice(summary.totalPrice)}`)

  return await doc.save()
}
