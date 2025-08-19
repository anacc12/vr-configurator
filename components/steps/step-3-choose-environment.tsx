"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { localDB } from "@/lib/local-db"
import type { OrderGame, OrderEnvironment } from "@/lib/database"
import { updateOrderTier } from "@/lib/database"

interface Step3ChooseEnvironmentProps {
  orderId: string
  onDataChange: () => void
  onValidationChange: (isValid: boolean) => void
}

const ENVIRONMENTS_DATA = [
  {
    name: "Modern Office",
    slots1x1: 3,
    slots9x16: 1,
    slots16x9: 4,
    pricingPackage: "Bronze",
    description:
      "This sleek modern office with marble floors and wooden finishings was made to easily fit any game with its minimalist design",
  },
  {
    name: "Luxury Retail Space",
    slots1x1: 2,
    slots9x16: 1,
    slots16x9: 2,
    pricingPackage: "Bronze",
    description:
      "This Retail space will make your users feel like they just stepped into a high-end store. A perfect way to showcase your products or services.",
  },
  {
    name: "Autumn Forest",
    slots1x1: 2,
    slots9x16: 1,
    slots16x9: 2,
    pricingPackage: "Bronze",
    description:
      "For all the nature lovers, this beautiful forest environment makes you feel like you are in a vast and open space.",
  },
  {
    name: "Ancient Temple",
    slots1x1: 2,
    slots9x16: 1,
    slots16x9: 2,
    pricingPackage: "Gold",
    description:
      "Embrace the the immersion and transport your users to an ancient temple built perfectly to represent a roman or greek temple.",
  },
]

