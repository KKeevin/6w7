import { type Place } from "@/shared/game/protocol";

type Ctx = CanvasRenderingContext2D;
function box(c: Ctx, color: string, x: number, y: number, w: number, h: number) { c.fillStyle = color; c.fillRect(x, y, w, h); }
function poly(c: Ctx, color: string, points: number[][]) {
  c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
}
function shade(hex: string, factor: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round((n >> 16) * factor)},${Math.round(((n >> 8) & 255) * factor)},${Math.round((n & 255) * factor)})`;
}

export { drawCharacter as drawBear } from "./character-art";

function label(c: Ctx, text: string, x: number, y: number, size = 18, color = "#35463d") {
  c.fillStyle = color; c.font = `700 ${size}px system-ui, sans-serif`; c.textAlign = "center"; c.fillText(text, x, y);
}
function plant(c: Ctx, x: number, y: number, scale=1) {
  c.save(); c.translate(x,y); c.scale(scale,scale);
  box(c,"#bb7755",-13,-20,26,23);box(c,"#d49a6c",-17,-24,34,8);box(c,"#446e4e",-3,-69,6,45);
  for(const [dx,dy] of [[-22,-63],[3,-76],[-27,-43],[4,-53]]) {
    box(c,"#427555",dx,dy,23,13);box(c,"#6e9870",dx+3,dy-4,16,7);
  }
  c.restore();
}
function tree(c: Ctx,x:number,y:number) {
  box(c,"#6c6246",x-9,y-60,18,65);box(c,"#8b7b50",x-5,y-60,6,62);
  poly(c,"#385e49",[[x-65,y-35],[x-75,y-70],[x-57,y-113],[x-24,y-135],[x+20,y-139],[x+62,y-115],[x+75,y-75],[x+56,y-36]]);
  poly(c,"#4e8058",[[x-62,y-61],[x-57,y-100],[x-24,y-126],[x+17,y-128],[x+51,y-104],[x+61,y-70],[x+27,y-48],[x-20,y-50]]);
  box(c,"#719666",x-29,y-114,32,8);box(c,"#719666",x-46,y-96,18,7);
}
export function drawMap(c: Ctx, place: Place) {
  c.clearRect(0,0,960,720);
  if(place === "home") {
    box(c,"#d7c3a4",0,0,960,720);
    for(let y=200;y<720;y+=42) for(let x=-((y/42)%2)*90;x<960;x+=180) {
      box(c,(Math.floor(x+y)%3===0)?"#d9bd94":"#e2c9a5",x+2,y+2,176,38);
      box(c,"#c9aa84",x+9,y+30,65,2);
    }
    box(c,"#f2ecda",0,0,960,194);box(c,"#b49473",0,194,960,12);box(c,"#e7d7bb",0,185,960,9);
    // Window overlooking the garden.
    box(c,"#b49576",335,33,220,133);box(c,"#f8efdb",341,39,208,121);box(c,"#a6c8bd",350,48,190,103);
    box(c,"#e4dfb2",350,107,190,44);box(c,"#76976c",350,133,190,18);
    box(c,"#faf0d6",440,44,8,112);box(c,"#faf0d6",347,96,196,7);
    box(c,"#d6a37e",317,32,20,146);box(c,"#d6a37e",555,32,20,146);
    // Bed, pillow and quilt (collision coordinates live in shared protocol).
    box(c,"#6f6051",85,210,160,180);box(c,"#aa8464",91,213,148,166);
    box(c,"#f3ead6",98,222,134,147);box(c,"#fffae8",109,226,111,40);
    box(c,"#457c70",98,272,134,99);box(c,"#609688",104,278,122,82);
    for(let x=106;x<224;x+=23) box(c,"#82aa94",x,278,3,82);
    box(c,"#bbd0ae",98,267,134,13);
    // Rug and coffee table.
    box(c,"#bca887",330,382,245,166);box(c,"#f1e2bd",336,386,233,158);
    for(let x=343;x<568;x+=14) {box(c,"#b96e56",x,396,5,7);box(c,"#b96e56",x,525,5,7);}
    box(c,"#d7bc91",360,425,188,74);box(c,"#ac8764",365,485,178,8);
    box(c,"#4a6c59",395,435,43,28);box(c,"#ede8ca",399,438,35,3);
    box(c,"#fcf0d5",484,440,17,19);box(c,"#9b6b4e",487,440,11,5);
    // Sofa.
    box(c,"#876f56",650,222,195,82);box(c,"#a0ad8a",652,210,191,77);
    box(c,"#bbc5a0",661,219,173,55);box(c,"#899b79",746,225,5,48);
    box(c,"#e1b57f",670,225,39,32);box(c,"#cf8566",789,225,32,34);
    box(c,"#a0ad8a",645,240,20,49);box(c,"#a0ad8a",832,240,20,49);
    // Desk.
    box(c,"#785a43",610,463,175,65);box(c,"#bd946c",604,447,187,17);
    box(c,"#36443e",671,380,71,60);box(c,"#85b8a2",677,386,59,43);box(c,"#36443e",699,438,14,9);
    box(c,"#efe4cc",660,465,70,8);plant(c,771,445,.6);
    box(c,"#b18661",390,236,115,60);box(c,"#ecd5ad",386,227,123,14);
    plant(c,290,260);plant(c,867,400,1.2);
    box(c,"#c6a479",93,38,139,112);box(c,"#f4ead1",100,45,125,98);
    label(c,"6w7",162,96,34,"#427668");label(c,"好好過日子",162,123,12);
    box(c,"#b58b65",710,58,119,8);box(c,"#e39a7c",724,21,20,37);box(c,"#6c8e73",750,29,14,29);box(c,"#d1be8f",770,17,24,41);
    box(c,"#6c7860",417,667,125,42);label(c,"出門散步 ↓",480,695,16,"#fff4d7");
  } else {
    box(c,place === "street"?"#a7b88d":"#93ae7e",0,0,960,720);
    for(let i=0;i<380;i++){const x=(i*73)%960,y=(i*137)%720;box(c,i%3?"#8da77a":"#bfd19a",x,y,3,6);}
    box(c,"#ddcfaa",328,0,287,720);
    for(let y=10;y<720;y+=46) for(let x=337;x<610;x+=68){box(c,"#e9dec0",x,y,58,36);box(c,"#cbbd98",x,y+35,58,2);}
    if(place==="street") {
      box(c,"#c9b494",0,326,960,112);box(c,"#e3d3b2",0,332,960,96);
      for(const [x,w,color,title] of [[55,255,"#477c6a","好日便利店"],[625,270,"#b97152","熊力健身房"]] as const){
        box(c,"#82775c",x+7,154,w,163);box(c,"#f0e3bd",x,140,w,167);
        box(c,color,x-9,101,w+18,68);box(c,shade(color,.77),x-9,157,w+18,13);
        label(c,title,x+w/2,145,24,"#fff0d3");
        box(c,"#b3c7b7",x+18,192,80,91);box(c,"#fbefd0",x+53,190,6,95);
        box(c,"#576c60",x+w-90,184,66,124);box(c,"#92b5a0",x+w-82,191,50,76);
        box(c,"#f1dab0",x+w-40,275,5,5);plant(c,x+121,304,.7);
      }
      for(let y=465;y<510;y+=15) box(c,"#aa835c",645,y,145,10);
      box(c,"#5a6652",654,510,9,14);box(c,"#5a6652",768,510,9,14);
      tree(c,164,585);tree(c,863,606);plant(c,284,295,1.1);
      box(c,"#4a6855",453,75,8,65);box(c,"#f6e9c6",409,59,110,40);label(c,"林地 ↑",464,85,18);
      label(c,"慢慢走，也很好。",480,675,20,"#6f795d");
    } else {
      tree(c,124,259);tree(c,820,267);tree(c,813,582);tree(c,90,590);tree(c,229,132);tree(c,712,104);
      box(c,"#7b9a77",230,440,76,35);box(c,"#a6b09a",235,429,64,34);box(c,"#bdc5ac",244,431,40,9);
      for(const [x,y] of [[240,310],[710,390],[268,591],[655,608]]) {
        box(c,"#eee1b5",x-3,y-3,8,19);box(c,"#bb7055",x-13,y-12,29,14);box(c,"#e5b983",x-8,y-16,18,6);box(c,"#f7eac5",x-5,y-10,5,4);
      }
      box(c,"#627c57",421,71,118,52);label(c,"蘑菇林地",480,103,20,"#fff0d0");
      label(c,"一起探索，把小星星帶回家。",480,680,18,"#536e4e");
    }
  }
}
