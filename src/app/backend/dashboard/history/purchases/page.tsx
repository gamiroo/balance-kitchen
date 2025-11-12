// app/dashboard/history/purchases/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../lib/auth/auth"
import { redirect } from "next/navigation"
import { db } from "../../../../../lib/database/client"
import styles from "./purchases.module.css"

// Define interface for database results
interface MealPackRow {
  id: string;
  user_id: string;
  pack_size: number;
  remaining_balance: number;
  purchase_date: Date;
  expiry_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  [key: string]: unknown;
}

async function getUserPurchases(userId: string): Promise<MealPackRow[]> {
  const result = await db.query<MealPackRow>(
    `SELECT * FROM meal_packs 
     WHERE user_id = $1 
     ORDER BY purchase_date DESC`,
    [userId]
  )
  return result.rows
}

export default async function PurchaseHistoryPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const purchases = await getUserPurchases(session.user.id)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Purchase History</h1>
        <p>View your meal pack purchases</p>
      </div>

      {purchases.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No purchases yet</h3>
          <p>You haven&#39;t purchased any meal packs yet.</p>
          <a href="/dashboard/packs" className={styles.linkButton}>
            Purchase Packs
          </a>
        </div>
      ) : (
        <div className={styles.purchasesList}>
          {purchases.map((pack: MealPackRow) => (
            <div key={pack.id} className={styles.packCard}>
              <div className={styles.packHeader}>
                <div>
                  <h3>{pack.pack_size} Meal Pack</h3>
                  <p className={styles.purchaseDate}>
                    Purchased: {new Date(pack.purchase_date).toLocaleDateString()}
                  </p>
                </div>
                <div className={styles.packStatus}>
                  {pack.is_active ? (
                    <span className={styles.activeStatus}>
                      Active ({pack.remaining_balance} meals left)
                    </span>
                  ) : (
                    <span className={styles.inactiveStatus}>
                      Expired/Used
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.packDetails}>
                <div className={styles.detailItem}>
                  <span>Total Meals:</span>
                  <span>{pack.pack_size}</span>
                </div>
                <div className={styles.detailItem}>
                  <span>Remaining:</span>
                  <span>{pack.remaining_balance}</span>
                </div>
                <div className={styles.detailItem}>
                  <span>Used:</span>
                  <span>{pack.pack_size - pack.remaining_balance}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
