// app/dashboard/history/orders/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth/auth"
import { redirect } from "next/navigation"
import { db } from "../../../../../lib/database/client"
import styles from "./orders.module.css"

// Define interfaces for database results
interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  created_at: Date;
  updated_at: Date;
  [key: string]: unknown;
}

interface OrderRow {
  id: string;
  user_id: string;
  menu_id: string;
  order_date: Date;
  total_meals: number;
  total_price: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  order_items: OrderItemRow[];
  [key: string]: unknown;
}

async function getUserOrders(userId: string): Promise<OrderRow[]> {
  const result = await db.query<OrderRow & { order_items: OrderItemRow[] }>(
    `SELECT o.*, 
            json_agg(oi.*) as order_items
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.order_date DESC`,
    [userId]
  )
  return result.rows
}

export default async function OrderHistoryPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const orders = await getUserOrders(session.user.id)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Order History</h1>
        <p>View your past meal orders</p>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No orders yet</h3>
          <p>You haven&#39;t placed any orders yet.</p>
          <a href="/dashboard/order" className={styles.linkButton}>
            Order Meals
          </a>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order: OrderRow) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <h3>Order #{order.id.slice(0, 8)}</h3>
                  <p className={styles.orderDate}>
                    {new Date(order.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div className={styles.orderStatus}>
                  <span className={`${styles.status} ${styles[order.status as keyof typeof styles]}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className={styles.orderDetails}>
                <p><strong>Meals:</strong> {order.total_meals}</p>
                <p><strong>Status:</strong> {order.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
