"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { localDB } from "@/lib/local-db"
import type { OrderGame } from "@/lib/database"
import { recalculateOrderTier } from "@/lib/database"

interface Step2ChooseGameProps {
  orderId: string
  onDataChange: () => void
  onValidationChange: (isValid: boolean) => void
}

const GAMES_DATA = [
  {
    name: "Find the ball",
    compatibleEnvironments: "All",
    pricingPackage: "Bronze",
    custom3DModels: 0,
    unique2DSlots: 0,
    description: "A fun interactive game where players search for hidden balls in the virtual environment.",
  },
  {
    name: "Memory",
    compatibleEnvironments: "All",
    pricingPackage: "Bronze",
    custom3DModels: 0,
    unique2DSlots: 8,
    description: "Test your memory skills with this engaging pattern-matching game.",
  },
  {
    name: "Simon Says",
    compatibleEnvironments: "All",
    pricingPackage: "Bronze",
    custom3DModels: 0,
    unique2DSlots: 0,
    description: "Follow the sequence and test your attention with this classic game.",
  },
  {
    name: "Branded objects hunt",
    compatibleEnvironments: "Ancient Temple,Autumn Forest",
    pricingPackage: "Gold",
    custom3DModels: 3,
    unique2DSlots: 0,
    description: "Hunt for branded objects in immersive environments with custom 3D models.",
  },
  {
    name: "Wheel of fortune",
    compatibleEnvironments: "All",
    pricingPackage: "Gold",
    custom3DModels: 0,
    unique2DSlots: 5,
    description: "Spin the wheel and win prizes in this exciting game of chance.",
  },
  {
    name: "Product Inspection",
    compatibleEnvironments: "All",
    pricingPackage: "Silver",
    custom3DModels: 3,
    unique2DSlots: 0,
    description: "Inspect and examine products in detail using VR technology.",
  },
  {
    name: "Build the product",
    compatibleEnvironments: "All",
    pricingPackage: "Silver",
    custom3DModels: 3,
    unique2DSlots: 0,
    description: "Assemble products step by step in an interactive virtual environment.",
  },
  {
    name: "Whack a mole",
    compatibleEnvironments: "All",
    pricingPackage: "Bronze",
    custom3DModels: 0,
    unique2DSlots: 0,
    description: "Classic whack-a-mole game with VR immersion and haptic feedback.",
  },
]

