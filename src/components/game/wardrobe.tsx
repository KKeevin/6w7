"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Shirt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BODY_LABELS, BODY_TYPES, DEFAULT_APPEARANCE, HAIR_REGIONS, MUSCLES, OPTIONS, SKINS, type Appearance } from "@/shared/game/appearance";
import { drawCharacter, SPRITE_HEIGHT, SPRITE_WIDTH } from "./character-art";
import styles from "./wardrobe.module.css";

const TABS = ["身形", "臉與髮鬍", "體毛", "衣著", "配件"] as const;
const VIEWS = [0,3,1,2];
const VIEW_LABELS = ["正面", "右斜側", "背面", "左斜側"];
const COLORS = ["#f0ece1", "#303432", "#256f65", "#34445c", "#b65d48", "#d6ad67", "#839bba", "#b67b94"];
type ChoiceKey = keyof typeof OPTIONS;
type ColorKey = "hairColor" | "topColor" | "bottomColor" | "underwearColor" | "shoeColor" | "hatColor" | "accessoryColor";

export function CharacterPreview({ appearance, facing=0, className }: { appearance: Appearance; facing?: number; className?: string }) {
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const ctx=canvas.current?.getContext("2d");if(ctx)drawCharacter(ctx,appearance,0,facing);},[appearance,facing]);
  return <canvas ref={canvas} width={SPRITE_WIDTH} height={SPRITE_HEIGHT} className={className} role="img" aria-label={`${BODY_LABELS[appearance.body]}角色，${VIEW_LABELS[VIEWS.indexOf(facing)]}外觀預覽`}/>;
}
export function Wardrobe({ appearance:a, onChange, disabled=false }: { appearance:Appearance; onChange:(a:Appearance)=>void; disabled?:boolean }) {
  const dialog=useRef<HTMLDialogElement>(null);
  const settings=useRef<HTMLElement>(null);
  const [tab,setTab]=useState<typeof TABS[number]>("身形");
  const [view,setView]=useState(0);
  const [open,setOpen]=useState(false);
  const [original,setOriginal]=useState(a);
  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous;};
  },[open]);
  function launch(){setOriginal(a);setOpen(true);dialog.current?.showModal();}
  function close(){dialog.current?.close();setOpen(false);}
  function update(patch:Partial<Appearance>){onChange({...a,...patch});}
  function choice(key:ChoiceKey,label:string){return <fieldset className={styles.group}><legend>{label}</legend><div className={styles.choices}>{Object.entries(OPTIONS[key]).map(([value,text])=><button type="button" key={value} aria-pressed={a[key]===value} onClick={()=>update({[key]:value})}>{text}</button>)}</div></fieldset>;}
  function colors(key:ColorKey,label:string){return <fieldset className={styles.group}><legend>{label}</legend><div className={styles.colors}>{COLORS.map((color,i)=><button type="button" key={color} style={{background:color}} aria-label={`${label}配色 ${i+1}`} aria-pressed={a[key].toLowerCase()===color} onClick={()=>update({[key]:color})}>{a[key].toLowerCase()===color&&<Check size={14} style={{color:i===0?"#14212b":"white"}}/>}</button>)}<label className={styles.customColor}>自選<input aria-label={`${label}自選顏色`} type="color" value={a[key]} onChange={e=>update({[key]:e.target.value})}/></label></div></fieldset>;}
  return <>
    <Button className="w-full" disabled={disabled} onClick={launch}><Shirt size={17}/>打開造型工作室</Button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="wardrobe-title" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)}>
      {open&&<>
        <header className={styles.header}><div><p>6w7 · 你的造型工作室</p><h2 id="wardrobe-title">每一種你，都很好。</h2></div><button type="button" aria-label="關閉造型工作室" onClick={close}><X size={22}/></button></header>
        <div className={styles.layout}>
          <section className={styles.preview} aria-label="即時角色預覽">
            <div className={styles.previewMeta}><span>{BODY_LABELS[a.body]}</span><span>即時試穿</span></div>
            <CharacterPreview appearance={a} facing={VIEWS[view]} className={styles.character}/>
            <div className={styles.rotate}><button type="button" aria-label="向左旋轉角色" onClick={()=>setView((view+3)%4)}><ArrowLeft size={17}/></button><span>{VIEW_LABELS[view]}</span><button type="button" aria-label="向右旋轉角色" onClick={()=>setView((view+1)%4)}><ArrowRight size={17}/></button></div>
            <p>輪廓、衣著、細節，都由你決定。</p>
          </section>
          <div className={styles.editor}>
            <nav className={styles.tabs} aria-label="造型分類">{TABS.map(t=><button type="button" key={t} aria-pressed={t===tab} onClick={()=>{setTab(t);settings.current?.scrollTo(0,0);}}>{t}</button>)}</nav>
            <section ref={settings} className={styles.settings} aria-label={`${tab}設定`}>
              {tab==="身形"&&<>
                <fieldset className={styles.group}><legend>從喜歡的輪廓開始</legend><div className={styles.choices}>{BODY_TYPES.map(body=><button type="button" key={body} aria-pressed={a.body===body} onClick={()=>update({body})}>{BODY_LABELS[body]}</button>)}</div></fieldset>
                <fieldset className={styles.group}><legend>膚色</legend><div className={styles.colors}>{SKINS.map((color,skin)=><button type="button" key={color} style={{background:color}} aria-label={`膚色 ${skin+1}`} aria-pressed={a.skin===skin} onClick={()=>update({skin})}/>)}</div></fieldset>
                <p className={styles.hint}>以目前體型為基礎微調。先脫下上衣，更容易看清肌肉與胸腹線條。</p>
                {Object.entries(MUSCLES).map(([key,label])=>{const k=key as keyof typeof MUSCLES;return <label className={styles.slider} key={key}><span>{label}<output>{a[k]}</output></span><input type="range" min={0} max={100} value={a[k]} onChange={e=>update({[k]:Number(e.target.value)})}/></label>;})}
                <Button variant="ghost" size="sm" onClick={()=>update(Object.fromEntries(Object.keys(MUSCLES).map(k=>[k,DEFAULT_APPEARANCE[k as keyof typeof MUSCLES]])))}><RotateCcw size={14}/>重設身形微調</Button>
              </>}
              {tab==="臉與髮鬍"&&<>{choice("face","臉型")}{choice("hair","髮型")}{choice("beardStyle","鬍子")}{colors("hairColor","髮鬍與體毛顏色")}<p className={styles.hint}>帽子會蓋住部分髮型；可以到「配件」取下帽子查看。</p></>}
              {tab==="體毛"&&<>
                <fieldset className={styles.group}><legend>全部部位一起設定</legend><div className={styles.choices}>{["全部無毛","全部稀疏","全部適中","全部濃密"].map((label,value)=><button type="button" key={value} aria-pressed={Object.values(a.bodyHair).every(n=>n===value)} onClick={()=>update({bodyHair:{chest:value,belly:value,upperArm:value,forearm:value,thigh:value,calf:value}})}>{label}</button>)}</div></fieldset>
                <p className={styles.hint}>也可以分別調整。衣物遮住的體毛仍會保留設定。</p>
                {Object.entries(HAIR_REGIONS).map(([region,label])=>{const r=region as keyof typeof HAIR_REGIONS;return <fieldset className={styles.group} key={r}><legend>{label}</legend><div className={styles.choices}>{["無毛","稀疏","適中","濃密"].map((text,value)=><button type="button" key={value} aria-pressed={a.bodyHair[r]===value} onClick={()=>update({bodyHair:{...a.bodyHair,[r]:value}})}>{text}</button>)}</div></fieldset>;})}
              </>}
              {tab==="衣著"&&<>
                <Button variant="outline" size="sm" onClick={()=>update({top:"none",bottom:"none",shoes:"none",hat:"none",necklace:"none",accessory:"none",held:"none"})}>脫下外衣與配件，只留內褲</Button>
                {choice("top","上衣")}{colors("topColor","上衣顏色")}{choice("bottom","褲子")}{colors("bottomColor","褲子顏色")}{choice("underwear","內褲款式")}{colors("underwearColor","內褲顏色")}{choice("shoes","鞋子")}{colors("shoeColor","鞋子顏色")}
              </>}
              {tab==="配件"&&<>{choice("hat","帽子")}{colors("hatColor","帽子顏色")}{choice("necklace","項鍊")}{choice("accessory","身上配件")}{choice("held","手持物")}{colors("accessoryColor","配件顏色")}</>}
            </section>
          </div>
        </div>
        <footer className={styles.footer}><p>外觀自動儲存在此瀏覽器</p><div><Button variant="ghost" onClick={()=>{onChange(original);close();}}>還原本次調整</Button><Button onClick={close}><Check size={16}/>完成造型</Button></div></footer>
      </>}
    </dialog>
  </>;
}

