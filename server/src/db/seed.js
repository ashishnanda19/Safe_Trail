import bcrypt from 'bcrypt';
import { db } from '../config/db.js';

const seed = async () => {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // Insert seed users
  await db.query(`
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES
      ('Alice Johnson', 'alice@example.com', '+1234567890', $1, 'user'),
      ('Bob Smith', 'bob@example.com', '+1234567891', $1, 'volunteer'),
      ('Carol Admin', 'carol@example.com', '+1234567892', $1, 'admin')
    ON CONFLICT (email) DO NOTHING
  `, [passwordHash]);

  // Get user IDs
  const usersResult = await db.query(
    `SELECT id, name, email FROM users WHERE email IN ('alice@example.com', 'bob@example.com')`
  );
  const alice = usersResult.rows.find(u => u.email === 'alice@example.com');
  const bob = usersResult.rows.find(u => u.email === 'bob@example.com');

  if (alice && bob) {
    // Make Bob a guardian of Alice
    await db.query(`
      INSERT INTO guardian_circles (user_id, guardian_id, status)
      VALUES ($1, $2, 'accepted')
      ON CONFLICT (user_id, guardian_id) DO NOTHING
    `, [alice.id, bob.id]);

    // Seed a sample incident
    await db.query(`
      INSERT INTO incidents (reported_by, location, category, description, occurred_at)
      VALUES (
        $1,
        ST_SetSRID(ST_MakePoint(-73.935242, 40.730610), 4326),
        'unsafe_area',
        'Poorly lit area with frequent suspicious activity late at night.',
        NOW() - INTERVAL '2 days'
      )
    `, [alice.id]);
  }

  console.log('✅ Seed complete. Users: alice@example.com, bob@example.com, carol@example.com (password: password123)');
  await db.end();
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
