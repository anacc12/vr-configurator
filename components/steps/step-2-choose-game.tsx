"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { localDB } from "@/lib/local-db"
import type { OrderGame } from "@/lib/database"
import { recalculateOrderTier } from "@/lib/database"
import { Switch } from "@/components/ui/switch"
import { Label } from "@radix-ui/react-label"

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
    link: "https://forceful-manager-624125.framer.app/games/where-is-the-ball"
  },
  {
    name: "Memory",
    compatibleEnvironments: "All",
    pricingPackage: "Bronze",
    custom3DModels: 0,
    unique2DSlots: 8,
    description: "Test your memory skills with this engaging pattern-matching game.",
    link: "https://forceful-manager-624125.framer.app/games/memory"
  },
  {
    name: "Simon Says",
    compatibleEnvironments: "All",
    pricingPackage: "Bronze",
    custom3DModels: 0,
    unique2DSlots: 0,
    description: "Follow the sequence and test your attention with this classic game.",
    link: "https://forceful-manager-624125.framer.app/games/simon-says"
  },
  {
    name: "Branded objects hunt",
    compatibleEnvironments: "Ancient Temple,Autumn Forest",
    pricingPackage: "Gold",
    custom3DModels: 3,
    unique2DSlots: 0,
    description: "Hunt for branded objects in immersive environments with custom 3D models.",
    link: "https://forceful-manager-624125.framer.app/games/branded-objects-hunt"
  },
  {
    name: "Wheel of fortune",
    compatibleEnvironments: "All",
    pricingPackage: "Gold",
    custom3DModels: 0,
    unique2DSlots: 5,
    description: "Spin the wheel and win prizes in this exciting game of chance.",
    link: "https://forceful-manager-624125.framer.app/games/wheel-of-fortune"

  },
  {
    name: "Product Inspection",
    compatibleEnvironments: "All",
    pricingPackage: "Silver",
    custom3DModels: 3,
    unique2DSlots: 0,
    description: "Inspect and examine products in detail using VR technology.",
    link: "https://forceful-manager-624125.framer.app/games/product-inspection"

  },
  {
    name: "Build the product",
    compatibleEnvironments: "All",
    pricingPackage: "Silver",
    custom3DModels: 3,
    unique2DSlots: 0,
    description: "Assemble products step by step in an interactive virtual environment.",
    link: "https://forceful-manager-624125.framer.app/games/build-the-product"

  },
  {
    name: "Whack a mole",
    compatibleEnvironments: "All",
    pricingPackage: "Bronze",
    custom3DModels: 0,
    unique2DSlots: 0,
    description: "Classic whack-a-mole game with VR immersion and haptic feedback.",
    link: "https://forceful-manager-624125.framer.app/games/whack-a-mole"

  },
]