export function Step2ChooseGame({ orderId, onDataChange, onValidationChange }: Step2ChooseGameProps) {
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [showSecondGameSelection, setShowSecondGameSelection] = useState(false)
  const [selectOneMoreGame, setSelectOneMoreGame] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const lastValidationRef = useRef<boolean | null>(null)

  useEffect(() => {
    // Load existing data
    const loadGameData = async () => {
      const games = await localDB.getOrderGames(orderId)
      if (games.length > 0) {
        setSelectedGames(games.map((g) => g.gameName))
        setSelectOneMoreGame(games.length > 1)
        setShowSecondGameSelection(games.length > 1)
      }
      setIsLoading(false)
    }
    loadGameData()
  }, [orderId])

  useEffect(() => {
    const isValid = selectedGames.length > 0
    if (lastValidationRef.current !== isValid) {
      lastValidationRef.current = isValid
      onValidationChange(isValid)
    }
  }, [selectedGames]) // Removed onValidationChange from dependencies to prevent infinite loop

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

  const handleGameSelect = async (gameName: string) => {
    let newSelectedGames: string[]

    if (showSecondGameSelection) {
      newSelectedGames = [selectedGames[0], gameName]
      setShowSecondGameSelection(false)
    } else {
      // Selecting first game
      newSelectedGames = [gameName]
    }

    setSelectedGames(newSelectedGames)
    await saveGameSelection(newSelectedGames)
    onDataChange() // Added onDataChange call to trigger order summary refresh when games are selected
  }

  const handleSelectOneMoreGame = async () => {
    setSelectOneMoreGame(true)
    setShowSecondGameSelection(true)

    await saveGameSelection(selectedGames, true) // Pass flag to indicate Gold tier selection
    onDataChange()
  }

  const handleChooseOnlyOneGame = async () => {
    setSelectOneMoreGame(false)
    setShowSecondGameSelection(false)
    const newSelectedGames = [selectedGames[0]]
    setSelectedGames(newSelectedGames)

    await saveGameSelection(newSelectedGames)
    onDataChange()
  }

  const saveGameSelection = async (games: string[], isMultipleGamesSelection = false) => {
    const orderGames: Omit<OrderGame, "orderId">[] = games.map((gameName) => {
      const gameData = GAMES_DATA.find((g) => g.name === gameName)!
      return {
        gameName,
        pricingPackage: gameData.pricingPackage,
        compatibleEnvironments: gameData.compatibleEnvironments,
        custom3DModels: gameData.custom3DModels,
        unique2DSlots: gameData.unique2DSlots,
      }
    })

    await localDB.saveOrderGames(orderId, orderGames)

    await recalculateOrderTier(orderId) // Always recalculate tier based on current selections instead of hardcoding Gold
  }

  const getAvailableGames = () => {
    if (showSecondGameSelection) {
      return GAMES_DATA.filter((game) => !selectedGames.includes(game.name))
    }
    return GAMES_DATA
  }

  const getGameImageUrl = (gameName: string) => {
    const imageMap: Record<string, string> = {
      "Find the ball":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Where%20is%20the%20ball-Of1R65RQHlEGZU0FPaPJmvsQaYjxxA.png",
      Memory: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Memory-9NOlQXrgf7raqXwavOSMiv9gfB7C6c.png",
      "Simon Says":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Simon%20Says-rx3JAh8eOCp0O1h8DRc3Zx9qKLUq89.png",
      "Branded objects hunt":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Branded%20Object%20Hunt-IxcCZemencBjUo2aJQTDx93Z8Koe6x.png",
      "Wheel of fortune":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Wheel%20of%20Fortune-fZ17NTxhSkPYCbSd3aSyDHaCe6Mqlg.png",
      "Product Inspection":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Product%20inspection-1f2yUvczb6LdM0JI1PDYUxxKEp8L94.png",
      "Build the product":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Build%20the%20product-8UPiWhJWbJjmry29je6yfVrQL3RVaO.png",
      "Whack a mole":
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Whack%20a%20mole-ZYReDHKsNd1VdPrdbpt5bqx7sVh6mm.png",
    }
    return (
      imageMap[gameName] || `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(gameName + " VR game")}`
    )
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Choose Your Game</h2>
      <p className="text-gray-600 mb-8">
        {showSecondGameSelection
          ? "Select your second game to complete your Gold package selection."
          : "Select from our collection of VR games for your event."}
      </p>

      {/* Show selected games */}
      {selectedGames.length > 0 && !showSecondGameSelection && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Selected Games:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedGames.map((gameName) => (
              <Badge key={gameName} variant="secondary" className="bg-green-100 text-green-800">
                {gameName}
              </Badge>
            ))}
          </div>
          {selectOneMoreGame && (
            <div className="mt-2">
              <Badge className={getTierBadgeColor("Gold")}>Gold Package - Multiple Games</Badge>
            </div>
          )}
        </div>
      )}

      {/* Select one more game option */}
      {!selectOneMoreGame && selectedGames.length === 1 && !showSecondGameSelection && (
        <div className="mb-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="selectOneMore"
                    className="w-4 h-4"
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSelectOneMoreGame()
                      }
                    }}
                  />
                  <label htmlFor="selectOneMore" className="font-medium">
                    Select one more game
                  </label>
                  <Badge className={getTierBadgeColor("Gold")}>Gold</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back to single game selection */}
      {showSecondGameSelection && (
        <div className="mb-6">
          <Button variant="outline" onClick={handleChooseOnlyOneGame}>
            Choose only 1 game
          </Button>
        </div>
      )}

      {/* Games grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getAvailableGames().map((game) => (
          <Card
            key={game.name}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedGames.includes(game.name) ? "ring-2 ring-black" : ""
            }`}
            onClick={() => handleGameSelect(game.name)}
          >
            <CardContent className="p-4">
              {/* Game Image */}
              <div className="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                <img
                  src={getGameImageUrl(game.name) || "/placeholder.svg"}
                  alt={game.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Game Title and Badge */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{game.name}</h3>
                {game.pricingPackage !== "Bronze" && (
                  <Badge className={getTierBadgeColor(game.pricingPackage)}>{game.pricingPackage}</Badge>
                )}
              </div>

              {/* Game Description */}
              <p className="text-gray-600 text-sm mb-4">{game.description}</p>

              {/* Learn More Button */}
              <Button variant="outline" className="w-full bg-transparent" onClick={(e) => e.stopPropagation()}>
                Learn more about the game
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
