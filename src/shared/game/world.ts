import { appearanceSchema, actionSchema, canStand, DEFAULT_APPEARANCE, WORLD, type Appearance, type GameAction, type Player, type Snapshot, type Monster } from "./protocol";

/** Shared deterministic rules. In multiplayer ONLY the server runs this simulation. */
export class GameWorld {
  players = new Map<string, Player>();
  ownerId = "";
  allowFollow = true;
  private ownerMemory?: Player;
  private inputs = new Map<string, { x: number; y: number; at: number }>();
  private cooldowns = new Map<string, number>();
  monsters: Monster[] = [
    { id: "m1", x: 350, y: 360, hp: 3, respawnAt: 0 },
    { id: "m2", x: 610, y: 430, hp: 3, respawnAt: 0 },
    { id: "m3", x: 480, y: 560, hp: 3, respawnAt: 0 },
  ];
  join(id: string, appearance: Appearance = DEFAULT_APPEARANCE): Player {
    if (this.players.has(id)) return this.players.get(id)!;
    if (this.players.size >= WORLD.maxPlayers) throw new Error("ROOM_FULL");
    if (!this.ownerId) this.ownerId = id;
    const player: Player = { id, name: id === this.ownerId ? "屋主" : `旅人 ${this.players.size + 1}`,
      appearance: { ...appearance }, place: "home", x: 450 + this.players.size * 48, y: 530,
      facing: 0, moving: false, sleeping: false, connected: true, emote: "", emoteUntil: 0, stars: 0 };
    this.players.set(id, player);
    if (id === this.ownerId) this.ownerMemory = player;
    return player;
  }
  setAppearance(id: string, raw: unknown): boolean {
    const parsed = appearanceSchema.safeParse(raw);
    const player = this.players.get(id);
    if (!player || !parsed.success) return false;
    player.appearance = parsed.data;
    return true;
  }
  disconnect(id: string) {
    const p = this.players.get(id);
    if (p) { p.connected = false; p.moving = false; }
    this.inputs.delete(id);
  }
  reconnect(id: string) { const p = this.players.get(id); if (p) p.connected = true; }
  leave(id: string) {
    this.disconnect(id); this.players.delete(id); this.cooldowns.delete(id);
  }
  action(id: string, raw: unknown, now = Date.now()): string | undefined {
    const parsed = actionSchema.safeParse(raw);
    if (!parsed.success) return "操作格式不正確";
    const a: GameAction = parsed.data;
    const p = this.players.get(id);
    if (!p?.connected) return;
    if (a.type === "move") { this.inputs.set(id, { x: a.x, y: a.y, at: now }); return; }
    if (now < (this.cooldowns.get(id) ?? 0)) return;
    this.cooldowns.set(id, now + 400);
    if (a.type === "emote") { p.emote = a.value; p.emoteUntil = now + 2800; }
    if (a.type === "allowFollow" && id === this.ownerId) this.allowFollow = a.value;
    if (a.type === "rest") {
      if (p.place !== "home" || id !== this.ownerId) return "只有屋主能在自己的床上休息";
      p.sleeping = !p.sleeping; this.inputs.delete(id);
      p.x = p.sleeping ? 165 : 310; p.y = p.sleeping ? 310 : 410;
    }
    if (a.type === "travel") {
      p.place = a.place; p.x = 480; p.y = 600; p.sleeping = false; p.moving = false; this.inputs.delete(id);
    }
    if (a.type === "follow") {
      const owner = this.players.get(this.ownerId);
      if (!this.allowFollow || !owner?.connected || owner.sleeping) return "屋主目前沒有開放會合";
      const spots = [[48, 0], [-48, 0], [0, 55], [0, -55]];
      const spot = spots.find(([dx, dy]) => canStand(owner.place, owner.x + dx, owner.y + dy));
      if (!spot) return "附近沒有安全位置，稍後再試";
      p.place = owner.place; p.x = owner.x + spot[0]; p.y = owner.y + spot[1]; p.sleeping = false; this.inputs.delete(id);
    }
    if (a.type === "attack" && p.place === "garden") {
      const monster = this.monsters.find(m => m.hp > 0 && Math.hypot(m.x - p.x, m.y - p.y) < 110);
      if (!monster) return "靠近蘑菇怪，再按探索";
      monster.hp--;
      p.emote = "嘿！"; p.emoteUntil = now + 500;
      if (monster.hp === 0) {
        monster.respawnAt = now + 12000;
        // Nearby teammates share the temporary reward; never a persistent currency.
        for (const peer of this.players.values()) if (peer.connected && peer.place === "garden" && Math.hypot(peer.x - monster.x, peer.y - monster.y) < 220) peer.stars++;
      }
    }
  }
  tick(deltaMs: number, now = Date.now()) {
    const dt = Math.max(0, Math.min(deltaMs, 100)) / 1000;
    for (const p of this.players.values()) {
      const input = this.inputs.get(p.id);
      p.moving = false;
      if (!input || now - input.at > 300 || !p.connected || p.sleeping) continue;
      const length = Math.hypot(input.x, input.y);
      if (!length) continue;
      const dx = input.x / Math.max(1, length), dy = input.y / Math.max(1, length);
      const x = p.x + dx * WORLD.speed * dt, y = p.y + dy * WORLD.speed * dt;
      if (canStand(p.place, x, p.y)) { p.moving ||= Math.abs(x - p.x) > 0.01; p.x = x; }
      if (canStand(p.place, p.x, y)) { p.moving ||= Math.abs(y - p.y) > 0.01; p.y = y; }
      p.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    }
    for (const m of this.monsters) if (m.hp === 0 && now >= m.respawnAt) m.hp = 3;
  }
  snapshot(selfId: string, now = Date.now()): Snapshot {
    const self = this.players.get(selfId);
    const owner = this.players.get(this.ownerId) ?? this.ownerMemory!;
    return { selfId, ownerId: this.ownerId, owner: { ...owner, appearance: { ...owner.appearance } }, ownerReconnecting: this.players.has(this.ownerId) && !owner.connected, allowFollow: this.allowFollow,
      players: [...this.players.values()].filter(p => p.connected && p.place === self?.place).map(p => ({ ...p, appearance: { ...p.appearance } })),
      monsters: self?.place === "garden" ? this.monsters.map(m => ({ ...m })) : [],
      online: [...this.players.values()].filter(p => p.connected).length, now };
  }
}
