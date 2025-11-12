// app/dashboard/packs/PurchasePacksClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./packs.module.css"

interface PackSize {
  size: number;
  price: number;
  savings: string;
}

const PACK_SIZES: PackSize[] = [
  { size: 10, price: 150, savings: "Save $5" },
  { size: 20, price: 280, savings: "Save $20" },
  { size: 40, price: 520, savings: "Save $80" },
  { size: 80, price: 960, savings: "Save $240" },
]

interface PurchaseResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export default function PurchasePacksClient({ userId }: { userId: string }) {
  const [selectedPack, setSelectedPack] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handlePurchase = async () => {
    if (!selectedPack) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Create meal pack via API
      const response = await fetch("/api/packs/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packSize: selectedPack,
          userId: userId,
        }),
      })

      const data: PurchaseResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to purchase pack")
      }

      setSuccess(`Successfully purchased ${selectedPack} meal pack!`)
      setSelectedPack(null)
      
      // Refresh or redirect to dashboard
      setTimeout(() => {
        router.push("/backend/dashboard")
        router.refresh()
      }, 2000)
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to purchase pack. Please try again."
      setError(errorMessage)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Purchase Meal Packs</h1>
        <p>Choose a meal pack that fits your needs</p>
      </div>

      <div className={styles.packsGrid}>
        {PACK_SIZES.map((pack) => (
          <div 
            key={pack.size}
            className={`${styles.packCard} ${selectedPack === pack.size ? styles.selected : ''}`}
            onClick={() => setSelectedPack(pack.size)}
          >
            <div className={styles.packHeader}>
              <h3>{pack.size} Meals</h3>
              {pack.savings && (
                <span className={styles.savingsBadge}>{pack.savings}</span>
              )}
            </div>
            <div className={styles.packPrice}>
              <span className={styles.price}>${pack.price}</span>
              <span className={styles.perMeal}>
                ${(pack.price / pack.size).toFixed(2)}/meal
              </span>
            </div>
            <div className={styles.packBenefits}>
              <ul>
                <li>✓ No expiration</li>
                <li>✓ Flexible ordering</li>
                <li>✓ Fresh ingredients</li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      {selectedPack && (
        <div className={styles.purchaseSection}>
          <div className={styles.summary}>
            <h3>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>{selectedPack} Meal Pack</span>
              <span>${PACK_SIZES.find(p => p.size === selectedPack)?.price}</span>
            </div>
            <div className={styles.summaryTotal}>
              <strong>Total: ${PACK_SIZES.find(p => p.size === selectedPack)?.price}</strong>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <button 
            className={styles.purchaseButton}
            onClick={handlePurchase}
            disabled={loading}
          >
            {loading ? "Processing..." : "Purchase Pack"}
          </button>
        </div>
      )}

      {!selectedPack && (
        <div className={styles.noSelection}>
          <p>Select a meal pack to purchase</p>
        </div>
      )}
    </div>
  )
}
