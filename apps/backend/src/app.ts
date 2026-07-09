import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { errorMiddleware } from "./middleware/errorMiddleware";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "./config/openapi";
import { Payment } from "./models/Payment";
import { HandoffService } from "./services/HandoffService";

const handoffService = new HandoffService();

export const app = express();

app.use(cors({
  origin: env.frontendBaseUrl,
  credentials: true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser());

app.use("/uploads", async (req, res, next) => {
  try {
    const relativePath = req.path.replace(/^\/+/, "");
    const proof = await Payment.findOne({ where: { proof_url: `/uploads/${relativePath}` } });
    if (proof) {
      return res.status(404).end();
    }
    const isHandoffProof = await handoffService.isProtectedUploadPath(relativePath);
    if (isHandoffProof) {
      return res.status(404).end();
    }
    next();
  } catch (error) {
    next(error);
  }
});
app.use("/uploads", express.static(env.fileUploadDir));

// Swagger UI configuration
const openApiDocument = generateOpenApiDocument();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.head("/health", (_req, res) => {
  res.sendStatus(204);
});

app.use("/api/auth", routes.auth);
app.use("/api/health", routes.health);
// Webhooks are unauthenticated; token in URL path is the shared secret
app.use("/api/webhooks", routes.webhooks);

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
app.use("/api/account", routes.account);
app.use("/api/subscriptions", routes.subscriptions);

app.use(errorMiddleware);
