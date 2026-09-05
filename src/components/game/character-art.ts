import { SKINS, type Appearance } from "@/shared/game/appearance";

export const SPRITE_WIDTH = 192;
export const SPRITE_HEIGHT = 256;
type C = CanvasRenderingContext2D;
const INK = "#3b302c";
function tint(hex: string, n: number) {
  const v = parseInt(hex.slice(1), 16);
  return `rgb(${Math.min(255, Math.round((v >> 16) * n))},${Math.min(255, Math.round(((v >> 8) & 255) * n))},${Math.min(255, Math.round((v & 255) * n))})`;
}
function shape(c: C, fill: string, path: string, stroke = INK, width = 1.4) {
  const p = new Path2D(path); c.fillStyle = fill; c.fill(p);
  if (width) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
}
function ellipse(c: C, fill: string, x: number, y: number, rx: number, ry: number, outline = false) {
  c.beginPath(); c.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  if (outline) { c.strokeStyle = INK; c.lineWidth = 1.3; c.stroke(); }
}
function line(c: C, color: string, path: string, width = 1.2) { c.strokeStyle = color; c.lineWidth = width; c.stroke(new Path2D(path)); }
function rect(c: C, color: string, x: number, y: number, w: number, h: number) { c.fillStyle = color; c.fillRect(x, y, w, h); }
function hairPatch(c: C, color: string, density: number, x: number, y: number, rx: number, ry: number, seed: number) {
  if (!density) return;
  c.save(); c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();
  c.globalAlpha = .42 + density * .12;
  for (let i=0;i<density*19;i++) {
    const dx = ((i*37+seed*13)%101)/100*rx*2-rx, dy=((i*61+seed*7)%103)/102*ry*2-ry;
    line(c,color,`M${x+dx} ${y+dy}q-1 -2 1 -3`, .85);
  }
  c.restore();
}
/** Proportions are independent from outfit: clothing follows the same fitted silhouette. */
export function bodyDimensions(a: Appearance) {
  const base = { slim:[24,18,7,10], regular:[29,23,9,13], wolf:[32,22,11,14], muscle:[38,25,14,17], brawny:[39,34,14,19], round:[33,39,11,19] }[a.body];
  return { shoulder:base[0]+(a.shoulders-50)*.09, belly:base[1]+(a.bellySize-50)*.14,
    upper:base[2]+(a.biceps-50)*.065, rear:3+a.triceps*.045,
    forearm:base[2]*.68+2+(a.forearms-50)*.05, thigh:base[3]+(a.legs-50)*.065,
    chest:9+a.chestSize*.08, definition:a.definition/100 };
}

