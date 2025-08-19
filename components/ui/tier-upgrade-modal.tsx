"use client"
import { Button } from "./button"
import { Card, CardContent } from "./card"
import { Badge } from "./badge"
import { X } from "lucide-react"

interface TierUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  currentTier: string
  newTier: string
  newTierPrice: number
  triggerSelection: string
}

export function TierUpgradeModal({
  isOpen,
  onClose,
  onConfirm,
  currentTier,
  newTier,
  newTierPrice,
  triggerSelection,
}: TierUpgradeModalProps) {
  if (!isOpen) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "Silver":
        return "bg-gray-400 text-white"
      case "Gold":
        return "bg-yellow-500 text-white"
      default:
        return "bg-amber-600 text-white"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Package Upgrade Required</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                Your selection of <strong>"{triggerSelection}"</strong> requires an upgrade to the{" "}
                <Badge className={getTierBadgeColor(newTier)}>{newTier}</Badge> package.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Current Package:</span>
                <Badge className={getTierBadgeColor(currentTier)}>{currentTier}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>New Package:</span>
                <Badge className={getTierBadgeColor(newTier)}>{newTier}</Badge>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>New Package Price:</span>
                <span>{formatPrice(newTierPrice)}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              By clicking "Continue", your order will reflect the {newTier} package pricing. If you do not want this
              change, please click "Cancel" and unselect the choice.
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={onConfirm} className="flex-1 bg-black text-white hover:bg-gray-800">
                Continue with {newTier}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