export function Step3ChooseEnvironment({ orderId, onDataChange, onValidationChange }: Step3ChooseEnvironmentProps) {
  const [selectedGames, setSelectedGames] = useState<OrderGame[]>([])
  const [selectedEnvironments, setSelectedEnvironments] = useState<Record<string, string>>({})
  const [currentGameIndex, setCurrentGameIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load games and existing environment selections
    const loadData = async () => {
      const games = await localDB.getOrderGames(orderId)
      const environments = await localDB.getOrderEnvironments(orderId)

      setSelectedGames(games)

      // Build selected environments map
      const envMap: Record<string, string> = {}
      environments.forEach((env) => {
        envMap[env.gameName] = env.environmentName
      })

      const gameNames = games.map((g) => g.gameName)
      const filteredEnvMap: Record<string, string> = {}
      Object.entries(envMap).forEach(([gameName, envName]) => {
        if (gameNames.includes(gameName)) {
          filteredEnvMap[gameName] = envName
        }
      })

      setSelectedEnvironments(filteredEnvMap)

      if (Object.keys(envMap).length !== Object.keys(filteredEnvMap).length) {
        await saveEnvironmentSelections(filteredEnvMap)
      }

      setIsLoading(false)
    }
    loadData()
  }, [orderId])

  useEffect(() => {
    const requiredSelections = selectedGames.length
    const currentSelections = Object.keys(selectedEnvironments).length
    const hasAllRequiredSelections = selectedGames.every((game) => selectedEnvironments[game.gameName])

    // Allow progression if we have at least one selection and we're not requiring all at once
    // For multiple games, allow progression as long as current game has selection
    let isValid = false

    if (selectedGames.length === 1) {
      // Single game: must have environment selected
      isValid = hasAllRequiredSelections
    } else {
      // Multiple games: allow progression if at least current game has environment
      const currentGame = selectedGames[currentGameIndex]
      isValid = currentGame && selectedEnvironments[currentGame.gameName] !== undefined
    }

    onValidationChange(isValid)
  }, [selectedEnvironments, selectedGames, currentGameIndex]) // Removed onValidationChange from dependencies

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

  const getCompatibleEnvironments = (game: OrderGame) => {
    if (game.compatibleEnvironments === "All") {
      return ENVIRONMENTS_DATA
    }
    const compatibleNames = game.compatibleEnvironments.split(",").map((name) => name.trim())
    return ENVIRONMENTS_DATA.filter((env) => compatibleNames.includes(env.name))
  }

  const handleEnvironmentSelect = async (gameName: string, environmentName: string) => {
    const newSelectedEnvironments = {
      ...selectedEnvironments,
      [gameName]: environmentName,
    }
    setSelectedEnvironments(newSelectedEnvironments)
    await saveEnvironmentSelections(newSelectedEnvironments)
  }

  const saveEnvironmentSelections = async (envSelections: Record<string, string>) => {
    const validGameNames = selectedGames.map((g) => g.gameName)
    const validEnvSelections: Record<string, string> = {}

    Object.entries(envSelections).forEach(([gameName, environmentName]) => {
      if (validGameNames.includes(gameName)) {
        validEnvSelections[gameName] = environmentName
      }
    })

    const orderEnvironments: Omit<OrderEnvironment, "orderId">[] = Object.entries(validEnvSelections).map(
      ([gameName, environmentName]) => {
        const envData = ENVIRONMENTS_DATA.find((e) => e.name === environmentName)!
        return {
          gameName,
          environmentName,
          slots1x1: envData.slots1x1,
          slots9x16: envData.slots9x16,
          slots16x9: envData.slots16x9,
          pricingPackage: envData.pricingPackage,
        }
      },
    )

    await localDB.saveOrderEnvironments(orderId, orderEnvironments)

    const currentOrder = await localDB.getOrder(orderId)
    let newTier = currentOrder?.pricingTier || "Bronze"

    // Update tier based on environment selections
    for (const [, environmentName] of Object.entries(envSelections)) {
      const envData = ENVIRONMENTS_DATA.find((e) => e.name === environmentName)!
      if (envData.pricingPackage !== "Bronze") {
        newTier = updateOrderTier(newTier, envData.pricingPackage)
      }
    }

    await localDB.updateOrder(orderId, { pricingTier: newTier })
    onDataChange()
  }

  const getEnvironmentImageUrl = (environmentName: string) => {
    const imageMap: Record<string, string> = {
      "Modern Office":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Modern%20office-rE2boOHits6qXxzjboMcL1VfJdC3af.png",
      "Luxury Retail Space":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Luxury%20store-DLVpFawqdMbMfnIeqmEj4JYRtMlq2J.png",
      "Autumn Forest":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Autumn%20forest-zvNJaw9Sl1hHFAFYo7CybmM4vgE40M.png",
      "Ancient Temple":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Ancient%20Temple-8WMUmXxqqUyRwxcIPMgezfTK0YtF1u.png",
    }
    return (
      imageMap[environmentName] ||
      `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(environmentName + " VR environment")}`
    )
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (selectedGames.length === 0) {
    return (
      <div className="max-w-6xl">
        <h2 className="text-2xl font-bold mb-6">Choose Your Environment</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">Please select a game first before choosing an environment.</p>
        </div>
      </div>
    )
  }

  const currentGame = selectedGames[currentGameIndex]
  const compatibleEnvironments = getCompatibleEnvironments(currentGame)

  return (
    <div className="max-w-6xl">


      {/* ------ START NEW ------- */}
      <div className="!sticky !top-25 z-[40] bg-white border-null b-0 pt-4 pb-4 w-full">

        <div className="flex justify-between w-full items-center mb-3">
          <h2 className="text-2xl font-bold">Choose Your Environment</h2>
          {selectedGames.length > 1 && (
            <div className="flex gap-2">
              {selectedGames.map((game, index) => (
                <Button
                  key={game.gameName}
                  variant={index === currentGameIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentGameIndex(index)}
                  className={index === currentGameIndex ? "bg-black text-white rounded-full cursor-pointer" : "rounded-full cursor-pointer"}
                >
                  {game.gameName}
                  {selectedEnvironments[game.gameName] && " ✓"}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* 
        <p className="text-gray-600 mb-8">
          {selectedGames.length > 1
            ? `Select the environment for "${currentGame.gameName}" (${currentGameIndex + 1} of ${selectedGames.length})`
            : `Select the environment that best fits your selected game "${currentGame.gameName}".`}
        </p> */}

        {/* Game navigation for multiple games */}


        {/* Show selected environment for current game */}
        <div className="flex justify-between gap-2 items-center p-2 pl-3 bg-[#f6f6f6] rounded-full">
          <p className="font-medium text-xs text-[#1f1f1f]">Selected for {currentGame.gameName}</p>

          {selectedEnvironments[currentGame.gameName] ? (
            <Badge variant="secondary" className="bg-white border border-[#e6e6e6] text-[#1f1f1f]">
              {selectedEnvironments[currentGame.gameName]}
            </Badge>
          ) : <p className="font-medium text-xs text-[#1f1f1f] pr-2">No environments selected yet.</p>}

        </div>



      </div>

      {/* ------- END NEW ------- */}

      {/* Environments grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 mt-2">
        {compatibleEnvironments.map((environment) => {
          const checked =
            selectedEnvironments[currentGame.gameName] === environment.name;

          return (
            <Card
              key={environment.name}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${checked ? "ring-2 ring-black" : ""
                }`}
              onClick={() =>
                handleEnvironmentSelect(currentGame.gameName, environment.name)
              }
              role="radio"
              aria-checked={checked}
            >

              <div className="absolute left-3 top-3 z-10">
                <input
                  type="radio"
                  name={`env-${currentGame.gameName}`} // grupira radio-e po igri
                  aria-label={`Select ${environment.name}`}
                  checked={checked}
                  onChange={() =>
                    handleEnvironmentSelect(currentGame.gameName, environment.name)
                  }
                  onClick={(e) => e.stopPropagation()} // da klik na radio ne triggira onClick kartice
                  className="h-4 w-4 accent-black"
                />
              </div>

              <CardContent className="p-4 pb-0">
                {/* Environment Image */}
                <div className="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={getEnvironmentImageUrl(environment.name) || "/placeholder.svg"}
                    alt={environment.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Environment Title and Badge */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{environment.name}</h3>
                  {environment.pricingPackage !== "Bronze" && (
                    <Badge className={getTierBadgeColor(environment.pricingPackage)}>{environment.pricingPackage}</Badge>
                  )}
                </div>

                {/* Environment Description */}
                <p className="text-gray-600 text-sm mb-4">{environment.description}</p>

                {/* Slots Information */}
                <div className="text-xs text-gray-500 mb-4">
                  <div>Promotional Slots:</div>
                  <div>
                    1:1 - {environment.slots1x1} | 9:16 - {environment.slots9x16} | 16:9 - {environment.slots16x9}
                  </div>
                </div>

                {/* Learn More Button */}
                {/* <Button variant="outline" className="w-full bg-transparent" onClick={(e) => e.stopPropagation()}>
                Learn more about the environment
              </Button> */}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Navigation for multiple games */}
      {selectedGames.length > 1 && (
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentGameIndex(Math.max(0, currentGameIndex - 1))}
            disabled={currentGameIndex === 0}
          >
            Previous Game
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentGameIndex(Math.min(selectedGames.length - 1, currentGameIndex + 1))}
            disabled={currentGameIndex === selectedGames.length - 1}
          >
            Next Game
          </Button>
        </div>
      )}
    </div>
  )
}
