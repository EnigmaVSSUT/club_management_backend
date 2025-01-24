import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./router/user.routes.js";
import clubRouter from "./router/club.routes.js";
import achievementRouter from "./router/achievements.routes.js";
import eventsRouter from "./router/events.routes.js";
import projectsRouter from "./router/projects.routes.js";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/clubs", clubRouter);
app.use("/api/v1/achievements", achievementRouter);
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/projects", projectsRouter);
export default app;
