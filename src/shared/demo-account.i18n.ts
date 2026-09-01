import type { Locale } from "@/shared/i18n";

const demoMessageEn = {
  "study-night-owl": {
    title: "You gonna come back even rounder from Japan?",
    body: "Your story archive looks like you’re checking flights. I’m into stocky guys — if you eat your way around and come back even bigger, I’m actually happy. Vacation? Osaka or Tokyo? Just wanna know if I should copy you.",
  },
  "study-group-project": {
    title: "New job going okay?",
    body: "Not trying to gossip — you just post less lately. If it’s overtime, take care of yourself too.",
  },
  "love-distance": {
    title: "Saw you at Taipei Main Station",
    body: "Friday evening, Exit 1, grey oversized tee, shoulders filling it out — a big guy’s hard to miss. Almost called out, then got scared it wasn’t you. If it was, were you rushing for a train? You looked in a hurry.",
  },
  "love-friend-crush": {
    title: "Please don’t get skinny",
    body: "I see you lift. I’ve always been into chubby bears. Stay like this — belly, shoulders, the whole size is just right.",
  },
  "daily-family-dinner": {
    title: "Barely any stories lately — you tired?",
    body: "Used to see you around almost every day, then this week went quiet. Overtime or just not posting? No hidden meaning. Bear fans just wanna know you’re still here.",
  },
  "daily-phone-habit": {
    title: "Mmm, you smell good, bear",
    body: "So good. Love this.",
  },
  "work-first-job": {
    title: "Wanna get dinner this weekend?",
    body: "I genuinely don’t know what to do on Saturday. If you’re free, we could eat.",
  },
  "work-meeting-quiet": {
    title: "You still go to that late-night ramen place?",
    body: "Think you posted it in stories. I went later — packed. If you still go, I wanna know. Other recs welcome too.",
  },
  "honest-compare": {
    title: "Do you actually count calories or just eat",
    body: "Gym guys are two types: the ones weighing chicken breast, and the ones hitting ramen after. You look like both. Curious how you actually eat.",
  },
  "honest-apology": {
    title: "That was you at the convenience store, right?",
    body: "East District, you were heating oden, I stood behind you forever and said nothing. Only dared ask anonymously the next day. If I’m wrong, I’m blind — that build really looked like you.",
  },
  "study-major-switch": {
    title: "Round face + Korean bangs is even cuter",
    body: "Not sure you got a haircut, just feels rounder and easier to spot. If it’s new, which shop?",
  },
  "daily-alone-weekend": {
    title: "Are you moving?",
    body: "If it’s true, is the new place far? If you are moving, can I help carry stuff?",
  },
  "work-feedback": {
    title: "Going home for long?",
    body: "You mentioned heading back. If family keeps telling you to eat less, don’t you dare come back skinny. Ignore this if that question’s annoying from people far away.",
  },
  "love-pace": {
    title: "Where are you from?",
    body: "I kept thinking you were from Taichung.",
  },
} as const;

export type DemoMessageId = keyof typeof demoMessageEn;

type DemoMessageCopy = Record<DemoMessageId, { title: string; body: string }>;

export const DEMO_PROMPT_I18N = {
  en: "Ask me anything — go wild :D",
  ja: "聞きたいこと、言いたいこと、好きにして：D",
  ko: "묻고 싶은 거, 말하고 싶은 거, 마음대로 :D",
} as const satisfies Record<Exclude<Locale, "zh-Hant">, string>;

