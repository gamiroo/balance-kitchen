// scripts/populate-menu-items.ts
import { Pool } from 'pg'
import { config } from 'dotenv'
import { dishData } from '../src/data/dishData'

// Use the same connection logic as your main app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
}

config({ path: '.env.local' })
async function populateMenuItems() {
  try {
    console.log('Starting to populate menu items...')
    console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'Not found')
    const testResult = await db.query('SELECT NOW()')
    console.log('Database connection successful:', testResult.rows[0])
    
    // First, make sure we have a menu
    const menuResult = await db.query(
      `INSERT INTO menus (id, week_start_date, week_end_date, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET is_active = $4
       RETURNING id`,
      ['123e4567-e89b-12d3-a456-426614174000', '2024-01-15', '2024-01-21', true]
    )
    
    console.log('Menu ensured:', menuResult.rows[0])
    
    // Clear existing menu items for this menu (optional)
    await db.query(
      'DELETE FROM menu_items WHERE menu_id = $1',
      [menuResult.rows[0].id]
    )
    
    // Insert all dishes as menu items
    let count = 0
    for (const dish of dishData) {
      const result = await db.query(
        `INSERT INTO menu_items (id, menu_id, name, description, price, category, is_available)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = $3,
           description = $4,
           price = $5,
           category = $6,
           is_available = $7
         RETURNING id`,
        [
          dish.id, // This will be 'c1', 'c2', etc.
          menuResult.rows[0].id,
          dish.name,
          dish.description,
          0, // Price is 0 since it's pre-paid
          dish.category,
          true // is_available
        ]
      )
      
      console.log(`Inserted/Updated dish: ${dish.name} (${result.rows[0].id})`)
      count++
    }
    
    console.log('Successfully populated menu items!')
    console.log(`Total dishes processed: ${count}`)
    
    // Close the pool
    await pool.end()
    
  } catch (error) {
    console.error('Error populating menu items:', error)
  }
}

// Make sure environment variables are loaded


// Run the function
populateMenuItems()