/** Original 192 × 256 layered sprite; the same renderer powers the wardrobe and world. */
export function drawCharacter(c: C, a: Appearance, frame=0, facing=0) {
  c.clearRect(0,0,SPRITE_WIDTH,SPRITE_HEIGHT); c.save();
  c.lineJoin="round";c.lineCap="round";
  const back=facing===1, profile=facing===2||facing===3;
  c.translate(96,0); if(facing===2)c.scale(-1,1); if(profile)c.scale(.76,1);
  const d=bodyDimensions(a), s=d.shoulder, b=d.belly, sk=SKINS[a.skin], sh=tint(sk,.77), soft=tint(sk,.9), hi=tint(sk,1.08), hair=a.hairColor;
  const stride=frame===1?3:frame===2?-3:0;
  // Back layers are behind every body part.
  if(a.hair==="long") shape(c,hair,"M-22 25Q-30 47 -24 82Q0 92 25 80L25 36Q20 10 0 12Q-17 12 -22 25Z");
  if(a.accessory==="backpack"&&!back) shape(c,a.accessoryColor,`M${-s-5} 82Q0 62 ${s+5} 82L${s+5} 139Q0 154 ${-s-5} 139Z`);
  // Legs retain knee, quadriceps, calf and ankle transitions instead of stacked blocks.
  for(const side of [-1,1]) {
    c.save();c.translate(side*(b*.48+1),side*stride);
    const t=d.thigh;
    shape(c,sk,`M${-t} 144Q${-t-3} 166 ${-t*.65} 191Q${-t*.85} 211 -7 232L9 233Q${t*.83} 216 ${t*.66} 195Q${t+3} 166 ${t} 145Z`);
    shape(c,sh,`M${t-4} 150Q${t+1} 174 ${t*.48} 193Q${t*.64} 215 6 232L10 230Q${t*.86} 212 ${t*.66} 191Q${t+2} 167 ${t} 150Z`,sh,0);
    ellipse(c,hi,-t*.25,172,t*.48,17);
    line(c,soft,`M${-t*.65} 160Q${-t*.35} 180 -3 186M3 198Q${t*.35} 211 2 225`,1.7);
    line(c,sh,"M-6 191Q0 194 6 190",1.1+d.definition);
    hairPatch(c,hair,a.bodyHair.thigh,0,171,t*.7,17,side+3);
    hairPatch(c,hair,a.bodyHair.calf,0,213,t*.46,15,side+9);
    if(a.bottom!=="none") {
      const short=a.bottom==="shorts", end=short?178:230, w=short?t+2:t*.7;
      shape(c,a.bottomColor,`M${-t-2} 144L${t+2} 144Q${t+4} 167 ${w} ${end}L${-w} ${end}Q${-t-3} 167 ${-t-2} 144Z`);
      line(c,tint(a.bottomColor,.65),`M${t-2} 154L${w-3} ${end-3}M${-w+2} ${end-3}L${w-2} ${end-3}`);
      line(c,tint(a.bottomColor,1.2),`M${-t+4} 153L${-w+4} ${end-8}`);
      if(a.bottom==="cargo") {rect(c,tint(a.bottomColor,.82),side<0?-t-2:3,174,t-1,20);line(c,INK,`M${side<0?-t:5} 178h${t-5}`);}
      if(a.bottom==="joggers")rect(c,tint(a.bottomColor,.7),-w,223,w*2,7);
    }
    shape(c,sk,"M-7 230Q-11 234 -12 242Q-3 247 12 243L12 235L7 231Z");
    if(a.shoes!=="none") {
      const boot=a.shoes==="boots", sandal=a.shoes==="sandals";
      if(!sandal)shape(c,a.shoeColor,`M-9 ${boot?217:233}L10 ${boot?217:233}L11 235Q18 239 15 245L-13 245Q-15 239 -9 235Z`);
      rect(c,tint(a.shoeColor,.65),-13,243,28,3);
      if(sandal){line(c,a.shoeColor,"M-9 234L8 241M9 234L-8 241",3);}
      else if(a.shoes==="sneakers"||boot){line(c,"#e7dbc5","M-6 236h13M-5 232h12",1.6);if(boot)line(c,"#a0a494","M-4 222h10M-4 227h10");}
    } else {line(c,sh,"M-7 240v3M-3 241v3M1 241v3M5 241v3",.7);}
    c.restore();
  }
  // Arms: independently adjustable deltoid, biceps, triceps and forearm lobes.
  for(const side of [-1,1]) {
    c.save();c.scale(side,1);c.translate(s-3,-side*stride);
    const u=d.upper,f=d.forearm,r=d.rear;
    shape(c,sk,`M-4 76Q${u} 68 ${u+9} 86Q${u+r+7} 102 ${u+6} 119Q${u+f+4} 135 ${u+5} 150L${u+4} 162Q${u-1} 169 ${u-7} 160L${u-9} 147Q${u-f-8} 134 0 118Q-10 104 -7 90Z`);
    shape(c,sh,`M${u+6} 86Q${u+r+6} 104 ${u+4} 120Q${u+f+2} 139 ${u+2} 153L${u-1} 159L${u+4} 159L${u+5} 149Q${u+f+4} 134 ${u+6} 119Q${u+r+7} 104 ${u+6} 86Z`,sh,0);
    ellipse(c,hi,u*.15+2,88,u*.62,10);
    ellipse(c,hi,u*.2+2,108,u*.6,10);
    c.save();c.globalAlpha=.25+d.definition*.6;
    line(c,sh,`M-2 94Q${u*.4} 99 ${u+4} 93M0 103Q-2 116 ${u*.6} 117M${u+6} 102Q${u+r+1} 111 ${u+3} 117M${u-4} 126Q${u*.2} 137 ${u} 146`,1.4);
    c.restore();
    hairPatch(c,hair,a.bodyHair.upperArm,u*.4,109,u*.7,12,side+4);
    hairPatch(c,hair,a.bodyHair.forearm,u*.55,138,f*.8,12,side+7);
    line(c,sh,`M${u-5} 155v6M${u-1} 156v7M${u+3} 155v5`,.8);
    if(["tee","shirt","hoodie","jacket"].includes(a.top)) {
      const long=a.top==="hoodie"||a.top==="jacket", end=long?148:106;
      shape(c,a.topColor,`M-7 78Q${u} 69 ${u+10} 87L${u+(long?8:10)} ${end}L${long?u-9:-2} ${end}L-7 90Z`);
      line(c,tint(a.topColor,.7),`M${long?u-8:0} ${end-4}h${long?15:u+7}`);
    }
    if(a.accessory==="watch"&&side===-1){rect(c,a.accessoryColor,u-9,146,17,5);rect(c,"#263f44",u-5,143,9,10);rect(c,"#b7d6cf",u-3,145,5,5);}
    if(a.accessory==="armband")line(c,a.accessoryColor,`M-1 113Q${u*.5} 118 ${u+8} 113`,4);
    if(side===1)drawHeld(c,a,u,158,back);
    c.restore();
  }
  // Continuous torso contour from trapezius through ribcage, waist and hips.
  const torso=`M-12 65Q${-s+7} 70 ${-s} 81Q${-s-3} 101 ${-b+2} 118Q${-b-6} 146 ${-b+5} 157Q0 166 ${b-5} 157Q${b+6} 146 ${b-2} 118Q${s+3} 101 ${s} 81Q${s-7} 70 12 65Z`;
  shape(c,sk,torso);
  c.save();c.clip(new Path2D(torso));
  shape(c,sh,`M${s-6} 73Q${s+3} 97 ${b-3} 119Q${b+6} 146 ${b-9} 157L${b+10} 167L${s+14} 78Z`,sh,0);
  ellipse(c,hi,-b*.12,133,b*.72,19);
  if(!back) {
    for(const side of [-1,1]) {
      ellipse(c,hi,side*s*.45,88,s*.43,d.chest);
      line(c,sh,`M${side*3} ${88+d.chest*.3}Q${side*s*.45} ${91+d.chest} ${side*(s-5)} ${88+d.chest*.6}`,1+d.definition);
      ellipse(c,tint(sk,.58),side*s*.57,96,2.2,1.4);
    }
    line(c,soft,`M-11 73L-24 79M11 73L24 79M0 80v15`,1.4);
    if(b<31){c.save();c.globalAlpha=d.definition*.75;for(let i=0;i<3;i++){const y=111+i*12;line(c,sh,`M-3 ${y}Q-9 ${y+3} -13 ${y}M3 ${y}Q9 ${y+3} 13 ${y}M0 ${y-3}v7`);}c.restore();}
    line(c,sh,`M${-b*.65} 149Q0 159 ${b*.65} 149`,1.2);
    ellipse(c,sh,0,142,1.4,2);
    hairPatch(c,hair,a.bodyHair.chest,0,94,s*.69,17,12);
    hairPatch(c,hair,a.bodyHair.belly,0,134,b*.5,17,6);
  } else {
    line(c,sh,`M0 77v57M-5 85Q${-s*.65} 77 ${-s*.7} 101M5 85Q${s*.65} 77 ${s*.7} 101M${-b*.5} 130L-4 144M${b*.5} 130L4 144`,1.4);
  }
  c.restore();
  // Underwear remains the minimum layer. Outer trousers occlude it completely.
  const briefs=a.underwear==="briefs";
  if(a.bottom==="none") { shape(c,a.underwearColor,briefs?`M${-b+4} 151Q0 158 ${b-4} 151L${b-7} 163Q13 167 7 177L-7 177Q-13 167 ${-b+7} 163Z`:`M${-b+4} 151Q0 158 ${b-4} 151L${b-3} 179L5 179L0 173L-5 179L${-b+3} 179Z`);
  line(c,tint(a.underwearColor,.7),`M${-b+5} 156Q0 162 ${b-5} 156M0 163v10`); }
  if(a.bottom!=="none") {shape(c,a.bottomColor,`M${-b+2} 151Q0 157 ${b-2} 151L${b} 170L5 174L0 169L-5 174L${-b} 170Z`);line(c,tint(a.bottomColor,.6),`M${-b+4} 155Q0 161 ${b-4} 155M0 161v9`);rect(c,"#d7c298",-3,154,6,4);}
  if(a.top!=="none") {
    c.save();c.clip(new Path2D(torso));
    if(a.top==="tank")shape(c,a.topColor,`M${-s+8} 72L-15 72Q0 101 15 72L${s-8} 72Q${s-15} 95 ${s+3} 109L${b+5} 155Q0 166 ${-b-5} 155L${-s-3} 109Q${-s+15} 95 ${-s+8} 72Z`);
    else {shape(c,a.topColor,torso); if(a.top==="shirt"||a.top==="jacket") {shape(c,sk,"M-10 67L10 67L12 156L-12 156Z");shape(c,tint(a.topColor,1.15),"M-11 68L-21 79L-13 91L-5 76Z");shape(c,tint(a.topColor,1.15),"M11 68L21 79L13 91L5 76Z");}else {line(c,tint(a.topColor,.65),"M-13 69Q0 86 13 69",2);}}
    line(c,tint(a.topColor,.78),`M${-b+7} 147Q0 153 ${b-7} 147M${s-6} 107l-5 14M${-s+6} 110l4 13`,1.4);
    if(a.top==="hoodie"){line(c,"#d8d0c1","M-9 80v23M9 80v23",2);line(c,tint(a.topColor,.65),"M-17 125L-22 139Q0 146 22 139L17 125Z",1.5);}
    c.restore();
  }
  // Neck and head. Face shape changes the jaw, cheek width and chin, not just a label.
  shape(c,sk,"M-11 54L11 54L14 72Q0 81 -14 72Z");
  const fw=a.face==="round"?23:a.face==="square"?22:a.face==="long"?17:19;
  const chin=a.face==="oval"?8:a.face==="round"?15:a.face==="square"?17:10;
  const head=`M${-fw} 30Q${-fw} 14 0 14Q${fw} 14 ${fw} 30L${fw-1} 49Q${fw-3} 58 ${chin} 62Q0 68 ${-chin} 62Q${-fw+3} 58 ${-fw+1} 49Z`;
  ellipse(c,sk,-fw,42,4,7,true);ellipse(c,sk,fw,42,4,7,true);shape(c,sk,head);
  line(c,sh,`M${fw-3} 31v18Q${fw-6} 57 6 61`,2.6);
  if(a.hair!=="bald") {
    const h=a.hair;
    if(h==="buzz") {shape(c,hair,`M${-fw} 34L${-fw} 27Q${-fw+2} 13 0 14Q${fw-2} 13 ${fw} 27L${fw} 34Q0 24 ${-fw} 34Z`);for(let i=0;i<24;i++)rect(c,tint(hair,1.6),-16+(i*7)%32,21+(i*3)%8,1,1);}
    else {
      const fringe=h==="fringe"?`Q13 44 1 31Q-6 43 ${-fw} 35`:h==="parted"?`Q7 36 0 23Q-8 37 ${-fw} 35`:`L14 27L5 29L-3 25L-13 30L${-fw} 37`;
      shape(c,hair,`M${-fw} 40L${-fw-1} 25Q-16 9 -5 12Q3 6 13 14Q${fw+5} 14 ${fw+1} 35L${fw-2} 42L${fw-3} 29${fringe}Z`);
      line(c,tint(hair,1.7),"M-15 23Q-7 15 1 17M4 18Q12 16 17 23",1);
      if(h==="bun"){ellipse(c,hair,1,12,10,8,true);line(c,"#98764f","M-7 16h16",2);}
      if(h==="curls")for(let i=0;i<7;i++)ellipse(c,i%2?hair:tint(hair,1.3),-21+i*7,21+(i%2)*4,6,7,true);
    }
  }
  if(back) {
    if(a.hair!=="bald")shape(c,hair,`M${-fw} 29Q0 20 ${fw} 29L${fw-2} 52Q0 63 ${-fw+2} 52Z`);
  } else {
    const shift=profile?6:0;c.save();c.translate(shift,0);
    line(c,hair,"M-15 37l9 -1M6 36l9 1",2);
    for(const side of [-1,1]){ellipse(c,"#fcf0d9",side*10,41,4.4,2);rect(c,"#302c28",side*10-1,40,2,3);}
    line(c,sh,"M1 41L3 48L-2 49",1.3);
    line(c,"#995f51","M-5 55Q0 57 5 54",1.2);
    if(a.beardStyle==="full"||a.beardStyle==="short") {
      const len=a.beardStyle==="full"?13:5;
      shape(c,hair,`M${-fw+2} 46L-13 52L-7 50Q0 48 7 50L13 52L${fw-2} 46L${fw-4} 59Q12 ${64+len} 0 ${65+len}Q-12 ${64+len} ${-fw+4} 59Z`);
      shape(c,sk,"M-7 54Q0 50 7 54L5 58L-5 58Z",sk,0);line(c,"#efe0c5","M-4 55h8",1.4);
      for(let i=0;i<8;i++)line(c,tint(hair,1.5),`M${-12+i*3} 62l1 ${len*.5}`, .7);
    } else if(a.beardStyle==="stubble")hairPatch(c,hair,3,0,59,17,7,31);
    else if(a.beardStyle==="goatee") {shape(c,hair,"M-6 59L6 59L5 69L0 73L-5 69Z");line(c,hair,"M-6 52Q0 49 6 52",2.5);}
    else if(a.beardStyle==="handlebar")line(c,hair,"M0 52Q-10 58 -13 51M0 52Q10 58 13 51",3);
    else if(a.beardStyle==="pencil")line(c,hair,"M-7 52Q0 50 7 52",1.8);
    if(a.accessory==="glasses") {line(c,a.accessoryColor,"M-18 38h14v10h-14ZM4 38h14v10H4ZM-4 41H4",1.7);}
    c.restore();
  }
  if(a.necklace!=="none") {
    line(c,a.accessoryColor,a.necklace==="choker"?"M-12 70Q0 75 12 70":"M-14 73Q-10 88 0 91Q10 88 14 73",a.necklace==="choker"?3:1.8);
    if(a.necklace==="pendant"&&!back)shape(c,a.accessoryColor,"M0 88L4 94L0 100L-4 94Z",INK,.8);
  }
  if(a.accessory==="crossbody") {line(c,a.accessoryColor,`M${-s+6} 75L${b-5} 145`,5);shape(c,a.accessoryColor,`M${b-17} 128L${b+6} 128L${b+6} 151L${b-17} 151Z`);line(c,tint(a.accessoryColor,.6),`M${b-15} 134h19`);}
  if(a.accessory==="backpack") {
    if(back) {shape(c,a.accessoryColor,"M-25 88Q0 75 25 88L27 143Q0 155 -27 143Z");shape(c,tint(a.accessoryColor,.8),"M-20 117H20V140H-20Z");}
    else {line(c,a.accessoryColor,`M${-s+8} 77L${-s+10} 111M${s-8} 77L${s-10} 111`,4);}
  }
  drawHat(c,a,fw);
  c.restore();
}
function drawHat(c:C,a:Appearance,fw:number) {
  const color=a.hatColor;
  if(a.hat==="none")return;
  if(a.hat==="cap") {shape(c,color,`M${-fw-2} 28Q${-fw} 8 0 9Q${fw} 8 ${fw+2} 28Z`);shape(c,tint(color,.8),`M-5 26Q25 22 35 29L32 33L-5 31Z`);line(c,tint(color,1.4),"M0 12v12");}
  if(a.hat==="beanie") {shape(c,color,`M${-fw-3} 30Q${-fw-4} 4 0 6Q${fw+4} 4 ${fw+3} 30Z`);rect(c,tint(color,.8),-fw-3,25,fw*2+6,8);for(let i=-fw+2;i<fw;i+=5)line(c,tint(color,1.3),`M${i} 18v11`,.8);}
  if(a.hat==="bucket") {shape(c,color,`M-18 10L18 10L23 27L30 36Q0 43 -30 36L-23 27Z`);line(c,tint(color,.7),"M-23 27Q0 31 23 27");}
  if(a.hat==="cowboy") {shape(c,color,"M-20 27L-17 8Q-8 4 0 13Q8 4 17 8L20 27Q32 33 35 24Q41 41 0 38Q-41 41 -35 24Q-32 33 -20 27Z");line(c,tint(color,.6),"M-20 25Q0 30 20 25",3);}
}
function drawHeld(c:C,a:Appearance,x:number,y:number,back:boolean) {
  const color=a.accessoryColor;c.save();c.translate(x+3,y-4);
  if(a.held==="coffee") {shape(c,"#f3e4cc","M0 -12H13L11 8H2Z");rect(c,"#6b4c3b",-1,-14,15,4);rect(c,color,2,-4,9,7);}
  if(a.held==="bottle") {shape(c,"#91bcb0","M3 -20H10V-15L14 -11V11H0V-11L3 -15Z");rect(c,color,3,-23,7,4);line(c,"#e7f2df","M3 -8v14",2);}
  if(a.held==="tote") {line(c,color,"M0 10V0Q10 -10 20 0V10",2);shape(c,color,"M-4 8H24L27 38H-7Z");line(c,tint(color,.75),"M1 14v17M18 14v17");}
  if(a.held==="dumbbell") {rect(c,"#9faaa4",-5,-2,27,5);for(const x0 of [-10,20]){shape(c,"#384747",`M${x0} -11h8v24h-8Z`);rect(c,"#637776",x0+2,-8,2,17);}}
  if(a.held==="sword") {shape(c,"#c4d4cf","M5 -9L3 -46L8 -58L13 -46L11 -9Z");line(c,"#f1f7e8","M8 -49v35");rect(c,color,-1,-11,18,4);rect(c,"#765c45",5,-6,6,14);}
  if(back&&a.held!=="none")line(c,"#746254","M0 0h5",2);
  c.restore();
}
