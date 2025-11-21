// components/dashboard/Sidebar.tsx
"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import styles from "./Sidebar.module.css"

export default function DashboardSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState({
    history: pathname.startsWith('/dashboard/history')
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Order Meals", href: "/dashboard/orders", icon: "🍽️" },
    { name: "Purchase Packs", href: "/dashboard/packs", icon: "📦" },
    {
      name: "History",
      href: "#",
      icon: "📋",
      isSection: true,
      isExpanded: expandedSections.history,
      onClick: () => toggleSection('history')
    },
    {
      name: "Order History",
      href: "/dashboard/history/orders",
      icon: "📝",
      isSubItem: true,
      isVisible: expandedSections.history
    },
    {
      name: "Purchase History",
      href: "/dashboard/history/purchases",
      icon: "💰",
      isSubItem: true,
      isVisible: expandedSections.history
    },
    { name: "Account", href: "/dashboard/account", icon: "👤" },
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.logo}>MealPack</h2>
        {session?.user && (
          <div className={styles.user}>
            <span className={styles.userName}>{session.user.name}</span>
            <span className={styles.userEmail}>{session.user.email}</span>
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        <ul className={styles.menu}>
          {menuItems.map((item, index) => {
            // Skip hidden sub-items
            if (item.isSubItem && !item.isVisible) return null
            
            return (
              <li 
                key={item.href + index} 
                className={`${styles.menuItem} ${
                  item.isSubItem ? styles.subMenuItem : ''
                }`}
              >
                {item.isSection ? (
                  <button
                    onClick={item.onClick}
                    className={`${styles.sectionButton} ${
                      pathname === item.href ? styles.active : ''
                    }`}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.text}>{item.name}</span>
                    <span className={`${styles.arrow} ${
                      item.isExpanded ? styles.arrowExpanded : ''
                    }`}>
                      ▼
                    </span>
                  </button>
                ) : (
                  <Link 
                    href={item.href}
                    className={`${styles.link} ${
                      pathname === item.href ? styles.active : ''
                    } ${
                      item.isSubItem ? styles.subLink : ''
                    }`}
                  >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.text}>{item.name}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={styles.footer}>
        <button onClick={handleSignOut} className={styles.signOutButton}>
          <span className={styles.icon}>🚪</span>
          <span className={styles.text}>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
