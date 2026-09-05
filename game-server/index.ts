import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { Neighborhood } from "./room";
import { gameSecret } from "../src/shared/game/ticket";

gameSecret(); // Fail closed before listening in production.
const origins = new Set((process.env.GAME_ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000").split(",").map(s => s.trim()));
if (process.env.NODE_ENV === "production" && !process.env.GAME_ALLOWED_ORIGINS) throw new Error("GAME_ALLOWED_ORIGINS required");
const transport = new WebSocketTransport({ maxPayload: 4096, pingInterval: 5000, pingMaxRetries: 2,
  beforeUpgrade: (_req, ctx) => {
    const origin = ctx.headers.get("origin");
    if (!origin || !origins.has(origin)) return new Response("Forbidden", { status: 403 });
  },
});
const server = new Server({ transport, greet: false, express: app => {
  app.use((req, res, next) => {
    if (req.path === "/healthz") { res.json({ ok: true, service: "6w7-game" }); return; }
    const origin = req.headers.origin;
    if (!origin || !origins.has(origin)) { res.status(403).end(); return; }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    if (req.method === "OPTIONS") { res.status(204).end(); return; }
    // No public room browser: invitations join an exact room id.
    if (req.method !== "POST") { res.status(405).end(); return; }
    next();
  });
} });
server.define("neighborhood", Neighborhood);
const port = Number(process.env.GAME_PORT || 2567);
void server.listen(port, process.env.GAME_HOST || "127.0.0.1").then(() => console.log(`6w7 game listening on port ${port}`));
