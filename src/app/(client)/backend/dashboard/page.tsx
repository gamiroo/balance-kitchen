// app/backend/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import MealBalance from "./components/MealBalance"
import styles from "./page.module.css"

export default function DashboardPage() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Trigger entrance animation after component mounts
    const timer = setTimeout(() => {
      setShow(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  console.log("Dashboard page rendering")
  return (
    <div className={styles.dashboard}>
      
      <div className={`${styles.header} ${show ? styles.show : ''}`}>
        <h1>Dashboard</h1>
        <p>Welcome to your meal pack dashboard</p>
      </div>
      
      <div className={styles.stats}>
        <div className={`${styles.statCard} ${show ? styles.show : ''}`}>
          <MealBalance />
        </div>
        
        <div className={`${styles.statCard} ${show ? styles.show : ''}`}>
          <h3>This Week&#39;s Order</h3>
          <p className={styles.statNumber}>0</p>
          <p className={styles.statLabel}>Meals ordered</p>
        </div>
      </div>
      
      <div className={styles.actions}>
        <button className={`${styles.primaryButton} ${show ? styles.show : ''}`}>
          Order Meals
        </button>
        <button className={`${styles.secondaryButton} ${show ? styles.show : ''}`}>
          Purchase Pack
        </button>
      </div>
    </div>
  )
}
