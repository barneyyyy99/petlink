import { useStore, currentRoom } from '@/store/useStore'
import { PetSvg } from '@/components/PetSvg'
import { behaviorLabel, behaviorMeta } from '@/lib/tracking'
import { summarizeDay } from '@/lib/diary'

export function HomePage() {
  const pet = useStore((s) => s.pet)
  const room = useStore(currentRoom)
  const goPage = useStore((s) => s.goPage)
  const openCamera = useStore((s) => s.openCamera)
  const toggleDrawer = useStore((s) => s.toggleDrawer)
  const sendCommand = useStore((s) => s.sendCommand)
  const turnOnAC = useStore((s) => s.turnOnAC)
  const events = useStore((s) => s.events)
  const home = useStore((s) => s.homeMap)
  const rules = useStore((s) => s.rules)
  const diaryText = useStore((s) => s.diaryText)

  const env = room?.environment
  const tempRule = rules.find((r) => r.trigger === 'temp_above' && r.enabled)
  const tempHigh = env && tempRule && env.temperature >= (tempRule.threshold ?? 29)
  const sum = summarizeDay(events, home)
  const recent = events.slice(0, 3)

  return (
    <div>
      <div className="eyebrow">MON · 09:42 AM</div>
      <h1 className="my-1.5 text-3xl font-extrabold tracking-tight">早上好，Jin</h1>
      <div className="text-sm text-muted">{pet.name}正在{room?.name ?? '家里'}活动，当前一切正常。</div>

      <div className="mt-5 grid grid-cols-[minmax(0,1.4fr)_minmax(320px,.76fr)] gap-5 max-[1000px]:grid-cols-1">
        <div>
          <div className="relative min-h-[320px] overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2b8176] to-[#4b9c8e] p-8 text-white shadow-soft">
            <div className="eyebrow text-white/70">今日守护对象</div>
            <h2 className="my-3 text-5xl font-extrabold tracking-tight">{pet.name}</h2>
            <div className="my-2.5 flex items-center gap-2 text-lg font-bold">
              <span>●</span>
              <span>{behaviorLabel[pet.behavior]}</span>
            </div>
            <div className="mt-2 text-sm opacity-90">{behaviorMeta[pet.behavior]}</div>
            <div className="mt-4 text-sm opacity-90">⌁ 在线 · 项圈 {pet.collarBattery}%</div>
            <div className="absolute bottom-6 right-8 grid h-[200px] w-[200px] place-items-center rounded-full bg-[rgba(244,233,208,.92)] shadow-soft max-[1000px]:opacity-70">
              <PetSvg behavior={pet.behavior} size={150} />
            </div>
            <button className="btn btn-ghost absolute bottom-6 right-8 z-[3] border-white/40 bg-[rgba(37,68,62,.28)] text-white" onClick={() => goPage('map')}>
              ✦ 打开桌宠
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3.5 max-[640px]:grid-cols-1">
            <QuickCard icon="🍽" bg="bg-orange-soft text-orange" title="投喂" sub="8g · 2 次" onClick={() => sendCommand(useStore.getState().devices.find((d) => d.type === 'feeder')?.id ?? pet.id, '远程投喂 8g')} />
            <QuickCard icon="⌖" bg="bg-teal-soft text-teal" title="寻宠" sub="灯光 + 声音" onClick={() => { goPage('map'); toggleDrawer(true); useStore.getState().toast('info', '已开启寻宠模式：灯光 + 声音') }} />
            <QuickCard icon="◉" bg="bg-blue-soft text-blue" title="看一眼" sub={`${room?.name} · 在线`} onClick={() => openCamera()} />
          </div>

          <div className="mt-6 eyebrow">LIVE STATUS</div>
          <div className="card mt-2.5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{pet.name}现在怎么样</h3>
              <span className="badge">◉ 无异常</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <b className="text-xl">● {behaviorLabel[pet.behavior]}</b>
                <div className="mt-1.5 text-sm text-muted">{behaviorMeta[pet.behavior]}</div>
              </div>
              <div className="text-right"><div className="text-5xl font-extrabold text-teal">86</div><small className="text-muted">今日状态分</small></div>
            </div>
            <div className="mt-5 grid grid-cols-3 border-t border-line pt-4 text-center">
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
            {recent.map((e) => (
              <div key={e.id} className="mb-2.5 flex items-start gap-3 rounded-2xl border border-[#e5ece7] bg-[#f4f8f5] p-3.5">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-teal-2" />
                <div><b className="text-sm">{e.title}</b><p className="mt-1 text-xs text-muted">{e.detail}</p></div>
              </div>
            ))}
          </div>

          <div className="rounded-[26px] border border-[#e2e9e4] bg-gradient-to-br from-[#f0f8f4] to-[#fffaf4] p-6 shadow-softsm">
            <span className="badge">AI 宠物日记</span>
            <div className="my-4 text-xl font-bold leading-relaxed tracking-tight">“{diaryText}”</div>
            <small className="text-muted">AI 拟人文案，依据今日真实轨迹/行为/互动生成，非客观事实。</small>
            <div className="mt-4 flex gap-2"><button className="btn btn-primary" onClick={() => goPage('records')}>看完整日记</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickCard({ icon, bg, title, sub, onClick }: { icon: string; bg: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button className="card min-h-[108px] text-left transition hover:-translate-y-0.5" onClick={onClick}>
      <div className={`mb-2.5 grid h-9 w-9 place-items-center rounded-xl text-lg ${bg}`}>{icon}</div>
      <b className="text-base">{title}</b>
      <span className="mt-1.5 block text-xs text-muted">{sub}</span>
    </button>
  )
}
