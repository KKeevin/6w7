import * as Phaser from "phaser";
import { drawBear, drawMap } from "./pixel-art";
import { WORLD, type GameAction, type Snapshot, type Player, type Place } from "@/shared/game/protocol";

export type GameBridge = {
  snapshot: Snapshot | null;
  direction: { x: number; y: number };
  send: (action: GameAction) => void;
};
type Actor = { sprite: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text; bubble: Phaser.GameObjects.Text };

export function mountGame(parent: HTMLElement, bridge: GameBridge) {
  class NeighborhoodScene extends Phaser.Scene {
    private actors = new Map<string, Actor>();
    private map!: Phaser.GameObjects.Image;
    private place: Place | null = null;
    private monsters: Phaser.GameObjects.Container[] = [];
    private keys = new Set<string>();
    private target: { x: number; y: number } | null = null;
    private sentAt = 0;
    private marker!: Phaser.GameObjects.Arc;
    create() {
      for (const place of ["home", "street", "garden"] as const) {
        const tex = this.textures.createCanvas(`map-${place}`, WORLD.width, WORLD.height)!;
        drawMap(tex.context, place); tex.refresh();
      }
      this.map = this.add.image(0,0,"map-home").setOrigin(0);
      this.marker = this.add.circle(0,0,12,0xffffff,0).setStrokeStyle(2,0xfff5db,.8).setVisible(false).setDepth(1);
      this.cameras.main.setBounds(0,0,WORLD.width,WORLD.height);
      const resize = () => this.cameras.main.setZoom(this.scale.width < 600 ? .95 : 1);
      resize(); this.scale.on("resize",resize);
      const canvas = this.game.canvas;
      canvas.tabIndex = 0;
      canvas.setAttribute("aria-label", "遊戲場景，點地面移動；鍵盤方向鍵或 WASD 移動，E 互動");
      const down = (event: KeyboardEvent) => {
        if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"].includes(event.key)) { event.preventDefault(); this.keys.add(event.key.toLowerCase()); this.target = null; }
        if (event.key.toLowerCase() === "e" && !event.repeat) bridge.send({ type: this.place === "garden" ? "attack" : "rest" });
      };
      const up = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
      const reset = () => { this.keys.clear(); this.target = null; bridge.direction = {x:0,y:0}; bridge.send({type:"move",x:0,y:0}); };
      const visible = () => { if (document.hidden) reset(); };
      canvas.addEventListener("keydown",down); window.addEventListener("keyup",up);
      canvas.addEventListener("blur",reset);window.addEventListener("blur",reset);document.addEventListener("visibilitychange",visible);
      this.input.on("pointerdown",(pointer: Phaser.Input.Pointer) => {
        canvas.focus({preventScroll:true});
        const p = this.cameras.main.getWorldPoint(pointer.x,pointer.y);
        this.target = {x:p.x,y:p.y};this.marker.setPosition(p.x,p.y).setVisible(true);
      });
      this.events.once("shutdown",() => { canvas.removeEventListener("keydown",down);window.removeEventListener("keyup",up);canvas.removeEventListener("blur",reset);window.removeEventListener("blur",reset);document.removeEventListener("visibilitychange",visible); });
    }
    private texture(p: Player, frame: number) {
      const a=p.appearance,key=`bear-${a.body}-${a.skin}-${a.shorts}-${Number(a.beard)}-${frame}-${p.facing}`;
      if(!this.textures.exists(key)) { const t=this.textures.createCanvas(key,96,128)!;drawBear(t.context,a,frame,p.facing);t.refresh(); }
      return key;
    }
    update(time: number, delta: number) {
      const s=bridge.snapshot;if(!s)return;
      const self=s.players.find(p=>p.id===s.selfId);if(!self)return;
      const changed=this.place!==self.place;
      if(changed){this.place=self.place;this.map.setTexture(`map-${self.place}`);this.target=null;this.marker.setVisible(false);for(const actor of this.actors.values()){actor.sprite.destroy();actor.label.destroy();actor.bubble.destroy();}this.actors.clear();}
      let x=bridge.direction.x,y=bridge.direction.y;
      if(this.keys.has("a")||this.keys.has("arrowleft"))x--;
      if(this.keys.has("d")||this.keys.has("arrowright"))x++;
      if(this.keys.has("w")||this.keys.has("arrowup"))y--;
      if(this.keys.has("s")||this.keys.has("arrowdown"))y++;
      if(x||y){this.target=null;this.marker.setVisible(false);}
      else if(this.target){const dx=this.target.x-self.x,dy=this.target.y-self.y,length=Math.hypot(dx,dy);if(length<12){this.target=null;this.marker.setVisible(false);}else{x=dx/length;y=dy/length;}}
      if(time-this.sentAt>=65){bridge.send({type:"move",x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))});this.sentAt=time;}
      const people=[...s.players];
      if(self.place==="home"&&!s.owner.connected&&!s.ownerReconnecting) people.push({...s.owner,id:"sleeping-owner",place:"home",x:165,y:315,moving:false,sleeping:true,facing:0});
      const present=new Set(people.map(p=>p.id));
      for(const [id,a] of this.actors)if(!present.has(id)){a.sprite.destroy();a.label.destroy();a.bubble.destroy();this.actors.delete(id);}
      for(const p of people){
        let a=this.actors.get(p.id);
        const frame=p.moving?(Math.floor(time/160)%2)+1:0;
        if(!a){a={sprite:this.add.image(p.x,p.y,this.texture(p,frame)).setOrigin(.5,.92),label:this.add.text(p.x,p.y+12,"",{fontFamily:"system-ui",fontSize:"13px",color:"#fff8e8",backgroundColor:"#34483e",padding:{x:7,y:3}}).setOrigin(.5,0),bubble:this.add.text(p.x,p.y-145,"",{fontFamily:"system-ui",fontSize:"16px",color:"#34483e",backgroundColor:"#fff7df",padding:{x:12,y:7}}).setOrigin(.5,1)};this.actors.set(p.id,a);}
        const ease=1-Math.exp(-delta/45);
        if(changed||Math.hypot(a.sprite.x-p.x,a.sprite.y-p.y)>120)a.sprite.setPosition(p.x,p.y);
        else a.sprite.setPosition(Phaser.Math.Linear(a.sprite.x,p.x,ease),Phaser.Math.Linear(a.sprite.y,p.y,ease));
        a.sprite.setTexture(this.texture(p,frame)).setRotation(p.sleeping?-Math.PI/2:0).setDepth(p.y);
        a.label.setText(`${p.name}${p.id===s.selfId?" · 你":""}`).setPosition(a.sprite.x,a.sprite.y+13).setDepth(p.y+1);
        const emote=p.sleeping?"Z z z":p.emoteUntil>s.now?p.emote:"";
        a.bubble.setText(emote).setVisible(Boolean(emote)).setPosition(a.sprite.x,a.sprite.y-125).setDepth(1000);
      }
      const me=this.actors.get(s.selfId);
      if(me)this.cameras.main.centerOn(me.sprite.x,me.sprite.y-75);
      for(const m of this.monsters)m.destroy();this.monsters=[];
      for(const m of s.monsters){if(m.hp<=0)continue;const g=this.add.graphics();g.fillStyle(0xeee4ba);g.fillRoundedRect(-13,-23,26,29,4);g.fillStyle(0xb7654e);g.fillRoundedRect(-32,-50,64,35,10);g.fillStyle(0xf3d7a8);g.fillRect(-18,-44,8,7);g.fillRect(9,-39,10,7);g.fillStyle(0x3b4b3e);g.fillRect(-7,-17,3,4);g.fillRect(5,-17,3,4);const hp=this.add.text(0,16,"●".repeat(m.hp),{fontSize:"12px",color:"#a65642"}).setOrigin(.5);this.monsters.push(this.add.container(m.x,m.y,[g,hp]).setDepth(m.y));}
    }
  }
  const game=new Phaser.Game({type:Phaser.AUTO,parent,backgroundColor:"#d7c3a4",pixelArt:true,antialias:false,
    scale:{mode:Phaser.Scale.RESIZE,width:parent.clientWidth,height:parent.clientHeight},scene:NeighborhoodScene,
    audio:{noAudio:true},fps:{target:30,forceSetTimeOut:false},banner:false});
  return () => game.destroy(true);
}
