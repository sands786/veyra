import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
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
  registerOAuthRoutes(app);
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
      res.status(500).json({ error: String(error), context: { url: req.originalUrl }, timestamp: new Date().toISOString() });
    }
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
