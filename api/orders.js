import { neon } from '@neondatabase/serverless';

// Initialize the Neon SQL client using your environment variable
const sql = neon(process.env.DATABASE_URL);

/**
 * SCHEMA INITIALIZATION
 * This ensures your 'orders' table exists in your Neon DB.
 */
async function ensureTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT NOT NULL,
        items JSONB NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        printed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (err) {
    console.error('Database Schema Error:', err);
  }
}

export default async function handler(req, res) {
  // Ensure the table is ready
  await ensureTableExists();

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Fetch orders from the last 24 hours to keep the UI snappy
        const orders = await sql`
          SELECT * FROM orders 
          WHERE created_at > NOW() - INTERVAL '24 hours' 
          ORDER BY created_at DESC
        `;
        return res.status(200).json(orders);

      case 'POST':
        const { orderNumber, items, totalAmount } = req.body;
        if (!orderNumber || !items) {
          return res.status(400).json({ error: 'Missing order details' });
        }
        
        // Insert order into Neon Cloud DB
        const [newOrder] = await sql`
          INSERT INTO orders (order_number, items, total_amount, status) 
          VALUES (${orderNumber.toString()}, ${JSON.stringify(items)}, ${totalAmount || 0}, 'PENDING') 
          RETURNING *
        `;
        return res.status(201).json(newOrder);

      case 'PUT':
        const { id, status, printed } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing ID' });

        let updatedOrder;
        // Construct update query based on provided fields
        if (status !== undefined && printed !== undefined) {
          [updatedOrder] = await sql`UPDATE orders SET status = ${status}, printed = ${printed} WHERE id = ${id} RETURNING *`;
        } else if (status !== undefined) {
          [updatedOrder] = await sql`UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *`;
        } else if (printed !== undefined) {
          [updatedOrder] = await sql`UPDATE orders SET printed = ${printed} WHERE id = ${id} RETURNING *`;
        }

        if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });
        return res.status(200).json(updatedOrder);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Neon DB Cloud Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}