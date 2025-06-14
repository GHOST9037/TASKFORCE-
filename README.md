# Smart Production Cost Calculator

A comprehensive web application for calculating and analyzing production costs with AI-powered insights and visualizations.

## Features

- User authentication with role-based access (Admin/User)
- Cost calculation for raw materials, labor, and overheads
- Interactive charts and visualizations
- Cost template management
- Report generation (PDF/Excel)
- Historical calculation tracking
- Mobile-responsive design

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: MongoDB
- Visualization: Chart.js
- Authentication: Firebase Auth
- Hosting: Firebase

## Project Structure

```
smart-cost-calculator/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── .gitignore
└── README.md
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```
3. Set up environment variables:
   - Create `.env` file in server directory
   - Add MongoDB connection string and other configurations

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm start
   ```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_API_KEY=your_firebase_api_key
```

## License

MIT 