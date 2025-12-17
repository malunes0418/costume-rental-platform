import express from "express";
import cors from "cors";
import session from "express-session";
import { env } from "./config/env";
import routes from "./routes";
import { errorMiddleware } from "./middleware/errorMiddleware";

export const app = express();

// CORS configuration
app.use(cors({
  origin: env.frontendBaseUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/api/auth", routes.auth);

app.use(routes.authMiddleware);

app.use("/api/costumes", routes.costumes);
app.use("/api/reservations", routes.reservations);
app.use("/api/payments", routes.payments);
app.use("/api/notifications", routes.notifications);
app.use("/api/wishlist", routes.wishlist);
app.use("/api/reviews", routes.reviews);
app.use("/api/admin", routes.admin);

app.use(errorMiddleware);
