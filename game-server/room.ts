import { Room, ServerError, type Client } from "@colyseus/core";
import { GameWorld } from "../src/shared/game/world";
import { WORLD } from "../src/shared/game/protocol";
import { gameSecret, verifyTicket, type TicketClaims } from "../src/shared/game/ticket";

let activeRooms = 0;
const consumed = new Map<string, number>();
export class Neighborhood extends Room {
  maxClients = WORLD.maxPlayers;
  maxMessagesPerSecond = 35;
  world = new GameWorld();
  private counted = false;
  private creatorNonce = "";
  private creatorClaimed = false;
  private snapshotElapsed = 0;
  onCreate(options: { ticket?: unknown }) {
    let claims: TicketClaims;
    try { claims = verifyTicket(options.ticket, gameSecret()); } catch { throw new ServerError(403, "INVALID_TICKET"); }
    if (claims.roomId !== null || consumed.has(claims.nonce)) throw new ServerError(403, "INVALID_TICKET");
    if (activeRooms >= 8) throw new ServerError(503, "SERVER_FULL");
    consumed.set(claims.nonce, claims.exp);
    this.creatorNonce = claims.nonce;
    activeRooms++; this.counted = true;
    this.setPrivate(true);
    this.onMessage("action", (client, raw: unknown) => {
      const message = this.world.action(client.sessionId, raw);
      if (message) client.send("notice", message);
    });
    this.setSimulationInterval(dt => {
      this.world.tick(dt);
      this.snapshotElapsed += dt;
      if (this.snapshotElapsed >= 100) {
        this.snapshotElapsed = 0;
        for (const c of this.clients) if (this.world.players.get(c.sessionId)?.connected) c.send("snapshot", this.world.snapshot(c.sessionId));
      }
    }, WORLD.tickMs);
    this.clock.setTimeout(() => { void this.disconnect(4010); }, 30 * 60 * 1000);
  }
  onAuth(_client: Client, options: { ticket?: unknown }): TicketClaims {
    try {
      const claims = verifyTicket(options.ticket, gameSecret());
      for (const [nonce, exp] of consumed) if (exp < Date.now()) consumed.delete(nonce);
      const creator = claims.nonce === this.creatorNonce && !this.creatorClaimed;
      if (!creator && (claims.roomId !== this.roomId || consumed.has(claims.nonce))) throw new Error("INVALID_TICKET");
      if (consumed.size >= 4096) throw new Error("SERVER_BUSY");
      consumed.set(claims.nonce, claims.exp);
      if (creator) this.creatorClaimed = true;
      return claims;
    } catch { throw new ServerError(403, "INVALID_TICKET"); }
  }
  onJoin(client: Client, _options: unknown, auth: TicketClaims) {
    this.world.join(client.sessionId, auth.appearance);
    client.send("snapshot", this.world.snapshot(client.sessionId));
  }
  async onDrop(client: Client) {
    this.world.disconnect(client.sessionId);
    try { await this.allowReconnection(client, 15); }
    catch { /* onLeave handles the expired reservation */ }
  }
  onReconnect(client: Client) { this.world.reconnect(client.sessionId); }
  onLeave(client: Client) { this.world.leave(client.sessionId); }
  onDispose() { if (this.counted) { activeRooms--; this.counted = false; } }
}
