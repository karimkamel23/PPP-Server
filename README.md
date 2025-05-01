# PPP-Server

A secure and robust backend server for the PPP (Peter's Protection Prusuit) game, built with Node.js and Express. This server handles user authentication, game progress tracking, and provides a secure HTTPS API for the game client. The server is designed to work seamlessly with the Unity-based game client, providing a reliable and secure backend infrastructure for player data management and game state persistence.

## Game Repository

The game client repository can be found at: [PPP-Game Repository](https://github.com/karimkamel23/Peter-s-Protection-Pursuit)

## Features

- User registration and authentication with secure password storage
- Secure password hashing using bcrypt with salt rounds
- Comprehensive game progress tracking and saving system
- HTTPS support for secure communication between client and server
- SQLite database for efficient data persistence and retrieval
- CORS enabled for Unity client integration
- Input validation and sanitization for all API endpoints
- Transaction support for critical database operations
- Error handling and logging for debugging and monitoring

## Dependencies

The project uses the following third-party packages:

- **express** (^5.1.0): Web framework for Node.js
- **bcrypt** (^5.1.1): Password hashing library
- **body-parser** (^2.2.0): Middleware for parsing request bodies
- **cors** (^2.8.5): Middleware for enabling CORS
- **sqlite3** (^5.1.7): SQLite database driver
- **https** (^1.0.0): HTTPS server implementation
- **fs** (^0.0.1-security): File system operations
- **path** (^0.12.7): Path manipulation utilities

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- mkcert (for local HTTPS development)
- Git (for version control)
- SQLite3 (for database management)

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd PPP-Server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up SSL certificates for local development:
   ```bash
   # Install mkcert if you haven't already
   # Windows: choco install mkcert
   # macOS: brew install mkcert
   
   # Generate certificates
   mkcert localhost
   # Move the generated certificates to the certs folder
   mkdir certs
   mv localhost-key.pem certs/
   mv localhost.pem certs/
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. For production:
   ```bash
   npm start
   ```

## API Endpoints

- `POST /register`: Register a new user with username, password, and email
- `POST /login`: Authenticate user and return session data
- `GET /user/:id`: Retrieve user profile information
- `GET /progress/:userId`: Get user's game progress and achievements
- `POST /save-progress`: Save or update level progress and scores
- `DELETE /user/:id`: Delete user account and associated data

## Security Features

- Password hashing with bcrypt and salt
- HTTPS support for encrypted communication
- Input validation and sanitization
- SQL injection prevention
- CORS configuration for client security
- Error handling and logging
- Transaction support for data integrity

## Development

The server runs on port 3000 for HTTP and port 443 for HTTPS in development mode. For production, make sure to configure the appropriate ports and SSL certificates. The development environment includes hot-reloading for faster development cycles.

## Database Schema

The server uses SQLite with the following main tables:
- `users`: Stores user account information
- `user_progress`: Tracks game progress and achievements

## License

ISC License