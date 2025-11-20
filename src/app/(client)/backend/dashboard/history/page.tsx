// app/dashboard/history/page.tsx
import { redirect } from "next/navigation"

export default function HistoryPage() {
  // Redirect to orders by default
  redirect("/dashboard/history/orders")
}
