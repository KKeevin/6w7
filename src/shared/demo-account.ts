import { BRAND } from "@/shared/tools";

/** 示範帳號走與正式登入相同的網址，不使用 /demo 前綴 */
export const DEMO_ENTER_PATH = "/api/v1/auth/demo" as const;

export const DEMO_PROFILE = {
  username: "lewanq",
  displayName: "樂玩ㄑ小編",
  prompt: "想問就問，想說就說。這裡只進收件匣，不會預設公開掛牆。",
  acceptingMessages: true,
  requireTopic: true,
  topics: ["學業", "感情", "日常", "職場", "真心話"] as const,
  publicPath: "/lewanq",
  dashboardPath: "/dashboard",
  inboxPath: "/inbox",
  settingsPath: "/settings",
} as const;

export type DemoTopic = (typeof DEMO_PROFILE.topics)[number];

export type DemoMessage = {
  id: string;
  topic: DemoTopic;
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
    topic: "學業",
    isRead: true,
    isFeatured: true,
    isArchived: false,
    createdAt: "2026-08-12T21:18:00+08:00",
    title: "複習到半夜還是記不住，是方法錯了嗎？",
    body: "我最近段考前都會把自己關在房間到凌晨兩點，筆記抄了三遍，隔天還是對不上題目。朋友說我是在「假裝很認真」，其實只是把時間耗掉。我想問：有沒有比較實際的複習節奏？例如先做考古題再回頭看書，還是先把觀念講給自己聽？我也怕一直熬夜把白天的課聽成背景音。如果你曾經從這種空轉裡走出來，希望你願意把那天後來怎麼調整的步驟寫下來，哪怕只是很小的改變。",
  },
  {
    id: "study-group-project",
    topic: "學業",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-11T14:02:00+08:00",
    title: "小組報告永遠變成我一個人收尾",
    body: "每次分組都有人消失、有人只丟一頁沒有出處的投影片。我最後還是會補完，因為不想被老師覺得整組不負責。可是補完之後心裡很火，又覺得自己如果拒絕，分數會一起陪葬。我想知道：你會在第一次進度落後時就公開把分工寫進群組嗎？還是私下找老師說明？我不是想告狀，只是想學會在期限前把界線講清楚，同時還能把報告做出來。請分享你遇過最有效、又不會把氣氛搞砸的做法。",
  },
  {
    id: "love-distance",
    topic: "感情",
    isRead: true,
    isFeatured: true,
    isArchived: false,
    createdAt: "2026-08-10T22:41:00+08:00",
    title: "異地戀每天報備，是關心還是不信任？",
    body: "我們分隔兩個城市快八個月。一開始覺得報備行程很甜，現在變成沒回訊息就會互相猜測。我想把「今天過得怎麼樣」留著，但把「你現在在哪、跟誰」拿掉，又怕對方以為我在閃。匿名問是因為不想在限動下面被熟人開地圖砲。如果你也走過這段，你後來怎麼重新講規則？有沒有哪些句子比較不會被聽成指責？我希望關係還在，只是想把焦慮從日常對話裡拆出來，讓剩下的時間是真的想聽對方說話。",
  },
  {
    id: "love-friend-crush",
    topic: "感情",
    isRead: false,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-09T19:27:00+08:00",
    title: "喜歡上很久的朋友，要不要說？",
    body: "我們從高中就認識，現在偶爾還會一起吃消夜。我發現自己開始在意對方回訊的速度，連看劇都會想到「如果是一起看會怎樣」。我怕說出來就把這份輕鬆弄丟，更怕對方其實早知道、只是不想拆穿。我想聽兩種經驗：說了之後友誼還在的，以及選擇不說、後來怎麼把自己收回來的。請盡量寫具體一點，例如你選在什麼場合、對方當下的反應、你隔天怎麼面對同一個群組。我需要的不是雞湯，是可以照著想一遍的真實過程。",
  },
  {
    id: "daily-family-dinner",
    topic: "日常",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-08T18:05:00+08:00",
    title: "回家吃飯總被問何時穩定，該怎麼接？",
    body: "每次飯桌都會從天氣一路問到工作、房租、有沒有對象。我知道長輩是擔心，可是被連續提問時會覺得自己被檢查進度。我想練習把話題轉成我真正想分享的事，例如最近學會的一道菜、或一本還在看的書，而不是用「還好啊」把整晚糊過去。你有沒有用過比較溫和、又不會讓桌邊安靜到尷尬的回法？也想知道：如果當下真的累了，怎麼預先跟家人說「今天想少聊正事」而不被解讀成翻臉。希望答案可以實用到下一次週末。",
  },
  {
    id: "daily-phone-habit",
    topic: "日常",
    isRead: true,
    isFeatured: true,
    isArchived: false,
    createdAt: "2026-08-07T23:55:00+08:00",
    title: "睡前滑到兩點，早上又厭世，怎麼停？",
    body: "我不是不知道該早睡，是放下手機的那一刻會突然好空，好像一定要再看一則才甘願。隔天遲到、咖啡灌下去、晚上又重複。我想找一個比「意志力」更具體的收尾動作：例如把充電器放到房間外面、或睡前只允許看紙本書十分鐘。請告訴我你真正有做到超過兩週的方法，以及中途破功那天你怎麼不當成全面失敗。如果可以，也想聽你怎麼跟室友或家人解釋「我不是在忙，我是在練習結束這一天」。",
  },
  {
    id: "work-first-job",
    topic: "職場",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-06T12:16:00+08:00",
    title: "第一份工作常常被加塞，要不要當面講？",
    body: "進公司半年，原本職掌已經滿了，還是會被臨時丟「順便幫一下」。我當下都會答應，回家才覺得自己被當成永遠有空的人。我想學怎麼在當下用很短的句子講容量，而不是事後在心裡記帳。例如先問截止日期、或請對方幫我排出優先順序。也怕講了就被貼上不配合的標籤。如果你曾經成功把加塞變成「可以，但這件要延後」，請把你實際說過的話寫下來。我需要可以唸出口的版本，不是抽象的「要學會拒絕」。",
  },
  {
    id: "work-meeting-quiet",
    topic: "職場",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-05T09:44:00+08:00",
    title: "會議裡我總是最後才說話，怎麼練習？",
    body: "不是沒有想法，是等我想好完整句子，討論已經跳到下一題。後來被問「你怎麼都沒意見」時更緊張。我想知道有沒有比較低門檻的開口方式：先重述別人的重點、先問一個澄清問題，或會前把三句話寫在記事本。也想聽內向但後來會議表現穩定的人，你們花了多久才覺得自己不是在硬演。請避免只說「多練習就好」。我想要一個可以從下週例會就用的小劇本，就算一開始很生硬也沒關係。",
  },
  {
    id: "honest-compare",
    topic: "真心話",
    isRead: true,
    isFeatured: true,
    isArchived: false,
    createdAt: "2026-08-04T20:08:00+08:00",
    title: "看到同學好像都比我快，會不會其實沒有落後？",
    body: "社群上大家都在發錄取、旅行、新家。我知道那是精選畫面，可是滑一輪還是會覺得自己停在原地。我想問一個比較誠實的問題：你後來是怎麼判斷「這是比較傷害」還是「我真的需要調整方向」？有沒有哪個瞬間讓你把手機放下、去把一件很小的事做完，例如回一封信或把房間清出一塊桌面？我不是要你安慰我很棒，我想要一個可以把注意力從別人的高光，拉回自己下一步的具體做法。",
  },
  {
    id: "honest-apology",
    topic: "真心話",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-03T16:33:00+08:00",
    title: "當初一句重話，現在還能好好道歉嗎？",
    body: "去年我在群組裡用很衝的語氣回朋友，當下覺得自己有道理，後來才發現那句話被截圖留著。我們沒有大吵，只是互動變少。我想道歉，又怕一翻舊帳會讓對方重新生氣，或被當成求原諒的表演。請分享你寫過、後來對方真的願意再聊天的道歉方式：你怎麼承認傷害、怎麼不把責任推給「當下太累」、以及你有沒有給對方「可以先不回」的空間。我想做對的事，不是急著把關係修到看起來沒裂痕。",
  },
  {
    id: "study-major-switch",
    topic: "學業",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-02T11:21:00+08:00",
    title: "想換領域，但已經讀了兩年，會不會太晚？",
    body: "課程愈上愈確定興趣不在這裡，可是轉系或重考的成本我算過，家裡也不一定支持。我想聽「留下把輔系讀完」和「真的轉走」兩種人怎麼做決定，尤其是你們用什麼證據，而不是只用心情。例如去旁聽、打工、或跟學長姐要一份真實的一週時間表。也想知道：如果暫時不轉，怎麼避免每天都在後悔裡上課。請寫你當時的年齡或年級沒關係，重點是決策步驟，讓我可以拿來對自己的狀況一條一條勾。",
  },
  {
    id: "daily-alone-weekend",
    topic: "日常",
    isRead: false,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-08-01T15:47:00+08:00",
    title: "週末一個人也不想出門，怎樣才不算浪費？",
    body: "朋友約聚餐我會偶爾去，但更多時候我只想待在家。滑完一輪又覺得自己什麼都沒做，週日晚上開始焦慮。我想重新定義一個對我來說合格的週末：例如煮一餐、走二十分鐘、回兩則訊息，而不是跟別人的行程表比賽。請告訴我你一個人過得最踏實的一天實際做了哪些事、時間怎麼切，以及你怎麼跟那個「應該要更精彩」的聲音相處。如果可以，也想聽你怎麼拒絕邀約卻不讓朋友覺得被討厭。",
  },
  {
    id: "work-feedback",
    topic: "職場",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-07-31T10:09:00+08:00",
    title: "主管說我細心，但升遷好像輪不到我",
    body: "被稱讚細心、穩定，可是新專案總是交給比較會發言的同事。我不知道該繼續把細節做好，還是也去搶曝光。想問：你後來是怎麼讓「可靠」被看成「可以帶一件事」，而不是永遠當支援？例如在週報寫成果、主動要一個小範圍負責，或請主管給一次觀察機會。也想知道失敗的例子，避免我用很刻意的方式說話。請盡量寫你實際做的兩三個動作，以及做了之後同事或主管有沒有改變對待你的方式。",
  },
  {
    id: "love-pace",
    topic: "感情",
    isRead: true,
    isFeatured: false,
    isArchived: false,
    createdAt: "2026-07-30T21:02:00+08:00",
    title: "對方想穩定，我還想多看一下自己，怎麼講？",
    body: "不是不喜歡，是目前同時在適應新環境，沒辦法把所有情緒都放進一段關係。對方已經在問之後怎麼走，我一拖再拖，自己也討厭這種含糊。我想找到一種說法：承認我在意、說明我需要的時間尺度，同時不要讓對方覺得被吊著。請分享你聽過或說過、後來雙方都比較好過的版本。也想知道如果對方沒辦法等，你怎麼判斷該結束還是該加速。我希望對話結束後，兩個人都還保有尊嚴，而不是互相猜測對方到底想怎樣。",
  },
];

export function getDemoMessage(id: string): DemoMessage | undefined {
  return DEMO_MESSAGES.find((m) => m.id === id);
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

export function getDemoShareProfile() {
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
      prompt: DEMO_PROFILE.prompt,
      acceptingMessages: DEMO_PROFILE.acceptingMessages,
      url: demoPublicUrl(),
      topics: [...DEMO_PROFILE.topics],
      requireTopic: DEMO_PROFILE.requireTopic,
    },
  };
}

export function toInboxDemoMessages(): InboxMessageShape[] {
  return DEMO_MESSAGES.map((m) => ({
    id: m.id,
    body: m.body,
    topic: m.topic,
    isRead: m.isRead,
    isFeatured: m.isFeatured,
    isArchived: m.isArchived,
    status: "visible",
    createdAt: m.createdAt,
    link: {
      id: "demo",
      slug: DEMO_PROFILE.username,
      title: m.title,
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
