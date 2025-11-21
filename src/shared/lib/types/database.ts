// lib/types/database.ts
export interface User {
  id: string
  email: string
  name: string
  password_hash?: string
  created_at: Date
}

export interface MealPack {
  id: string
  user_id: string
  pack_size: number
  remaining_balance: number
  purchase_date: Date
  expiry_date?: Date
  is_active: boolean
  created_at: Date
}

export interface Menu {
  id: string
  week_start_date: Date
  week_end_date: Date
  is_active: boolean
  created_at: Date
}

export interface MenuItem {
  id: string
  menu_id: string
  name: string
  description: string
  price: number
  category: string
  is_available: boolean
  created_at: Date
}

export interface Order {
  id: string
  user_id: string
  menu_id: string
  order_date: Date
  total_meals: number
  total_price: number
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  created_at: Date
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
}
