# 🌤️ WeatherIO - Weather Forecast Web Application

**WeatherIO** is a full-stack weather forecasting web app that allows users to view daily and weekly weather information, manage their profiles, and access an admin panel for manual data input and user management.

## ✨ Features

- 📅 Current and 7-day weather forecast using OpenWeather API
- 🔐 Secure user authentication (Passport.js + bcrypt)
- 📁 MongoDB Atlas for storing users, weather logs, and settings
- 🛠️ Admin dashboard:
  - Add/edit/delete weather records manually
  - View and manage registered users
- 📊 Interactive weather charts (Chart.js)
- 🎨 Clean UI with EJS templates and Bootstrap 5

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS, Bootstrap
- **Database**: MongoDB Atlas with Mongoose
- **Authentication**: Passport.js (Local Strategy)
- **Security**: bcryptjs, express-session
- **API**: OpenWeatherMap API
- **Charts**: Chart.js

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/weather_web_app.git
cd weather_web_app
```

### 2. Install Dependencies

npm install

### 3. Create .env File

In the root directory, create a .env file and add the following:
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/weatherDB
SESSION_SECRET=your_session_secret
API_KEY=your_openweather_api_key

### 3. Start the Server

npm start 
or
npm run dev

App will run on: http://localhost:5000

🌍 Live Demo

🔗 https://weatherio-ffmo.onrender.com/)

📁 Project Structure

```
weather_web_app/
├── config/             # Passport configuration
├── middleware/         # 
├── models/             # Mongoose models
├── public/             # Static files (CSS, JS)
├── routes/             # Express route files
├── services/           # API calls
├── tests/              # Tests
├── views/              # EJS view templates
├── app.js              # Main application file
├── .env                # Environment variables (DO NOT push this)
└── README.md
```

🔐 Security Notes
Do not commit .env files — sensitive keys must be kept private.

Use process.env to securely access API keys and secrets.

Passwords are hashed with bcrypt and login attempts are limited to prevent brute-force.

📄 License
This project is licensed under the MIT License.