export function Step2ChooseGame({ orderId, onDataChange, onValidationChange }: Step2ChooseGameProps) {
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [showSecondGameSelection, setShowSecondGameSelection] = useState(false)
  const [selectOneMoreGame, setSelectOneMoreGame] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const lastValidationRef = useRef<boolean | null>(null)

  // treat selectOneMoreGame as the multi-select flag
  const isMulti = selectOneMoreGame;

  // single source for saving + side-effects
  const applySelection = async (next: string[]) => {
    setSelectedGames(next);

    const orderGames: Omit<OrderGame, "orderId">[] = next.map((gameName) => {
      const g = GAMES_DATA.find((x) => x.name === gameName)!;
      return {
        gameName,
        pricingPackage: g.pricingPackage,
        compatibleEnvironments: g.compatibleEnvironments,
        custom3DModels: g.custom3DModels,
        unique2DSlots: g.unique2DSlots,
      };
    });

    await localDB.saveOrderGames(orderId, orderGames);
    await recalculateOrderTier(orderId);
    onDataChange();
  };



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

  // const handleGameSelect = async (gameName: string) => {
  //   let newSelectedGames: string[]

  //   if (showSecondGameSelection) {
  //     newSelectedGames = [selectedGames[0], gameName]
  //     setShowSecondGameSelection(false)
  //   } else {
  //     // Selecting first game
  //     newSelectedGames = [gameName]
  //   }

  //   setSelectedGames(newSelectedGames)
  //   await saveGameSelection(newSelectedGames)
  //   onDataChange() // Added onDataChange call to trigger order summary refresh when games are selected
  // }

  const handleGameSelect = async (gameName: string) => {
    const isAlready = selectedGames.includes(gameName);

    // UNSELECT (radi i u single i u multi modu)
    if (isAlready) {
      const next = selectedGames.filter((g) => g !== gameName);
      await applySelection(next);
      return;
    }

    // SELECT
    if (!isMulti) {
      // single select: nova zamjenjuje staru
      const next = [gameName];
      await applySelection(next);
      return;
    }

    // multi: max 2
    if (selectedGames.length < 2) {
      const next = [...selectedGames, gameName];
      await applySelection(next);
      return;
    }

    // ako je već 2, ignoriraj (disable u UI-ju ionako sprječava)
  };


  const handleSelectOneMoreGame = async () => {
    setSelectOneMoreGame(true)
    setShowSecondGameSelection(true)

    if (selectedGames.length > 0) {
      await saveGameSelection(selectedGames, true)
      onDataChange()
    }
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

  // const getAvailableGames = () => {
  //   if (showSecondGameSelection) {
  //     return GAMES_DATA.filter((game) => !selectedGames.includes(game.name))
  //   }
  //   return GAMES_DATA
  // }

  const getAvailableGames = () => GAMES_DATA;


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
    <div className="max-w-6xl">


      <div className="!sticky !top-25 z-[40] bg-white border-null b-0 pt-4 pb-4 w-full">
        <div className="flex justify-between w-full items-center mb-3">
          <h2 className="text-2xl font-bold">Choose Your Game</h2>
          <div className="flex items-center space-x-2">
            <Switch id="multi-game"
              checked={selectOneMoreGame || showSecondGameSelection}
              onCheckedChange={async (checked) => {
                if (checked) {
                  // uključi multi, zadrži postojeći izbor (ako nema ničeg, user može izabrati 2)
                  setSelectOneMoreGame(true);
                  setShowSecondGameSelection(selectedGames.length < 2); // samo za poruku
                } else {
                  // isključuješ multi: po specifikaciji — ako su 2 selektane, očisti sve
                  setSelectOneMoreGame(false);
                  setShowSecondGameSelection(false);

                  if (selectedGames.length === 2 || selectedGames.length === 0) {
                    await applySelection([]); // oba se unselectaju ili ostaje prazno
                  } else if (selectedGames.length === 1) {
                    // dozvoljeno je ostaviti 1 (ako to želiš striktno očistiti, zamijeni s [])
                    await applySelection([selectedGames[0]]);
                  }
                }
              }}

            />
            <Label htmlFor="airplane-mode">More than 1 game</Label>
          </div>
        </div>

        {/* <p className="text-gray-600 mb-8">
          {showSecondGameSelection
            ? "Select your second game to complete your Gold package selection."
            : "Select from our collection of VR games for your event."}
        </p> */}

        {/* Show selected games */}


        <div className="flex justify-between items-center p-2 pl-3 bg-[#f6f6f6] rounded-full">
          <div className="flex flex-wrap gap-2">
            {selectedGames.length > 0 ? selectedGames.map((gameName) => (
              <Badge key={gameName} variant="secondary" className="bg-white border border-[#e6e6e6] text-[#1f1f1f]">
                {gameName}
              </Badge>
            )) : <p className="font-medium text-xs text-[#1f1f1f] pl-2">No games selected yet.</p>}
          </div>
          {selectOneMoreGame && (
            <Badge className={getTierBadgeColor("Gold")}>Gold - Multiple Games</Badge>

          )}
        </div>


      </div>


      {/* Games grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 mt-2">
        {getAvailableGames().map((game) => {
          const checked = selectedGames.includes(game.name)
          const disablePick = isMulti && selectedGames.length >= 2 && !checked

          return (
            // <Card
            //   key={game.name}
            //   className={`cursor-pointer transition-all hover:shadow-lg ${selectedGames.includes(game.name) ? "ring-2 ring-black" : ""
            //     }`}
            //   onClick={() => handleGameSelect(game.name)}
            // >

            <Card
              key={game.name}
              className={`relative cursor-pointer transition-all hover:shadow-lg
    ${checked ? "ring-2 ring-black" : ""}
    ${disablePick ? "opacity-60 pointer-events-none" : ""}
  `}
              onClick={() => handleGameSelect(game.name)}
            >

              <CardContent className="p-4">
                {/* Game Image */}
                {/* top-left check control */}
                <div className="absolute left-3 top-3 z-10">
                  {isMulti ? (
                    <input
                      type="checkbox"
                      aria-label={`Select ${game.name}`}
                      checked={checked}
                      disabled={disablePick}
                      onChange={() => handleGameSelect(game.name)}
                      className="h-4 w-4 accent-black"
                    />
                  ) : (
                    <input
                      type="radio"
                      name="game-single"
                      aria-label={`Select ${game.name}`}
                      checked={checked}
                      onChange={() => handleGameSelect(game.name)}
                      className="h-4 w-4 accent-black"
                    />
                  )}
                </div>

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
                <Button variant="outline" className="w-full bg-transparent cursor-pointer" onClick={(e) => {
                  e.stopPropagation()
                  window.open(game.link, "_blank", "noopener,noreferrer")
                }}>
                  Learn more about the game
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
