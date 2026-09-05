import { test } from "node:test";
import assert from "node:assert/strict";
import { appearanceSchema, DEFAULT_APPEARANCE, readAppearance, OPTIONS, BODY_TYPES } from "../../src/shared/game/appearance";
import { signTicket, verifyTicket, DEV_GAME_SECRET } from "../../src/shared/game/ticket";
import { GameWorld } from "../../src/shared/game/world";

test("local v1 appearance migrates without losing body, skin, shorts or beard", () => {
  const result=readAppearance({body:"round",skin:2,shorts:2,beard:false});
  assert.ok(result);assert.equal(result.version,2);assert.equal(result.body,"round");assert.equal(result.skin,2);assert.equal(result.bottomColor,"#b65d48");assert.equal(result.beardStyle,"none");
  assert.equal(readAppearance({body:"round",skin:200,shorts:2,beard:false}),null);
  assert.equal(readAppearance({version:99}),null);
});
test("appearance rejects invalid colors, missing underwear, unknown assets and out-of-range anatomy", () => {
  for(const patch of [{top:"remote.svg"},{hairColor:"url(https://example.com)"},{underwear:"none"},{biceps:101},{legs:-1},{definition:NaN},{skin:8},{version:1},{extra:true},{bodyHair:{...DEFAULT_APPEARANCE.bodyHair,forearm:4}},{bodyHair:{chest:2}}]) {
    assert.equal(appearanceSchema.safeParse({...DEFAULT_APPEARANCE,...patch}).success,false,JSON.stringify(patch));
  }
});
test("every selectable appearance option passes strict network validation", () => {
  for(const body of BODY_TYPES)assert.ok(appearanceSchema.safeParse({...DEFAULT_APPEARANCE,body}).success);
  for(const [key,options] of Object.entries(OPTIONS))for(const value of Object.keys(options))assert.ok(appearanceSchema.safeParse({...DEFAULT_APPEARANCE,[key]:value}).success,`${key}:${value}`);
});
test("expanded appearance fits request and signed ticket limits and survives round trip", () => {
  const appearance={...DEFAULT_APPEARANCE,top:"hoodie" as const,bottom:"trousers" as const,accessory:"crossbody" as const,necklace:"pendant" as const,held:"dumbbell" as const};
  assert.ok(Buffer.byteLength(JSON.stringify({appearance,pilotCode:"x".repeat(128),roomId:"x".repeat(24)}))<2048);
  const ticket=signTicket(appearance,null,DEV_GAME_SECRET,1000);
  assert.ok(ticket.length<2048);assert.deepEqual(verifyTicket(ticket,DEV_GAME_SECRET,1001).appearance,appearance);
});
test("editing appearance preserves location, rewards, and existing world", () => {
  const world=new GameWorld();const player=world.join("you");player.stars=5;player.x=400;player.place="garden";
  assert.equal(world.setAppearance("you",{...DEFAULT_APPEARANCE,body:"slim",bodyHair:{...DEFAULT_APPEARANCE.bodyHair,forearm:3}}),true);
  assert.equal(player.x,400);assert.equal(player.stars,5);assert.equal(player.place,"garden");assert.equal(player.appearance.body,"slim");assert.equal(player.appearance.bodyHair.forearm,3);assert.equal(player.appearance.bodyHair.chest,2);
  assert.equal(world.setAppearance("you",{underwear:"none"}),false);assert.equal(player.appearance.underwear,"briefs");
});

