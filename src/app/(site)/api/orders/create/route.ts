// app/api/orders/create/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/lib/auth/auth"
import { db } from "@/shared/lib/database/client"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'
import { AuditLogger } from '@/shared/lib/logging/audit-logger'

// Define interfaces for database results
interface Dish {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  [key: string]: unknown;
}

interface OrderRequest {
  userId: string;
  selectedMeals: Record<string, number>;
  totalMeals: number;
  menuItems: Dish[];
}

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      logger.warn('Unauthorized order creation attempt - no session')
      AuditLogger.logFailedAction(
        undefined,
        'CREATE_ORDER',
        'orders',
        'UNAUTHORIZED'
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }

    const { userId, selectedMeals, totalMeals, menuItems }: OrderRequest = await request.json()
    
    logger.info('Order creation initiated', { 
      userId: session.user.id,
      userEmail: session.user.email 
    })

    // Verify the user is ordering for themselves
    if (session.user.id !== userId) {
      logger.warn('Unauthorized order creation attempt - user mismatch', { 
        sessionUserId: session.user.id,
        requestUserId: userId 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'CREATE_ORDER',
        'orders',
        'USER_MISMATCH',
        { requestUserId: userId }
      )
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 })
    }

    // Validate input
    if (!selectedMeals || totalMeals <= 0) {
      logger.warn('Order creation failed - invalid input', { 
        userId: session.user.id,
        hasSelectedMeals: !!selectedMeals,
        totalMeals 
      })
      return NextResponse.json({ 
        success: false,
        error: "Please select at least one meal" 
      }, { status: 400 })
    }

    logger.debug('Order request data validated', { 
      userId, 
      totalMeals, 
      selectedMealsCount: Object.keys(selectedMeals).length 
    })

    // Check user's meal balance
    logger.debug('Checking user meal balance', { userId })
    const balanceResult = await db.query<{ total_meals: string }>(
      `SELECT COALESCE(SUM(remaining_balance), 0) as total_meals
       FROM meal_packs 
       WHERE user_id = $1 AND is_active = true AND remaining_balance > 0`,
      [userId]
    )
    
    const availableMeals = parseInt(balanceResult.rows[0]?.total_meals || '0')
    logger.debug('User meal balance retrieved', { userId, availableMeals })
    
    if (totalMeals > availableMeals) {
      logger.info('Order creation failed - insufficient balance', { 
        userId, 
        requested: totalMeals, 
        available: availableMeals 
      })
      AuditLogger.logFailedAction(
        session.user.id,
        'CREATE_ORDER',
        'orders',
        'INSUFFICIENT_BALANCE',
        { requested: totalMeals, available: availableMeals }
      )
      return NextResponse.json({ 
        success: false,
        error: `You only have ${availableMeals} meals available. Please reduce your order.` 
      }, { status: 400 })
    }

    // Deduct meals from packs (oldest first)
    logger.debug('Fetching user meal packs for deduction', { userId })
    const packsResult = await db.query<{ id: string; remaining_balance: number }>(
      `SELECT id, remaining_balance 
       FROM meal_packs 
       WHERE user_id = $1 AND is_active = true AND remaining_balance > 0
       ORDER BY purchase_date ASC`,
      [userId]
    )

    logger.debug('User meal packs retrieved', { 
      userId, 
      packCount: packsResult.rows.length 
    })

    let mealsToDeduct = totalMeals
    const updates = []

    for (const pack of packsResult.rows) {
      if (mealsToDeduct <= 0) break
      
      const deductAmount = Math.min(mealsToDeduct, pack.remaining_balance)
      const newBalance = pack.remaining_balance - deductAmount
      
      logger.debug('Preparing meal deduction', { 
        packId: pack.id,
        oldBalance: pack.remaining_balance,
        deductAmount,
        newBalance 
      })
      
      updates.push(
        db.query(
          'UPDATE meal_packs SET remaining_balance = $1 WHERE id = $2',
          [newBalance, pack.id]
        )
      )
      
      mealsToDeduct -= deductAmount
    }

    // Execute all updates
    logger.info('Executing meal pack balance updates', { 
      userId, 
      updateCount: updates.length 
    })
    await Promise.all(updates)

    // Create order record
    logger.debug('Creating order record', { userId, totalMeals })
    const orderResult = await db.query<OrderRow>(
      `INSERT INTO orders (user_id, menu_id, order_date, total_meals, total_price, status)
       VALUES ($1, $2, NOW(), $3, 0, 'confirmed')
       RETURNING *`,
      [userId, '123e4567-e89b-12d3-a456-426614174000', totalMeals]
    )

    const orderId = orderResult.rows[0].id
    logger.info('Order record created successfully', { 
      userId, 
      orderId, 
      totalMeals 
    })

    // Create order items records
    const orderItems: OrderItemRow[] = []
    
    logger.debug('Creating order items', { 
      orderId, 
      mealItemCount: Object.keys(selectedMeals).length 
    })
    
    for (const [mealId, quantityValue] of Object.entries(selectedMeals)) {
      const quantity = Number(quantityValue)
      if (quantity > 0) {
        const menuItem = menuItems.find((item: Dish) => item.id === mealId)
        if (menuItem) {
          logger.debug('Creating order item', { 
            orderId, 
            mealId, 
            quantity 
          })
          const itemResult = await db.query<OrderItemRow>(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, price)
             VALUES ($1, $2, $3, 0)
             RETURNING *`,
            [orderId, mealId, quantity]
          )
          orderItems.push(itemResult.rows[0])
        }
      }
    }

    logger.info('Order items created successfully', { 
      orderId, 
      itemCount: orderItems.length 
    })

    const successData: OrderResponse = { 
      success: true, 
      orderId: orderId,
      mealsRemaining: availableMeals - totalMeals,
      message: `Order confirmed! ${totalMeals} meals have been deducted from your balance.`
    }
    
    logger.info('Order creation completed successfully', { 
      userId: session.user.id,
      orderId,
      totalMeals,
      mealsRemaining: availableMeals - totalMeals
    })
    
    AuditLogger.logUserAction(
      session.user.id,
      'CREATE_ORDER',
      'orders',
      { 
        orderId,
        totalMeals,
        mealsRemaining: availableMeals - totalMeals
      }
    )
    
    return NextResponse.json(successData)
    
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'create_order',
      endpoint: '/api/orders/create',
      method: 'POST',
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    logger.error('Order creation failed with system error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: (await getServerSession(authOptions))?.user?.id
    })
    
    // Return more detailed error for debugging
    const errorResponse: OrderResponse = {
      success: false,
      error: "Failed to process order. Please try again.",
      details: error instanceof Error ? error.message : "Unknown error"
    }
    
    return NextResponse.json(
      errorResponse,
      { status: 500 }
    )
  }
}
