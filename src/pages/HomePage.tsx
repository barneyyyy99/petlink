import { useRef } from 'react'
import { useStore, currentRoom } from '@/store/useStore'
import { PetFace } from '@/components/PetFace'
import { behaviorLabel, behaviorMeta } from '@/lib/tracking'
import { summarizeDay, buildDiary, eventsForPet, filterByRange } from '@/lib/diary'
import { blobToDataUrl, downscaleDataUrl } from '@/lib/image'
import { Icon, type IconName } from '@/components/Icon'

export function HomePage() {
  const pet = useStore((s) => s.pet)
  const pets = useStore((s) => s.pets)
  const activePetId = useStore((s) => s.activePetId)
  const setActivePet = useStore((s) => s.setActivePet)
  const setPetPhoto = useStore((s) => s.setPetPhoto)
  const room = useStore(currentRoom)
  const goPage = useStore((s) => s.goPage)
  const openCamera = useStore((s) => s.openCamera)
  const toggleDrawer = useStore((s) => s.toggleDrawer)
  const sendCommand = useStore((s) => s.sendCommand)
  const turnOnAC = useStore((s) => s.turnOnAC)
  const events = useStore((s) => s.events)
  const home = useStore((s) => s.homeMap)
  const rules = useStore((s) => s.rules)
  const moodSignal = useStore((s) => s.moodSignal)
  const diarySeed = useStore((s) => s.diarySeed)
  const regenerateDiary = useStore((s) => s.regenerateDiary)
  const toast = useStore((s) => s.toast)
  const photoRef = useRef<HTMLInputElement>(null)

  const onPickPhoto = async (file?: File) => {
    if (!file) return
    try {
      const raw = await blobToDataUrl(file)
      const small = await downscaleDataUrl(raw, 480, 0.82)
      setPetPhoto(pet.id, small)
      toast('success', `已更新${pet.name}的照片`)
    } catch {
      toast('error', '照片读取失败，请换一张')
    }
  }

  const env = room?.environment
  const tempRule = rules.find((r) => r.trigger === 'temp_above' && r.enabled)
  const tempHigh = env && tempRule && env.temperature >= (tempRule.threshold ?? 29)
  // 仅统计当前宠物的事件：首页所有卡片都围绕被选中的宠物
  const petEvents = eventsForPet(events, pet.id, pets[0]?.id)
  // 首页围绕“今天”：状态分 / 事件 / 日记只统计今日
  const todayEvents = filterByRange(petEvents, 'today', Date.now())
  const sum = summarizeDay(todayEvents, home)
  const recent = [...todayEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3)
  // AI 日记：由该宠物当日真实事件生成（可换一条）
  const diary = buildDiary(sum, moodSignal, diarySeed)
  // 状态分：由当日真实事件推导（透明可解释），而非写死
  const score = Math.max(
    40,
    Math.min(99, 60 + sum.eats * 5 + sum.drinks * 3 + sum.plays * 6 + sum.ownerInteractions * 4 + sum.roomChanges * 2),
  )
  // 问候语与时间按真实当前时间生成，和事件时间同一基准（避免固定“09:42”与事件时间矛盾）
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 5 ? '夜深了' : hour < 11 ? '早上好' : hour < 13 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
  const clock = now.toTimeString().slice(0, 5)

  return (
    <div>
      <div className="eyebrow">{week} · {clock}</div>
      <h1 className="my-1.5 text-3xl font-extrabold tracking-tight">{greeting}，Jin</h1>
      <div className="text-sm text-muted">{pet.name}正在{room?.name ?? '家里'}活动，当前一切正常。</div>

      {pets.length > 1 && (
        <div data-testid="home-pet-switcher" className="mt-4 flex flex-wrap gap-2">
          {pets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePet(p.id)}
              aria-pressed={p.id === activePetId}
              className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-sm font-bold transition ${
                p.id === activePetId ? 'border-teal bg-teal text-white' : 'border-line bg-white text-[#5d6e68] hover:border-[#cde3dc]'
              }`}
            >
              <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-[#fff8e9]">
                <PetFace pet={p} size={28} />
              </span>
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-[minmax(0,1.4fr)_minmax(320px,.76fr)] gap-5 max-[1000px]:grid-cols-1">
        <div>
          <div className="relative min-h-[320px] overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2b8176] to-[#4b9c8e] p-8 text-white shadow-soft">
            <div className="eyebrow text-white/70">今日守护对象</div>
            {/* 宠物名 + 其右侧的实时状态 */}
            <div className="my-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <h2 className="text-5xl font-extrabold tracking-tight">{pet.name}</h2>
              <div className="text-sm">
                <div className="flex items-center gap-2 text-lg font-bold"><span>●</span><span>{behaviorLabel[pet.behavior]}</span></div>
                <div className="mt-1 opacity-90">{behaviorMeta[pet.behavior]}</div>
                <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap opacity-90"><span className="inline-block h-2 w-2 rounded-full bg-emerald-300" /> 在线 · 项圈电量：{pet.collarBattery}%</div>
              </div>
            </div>

            {/* AI 宠物日记 */}
            <div className="relative z-[3] mt-5 max-w-[60%] rounded-2xl border border-white/25 bg-white/12 p-4 backdrop-blur max-[1000px]:max-w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/85">
                  <Icon name="diary" size={14} /> {pet.name}的今日日记
                </span>
                <button
                  className="rounded-full border border-white/35 px-2.5 py-1 text-[11px] font-bold text-white/90 hover:bg-white/15"
                  onClick={regenerateDiary}
                >
                  换一条
                </button>
              </div>
              <p data-testid="home-diary" className="mt-2 text-[15px] font-semibold leading-relaxed">“{diary}”</p>
              <div className="mt-2.5 flex justify-end">
                <button className="text-[11px] font-bold text-white hover:opacity-80" onClick={() => goPage('records')}>完整日记 ›</button>
              </div>
            </div>

            {/* 宠物头像（支持上传真实照片，地图沿用） */}
            <div className="absolute bottom-6 right-8 grid h-[200px] w-[200px] place-items-center overflow-hidden rounded-full bg-[rgba(244,233,208,.92)] shadow-soft max-[1000px]:opacity-80">
              <PetFace pet={pet} size={pet.photo ? 200 : 150} />
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" data-testid="home-photo-input" onChange={(e) => onPickPhoto(e.target.files?.[0])} />
            <button
              className="absolute bottom-[18px] right-[22px] z-[4] grid h-9 w-9 place-items-center rounded-full border border-white/50 bg-[rgba(37,68,62,.5)] text-white backdrop-blur"
              data-testid="home-upload-photo"
              title="上传真实照片"
              onClick={() => photoRef.current?.click()}
            >
              <Icon name="camera" size={16} />
            </button>
            <button className="btn btn-ghost absolute bottom-6 left-8 z-[3] inline-flex items-center gap-1.5 border-white/40 bg-[rgba(37,68,62,.28)] text-white" onClick={() => goPage('map')}>
              <Icon name="map" size={15} /> 打开地图
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3.5 max-[640px]:grid-cols-1">
            <QuickCard icon="feed" bg="bg-orange-soft text-orange" title="投喂" sub="8g · 2 次" onClick={() => sendCommand(useStore.getState().devices.find((d) => d.type === 'feeder')?.id ?? pet.id, '远程投喂 8g')} />
            <QuickCard icon="find" bg="bg-teal-soft text-teal" title="寻宠" sub="灯光 + 声音" onClick={() => { goPage('map'); toggleDrawer(true); useStore.getState().toast('info', '已开启寻宠模式：灯光 + 声音') }} />
            <QuickCard icon="peek" bg="bg-blue-soft text-blue" title="看一眼" sub={`${room?.name} · 在线`} onClick={() => openCamera()} />
          </div>

          <div className="mt-6 eyebrow">今日状态</div>
          <div className="card mt-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2"><b className="text-lg">{pet.name}今日状态分</b><span className="badge">● 无异常</span></div>
              </div>
              <div className="text-right"><div className="text-5xl font-extrabold text-teal">{score}</div></div>
            </div>
            <div className="mt-4 grid grid-cols-3 border-t border-line pt-4 text-center">
              <div><b className="block text-lg">{sum.roomChanges}</b><span className="text-[11px] text-muted">跨房间</span></div>
              <div><b className="block text-lg">{sum.eats + sum.drinks}</b><span className="text-[11px] text-muted">进食/饮水</span></div>
              <div><b className="block text-lg">{sum.ownerInteractions}</b><span className="text-[11px] text-muted">远程陪伴</span></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">我的家</h3><button className="text-xs font-bold text-teal" onClick={() => goPage('map')}>进入地图 →</button></div>
            <div className="flex items-start gap-3 rounded-2xl border border-[#e5ece7] bg-[#f4f8f5] p-4">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-teal-2" />
              <div><b className="text-sm">{pet.name}在 {room?.name}</b><p className="mt-1 text-xs text-muted">{env?.temperature.toFixed(1)}℃ · 湿度 {env?.humidity}% · {room?.devices.length ? '摄像头在线' : 'BLE 定位在线'}</p></div>
            </div>
            {tempHigh && (
              <div className="mt-2.5 flex items-start gap-3 rounded-2xl border border-[#f3dec8] bg-orange-soft p-4">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-orange" />
                <div>
                  <b className="text-sm">环境联动建议</b>
                  <p className="mt-1 text-xs text-muted">{room?.name}当前 {env?.temperature.toFixed(1)}℃，建议开启空调至 26℃。</p>
                  <div className="mt-2.5 flex gap-2"><button className="btn btn-primary" onClick={() => turnOnAC(room?.id)}>开启空调</button></div>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">今天发生了什么</h3><button className="text-xs font-bold text-teal" onClick={() => toggleDrawer(true)}>全部踪迹</button></div>
            {recent.length ? (
              recent.map((e) => (
                <div key={e.id} className="mb-2.5 flex items-start gap-3 rounded-2xl border border-[#e5ece7] bg-[#f4f8f5] p-3.5">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-teal-2" />
                  <div><b className="text-sm">{e.title}</b><p className="mt-1 text-xs text-muted">{e.detail}</p></div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d6e1db] bg-[#f7faf8] p-4 text-xs text-muted">{pet.name}今天还没有记录到事件。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickCard({ icon, bg, title, sub, onClick }: { icon: IconName; bg: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button className="card min-h-[108px] text-left transition hover:-translate-y-0.5" onClick={onClick}>
      <div className={`mb-2.5 grid h-9 w-9 place-items-center rounded-xl ${bg}`}><Icon name={icon} size={18} /></div>
      <b className="text-base">{title}</b>
      <span className="mt-1.5 block text-xs text-muted">{sub}</span>
    </button>
  )
}
