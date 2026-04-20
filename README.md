# 🎭 Costume Rental Platform

A full-stack costume rental web application with a **Node.js/Express REST API** backend and a **Next.js** frontend. Users can browse costumes, make reservations, submit payments, and leave reviews — while admins manage inventory, payments, and users.

---

## 📁 Project Structure

```
costume-rental-platform/
├── src/                    # Express + TypeScript backend
│   ├── app.ts              # Express app setup (middleware, routes)
│   ├── server.ts           # HTTP server entry point
│   ├── config/             # Environment config, OAuth setup
│   ├── controllers/        # Route handler logic
│   ├── dto/                # Data Transfer Objects / validation schemas
│   ├── helpers/            # Reusable utility helpers
│   ├── middleware/         # Auth, admin, error middleware
│   ├── models/             # Sequelize ORM models
│   ├── routes/             # Express routers
│   ├── services/           # Business logic layer
│   ├── types/              # TypeScript type declarations
│   └── utils/              # Standalone utility functions
├── next-frontend/          # Next.js frontend application
├── migrations/             # Sequelize database migrations
├── uploads/                # Uploaded costume image files
├── postman/                # Postman collection for API testing
├── .env.sample             # Environment variable template
├── sequelize-config.js     # Sequelize CLI configuration
└── tsconfig.json           # TypeScript compiler options
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MySQL** (or compatible) database
- A Google Cloud project with OAuth 2.0 credentials *(for Google login)*
- A Gmail account with an App Password *(for email notifications)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/malunes0418/costume-rental-platform.git
cd costume-rental-platform
```

---

### 2. Configure Environment Variables

Copy the sample env file and fill in your values:

```bash
cp .env.sample .env
```

| Variable | Description |
|---|---|
| `PORT` | Port the API server listens on (default: `3000`) |
| `DB_HOST` | MySQL host (default: `localhost`) |
| `DB_PORT` | MySQL port (default: `3306`) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `JWT_SECRET` | Secret key for signing JWTs |
| `SESSION_SECRET` | Secret key for express-session |
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret |
| `OAUTH_GOOGLE_CALLBACK_URL` | Google OAuth callback URL |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g. `587`) |
| `EMAIL_USER` | Sender email address |
| `EMAIL_PASSWORD` | Email app password |
| `FRONTEND_BASE_URL` | Frontend origin for CORS (e.g. `http://localhost:3001`) |
| `FILE_UPLOAD_DIR` | Directory for uploaded files (default: `uploads`) |

---

### 3. Install Dependencies

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd next-frontend
npm install
```

---

### 4. Run Database Migrations

```bash
npm run migrate
```

To roll back all migrations:
```bash
npm run migrate:undo:all
```

---

### 5. Start the Development Servers

**Backend** (runs on `http://localhost:3000`):
```bash
npm run dev
```

**Frontend** (runs on `http://localhost:3001`):
```bash
cd next-frontend
npm run dev
```

---

## 🛠️ Available Scripts (Backend)

| Script | Description |
|---|---|
| `npm run dev` | Start backend with hot-reload via `ts-node-dev` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled production build |
| `npm run migrate` | Run pending Sequelize migrations |
| `npm run migrate:undo` | Undo the last migration |
| `npm run migrate:undo:all` | Undo all migrations |

---

## 🌐 API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Login with email & password |
| `GET` | `/me` | JWT | Get the current authenticated user |
| `GET` | `/google` | Public | Initiate Google OAuth login |
| `GET` | `/google/callback` | Public | Google OAuth callback |

### Costumes — `/api/costumes` *(Public)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all costumes |
| `GET` | `/:id` | Get costume details |
| `GET` | `/:id/availability` | Check availability for a date range |

### Reservations — `/api/reservations` *(JWT Required)*

| Method | Path | Description |
|---|---|---|
| `POST` | `/cart` | Add a costume to the cart |
| `POST` | `/checkout` | Checkout and create a reservation |
| `GET` | `/my` | List the current user's reservations |

### Payments — `/api/payments` *(JWT Required)*

| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Submit a payment for a reservation |

### Reviews — `/api/reviews` *(Public browse, JWT to post)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List reviews |
| `POST` | `/` | Submit a review |

### Wishlist — `/api/wishlist` *(JWT Required)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get wishlist items |
| `POST` | `/` | Add item to wishlist |
| `DELETE` | `/:id` | Remove item from wishlist |

### Notifications — `/api/notifications` *(JWT Required)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get user notifications |
| `PATCH` | `/:id/read` | Mark a notification as read |

### Admin — `/api/admin` *(JWT + Admin Role Required)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/reservations` | List all reservations |
| `GET` | `/payments` | List all payments |
| `GET` | `/inventory` | List inventory |
| `GET` | `/users` | List all users |
| `POST` | `/payments/review` | Approve or reject a payment |
| `GET` | `/vendors/pending` | List pending vendor applications |
| `POST` | `/vendors/:userId/approve` | Approve a vendor application |
| `POST` | `/vendors/:userId/reject` | Reject a vendor application |
| `PATCH` | `/costumes/:id/status` | Flag or hide a costume listing |

### Vendors — `/api/vendors` *(JWT Required)*

| Method | Path | Description |
|---|---|---|
| `POST` | `/apply` | Submit a vendor application (KYC document upload) |
| `GET` | `/me` | Get the current user's vendor profile and status |
| `GET` | `/costumes` | List the vendor's own costumes |
| `POST` | `/costumes` | Create a new costume listing |
| `PUT` | `/costumes/:id` | Update a costume listing |
| `DELETE`| `/costumes/:id` | Delete a costume listing |
| `GET` | `/reservations` | View received reservation requests |
| `POST` | `/reservations/:id/approve` | Approve a reservation request |
| `POST` | `/reservations/:id/reject` | Reject a reservation request |

### Messaging — `/api/reservations/:id/messages` *(JWT Required)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get messages for a reservation |
| `POST` | `/` | Send a message for a reservation |

---

## 🗄️ Data Models

| Model | Description |
|---|---|
| `User` | Platform users (customer, vendor, or admin role) |
| `VendorProfile` | Vendor KYC and profile information |
| `OAuthAccount` | Linked Google OAuth accounts |
| `Costume` | Rental costume listings |
| `CostumeImage` | Images attached to costumes |
| `Inventory` | Stock/availability per costume |
| `Reservation` | A user's rental reservation |
| `ReservationItem` | Individual costumes within a reservation |
| `Payment` | Payment records linked to reservations |
| `Review` | User reviews for costumes |
| `Message` | In-platform chat messages between renter and vendor |
| `WishlistItem` | Saved costumes in a user's wishlist |
| `Notification` | In-app notifications for users |

---

## 🔐 Authentication

- **JWT-based auth** — issued on login/register, sent as a Bearer token.
- **Google OAuth 2.0** — via Passport.js; issues a JWT on success.
- **Role-based access** — `admin` role enforced via `adminMiddleware` on protected admin routes.

---

## 📦 Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express | HTTP framework |
| Sequelize + mysql2 | ORM & MySQL driver |
| TypeScript | Type safety |
| jsonwebtoken | JWT generation & verification |
| bcryptjs | Password hashing |
| passport + passport-google-oauth20 | Google OAuth |
| nodemailer | Email notifications |
| multer | File/image uploads |
| express-validator | Request validation |
| express-session | Session management |

### Frontend
| Tool | Purpose |
|---|---|
| Next.js (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |

---

## 🧪 API Testing

A **Postman collection** is included in the `postman/` directory. Import it into Postman to test all API endpoints with pre-configured requests.

---

## 📝 License

This project is for academic/portfolio purposes.
