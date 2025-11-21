// app/dashboard/packs/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { redirect } from "next/navigation"
import PurchasePacksClient from "./PurchasePacksClient"

export default async function PurchasePacksPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  return <PurchasePacksClient userId={session.user.id} />
}