export const DEMO_MESSAGE_I18N = {
  en: demoMessageEn,
  ja: {
    "study-night-owl": {
      title: "日本から帰ってきたらもっと丸くなる？",
      body: "ストーリーのアーカイブ、航空券調べてる感じ。ぽっちゃりマッチョ好きだから、食べ歩いてさらに大きくなって帰ってきてくれたら逆に嬉しい。遊び？大阪？東京？真似していいか先に知りたい。",
    },
    "study-group-project": {
      title: "新しい仕事、順調？",
      body: "噂がしたいんじゃなくて、最近投稿減ったなって。残業なら体も大事にしてね。",
    },
    "love-distance": {
      title: "この前、台北駅で見たよ",
      body: "金曜の夕方、1番出口、グレーのゆったりT、肩が生地いっぱいで大きい人はすぐ分かる。声かけようとして、別人だったら怖いなって。本人なら電車間に合わせようとしてた？急いでた。",
    },
    "love-friend-crush": {
      title: "痩せないでほしい",
      body: "筋トレしてるの見てる。元からぽっちゃり熊が好き。今のままでいい。お腹も肩も、全体の量がちょうどいい。",
    },
    "daily-family-dinner": {
      title: "最近ストーリー少ないけど疲れてる？",
      body: "前はほぼ毎日見かけたのに、今週急に静か。残業？それとも出すの面倒？他意はない。熊好きな人は、まだいるか確認したくなるだけ。",
    },
    "daily-phone-habit": {
      title: "いい匂いのくま",
      body: "最高。好き。",
    },
    "work-first-job": {
      title: "週末、ごはん行かない？",
      body: "土曜、本当に予定ない。空いてたら一緒に食べよ。",
    },
    "work-meeting-quiet": {
      title: "あの深夜ラーメン、まだ行く？",
      body: "前にストーリーで流れてた気がする。あとで一人で行ったら混んでた。まだ通ってるなら知りたい。他におすすめあったらそれも。",
    },
    "honest-compare": {
      title: "カロリー計算してる派？それとも食べたいもの食べる派？",
      body: "ジム勢って二種類いる。鶏むね量る人と、練り終わりにラーメンの人。どっちにも見える。普段どう食べてるか知りたい。",
    },
    "honest-apology": {
      title: "コンビニであの時、あなただよね",
      body: "東区のあの店、大きいあなたがおでん温めてて、後ろでずっと黙ってた。次の日になってやっと匿名で聞ける。人違いなら目が悪い。あの体型、本当に似てた。",
    },
    "study-major-switch": {
      title: "丸顔に韓国風前髪、もっと可愛い",
      body: "切ったか分からない。なんか丸くなって、より分かりやすくなった。新規ならどこのお店？",
    },
    "daily-alone-weekend": {
      title: "引っ越しするの？",
      body: "本当なら、新しいところ遠い？引っ越しするなら一緒に運ぼうか。",
    },
    "work-feedback": {
      title: "帰省、長くいる？",
      body: "前に一回帰るって言ってた。家で食べるなって言われても、痩せて戻ってこないで。遠くからこれ聞かれるの嫌なら、聞かなかったことにして。",
    },
    "love-pace": {
      title: "どこの人？",
      body: "ずっと台中の人だと思ってた。",
    },
  },
  ko: {
    "study-night-owl": {
      title: "일본 갔다 오면 더 둥글어져?",
      body: "스토리 보관함이 항공권 찾아보는 느낌이야. 나는 통통한 덩치 좋아해서, 먹고 돌아다니고 더 커져서 오면 오히려 기뻐. 놀러 가는 거야? 오사카야 도쿄야. 따라갈지 미리 알고 싶어.",
    },
    "study-group-project": {
      title: "새 직장 괜찮아?",
      body: "험담하려는 건 아니고, 요즘 글을 잘 안 올리는 것 같아서. 야근이면 몸도 챙기라구.",
    },
    "love-distance": {
      title: "지난번에 타이베이역에서 본 것 같아",
      body: "금요일 저녁 1번 출구, 회색 루즈핏 티, 어깨가 옷을 꽉 채운 큰 덩치는 잘 보여. 부를까 하다가 다른 사람일까 봐 못 했어. 너면 그날 기차 급했어? 급해 보였어.",
    },
    "love-friend-crush": {
      title: "제발 마르지 마",
      body: "운동하는 거 알아. 원래 통통한 베어가 좋아. 지금처럼만. 배, 어깨, 전체 부피가 딱이야.",
    },
    "daily-family-dinner": {
      title: "요즘 스토리 거의 없는데 피곤해?",
      body: "전에는 거의 매일 보였는데 이번 주 갑자기 조용해. 야근이야, 올리기 귀찮은 거야. 다른 뜻 없어. 베어 좋아하는 사람은 네가 아직 있나 확인하고 싶어져.",
    },
    "daily-phone-habit": {
      title: "향기로운 곰탱이",
      body: "너무 좋아. 사랑해.",
    },
    "work-first-job": {
      title: "주말에 밥 먹을래?",
      body: "토요일에 진짜 할 일이 없어. 너 괜찮으면 같이 먹자.",
    },
    "work-meeting-quiet": {
      title: "그 심야 라멘집 아직 가?",
      body: "전에 스토리에 올렸던 것 같아. 나중에 혼자 갔는데 사람 많더라. 아직 가면 알려줘. 더 추천하는 데도 좋아.",
    },
    "honest-compare": {
      title: "칼로리 재는 편이야, 그냥 먹는 편이야",
      body: "운동하는 사람 두 종류 있잖아. 닭가슴살 계량하는 사람이랑, 운동 끝나고 라멘 먹는 사람. 너는 둘 다처럼 보여. 평소에 어떻게 먹는지 궁금해.",
    },
    "honest-apology": {
      title: "편의점 그때 너지?",
      body: "동구 그 가게, 큰 덩치인 네가 오뎅 데우고 있어서 뒤에서 한참 말 못 했어. 다음 날이 돼서야 익명으로 물어봄. 아니면 내 눈이 잘못된 거고, 그 체형 진짜 너 같았어.",
    },
    "study-major-switch": {
      title: "둥근 얼굴에 한국식 앞머리 더 귀여워",
      body: "잘랐는지는 모르겠고, 더 둥글고 알아보기 쉬워진 느낌. 새로 자른 거면 어느 집이야?",
    },
    "daily-alone-weekend": {
      title: "이사하는 거야?",
      body: "진짜면 새 곳 멀어? 이사하면 같이 옮길까?",
    },
    "work-feedback": {
      title: "집 가면 오래 있어?",
      body: "전에 한번 내려간다고 했잖아. 집에서 덜 먹으라고 해도 말라서 오지 마. 멀리서 이런 질문 듣기 싫으면 안 물어본 걸로 해.",
    },
    "love-pace": {
      title: "어디 사람이야?",
      body: "맨날 타이중 사람인 줄 알았어.",
    },
  },
} as const satisfies Record<Exclude<Locale, "zh-Hant">, DemoMessageCopy>;
