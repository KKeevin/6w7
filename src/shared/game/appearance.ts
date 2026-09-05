import { z } from "zod";

export const BODY_TYPES = ["slim", "regular", "wolf", "muscle", "brawny", "round"] as const;
export const BODY_LABELS = { slim: "纖瘦", regular: "勻稱", wolf: "精實", muscle: "健壯", brawny: "胖壯", round: "圓潤" } as const;
export const SKINS = ["#e9b78f", "#cb8c62", "#9a6248", "#f2ceb0", "#754a38", "#b87957", "#e5c2aa", "#543a30"] as const;
export const SHORTS = ["#256f65", "#34445c", "#b65d48", "#777347"] as const;
export const OPTIONS = {
  face: { oval: "瓜子臉", round: "圓臉", square: "方臉", long: "長臉" },
  hair: { crop: "短碎髮", bald: "光頭", buzz: "寸頭", bun: "武士頭", fringe: "韓式劉海", parted: "中分", curls: "捲髮", long: "及肩長髮" },
  beardStyle: { none: "無鬍", stubble: "鬍渣", full: "濃密全鬍", short: "短全鬍", handlebar: "八字鬍", pencil: "小鬍子", goatee: "山羊鬍" },
  top: { none: "不穿上衣", tee: "短袖 T 恤", tank: "背心", shirt: "開襟襯衫", hoodie: "連帽上衣", jacket: "短外套" },
  bottom: { none: "只穿內褲", shorts: "休閒短褲", trousers: "長褲", cargo: "工裝褲", joggers: "束口褲" },
  underwear: { briefs: "三角內褲", boxers: "四角內褲" },
  shoes: { none: "赤腳", sneakers: "球鞋", boots: "靴子", sandals: "涼鞋", loafers: "休閒鞋" },
  hat: { none: "不戴帽", cap: "棒球帽", beanie: "毛帽", bucket: "漁夫帽", cowboy: "牛仔帽" },
  necklace: { none: "不戴項鍊", chain: "細鍊", pendant: "墜飾項鍊", choker: "短頸鍊" },
  accessory: { none: "無配件", glasses: "眼鏡", watch: "手錶", armband: "臂環", crossbody: "斜背包", backpack: "後背包" },
  held: { none: "空手", coffee: "咖啡", bottle: "水壺", tote: "提袋", dumbbell: "啞鈴", sword: "冒險短劍" },
} as const;
export const HAIR_REGIONS = { chest: "胸毛", belly: "肚毛", upperArm: "上臂", forearm: "前臂", thigh: "大腿", calf: "小腿" } as const;
export const MUSCLES = { shoulders: "三角肌／肩寬", biceps: "二頭肌", triceps: "三頭肌", forearms: "前臂肌", chestSize: "胸部厚度", bellySize: "腹部飽滿度", legs: "腿部圍度", definition: "肌肉線條" } as const;
const amount = z.int().min(0).max(100);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const appearanceSchema = z.object({
  version: z.literal(2), body: z.enum(BODY_TYPES), skin: z.int().min(0).max(SKINS.length - 1),
  face: z.enum(["oval", "round", "square", "long"]),
  hair: z.enum(["crop", "bald", "buzz", "bun", "fringe", "parted", "curls", "long"]),
  beardStyle: z.enum(["none", "stubble", "full", "short", "handlebar", "pencil", "goatee"]),
  hairColor: color, topColor: color, bottomColor: color, underwearColor: color, shoeColor: color, hatColor: color, accessoryColor: color,
  top: z.enum(["none", "tee", "tank", "shirt", "hoodie", "jacket"]),
  bottom: z.enum(["none", "shorts", "trousers", "cargo", "joggers"]), underwear: z.enum(["briefs", "boxers"]),
  shoes: z.enum(["none", "sneakers", "boots", "sandals", "loafers"]), hat: z.enum(["none", "cap", "beanie", "bucket", "cowboy"]),
  necklace: z.enum(["none", "chain", "pendant", "choker"]), accessory: z.enum(["none", "glasses", "watch", "armband", "crossbody", "backpack"]),
  held: z.enum(["none", "coffee", "bottle", "tote", "dumbbell", "sword"]),
  shoulders: amount, biceps: amount, triceps: amount, forearms: amount, chestSize: amount, bellySize: amount, legs: amount, definition: amount,
  bodyHair: z.object({ chest: z.int().min(0).max(3), belly: z.int().min(0).max(3), upperArm: z.int().min(0).max(3), forearm: z.int().min(0).max(3), thigh: z.int().min(0).max(3), calf: z.int().min(0).max(3) }).strict(),
}).strict();
export type Appearance = z.infer<typeof appearanceSchema>;
export const DEFAULT_APPEARANCE: Appearance = {
  version: 2, body: "brawny", skin: 0, face: "square", hair: "crop", beardStyle: "full", hairColor: "#303432",
  top: "none", bottom: "shorts", underwear: "briefs", shoes: "boots", hat: "none", necklace: "none", accessory: "none", held: "none",
  topColor: "#eee5d5", bottomColor: "#256f65", underwearColor: "#f0ece1", shoeColor: "#34443e", hatColor: "#b87750", accessoryColor: "#bda270",
  shoulders: 50, biceps: 50, triceps: 50, forearms: 50, chestSize: 50, bellySize: 50, legs: 50, definition: 65,
  bodyHair: { chest: 2, belly: 1, upperArm: 0, forearm: 1, thigh: 0, calf: 1 },
};
const legacy = z.object({ body: z.enum(["brawny", "muscle", "round", "wolf"]), skin: z.int().min(0).max(3), shorts: z.int().min(0).max(3), beard: z.boolean() }).strict();
/** Only local saves accept v1; network input must pass the current strict schema. */
export function readAppearance(value: unknown): Appearance | null {
  const current = appearanceSchema.safeParse(value);
  if (current.success) return current.data;
  const old = legacy.safeParse(value);
  return old.success ? { ...DEFAULT_APPEARANCE, body: old.data.body, skin: old.data.skin, bottomColor: SHORTS[old.data.shorts], beardStyle: old.data.beard ? "full" : "none", bodyHair: { ...DEFAULT_APPEARANCE.bodyHair } } : null;
}
export function appearanceKey(a: Appearance): string {
  // Canonical field ordering, including nested hair settings, avoids cache misses after migrations.
  return JSON.stringify(appearanceSchema.parse(a));
}
