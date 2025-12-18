import express from "express";
import session from "express-session";
import { env } from "./config/env";
import routes from "./routes";
import { errorMiddleware } from "./middleware/errorMiddleware";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const useSecureCookies = env.nodeEnv === "production";
if (useSecureCookies) {
  app.set("trust proxy", 1);
}

app.use(session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: useSecureCookies,
  cookie: {
    secure: useSecureCookies,
    httpOnly: true,
    sameSite: "lax"
  }
}));

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
