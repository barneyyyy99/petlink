// 养宠管家对话模型（可插拔）。
// 按意图分流：养护(care) vs 问诊(vet)。接真实大模型时设置 VITE_PETCHAT_API，实现 remoteReply()。
// 现为内置知识 Mock，保证离线可用。

export type Intent = 'care' | 'vet'

const VET_KW = /症状|生病|呕吐|吐|拉稀|腹泻|稀便|便血|发烧|体温|不吃|没胃口|食欲|挠|瘙痒|抓挠|咳|喷嚏|流鼻涕|精神不好|萎靡|受伤|流血|瘸|疼|痛|肿|结膜|眼屎|耳朵|异味|驱虫|疫苗|绝育|寄生虫|病/
const API = import.meta.env.VITE_PETCHAT_API as string | undefined

export function classifyIntent(text: string): Intent {
  return VET_KW.test(text) ? 'vet' : 'care'
}

/** 养护类回答 */
function careAnswer(q: string, pet: string): string {
  if (/吃得怎么样|进食|吃饭|食量/.test(q)) return `根据${pet}的项圈数据，今天进食 2 次、饮水 3 次，食量与昨日基本持平，属于正常范围～继续定时定量就好。`
  if (/喝水|饮水/.test(q)) return `${pet}今天饮水 3 次，饮水量正常。天气干燥时可多放一个水碗，或用流动饮水机提升它喝水的兴趣。`
  if (/运动|活动|遛|散步/.test(q)) return `${pet}今日活动量 2,480 步，奔跑 6.1 分钟。猫咪每天 2～3 次、每次 10～15 分钟的互动玩耍比较合适，逗猫棒+追逐能很好地消耗精力。`
  if (/睡|作息/.test(q)) return `${pet}今天睡了约 13.5 小时，猫咪日均 12～16 小时都正常。保持安静、温度适宜的休息角落有助睡眠质量。`
  if (/体重|胖|瘦|减肥/.test(q)) return `控制体重的关键是定量喂食+增加活动。可按包装建议量的 90% 投喂、减少零食，配合每天玩耍；一个月称一次体重观察趋势。`
  if (/掉毛|毛发|梳毛/.test(q)) return `换季掉毛属正常，每天梳毛 1 次能减少打结和误食毛球；可适当补充卵磷脂/化毛膏。若伴随皮肤红点或大面积脱毛，建议就医。`
  return `我已连接${pet}的项圈与健康数据，可以帮你看进食、饮水、运动、睡眠和行为趋势，并给出养护建议。你想了解哪方面？`
}

/** 问诊类回答（强调观察 + 就医提示，不作诊断） */
function vetAnswer(q: string, pet: string): string {
  const tail = '\n\n⚠️ 以上仅为参考，不能替代兽医诊断；若症状持续或加重，请尽快就医。'
  if (/不吃|没胃口|食欲/.test(q)) return `${pet}食欲下降可先观察：精神状态、有无呕吐/腹泻、鼻头是否干热、饮水是否减少、口腔有无异味或溃疡。偶尔一餐不吃多为挑食或应激；若连续 24 小时拒食或伴随其它异常，建议就医。` + tail
  if (/挠|瘙痒|抓/.test(q)) return `频繁挠痒常见原因：跳蚤/螨虫、皮肤过敏、干燥或耳道感染。检查有无红点、掉毛、耳道异味。可先做体外驱虫；若皮肤破损或持续，建议做皮肤镜/耳道检查。` + tail
  if (/呕吐|吐/.test(q)) return `偶发呕吐可能是吐毛球或吃太快。观察呕吐物（有无毛发/食物/泡沫/血丝）、频率、是否伴随精神差或腹泻。频繁呕吐、吐血或精神萎靡应立即就医。` + tail
  if (/拉稀|腹泻|稀便/.test(q)) return `腹泻注意：次数、性状（水样/带血/黏液）、是否伴呕吐。可先禁食 6～8 小时+少量多次饮水观察。若带血、持续超过一天或精神差，需尽快就医并带上粪便样本。` + tail
  if (/发烧|体温/.test(q)) return `猫咪正常体温约 38～39.2℃。若鼻头干热、精神差、食欲减退，建议用宠物体温计测量；超过 39.5℃ 属发热，应就医排查感染。` + tail
  return `描述一下${pet}的具体情况（症状、持续时间、精神与食欲、有无呕吐腹泻等），我帮你做初步判断与观察建议。` + tail
}

export async function reply(text: string, forced: Intent | null, pet: string): Promise<{ intent: Intent; text: string }> {
  const intent = forced ?? classifyIntent(text)
  if (API) {
    try { return await remoteReply(text, intent, pet) } catch { /* 回退本地 */ }
  }
  return { intent, text: intent === 'vet' ? vetAnswer(text, pet) : careAnswer(text, pet) }
}

async function remoteReply(text: string, intent: Intent, pet: string): Promise<{ intent: Intent; text: string }> {
  const res = await fetch(`${API}/petchat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, intent, pet }),
  })
  const data = await res.json()
  return { intent, text: data.reply ?? '' }
}
