const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./weapons.db');

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    category TEXT,
    image TEXT
  )`);

  // Insert sample data (only run once)
  db.run(`INSERT INTO products (name, description, price, category, image) VALUES 
    ('Desert Eagle .50 AE', 'Iconic semi-automatic pistol', 1999.99, 'pistol', 'deagle.jpg'),
    ('AK-47 Assault Rifle', 'Reliable 7.62×39mm assault rifle', 899.99, 'rifle', 'ak47.jpg')
  `);
});

module.exports = db;