// scripts/seed-admin-data.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local file explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'Loaded' : 'Not found');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function seedData() {
  try {
    console.log('Seeding admin data...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment variables. Check your .env.local file.');
    }
    
    // Test connection first
    const client = await pool.connect();
    console.log('✅ Connected to database successfully');
    client.release();
    
    // Create admin user if not exists
    const adminEmail = 'admin@yourdomain.com';
    const adminPassword = 'Admin123!';
    
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    await pool.query(`
      INSERT INTO users (id, name, email, password_hash, role, is_active)
      VALUES (
        gen_random_uuid(),
        'Admin User',
        $1,
        $2,
        'admin',
        true
      )
      ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        is_active = true
    `, [adminEmail, hashedPassword]);
    
    console.log('Admin user created/updated');
    
    // Get admin user ID for foreign key references
    const adminResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2',
      [adminEmail, 'admin']
    );
    
    if (adminResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    
    const adminId = adminResult.rows[0].id;
    
    // Create sample meal pack templates
    await pool.query(`
      INSERT INTO meal_pack_templates (id, name, size, price, description, is_active)
      VALUES 
        (gen_random_uuid(), 'Small Pack', 5, 25.99, 'Perfect for individuals', true),
        (gen_random_uuid(), 'Medium Pack', 10, 45.99, 'Great for couples', true),
        (gen_random_uuid(), 'Large Pack', 20, 85.99, 'Family-sized meals', true),
        (gen_random_uuid(), 'Family Pack', 30, 119.99, 'Large family meals', false)
      ON CONFLICT DO NOTHING
    `);
    
    console.log('Meal pack templates created');
    
    // Create sample menu
    const menuResult = await pool.query(`
      INSERT INTO menus (id, week_start_date, week_end_date, is_published, created_by)
      VALUES (
        gen_random_uuid(),
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '6 days',
        true,
        $1
      )
      RETURNING id
    `, [adminId]);
    
    const menuId = menuResult.rows[0].id;
    console.log('Sample menu created with ID:', menuId);
    
    // Create sample menu items
    await pool.query(`
      INSERT INTO menu_items (id, menu_id, name, description, price, category, is_available, created_by)
      VALUES 
        (gen_random_uuid(), $1, 'Grilled Salmon', 'Fresh salmon with herbs', 15.99, 'Main Course', true, $2),
        (gen_random_uuid(), $1, 'Caesar Salad', 'Classic Caesar with parmesan', 9.99, 'Salad', true, $2),
        (gen_random_uuid(), $1, 'Chicken Alfredo', 'Creamy pasta with grilled chicken', 13.99, 'Main Course', true, $2)
      ON CONFLICT DO NOTHING
    `, [menuId, adminId]);
    
    console.log('Sample menu items created');
    
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding
seedData();
