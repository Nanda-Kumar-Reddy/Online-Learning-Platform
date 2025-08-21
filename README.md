Setup Instructions

Follow the steps below to set up and run the project locally:

1. Clone the Repository
   git clone https://github.com/your-username/online-learning-platform.git
   cd online-learning-platform

2. Install Dependencies

Make sure you have Node.js (>=16) and npm/yarn installed.

npm install

# or

yarn install

3. Configure Environment Variables

Create a .env file in the root directory and set the following variables:

PORT=4000
JWT_SECRET=your_secret_key

# SQLite database file (auto-created if not exists)

DB_FILE=./database.sqlite

You can change the PORT or DB_FILE path as needed.

4. Initialize Database

The project automatically initializes tables if they don’t exist.
If you want to reset the database, delete the database.sqlite file and restart the server.

5. Run the Server
   npm run dev # development (nodemon)
   npm start # production

The API will be running at:
http://localhost:4000/api

6. API Documentation

Authentication (/api/auth/...)

Courses (/api/courses/...)

Enrollment (/api/courses/:id/enroll)

Reviews (/api/courses/:id/review)

Global Search (/api/search?q=...&type=...)

Use Postman or any API client to test the endpoints.
A sample Postman collection is included in docs/postman_collection.json.
