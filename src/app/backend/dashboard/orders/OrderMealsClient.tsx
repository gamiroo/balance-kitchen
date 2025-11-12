// app/dashboard/order/OrderMealsClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import MenuDishCard from "../../../../components/MenuDishCard"
import styles from "./order.module.css"

// Use the same interface as MenuDishCard expects
interface MenuDish {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string; // Required string, not optional
  allergens: string[];
  isAvailable: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image?: string;
  allergens?: string[];
  isAvailable?: boolean;
  [key: string]: unknown;
}

interface Menu {
  items: MenuItem[];
  [key: string]: unknown;
}

interface OrderResponse {
  success: boolean;
  orderId?: string;
  mealsRemaining?: number;
  message?: string;
  error?: string;
  details?: string;
}

// Helper function to transform your data to match MenuDish interface
const transformToMenuDish = (item: MenuItem): MenuDish => ({
  id: item.id,
  name: item.name,
  description: item.description,
  category: item.category,
  price: item.price,
  // Provide a default image if none exists
  image: item.image || '/default-dish-image.jpg',
  allergens: Array.isArray(item.allergens) ? item.allergens : [],
  isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
})

export default function OrderMealsClient({ 
  userId, 
  mealBalance, 
  menu 
}: { 
  userId: string;
  mealBalance: number;
  menu: Menu;
}) {
  const [selectedMeals, setSelectedMeals] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const totalMealsSelected = Object.values(selectedMeals).reduce((sum, count) => sum + count, 0)

  const handleMealChange = (mealId: string, count: number) => {
    if (count < 0) return
    
    setSelectedMeals(prev => ({
      ...prev,
      [mealId]: count
    }))
  }

  const handleOrder = async () => {
    if (totalMealsSelected === 0) {
      setError("Please select at least one meal")
      return
    }

    if (totalMealsSelected > mealBalance) {
      setError(`You only have ${mealBalance} meals available. Please reduce your order.`)
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          selectedMeals,
          totalMeals: totalMealsSelected,
          menuItems: menu.items,
        }),
      })

      const data: OrderResponse = await response.json()
      console.log("Order response:", data)

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to place order")
      }

      setSuccess(data.message || "Order placed successfully!")
      
      // Reset selection
      setSelectedMeals({})
      
      // Refresh or redirect after success
      setTimeout(() => {
        router.push("/backend/dashboard")
        router.refresh()
      }, 3000)
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to place order. Please try again."
      setError(errorMessage)
      console.error("Order error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Transform menu items to match MenuDish interface
  const menuDishes: MenuDish[] = menu.items.map(transformToMenuDish)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>This Week&#39;s Menu</h1>
        <p>Select the meals you&#39;d like for this week</p>
        <div className={styles.balanceInfo}>
          <span className={styles.balance}>Available Meals: {mealBalance}</span>
          <span className={styles.selected}>Selected: {totalMealsSelected}</span>
          <span className={styles.remaining}>
            Remaining after order: {mealBalance - totalMealsSelected}
          </span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.menuGrid}>
        {menuDishes.map((dish: MenuDish) => (
          <MenuDishCard
            key={dish.id}
            dish={dish}
            quantity={selectedMeals[dish.id] || 0}
            onQuantityChange={handleMealChange}
          />
        ))}
      </div>

      <div className={styles.orderSummary}>
        <h3>Order Summary</h3>
        <div className={styles.summaryRow}>
          <span>Meals Selected:</span>
          <span>{totalMealsSelected}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Available Meals:</span>
          <span>{mealBalance}</span>
        </div>
        <div className={styles.summaryRow}>
          <strong>Remaining After Order:</strong>
          <strong>{mealBalance - totalMealsSelected}</strong>
        </div>
        
        <button 
          className={styles.orderButton}
          onClick={handleOrder}
          disabled={loading || totalMealsSelected === 0}
        >
          {loading ? "Confirming Order..." : `Confirm Order (${totalMealsSelected} meals)`}
        </button>
        
        <p className={styles.note}>
          Note: Your meals will be deducted from your purchased meal pack balance.
        </p>
      </div>
    </div>
  )
}
