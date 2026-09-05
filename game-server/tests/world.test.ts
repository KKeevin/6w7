import { test } from "node:test";
import assert from "node:assert/strict";
import { GameWorld } from "../../src/shared/game/world";
import { DEFAULT_APPEARANCE, canStand } from "../../src/shared/game/protocol";
import { signTicket, verifyTicket, DEV_GAME_SECRET } from "../../src/shared/game/ticket";

test("diagonal movement has the same speed as cardinal movement", () => {
  const w = new GameWorld();const p = w.join("owner");const x=p.x,y=p.y;
  w.action(p.id,{type:"move",x:1,y:1},1000);w.tick(100,1100);
  assert.ok(Math.abs(Math.hypot(p.x-x,p.y-y)-17.5)<.001);
});
test("arbitrary coordinates, NaN and forged attributes cannot move a player",()=>{
  const w=new GameWorld();const p=w.join("owner");
  for(const raw of [{type:"move",x:9000,y:0},{type:"move",x:NaN,y:0},{type:"move",x:1,y:0,stars:999}])assert.equal(w.action(p.id,raw),"操作格式不正確");
  w.tick(100);assert.equal(p.x,450);assert.equal(p.stars,0);
});
test("stale input stops and large simulation pauses cannot teleport",()=>{
  const w=new GameWorld();const p=w.join("owner");
  w.action(p.id,{type:"move",x:1,y:0},1000);w.tick(5000,1100);assert.equal(p.x,467.5);
  w.tick(50,1500);assert.equal(p.x,467.5);assert.equal(p.moving,false);
});
test("bed and world boundaries block movement",()=>{
  assert.equal(canStand("home",160,280),false);assert.equal(canStand("home",-1,530),false);
  const w=new GameWorld();const p=w.join("owner");p.x=267;p.y=300;
  w.action(p.id,{type:"move",x:-1,y:0},1000);w.tick(100,1100);assert.equal(p.x,267);
});
test("visitors cannot rest in owner's bed or change following permissions",()=>{
  const w=new GameWorld();w.join("owner");const visitor=w.join("visitor");
  w.action(visitor.id,{type:"allowFollow",value:false},1000);assert.equal(w.allowFollow,true);
  assert.match(w.action(visitor.id,{type:"rest"},2000)!,/屋主/);assert.equal(visitor.sleeping,false);
});
test("following requires permission and lands at a safe point in owner's scene",()=>{
  const w=new GameWorld();const owner=w.join("owner");const visitor=w.join("visitor");
  w.action(owner.id,{type:"travel",place:"street"},1000);
  w.action(owner.id,{type:"allowFollow",value:false},2000);
  assert.match(w.action(visitor.id,{type:"follow"},3000)!,/沒有開放/);assert.equal(visitor.place,"home");
  w.action(owner.id,{type:"allowFollow",value:true},4000);w.action(visitor.id,{type:"follow"},5000);
  assert.equal(visitor.place,"street");assert.ok(canStand(visitor.place,visitor.x,visitor.y));
});
test("scene snapshots hide players elsewhere; owner sleeps only after reconnection expires",()=>{
  const w=new GameWorld();w.join("owner");w.join("visitor");w.action("owner",{type:"travel",place:"garden"},1000);
  let s=w.snapshot("visitor");assert.equal(s.players.length,1);assert.equal(s.owner.place,"garden");
  w.disconnect("owner");s=w.snapshot("visitor");assert.equal(s.ownerReconnecting,true);
  w.reconnect("owner");assert.equal(w.snapshot("visitor").owner.connected,true);
  w.leave("owner");s=w.snapshot("visitor");assert.equal(s.owner.connected,false);assert.equal(s.ownerReconnecting,false);assert.equal(s.owner.appearance.body,"brawny");
});
test("combat requires proximity, cooldown and shares reward only with nearby teammates",()=>{
  const w=new GameWorld();const p=w.join("owner");const friend=w.join("friend");const far=w.join("far");
  p.place=friend.place=far.place="garden";p.x=340;p.y=360;friend.x=370;friend.y=360;far.x=700;far.y=600;
  w.action(p.id,{type:"attack"},1000);w.action(p.id,{type:"attack"},1001);assert.equal(w.monsters[0].hp,2);
  w.action(p.id,{type:"attack"},1500);w.action(friend.id,{type:"attack"},2000);
  assert.equal(p.stars,1);assert.equal(friend.stars,1);assert.equal(far.stars,0);
  w.action(p.id,{type:"attack"},2500);assert.equal(p.stars,1);
  w.tick(50,14001);assert.equal(w.monsters[0].hp,3);
});
test("rooms enforce four-player capacity",()=>{
  const w=new GameWorld();for(let i=0;i<4;i++)w.join(String(i));assert.throws(()=>w.join("5"),/ROOM_FULL/);
});
test("tickets bind an exact room and appearance and expire",()=>{
  const ticket=signTicket(DEFAULT_APPEARANCE,"abcd12345",DEV_GAME_SECRET,1000);
  const claims=verifyTicket(ticket,DEV_GAME_SECRET,2000);assert.equal(claims.roomId,"abcd12345");
  assert.throws(()=>verifyTicket(ticket,"different-secret",2000));
  assert.throws(()=>verifyTicket(ticket,DEV_GAME_SECRET,61000),/EXPIRED/);
  const [body,sig]=ticket.split(".");const forged=JSON.parse(Buffer.from(body,"base64url").toString());forged.roomId="hijack1234";
  assert.throws(()=>verifyTicket(`${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${sig}`,DEV_GAME_SECRET,2000));
});
