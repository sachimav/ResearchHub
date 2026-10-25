import "../config/env.js";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { createServer, resolveConfig } from "../../frontend/node_modules/vite/dist/node/index.js";
import app from "../app.js";
import connectDB from "../config/db.js";
import { getJwtSecret } from "../config/env.js";

let api;
let frontend;
try {
  getJwtSecret();
  await connectDB({ autoIndex: false, autoCreate: false });
  const root = fileURLToPath(new URL("../../frontend", import.meta.url));
  const config = await resolveConfig({ root, logLevel: "error" }, "serve");
  const proxyTarget = config.server.proxy?.["/api"]?.target;
  assert.equal(Number(new URL(proxyTarget).port || 80), Number(process.env.PORT || 8000), "Vite proxy port must match the backend PORT.");
  api = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { api.once("listening", resolve); api.once("error", reject); });
  frontend = await createServer({ root, logLevel: "error", server: { port: 0, host: "127.0.0.1", proxy: {
    "/api": { target: `http://127.0.0.1:${api.address().port}`, changeOrigin: true },
  } } });
  await frontend.listen();
  const base = `http://127.0.0.1:${frontend.httpServer.address().port}`;
  for (const route of ["/", "/showcase", "/student/dashboard", "/supervisor/dashboard"]) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /src\/main.jsx/);
  }
  for (const module of ["/src/App.jsx", "/src/pages/AuthPage.jsx", "/src/pages/StudentDashboard.jsx", "/src/pages/SupervisorDashboard.jsx", "/src/pages/ShowcasePage.jsx", "/src/pages/ResearchDetailsPage.jsx", "/src/services/apiClient.js"]) {
    const response = await fetch(`${base}${module}`);
    assert.equal(response.status, 200, module);
    const source = await response.text();
    assert.ok(source.length > 0);
  }
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).database, "connected");
  const showcase = await fetch(`${base}/api/public/research`);
  assert.equal(showcase.status, 200);
  assert.ok(Array.isArray((await showcase.json()).research));
  assert.equal((await fetch(`${base}/api/student/dashboard`)).status, 401);
  console.log("PASS: frontend routes and modules, Vite /api proxy, backend health, MongoDB connection, public research and protected API access.");
} catch (error) {
  console.error("Stack check failed:", error.message);
  process.exitCode = 1;
} finally {
  if (frontend) await frontend.close();
  if (api?.listening) await new Promise((resolve) => api.close(resolve));
  await mongoose.disconnect();
}
