# Costume Rental Platform

A full-stack costume rental marketplace with an Express/TypeScript backend and a Next.js frontend. Users can browse costumes, place reservations, manage wishlists, and authenticate with email/password or Google OAuth.

---

## Project Structure

```text
costume-rental-platform/
├── apps/
│   ├── backend/              # Express + TypeScript API
│   │   ├── migrations/       # Sequelize migrations
│   │   ├── src/              # Routes, controllers, services, config
│   │   └── .env.sample       # Backend environment template
│   └── web/                  # Next.js frontend
│       └── src/
├── packages/                 # Shared workspace packages
├── postman/                  # Postman collections and environments
├── AGENTS.md                 # Repo-specific agent guidance
├── package.json              # Root workspace scripts
└── turbo.json                # Turborepo pipeline
```

---

## Prerequisites

- Node.js 18+
- MySQL or a compatible database
- A Google Cloud project with an OAuth 2.0 web application credential
- An SMTP account for transactional email

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure backend environment

Copy the sample backend env file:

```bash
cp apps/backend/.env.sample apps/backend/.env
```

Key backend variables:

| Variable | Description |
|---|---|
| `PORT` | API server port. Local default: `4000` |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | JWT signing secret |
| `SESSION_SECRET` | Session secret |
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OAUTH_GOOGLE_CALLBACK_URL` | Google OAuth callback URL. Local value: `http://localhost:4000/api/auth/google/callback` |
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP username / sender address |
| `EMAIL_PASSWORD` | SMTP password or app password |
| `FRONTEND_BASE_URL` | Frontend origin used for redirects and CORS. Local value: `http://localhost:3000` |
| `FILE_UPLOAD_DIR` | Upload directory |

### 3. Configure frontend environment

Create `apps/web/.env.local` with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Configure Google OAuth

Create a Google OAuth 2.0 credential with:

- Credential type: `OAuth client ID`
- Application type: `Web application`
- Authorized redirect URI: `http://localhost:4000/api/auth/google/callback`

Local OAuth flow:

1. Frontend sends the user to `http://localhost:4000/api/auth/google`
2. Google redirects back to `http://localhost:4000/api/auth/google/callback`
3. Backend sets the auth cookie
4. Backend redirects the browser to `http://localhost:3000/oauth/callback`

If Google redirects directly to `http://localhost:3000/api/auth/google/callback`, the OAuth client or backend env is pointed at the frontend instead of the backend.

### 5. Run database migrations

```bash
npm --workspace backend run migrate
```

To roll back all migrations:

```bash
npm --workspace backend run migrate:undo:all
```

### 6. Start the apps

Run both workspaces:

```bash
npm run dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

You can also run a single workspace:

- `npm --workspace web run dev`
- `npm --workspace backend run dev`

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start all workspaces in development mode |
| `npm run build` | Build all workspaces |
| `npm run lint` | Run lint tasks across workspaces |
| `npm --workspace backend run dev` | Start only the backend |
| `npm --workspace web run dev` | Start only the frontend |
| `npm --workspace backend run migrate` | Run pending migrations |
| `npm --workspace backend run migrate:undo` | Undo the last migration |
| `npm --workspace backend run migrate:undo:all` | Undo all migrations |

---

## API Endpoints

### Auth - `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register a new user |
| `POST` | `/login` | Public | Login with email and password |
| `POST` | `/logout` | Public | Clear the auth cookie |
| `GET` | `/me` | JWT | Get the current authenticated user |
| `GET` | `/google` | Public | Start Google OAuth |
| `GET` | `/google/callback` | Public | Google OAuth callback |

### Costumes - `/api/costumes`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all costumes |
| `GET` | `/:id` | Get costume details |
| `GET` | `/:id/availability` | Check availability for a date range |

### Reservations - `/api/reservations`

| Method | Path | Description |
|---|---|---|
| `POST` | `/cart` | Add a costume to the cart |
| `POST` | `/checkout` | Checkout and create a reservation |
| `GET` | `/my` | List the current user's reservations |

### Payments - `/api/payments`

| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Submit a payment for a reservation |

### Reviews - `/api/reviews`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List reviews |
| `POST` | `/` | Submit a review |

### Wishlist - `/api/wishlist`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get wishlist items |
| `POST` | `/` | Add item to wishlist |
| `DELETE` | `/:id` | Remove item from wishlist |

### Notifications - `/api/notifications`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get user notifications |
| `PATCH` | `/:id/read` | Mark a notification as read |

### Admin - `/api/admin`

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

### Vendors - `/api/vendors`

| Method | Path | Description |
|---|---|---|
| `POST` | `/apply` | Submit a vendor application |
| `GET` | `/me` | Get the current user's vendor profile and status |
| `GET` | `/costumes` | List the vendor's costumes |
| `POST` | `/costumes` | Create a costume listing |
| `PUT` | `/costumes/:id` | Update a costume listing |
| `DELETE` | `/costumes/:id` | Delete a costume listing |
| `GET` | `/reservations` | View received reservation requests |
| `POST` | `/reservations/:id/approve` | Approve a reservation request |
| `POST` | `/reservations/:id/reject` | Reject a reservation request |

### Messaging - `/api/reservations/:id/messages`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get messages for a reservation |
| `POST` | `/` | Send a message for a reservation |

---

## Authentication

- JWT-based auth for standard login
- Google OAuth 2.0 via Passport
- Role-based access for admin-only routes

---

## Tech Stack

### Backend

- Express
- Sequelize
- MySQL
- TypeScript
- Passport + `passport-google-oauth20`
- Nodemailer

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

---

## API Testing

Postman collections and environments are available in [postman](C:/Users/cayma/Documents/GitHub/costume-rental-platform/postman).

---

## License

This project is for academic and portfolio purposes.
