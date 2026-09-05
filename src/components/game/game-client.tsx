"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@colyseus/sdk";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, DoorOpen, Home, Leaf, LoaderCircle, MapPin, Share2, Sparkles, Users, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appearanceSchema, BODY_LABELS, BODY_TYPES, DEFAULT_APPEARANCE, PLACE_LABELS, roomIdSchema, SHORTS, SKINS, type Appearance, type GameAction, type Snapshot } from "@/shared/game/protocol";
import { GameWorld } from "@/shared/game/world";
import { drawBear } from "./pixel-art";
import type { GameBridge } from "./game-scene";
import styles from "./game.module.css";

type Status = "solo" | "connecting" | "online" | "reconnecting" | "disconnected";
const STORAGE_KEY = "6w7:game:appearance:v1";
const EMOTES = ["嗨！", "一起走？", "謝謝你", "好可愛", "💪"] as const;

export function GameClient({ invitation, onlineEnabled, endpoint, needsCode }: {
  invitation: string | null; onlineEnabled: boolean; endpoint: string; needsCode: boolean;
}) {
  const [appearance,setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [status,setStatus] = useState<Status>("solo");
  const [snapshot,setSnapshot] = useState<Snapshot | null>(null);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [ready,setReady] = useState(false);
  const [roomId,setRoomId] = useState<string | null>(null);
  const [pilotCode,setPilotCode] = useState("");
  const [inviteUrl,setInviteUrl] = useState("");
  const canvasHost = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const room = useRef<Room | null>(null);
  const local = useRef<GameWorld | null>(null);
  const attempt = useRef(0);
  const bridge = useRef<GameBridge>({snapshot:null,direction:{x:0,y:0},send:()=>{}});
  const statusRef=useRef<Status>("solo");
  const mounted=useRef(true);
  const report = useCallback((s: Snapshot) => { bridge.current.snapshot=s;setSnapshot(s); },[]);
  const changeStatus = useCallback((s: Status) => {statusRef.current=s;setStatus(s);},[]);

  const startSolo = useCallback((a: Appearance) => {
    attempt.current++;
    const old=room.current;room.current=null;if(old)void old.leave();
    const world=new GameWorld();world.join("you",a);local.current=world;
    bridge.current.direction={x:0,y:0};
    bridge.current.send=(action:GameAction)=>{const message=world.action("you",action);if(message)setNotice(message);};
    report(world.snapshot("you"));changeStatus("solo");setRoomId(null);setInviteUrl("");setError("");
  },[report,changeStatus]);

  useEffect(()=>{
    mounted.current=true;
    let saved=DEFAULT_APPEARANCE;
    try { const raw=localStorage.getItem(STORAGE_KEY);const parsed=appearanceSchema.safeParse(raw?JSON.parse(raw):null);if(parsed.success)saved=parsed.data; } catch { /* Private browsing still supports the game without saving. */ }
    setAppearance(saved);startSolo(saved);
    const timer=window.setInterval(()=>{if(statusRef.current!=="solo"||!local.current)return;local.current.tick(50);report(local.current.snapshot("you"));},50);
    return ()=>{mounted.current=false;attempt.current++;clearInterval(timer);void room.current?.leave();room.current=null;};
  },[startSolo,report]);

  useEffect(()=>{
    let alive=true;let destroy:(()=>void)|undefined;
    import("./game-scene").then(({mountGame})=>{if(alive&&canvasHost.current){destroy=mountGame(canvasHost.current,bridge.current);setReady(true);}})
      .catch(()=>{if(alive)setError("遊戲畫面載入失敗，請重新整理頁面再試。");});
    return ()=>{alive=false;destroy?.();};
  },[]);
  useEffect(()=>{const c=preview.current?.getContext("2d");if(c){c.imageSmoothingEnabled=false;drawBear(c,appearance);}},[appearance]);
  useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(""),4000);return()=>clearTimeout(id);},[notice]);

  function updateAppearance(next: Appearance) {
    setAppearance(next);startSolo(next);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}catch{setNotice("瀏覽器無法儲存設定，這次仍可繼續試玩。");}
  }
  async function connect(target: string | null) {
    if(!onlineEnabled||!endpoint){setError("多人封測尚未開放，現在可以先玩單人模式。");return;}
    if(target&&!roomIdSchema.safeParse(target).success){setError("邀請連結格式不正確，請向朋友索取新連結。");return;}
    const current=++attempt.current;changeStatus("connecting");setError("");
    bridge.current.direction={x:0,y:0};bridge.current.send=()=>{};
    let joined: Room | null=null;
    try {
      const response=await fetch("/api/v1/game/ticket",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({appearance,...(target?{roomId:target}:{}),...(pilotCode?{pilotCode}:{})}),signal:AbortSignal.timeout(12000)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error?.message||"暫時無法取得入場券。");
      const {Client}=await import("@colyseus/sdk");
      const client=new Client(endpoint);
      joined=target?await client.joinById(target,{ticket:data.ticket}):await client.create("neighborhood",{ticket:data.ticket});
      if(!mounted.current||current!==attempt.current){void joined.leave();return;}
      room.current=joined;local.current=null;
      setRoomId(joined.roomId);setInviteUrl(`${window.location.origin}/tools/play?room=${encodeURIComponent(joined.roomId)}`);
      joined.onMessage<Snapshot>("snapshot",s=>{if(current===attempt.current)report(s);});
      joined.onMessage<string>("notice",message=>{if(current===attempt.current)setNotice(message);});
      joined.onDrop(()=>{if(current===attempt.current){changeStatus("reconnecting");bridge.current.direction={x:0,y:0};}});
      joined.onReconnect(()=>{if(current===attempt.current){changeStatus("online");setNotice("已重新連上，繼續散步吧。");}});
      joined.onLeave(()=>{if(current===attempt.current){changeStatus("disconnected");setError("連線已結束或世界已到期。可以重新加入，或返回單人試玩。");}});
      joined.onError(()=>{if(current===attempt.current)setError("連線發生問題，請稍後再試。");});
      bridge.current.send=(action)=>{if(statusRef.current==="online")room.current?.send("action",action);};
      changeStatus("online");
      setNotice(target?"歡迎來到朋友的小屋。":"世界已開啟，複製邀請連結給朋友吧。");
    }catch(cause){
      if(joined)void joined.leave();
      if(!mounted.current||current!==attempt.current)return;
      startSolo(appearance);
      const message=cause instanceof Error?cause.message:"";
      setError(/封測|入場|角色|連結|暫時|頻繁|6w7/.test(message)?message:"無法加入世界：可能已滿 4 人、邀請已失效，或遊戲伺服器未啟動。請稍後重試。");
    }
  }
  async function copyInvite(){
    try{await navigator.clipboard.writeText(inviteUrl);setNotice("邀請連結已複製，傳給朋友一起散步。");}
    catch{setNotice("請從下方邀請欄位選取並複製連結。");}
  }
  const self=snapshot?.players.find(p=>p.id===snapshot.selfId);
  const isOwner=snapshot?.ownerId===snapshot?.selfId;
  const playable=status==="solo"||status==="online";
  const owner=snapshot?.owner;
  const stop=()=>{bridge.current.direction={x:0,y:0};bridge.current.send({type:"move",x:0,y:0});};
  return <main className={styles.shell} lang="zh-Hant">
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="返回 6w7 首頁">6w7<span>樂玩ㄑ</span></Link>
      <span className={styles.pilot}><span/>小日子・封測中</span>
      <Link href="/" className={styles.back}><ArrowLeft size={15}/>回主站</Link>
    </header>
    <div className={styles.intro}>
      <div><p className={styles.eyebrow}>一隻熊，一間房，一起過日子。</p><h1>歡迎來到<span>熊熊小日子</span></h1><p>捏一個喜歡的自己，出門走走。朋友來了，就一起去冒險。</p></div>
      <div className={styles.session}><span className={status==="online"?styles.dotOnline:styles.dotSolo}/>{({solo:"單人試玩",connecting:"正在連線",online:"朋友已可加入",reconnecting:"重新連線中",disconnected:"連線已結束"})[status]}<small>{status==="online"?`${snapshot?.online??1} / 4 人` : "外觀儲存在此瀏覽器"}</small></div>
    </div>
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        <details className={styles.dress} open>
          <summary>今天的你 <span>角色設定</span></summary>
          <div className={styles.portrait}><span className={styles.portraitTag}>{BODY_LABELS[appearance.body]}</span><canvas ref={preview} width={96} height={128} role="img" aria-label={`${BODY_LABELS[appearance.body]}角色外觀預覽`}/><div className={styles.portraitGround}/><p>大大的身形，剛剛好的自己。</p></div>
          <fieldset disabled={status!=="solo"} className={styles.options}>
            <legend className="sr-only">角色外觀</legend>
            <div className={styles.bodyTypes}>{BODY_TYPES.map(body=><button key={body} type="button" aria-pressed={appearance.body===body} onClick={()=>updateAppearance({...appearance,body})}>{BODY_LABELS[body]}</button>)}</div>
            <div className={styles.swatchRow}><span>膚色</span><div>{SKINS.map((color,skin)=><button key={color} type="button" style={{backgroundColor:color}} aria-label={`膚色 ${skin+1}`} aria-pressed={appearance.skin===skin} onClick={()=>updateAppearance({...appearance,skin})}/>)}</div></div>
            <div className={styles.swatchRow}><span>短褲</span><div>{SHORTS.map((color,shorts)=><button key={color} type="button" style={{backgroundColor:color}} aria-label={`短褲配色 ${shorts+1}`} aria-pressed={appearance.shorts===shorts} onClick={()=>updateAppearance({...appearance,shorts})}/>)}</div></div>
            <label className={styles.check}><input type="checkbox" checked={appearance.beard} onChange={e=>updateAppearance({...appearance,beard:e.target.checked})}/>留一把鬍子</label>
          </fieldset>
          {status!=="solo"&&<p className={styles.small}>返回單人試玩後，可以重新搭配角色。</p>}
        </details>
        <section className={styles.invite} aria-label="多人邀請">
          <div className={styles.inviteTitle}><Users size={19}/><strong>有朋友，更好玩。</strong></div>
          <p>邀朋友來小屋，或一起去林地收集小星星。</p>
          {needsCode&&status!=="online"&&<label className={styles.code}>封測通關碼<input type="password" value={pilotCode} maxLength={128} autoComplete="off" onChange={e=>setPilotCode(e.target.value)}/></label>}
          {status==="online"?<><Button className="w-full" onClick={copyInvite}><Copy size={16}/>複製邀請連結</Button><input className={styles.url} aria-label="邀請連結" value={inviteUrl} readOnly onFocus={e=>e.target.select()}/></>:<Button className="w-full" disabled={status==="connecting"||!onlineEnabled} onClick={()=>connect(invitation||roomId)}>{status==="connecting"?<LoaderCircle size={16} className="animate-spin"/>:<Share2 size={16}/>}{invitation?"加入朋友的小屋":"開啟多人小屋"}</Button>}
          {!onlineEnabled&&<p className={styles.small}>目前提供單人試玩，多人服務尚未開啟。</p>}
          {status!=="solo"&&<Button variant="ghost" className="mt-2 w-full" onClick={()=>startSolo(appearance)}>返回單人試玩</Button>}
          <p className={styles.small}>每個世界最多 4 人、30 分鐘。全員離開後邀請失效；小星星不會永久保存。</p>
        </section>
      </aside>
      <section className={styles.worldPanel} aria-label="遊戲">
        <div className={styles.worldHeader}><div><MapPin size={17}/><strong>{PLACE_LABELS[self?.place??"home"]}</strong><span>你的慢生活地圖</span></div><span className={styles.worldCount}>{status==="online"?<Wifi size={15}/>:<WifiOff size={15}/>}<Users size={15}/>{snapshot?.online??1}</span></div>
        <div className={styles.stage}>
          <div ref={canvasHost} className={styles.canvasHost}/>
          {!ready&&<div className={styles.loading}><LoaderCircle className="animate-spin"/><p>正在整理小屋…</p></div>}
          {!playable&&<div className={styles.connectionOverlay}>{status==="connecting"||status==="reconnecting"?<LoaderCircle className="animate-spin"/>:<WifiOff/>}<p>{status==="disconnected"?"連線已結束":status==="reconnecting"?"等一下，正在找回連線…":"正在打開朋友的小屋…"}</p></div>}
          <div className={styles.sceneBadge}><span>6w7</span><small>{self?.place==="garden"?"走近蘑菇怪，按探索":"點地面走過去"}</small></div>
          <div className={styles.reward}><Sparkles size={15}/>{self?.stars??0}<span>小星星</span></div>
          {notice&&<div className={styles.toast} role="status">{notice}</div>}
        </div>
        <div className={styles.travel} aria-label="選擇目的地">{([{place:"home",Icon:Home},{place:"street",Icon:DoorOpen},{place:"garden",Icon:Leaf}] as const).map(({place,Icon})=><button key={place} type="button" disabled={!playable} aria-pressed={self?.place===place} onClick={()=>bridge.current.send({type:"travel",place})}><Icon size={19}/>{PLACE_LABELS[place]}</button>)}</div>
        <div className={styles.controls}>
          <div className={styles.dpad} aria-label="移動控制">{[{label:"向上",x:0,y:-1,Icon:ArrowUp,position:"up"},{label:"向左",x:-1,y:0,Icon:ArrowLeft,position:"left"},{label:"向下",x:0,y:1,Icon:ArrowDown,position:"down"},{label:"向右",x:1,y:0,Icon:ArrowRight,position:"right"}].map(({label,x,y,Icon,position})=><button key={label} type="button" aria-label={label} className={styles[position]} disabled={!playable} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);bridge.current.direction={x,y};}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();bridge.current.direction={x,y};}}} onKeyUp={stop} onBlur={stop}><Icon size={20}/></button>)}</div>
          <p className={styles.controlHint}>點地面或按方向鍵移動<br/><kbd>W A S D</kbd> 也可以</p>
          <Button variant="secondary" disabled={!playable||(self?.place==="home"&&!isOwner)} onClick={()=>bridge.current.send({type:self?.place==="garden"?"attack":self?.place==="home"?"rest":"emote",...(self?.place==="street"?{value:"嗨！" as const}:{})} as GameAction)}>{self?.place==="garden"?<Sparkles size={18}/>:<Home size={18}/>}{self?.place==="garden"?"探索":self?.place==="home"?(self?.sleeping?"起床走走":"躺一下"):"打招呼"}</Button>
        </div>
        <div className={styles.emotes} aria-label="表情">{EMOTES.map(value=><button key={value} type="button" disabled={!playable} onClick={()=>bridge.current.send({type:"emote",value})}>{value}</button>)}</div>
        {status==="online"&&<div className={styles.ownerInfo}>{isOwner?<label className={styles.check}><input type="checkbox" checked={snapshot?.allowFollow??true} onChange={e=>bridge.current.send({type:"allowFollow",value:e.target.checked})}/>允許朋友一鍵來找我</label>:<><span>屋主{owner?.connected?`正在${PLACE_LABELS[owner.place]}`:"正在小屋睡覺"}</span><Button size="sm" variant="outline" disabled={!owner?.connected||!snapshot?.allowFollow||owner.sleeping} onClick={()=>bridge.current.send({type:"follow"})}>去找屋主</Button></>}</div>}
        {error&&<div className={styles.error} role="alert">{error}</div>}
      </section>
    </div>
    <footer className={styles.footer}><span>6w7 原創像素試作 · 角色與世界持續成長中</span><span>這是臨時試玩小屋，尚未綁定正式帳號。</span></footer>
  </main>;
}
