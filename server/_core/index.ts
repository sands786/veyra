import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import crypto from "node:crypto";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { getPayrollScheduleByTaskUid, markPayrollScheduleTriggered } from "../db";
import { nextPayrollRunAt } from "@shared/operations";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  app.post("/api/scheduled/payroll", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        res.status(403).json({ error: "cron-only" });
        return;
      }
      const schedule = await getPayrollScheduleByTaskUid(user.taskUid);
      if (!schedule) {
        res.json({ ok: true, skipped: "orphan" });
        return;
      }
      if (schedule.status !== "active") {
        res.json({ ok: true, skipped: schedule.status });
        return;
      }
      const now = new Date();
      if (schedule.nextRunAt > now) {
        res.json({ ok: true, skipped: "not-due", nextRunAt: schedule.nextRunAt });
        return;
      }
      const nextRunAt = nextPayrollRunAt(schedule.nextRunAt, schedule.frequency);
      await markPayrollScheduleTriggered(schedule.id, nextRunAt);
      res.json({ ok: true, scheduleId: schedule.id, nextRunAt, action: "wallet_authorization_required" });
    } catch (error) {
      const requestId = crypto.randomUUID();
      console.error("[Scheduled payroll] execution failed", {
        requestId,
        url: req.originalUrl,
        error,
      });
      res.status(500).json({
        error: "scheduled-payroll-failed",
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
  });
  // Browser mutations rely on an HttpOnly session cookie. Enforce same-origin
  // and Fetch Metadata signals before tRPC so cross-site callers cannot replay
  // cookie-authenticated state changes. Requests without browser signals remain
  // compatible with internal jobs and CLI clients, which still pass tRPC auth.
  app.use("/api/trpc", (req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }
    const origin = req.headers.origin;
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim();
    const forwardedHost = String(req.headers["x-forwarded-host"] || "")
      .split(",")[0]
      .trim();
    const protocol = forwardedProto || req.protocol;
    const expectedHost = forwardedHost || req.headers.host;
    const expectedOrigin = expectedHost ? `${protocol}://${expectedHost}` : undefined;
    const trustedProxyOrigins = new Set([
      ...(process.env.TRUSTED_BROWSER_ORIGINS || "")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean),
    ]);
    const originIsTrustedProxy = Boolean(origin && trustedProxyOrigins.has(origin));
    const fetchSite = String(req.headers["sec-fetch-site"] || "").toLowerCase();
    const crossSite = fetchSite === "cross-site" || fetchSite === "cross-origin";
    if ((origin && expectedOrigin && origin !== expectedOrigin && !originIsTrustedProxy) || (crossSite && !originIsTrustedProxy)) {
      res.status(403).json({ error: "cross-site-request-blocked" });
      return;
    }
    next();
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
