import crypto from "node:crypto";

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";

import { getServerConfig } from "./config";
import { buildV1Router } from "./routes";
import { getRequestId } from "./utils";

const config = getServerConfig();
const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
});

const app = express();

app.disable("x-powered-by");

app.use((req, res, next) => {
  const requestId = req.header("x-request-id") ?? crypto.randomUUID();
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => getRequestId(req),
  }),
);
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin denied"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/v1", buildV1Router());

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  void _next;
  const message = err instanceof Error ? err.message : "Unexpected error";
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    message,
  });
});

app.listen(config.port, () => {
  logger.info({ port: config.port, corsOrigins: config.corsOrigins }, "API server ready");
});
