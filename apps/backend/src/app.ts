import express from "express";
import cors from "cors";
import session from "express-session";
import { env } from "./config/env";
import routes from "./routes";
import { errorMiddleware } from "./middleware/errorMiddleware";

export const app = express();

app.use(cors({
  origin: env.frontendBaseUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false
}));

app.use("/uploads", express.static(env.fileUploadDir));

app.use("/api/auth", routes.auth);

// Public browse routes (Airbnb-like guest experience).
app.use("/api/costumes", routes.costumes);
app.use("/api/reviews", routes.reviews);

// Everything below requires a valid JWT.
app.use(routes.authMiddleware);

app.use("/api/reservations", routes.reservations);
app.use("/api/payments", routes.payments);
app.use("/api/notifications", routes.notifications);
app.use("/api/wishlist", routes.wishlist);
app.use("/api/vendors", routes.vendor);
app.use("/api/admin", routes.admin);

app.use(errorMiddleware);
