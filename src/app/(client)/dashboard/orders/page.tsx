// app/dashboard/order/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { redirect } from "next/navigation"
import { db } from "@/shared/lib/database/client"
import OrderMealsClient from "./OrderMealsClient"
import { getCurrentMenu } from "@/shared/lib/services/menuService"

async function getUserMealBalance(userId: string) {
  const result = await db.query(
    `SELECT COALESCE(SUM(remaining_balance), 0) as total_meals
     FROM meal_packs 
     WHERE user_id = $1 AND is_active = true AND remaining_balance > 0`,
    [userId]
  )
  return parseInt(result.rows[0]?.total_meals || '0')
}

export default async function OrderMealsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const mealBalance = await getUserMealBalance(session.user.id)
  const menu = getCurrentMenu()

  return (
    <OrderMealsClient 
      userId={session.user.id}
      mealBalance={mealBalance}
      menu={menu}
    />
  )
}
