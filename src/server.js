const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const bcrypt = require('bcrypt');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const HTTPS_PORT = 443;

// Middleware
app.use(cors()); // Allow Unity to access API
app.use(bodyParser.json()); // Parse JSON requests

// 1. Register a new user
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  
  // Basic input validation
  if (!username || !password || !email) {
    const errorMsg = 'Please fill all fields';
    return res.status(400).json({ error: errorMsg });
  }
  
  // Hash the password
  bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
    if (hashErr) {
      return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
    
    // Check if username already exists
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Server error. Please try again later.' });
      }
      
      if (user) {
        const errorMsg = 'Username already exists';
        return res.status(400).json({ error: errorMsg });
      }
      
      // Check if email already exists
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, emailUser) => {
        if (err) {
          return res.status(500).json({ error: 'Server error. Please try again later.' });
        }
        
        if (emailUser) {
          const errorMsg = 'Email already registered';
          return res.status(400).json({ error: errorMsg });
        }
        
        // If all validations pass, insert the new user with hashed password
        const sql = `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`;
        
        db.run(sql, [username, hashedPassword, email], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Registration failed. Please try again later.' });
          }
          
          // Create response data
          const responseData = { id: this.lastID, username, email };
          res.json(responseData);
        });
      });
    });
  });
});

// 2. Login user
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Input validation
  if (!username || !password) {
    const errorMsg = 'Please enter username and password';
    return res.status(400).json({ error: errorMsg });
  }
  
  // Get user with hashed password
  const sql = `SELECT id, username, email, password FROM users WHERE username = ?`;
  
  db.get(sql, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Server error. Please try again.' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Compare submitted password with stored hash
    bcrypt.compare(password, user.password, (compareErr, isMatch) => {
      if (compareErr) {
        return res.status(500).json({ error: 'Server error. Please try again.' });
      }
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Password matches - send user data without password
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email
      };
      
      res.json(userData);
    });
  });
});

// 3. Get user data
app.get('/user/:id', (req, res) => {
  const sql = `SELECT id, username, email FROM users WHERE id = ?`;
  
  db.get(sql, [req.params.id], (err, user) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// 4. Get user progress
app.get('/progress/:userId', (req, res) => {
  const sql = `SELECT level_number, stars, completed FROM user_progress WHERE user_id = ?`;
  
  db.all(sql, [req.params.userId], (err, progress) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(progress);
  });
});

// 5. Save/update level progress
app.post('/save-progress', (req, res) => {
  const { user_id, level_number, stars } = req.body;
  
  // First check if progress exists and get current stars
  db.get(
    `SELECT stars FROM user_progress WHERE user_id = ? AND level_number = ?`,
    [user_id, level_number],
    (err, row) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (row) {
        // Progress exists, only update if new stars are greater
        if (stars > row.stars) {
          db.run(
            `UPDATE user_progress SET stars = ?, completed = 1 WHERE user_id = ? AND level_number = ?`,
            [stars, user_id, level_number],
            function(err) {
              if (err) {
                return res.status(400).json({ error: err.message });
              }
              res.json({ message: 'Progress updated with higher score' });
            }
          );
        } else {
          res.json({ message: 'Existing score is higher, no changes made' });
        }
      } else {
        // No progress exists, create new record
        db.run(
          `INSERT INTO user_progress (user_id, level_number, stars, completed) VALUES (?, ?, ?, 1)`,
          [user_id, level_number, stars],
          function(err) {
            if (err) {
              return res.status(400).json({ error: err.message });
            }
            res.json({ message: 'New progress saved successfully' });
          }
        );
      }
    }
  );
});

// 6. Delete user
app.delete('/user/:id', (req, res) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Delete user progress first (due to foreign key constraint)
    db.run(`DELETE FROM user_progress WHERE user_id = ?`, [req.params.id], (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: err.message });
      }
      
      // Then delete the user
      db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: err.message });
        }
        
        db.run('COMMIT');
        res.json({ message: 'User deleted' });
      });
    });
  });
});

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// HTTPS Setup for localhost
try {
  // Path to the certificate files (expects them to be in a 'certs' folder in the project root)
  const certPath = path.join(__dirname, '..', 'certs');
  
  // Check if certificate files exist
  const certFiles = {
    key: path.join(certPath, 'localhost-key.pem'),
    cert: path.join(certPath, 'localhost.pem')
  };
  
  if (fs.existsSync(certFiles.key) && fs.existsSync(certFiles.cert)) {
    const httpsOptions = {
      key: fs.readFileSync(certFiles.key),
      cert: fs.readFileSync(certFiles.cert)
    };
    
    // Create HTTPS server
    https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
      console.log(`HTTPS server running on https://localhost:${HTTPS_PORT}`);
    });
    
    console.log('HTTPS server started successfully');
  } else {
    console.log('SSL certificate files not found. Starting HTTP server only.');
    console.log(`Expected certificate files at: ${certPath}`);
    console.log('Generate certificates using mkcert (run: mkcert localhost)');
  }
} catch (error) {
  console.error('Error starting HTTPS server:', error.message);
}

// Start HTTP server (for backward compatibility)
app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
}); 