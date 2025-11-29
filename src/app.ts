import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import session from "express-session";
import passport from "./config/oauth";
import router from "./routes";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/errorMiddleware";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: env.jwtSecret,
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/uploads", express.static(path.join(process.cwd(), env.fileUploadDir)));

app.use("/api", router);

app.use(errorMiddleware);

export { app };
