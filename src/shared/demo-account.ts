import { BRAND } from "@/shared/tools";
import type { PublicSticker } from "@/shared/page-stickers";
import { DEFAULT_LOCALE, type Locale } from "@/shared/i18n";
import {
  DEMO_MESSAGE_I18N,
  DEMO_PROMPT_I18N,
  type DemoMessageId,
} from "@/shared/demo-account.i18n";

/** 示範帳號走與正式登入相同的網址，不使用 /demo 前綴 */
export const DEMO_ENTER_PATH = "/api/v1/auth/demo" as const;

/** 示範帳號裝扮圖檔壽命（官方頭貼 profile.png 不適用） */
export const DEMO_MEDIA_TTL_MS = 30 * 60 * 1000;

/** 示範沙盒 cookie：同一 @lewanq、每個瀏覽器一份 overlay */
export const DEMO_SANDBOX_COOKIE = "6w7_demo_sandbox";

export const DEMO_PROFILE = {
  username: "lewanq",
  displayName: "樂玩ㄑ小編",
  prompt: "想問想說，隨你高興：D",
  acceptingMessages: true,
  requireTopic: false,
  topics: [] as readonly string[],
  publicPath: "/lewanq",
  dashboardPath: "/dashboard",
  inboxPath: "/inbox",
  settingsPath: "/settings",
} as const;

export type { DemoMessageId };

export type DemoMessage = {
  id: DemoMessageId;
  isRead: boolean;
  isFeatured: boolean;
  isArchived: boolean;
  createdAt: string;
  title: string;
  body: string;
};

export const DEMO_MESSAGES: DemoMessage[] = [
  {
    id: "study-night-owl",
    isRead: true,
    isFeatured: true,
    isArchived: false,
    createdAt: "2026-08-12T21:18:00+08:00",
    title: "去日本會不會吃回來更圓",
    body: "限動存檔好像在查機票。我是喜胖壯的，你如果去吃一圈回來更大隻我反而開心。是去玩嗎，大阪還是東京，想先心理準備要不要跟風。",
  },
  {
    id: "study-group-project",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-11T14:02:00+08:00",
    title: "新工作還順利嗎",
    body: "不是要八卦，就是覺得你最近比較少po文。如果是加班也要照顧自己身體喔。",
  },
  {
    id: "love-distance",
    isRead: false,
    isFeatured: true,
    isArchived: false,
    createdAt: "2026-08-10T22:41:00+08:00",
    title: "上次在台北車站看到你耶",
    body: "週五傍晚一號出口，灰色寬T那個，肩膀把衣服撐滿，大隻很好認。當下想叫又怕認錯。如果是你，那天趕車嗎，看起來很急。",
  },
  {
    id: "love-friend-crush",
    isRead: false,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-09T19:27:00+08:00",
    title: "拜託不要瘦好不好",
    body: "看你有在練，我本來就喜歡胖壯熊。保持現在這樣就好，肚、肩、整個人的份量都剛好。",
  },
  {
    id: "daily-family-dinner",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-08T18:05:00+08:00",
    title: "最近限動很少是不是很累",
    body: "以前幾乎每天都能看到你出沒，這週突然安靜。是加班還是懶得發。沒別的意思，就是喜熊的人會想確認你還在。",
  },
  {
    id: "daily-phone-habit",
    isRead: true,
    isFeatured: true,
    isArchived: false,
    createdAt: "2026-08-07T23:55:00+08:00",
    title: "香噴噴熊熊",
    body: "好讚好愛",
  },
  {
    id: "work-first-job",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-06T12:16:00+08:00",
    title: "週末要不要吃飯",
    body: "週六我真的不知道要幹嘛。如果你沒事，可以一起吃飯。",
  },
  {
    id: "work-meeting-quiet",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-05T09:44:00+08:00",
    title: "那間深夜拉麵你還會去嗎",
    body: "你之前限動好像有發文。我後來自己去吃，人很多。還常去的話想知道，有更推的也可以說。",
  },
  {
    id: "honest-compare",
    isRead: true,
    isFeatured: true,
    isArchived: false,
    createdAt: "2026-08-04T20:08:00+08:00",
    title: "你是真的算熱量還是該吃還是吃",
    body: "有在練的人有兩種，一種秤雞胸，一種練完去吃拉麵。你看起來兩個都像，想知道平常到底怎麼吃。",
  },
  {
    id: "honest-apology",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-03T16:33:00+08:00",
    title: "便利商店那次是你吧",
    body: "東區那間，大隻的你在加熱關東煮，我站後面看很久都沒出聲。隔天才敢用匿名問。認錯的話當我眼瞎，那體型真的很像你。",
  },
  {
    id: "study-major-switch",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-02T11:21:00+08:00",
    title: "圓臉韓系劉海更可愛了",
    body: "不是很確定你有沒有剪，就是感覺更圓、更好認。如果是新剪的，哪間可以講嗎。",
  },
  {
    id: "daily-alone-weekend",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-01T15:47:00+08:00",
    title: "你是不是要搬家",
    body: "如果是真的，新的地方遠嗎。如果是要搬家，可以一起搬嗎。",
  },
  {
    id: "work-feedback",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-07-31T10:09:00+08:00",
    title: "回家會待很久嗎",
    body: "看你之前有提過要回去一趟。家裡如果一直叫你少吃，你回來可別真的瘦了。人在外面被問這個超煩的話。",
  },
  {
    id: "love-pace",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-07-30T21:02:00+08:00",
    title: "你是哪裡人呀",
    body: "一直以為你是台中人",
  },
];

