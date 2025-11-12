// app/dashboard/layout.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth/auth"
import { redirect } from "next/navigation"
import DashboardSidebar from "../../../components/backend/dashboard/Sidebar"
import styles from "./dashboard.module.css"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("Dashboard layout rendering")
  
  const session = await getServerSession(authOptions)
  console.log("Session:", session)
  
  if (!session) {
    console.log("No session, redirecting to login")
    redirect("/login")
  }

  console.log("Rendering dashboard with sidebar")
  
  return (
    <div className={styles.container}>
      <DashboardSidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
