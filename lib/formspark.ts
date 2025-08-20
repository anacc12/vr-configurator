"use client"

import { localDB } from "./local-db"

// Ako nema env var, koristit će tvoj ID iz poruke
const FORMSPARK_URL = `https://submit-form.com/${
  process.env.NEXT_PUBLIC_FORMSPARK_ID ?? "aOnLwysz5"
}`


function composePlainTextSummary(order: any) {
  const { order: o, user, games, environments, devices, custom3D, options } = order

  const fmtMoney = (n?: number) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n)
      : "-"

  const gamesList =
    games?.length
      ? games.map((g: any) => `- ${g.gameName} (${g.pricingPackage})`).join("\n")
      : "—"

  const envList =
    environments?.length
      ? environments.map((e: any) => `- ${e.gameName} → ${e.environmentName} (${e.pricingPackage})`).join("\n")
      : "—"

  const devList =
    devices?.length
      ? devices.map((d: any) => `- ${d.devicePackage} ×${d.quantity} @ ${fmtMoney(d.pricePerDay)}/day (${d.eventDays}d)`).join("\n")
      : "—"

  const optList =
    options?.length
      ? options.map((op: any) => `- ${op.optionName} (${fmtMoney(op.price)})`).join("\n")
      : "—"

  return [
    `VR Configurator Order`,
    `Order ID: ${o?.orderId ?? "-"}`,
    `Pricing tier: ${o?.pricingTier ?? "-"}`,
    `Total price: ${fmtMoney(o?.totalPrice)}`,
    ``,
    `— Customer`,
    `Name: ${user?.fullName ?? "-"}`,
    `Company: ${user?.company ?? "-"}`,
    `Email: ${user?.email ?? "-"}`,
    `Phone: ${user?.phone ?? "-"}`,
    ``,
    `— Games`,
    gamesList,
    ``,
    `— Environments`,
    envList,
    ``,
    `— Devices`,
    devList,
    ``,
    `— Options`,
    optList,
    ``,
    `JSON payload is attached below in the submission.`
  ].join("\n")
}


export async function sendOrderToFormspark(orderId: string) {
  // 1) Skupi sve iz localDB
  const full = await localDB.getCompleteOrder(orderId)

  // 2) Izvuci e-mail za _replyto (korak 1 form)
  const replyTo = full?.user?.email ?? "hello@takeaway-reality.com"

  // 3) Ljudski čitljiv sažetak (ulazi u e‑mail body)
  const plainText = composePlainTextSummary(full)

  // 4) Payload koji ide na Formspark
  const payload = {
    // Headers/metadata koje Formspark prepoznaje:
    _replyto: replyTo,
    _subject: `🟢 VR Configurator – Order ${full?.order?.orderId ?? ""}`,
    // Ako želiš potvrdu na korisnikov email:
    // _email: replyTo,

    // Ljudski čitljiv body (da mail bude pregledan)
    message: plainText,

    // Stavljamo i kompletan JSON, da u Formspark dashu imaš sve polje‑po‑polje
    orderId: full?.order?.orderId,
    pricingTier: full?.order?.pricingTier,
    totalPrice: full?.order?.totalPrice,
    currentStep: full?.order?.currentStep,

    user: full?.user ?? null,
    games: full?.games ?? [],
    environments: full?.environments ?? [],
    devices: full?.devices ?? [],
    custom3D: full?.custom3D ?? null,
    options: full?.options ?? [],
  }

  // 5) Slanje
  const res = await fetch(FORMSPARK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Formspark error: ${res.status} ${txt}`)
  }
}