export function demoMessageBody(message: DemoMessage) {
  return `${message.title}\n\n${message.body}`;
}

export function getDemoPrompt(locale: Locale = DEFAULT_LOCALE) {
  if (locale === "zh-Hant") return DEMO_PROFILE.prompt;
  return DEMO_PROMPT_I18N[locale];
}

export function localizeDemoMessage(
  message: DemoMessage,
  locale: Locale = DEFAULT_LOCALE,
): DemoMessage {
  if (locale === "zh-Hant") return message;
  const copy = DEMO_MESSAGE_I18N[locale][message.id];
  return { ...message, title: copy.title, body: copy.body };
}

export function getLocalizedDemoMessages(locale: Locale = DEFAULT_LOCALE) {
  return DEMO_MESSAGES.map((message) => localizeDemoMessage(message, locale));
}

export function getDemoMessage(
  id: string,
  locale: Locale = DEFAULT_LOCALE,
): DemoMessage | undefined {
  const message = DEMO_MESSAGES.find((m) => m.id === id);
  if (!message) return undefined;
  return localizeDemoMessage(message, locale);
}

export function demoMessagePath(id: string): string {
  return `${DEMO_PROFILE.inboxPath}/${id}`;
}

export function demoPublicUrl(): string {
  return `https://${BRAND.domain}${DEMO_PROFILE.publicPath}`;
}

export function isDemoUsername(slug: string) {
  return slug.trim().toLowerCase() === DEMO_PROFILE.username;
}

export function getDemoShareProfile(locale: Locale = DEFAULT_LOCALE) {
  return {
    user: {
      id: "demo",
      username: DEMO_PROFILE.username,
      name: DEMO_PROFILE.displayName,
      image: null as string | null,
    },
    link: {
      id: "demo",
      slug: DEMO_PROFILE.username,
      title: "匿名問我",
      prompt: getDemoPrompt(locale),
      acceptingMessages: DEMO_PROFILE.acceptingMessages,
      url: demoPublicUrl(),
      topics: [] as string[],
      requireTopic: false,
    },
    stickers: [] as PublicSticker[],
  };
}

export function toInboxDemoMessages(
  locale: Locale = DEFAULT_LOCALE,
): InboxMessageShape[] {
  return getLocalizedDemoMessages(locale).map((m) => ({
    id: m.id,
    body: demoMessageBody(m),
    topic: null,
    isRead: m.isRead,
    isFeatured: m.isFeatured,
    isArchived: m.isArchived,
    status: "visible",
    createdAt: m.createdAt,
    link: {
      id: "demo",
      slug: DEMO_PROFILE.username,
      title: "匿名問我",
    },
  }));
}

type InboxMessageShape = {
  id: string;
  body: string;
  topic: string | null;
  isRead: boolean;
  isFeatured: boolean;
  isArchived: boolean;
  status: string;
  createdAt: string;
  link: { id: string; slug: string; title: string };
};

export const DEMO_FEATURED = DEMO_MESSAGES.filter((m) => m.isFeatured);
