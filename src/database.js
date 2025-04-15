const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./data/gamedb.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Create tables if they don't exist
    db.serialize(() => {
      // Users table for authentication
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE,
        )
      `);

      // User progress table to track completion and stars per level
      db.run(`
        CREATE TABLE IF NOT EXISTS user_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          level_number INTEGER NOT NULL,
          stars INTEGER DEFAULT 0,
          completed BOOLEAN DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, level_number)
        )
      `);
    });
  }
});

// Export the database connection
module.exports = db; 