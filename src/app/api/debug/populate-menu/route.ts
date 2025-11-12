// app/api/debug/populate-menu/route.ts
import { NextResponse } from "next/server"
import { db } from "../../../../lib/database/client"
import { dishData } from "../../../../data/dishData"

interface DishError {
  dishId: string;
  error: string;
}

interface MenuResult {
  id: string;
}

interface InsertResult {
  id: string;
}

// POST /api/debug/populate-menu
export async function POST() {
  try {
    console.log('Starting to populate menu items...')
    console.log('Database connection test...')
    
    // Test database connection first
    const testResult = await db.query('SELECT NOW() as now')
    console.log('Database connection successful:', testResult.rows[0])
    
    // First, make sure we have a menu
    console.log('Creating/Updating menu...')
    const menuResult = await db.query<MenuResult>(
      `INSERT INTO menus (id, week_start_date, week_end_date, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET is_active = $4
       RETURNING id`,
      ['123e4567-e89b-12d3-a456-426614174000', '2024-01-15', '2024-01-21', true]
    )
    
    console.log('Menu ensured:', menuResult.rows[0])
    
    // Clear existing menu items for this menu (optional)
    console.log('Clearing existing menu items...')
    await db.query(
      'DELETE FROM menu_items WHERE menu_id = $1',
      [menuResult.rows[0].id]
    )
    
    // Insert all dishes as menu items
    console.log('Inserting menu items...')
    let count = 0
    const errors: DishError[] = []
    
    for (const dish of dishData) {
      try {
        const result = await db.query<InsertResult>(
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
            dish.id,
            menuResult.rows[0].id,
            dish.name,
            dish.description,
            0,
            dish.category,
            true
          ]
        )
        
        console.log(`Inserted/Updated dish: ${dish.name} (${result.rows[0].id})`)
        count++
      } catch (dishError: unknown) {
        console.error(`Error inserting dish ${dish.id}:`, dishError)
        errors.push({ 
          dishId: dish.id, 
          error: dishError instanceof Error ? dishError.message : 'Unknown error' 
        })
      }
    }
    
    console.log(`Successfully processed ${count} menu items!`)
    
    if (errors.length > 0) {
      console.log('Errors encountered:', errors)
      return NextResponse.json({
        success: true,
        message: `Processed ${count} menu items with ${errors.length} errors`,
        errors: errors
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully populated ${count} menu items!`
    })
    
  } catch (error: unknown) {
    console.error('Error populating menu items:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to populate menu items",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
