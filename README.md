
# 🎬 Movie Reservation System Backend

A Node.js + Express.js based backend API for managing a movie ticket reservation system. It includes authentication, movie listings, showtimes, reservations, and admin features.

---

## 📁 Project Structure

```
Movie-Reservation-System-Backend/
├── app.js
├── server.js
├── package.json
├── config/
│   └── config.env
├── database/
│   └── dbConnection.js
├── controllers/
├── middlewares/
├── models/
├── routes/
└── utils/
```

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- dotenv, cors, helmet

---

## 🚀 Getting Started

### 1. Clone or Extract

```bash
git clone <repo-url>
cd Movie-Reservation-System-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Edit `config/config.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### 4. Run Server

```bash
npm start
# or
npm run dev
```

---

## 🔐 Auth Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`

---

## 🎥 Movies

- `GET /api/movies`
- `POST /api/movies` (Admin)
- `GET /api/movies/:id`

---

## 🏢 Theaters & Showtimes

- `GET /api/theaters`
- `POST /api/showtimes` (Admin)
- `GET /api/showtimes/:id/seats`

---

## 🎫 Reservations

- `POST /api/reservations/`
- `GET /api/reservations/my-reservations`
- `PUT /api/reservations/:id/status`
- `PUT /api/reservations/:id/cancel`

---

## 👑 Admin

- `GET /api/admin/`
- `PATCH /api/admin/:id/status`
- `DELETE /api/admin/:id`
- `GET /api/reservations/analytics/overview`

---

