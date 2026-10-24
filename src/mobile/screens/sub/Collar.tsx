import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { MapPin, Crosshair, Activity, Shield, HeartPulse, Settings2, Lightbulb, Cpu, ChevronRight, Volume2, Mic } from 'lucide-react'
import { C } from '@/mobile/theme'
import { Card, Sheet } from '@/mobile/MobileShell'
import { SubScreen, useNav } from '@/mobile/nav'
import { fetchCollarDetail, type CollarKey, type CollarDetail } from '@/mobile/collarApi'

const ROWS: { key: CollarKey; icon: any }[] = [
  { key: 'tracking', icon: Crosshair }, { key: 'behavior', icon: Activity },
  { key: 'fence', icon: Shield }, { key: 'health', icon: HeartPulse },
  { key: 'mode', icon: Settings2 }, { key: 'light', icon: Lightbulb },
  { key: 'firmware', icon: Cpu },
]
const PHRASES = ['豆豆～', '过来', '好棒', '吃饭啦', '我晚点回来']

const LABELS: Record<CollarKey, { title: string; desc: string; value?: string }> = {
  tracking: { title: '定位与追踪', desc: '实时定位、刷新频率、多基站接力', value: '均衡' },
  behavior: { title: '行为识别', desc: '进食、饮水、玩耍、睡眠及异常行为识别' },
  fence: { title: '电子围栏', desc: '安全范围、离家提醒、走失一键找回' },
  health: { title: '健康监测', desc: '体温、运动量、睡眠质量监测与周报' },
  mode: { title: '项圈模式', desc: '日常模式、户外模式、睡眠省电模式', value: '日常' },
  light: { title: '灯光与提示', desc: '夜间定位灯、找回闪灯与鸣叫' },
  firmware: { title: '固件升级', desc: '当前 v2.3.1，已是最新版本', value: '最新' },
}

export function CollarScreen() {
  const pet = useStore((s) => s.pet)
  const devices = useStore((s) => s.devices)
  const sendCommand = useStore((s) => s.sendCommand)
  const { openSub } = useNav()
  const [vol, setVol] = useState(65)
  const [detail, setDetail] = useState<CollarDetail | null>(null)
  const [draft, setDraft] = useState<CollarDetail | null>(null)

  const open = async (k: CollarKey) => { const d = await fetchCollarDetail(k); setDetail(d); setDraft(JSON.parse(JSON.stringify(d))) }
  const speaker = devices.find((d) => d.type === 'speaker')
  const linked = devices.filter((d) => ['feeder', 'camera', 'smart_screen', 'ac', 'water', 'temp_humidity'].includes(d.type))

  return (
    <SubScreen title="项圈设置" right="档案" onRight={() => openSub('persona')}>
      {/* 项圈档案 */}
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: C.primarySoft }}>📡</span>
          <div className="min-w-0 flex-1">
            <b className="text-[16px]" style={{ color: C.ink }}>{pet.name}的智能项圈</b>
            <div className="mt-1 flex items-center gap-1 text-[12px]" style={{ color: C.sub }}><MapPin size={13} /> 客厅 · 在线 · 电量 {pet.collarBattery}%</div>
          </div>
        </div>
      </Card>

      {/* 音量 */}
      <Card className="mt-3 !p-4">
        <div className="mb-2 flex items-center gap-2"><Volume2 size={16} color={C.primary} /><b className="text-[14px]" style={{ color: C.ink }}>提示音量</b><b className="ml-auto text-[16px]" style={{ color: C.primary }}>{vol}</b></div>
        <input type="range" min={0} max={100} value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full accent-[#3D7FFF]" />
        <p className="mt-1 text-[11px]" style={{ color: C.sub }}>当前项圈提示音量为 {vol}，户外模式下会自动增强，帮{pet.name}更快听到你的呼唤</p>
      </Card>

      {/* 设置项 */}
      <div className="mt-3 overflow-hidden rounded-[18px] bg-white shadow-[0_6px_20px_rgba(31,60,120,.07)]">
        {ROWS.map((r, i) => (
          <button key={r.key} onClick={() => open(r.key)} className={`flex w-full items-center gap-3 p-3.5 text-left active:bg-[#f4f7fc] ${i < ROWS.length - 1 ? 'border-b border-[#f0f2f7]' : ''}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><r.icon size={19} color={C.primary} /></span>
            <RowText k={r.key} />
            <ChevronRight size={16} color={C.faint} />
          </button>
        ))}
      </div>

      {/* 主人声音库 */}
      <div className="mb-2 mt-5 flex items-center justify-between px-1">
        <b className="text-[16px]" style={{ color: C.ink }}>主人声音库</b>
        <button className="text-[13px] font-semibold" style={{ color: C.primary }} onClick={() => openSub('voice')}>录制 ›</button>
      </div>
      <p className="mb-2 px-1 text-[12px]" style={{ color: C.sub }}>预录你的声音，通过项圈、音箱、小度智能屏随时为{pet.name}播放，远程也有你的陪伴 🧡</p>
      <div className="flex flex-wrap gap-2">
        {PHRASES.map((p) => (
          <button key={p} onClick={() => sendCommand(speaker?.id ?? pet.id, `播放主人声音：${p}`)} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[13px] font-semibold shadow-sm active:scale-95" style={{ color: C.ink }}>
            <Volume2 size={14} color={C.primary} /> {p}
          </button>
        ))}
        <button onClick={() => openSub('voice')} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold text-white" style={{ background: C.primary }}><Mic size={14} /> 录新短语</button>
      </div>

      {/* 联动设备 */}
      <div className="mb-2 mt-5 flex items-center justify-between px-1">
        <b className="text-[16px]" style={{ color: C.ink }}>联动设备</b>
        <button className="text-[13px] font-semibold" style={{ color: C.primary }} onClick={() => openSub('linked')}>添加 ›</button>
      </div>
      <div className="flex flex-col gap-2">
        {linked.slice(0, 4).map((d) => (
          <Card key={d.id} className="!p-3" onClick={() => openSub('linked')}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg" style={{ background: C.primarySoft }}>🔌</span>
              <div className="min-w-0 flex-1"><b className="block text-[13px]" style={{ color: C.ink }}>{d.name}</b><span className="text-[11px]" style={{ color: C.sub }}>{d.type}</span></div>
              <span className="shrink-0 rounded-full bg-[#e6f7ee] px-2 py-0.5 text-[11px] font-bold" style={{ color: C.green }}>{d.online ? '在线' : '离线'}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* 设置详情抽屉 */}
      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ''}>
        {draft && <DetailBody d={draft} onChange={setDraft} />}
      </Sheet>
    </SubScreen>
  )
}

function RowText({ k }: { k: CollarKey }) {
  const l = LABELS[k]
  return (
    <div className="min-w-0 flex-1">
      <b className="block text-[14px]" style={{ color: C.ink }}>{l.title}</b>
      <span className="text-[11px]" style={{ color: C.sub }}>{l.desc}</span>
    </div>
  )
}

function DetailBody({ d, onChange }: { d: CollarDetail; onChange: (x: CollarDetail) => void }) {
  const setToggle = (i: number) => {
    const t = [...(d.toggles ?? [])]; t[i] = { ...t[i], on: !t[i].on }; onChange({ ...d, toggles: t })
  }
  const setOpt = (o: string) => { if (d.options) onChange({ ...d, options: { ...d.options, current: o } }) }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px]" style={{ color: C.sub }}>{d.desc}</p>
      {/* 指标读数（模拟/固件上报） */}
      <div className="grid grid-cols-2 gap-2">
        {d.metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-[#f4f7fc] p-3">
            <div className="flex items-center gap-1 text-[16px] font-extrabold" style={{ color: m.warn ? C.danger : C.ink }}>{m.value}</div>
            <span className="text-[11px]" style={{ color: C.sub }}>{m.label}</span>
          </div>
        ))}
      </div>
      {/* 档位 */}
      {d.options && (
        <div>
          <div className="mb-1.5 text-[12px] font-bold" style={{ color: C.ink }}>{d.options.label}</div>
          <div className="flex rounded-full bg-[#eef2f8] p-1">
            {d.options.options.map((o) => (
              <button key={o} onClick={() => setOpt(o)} className="flex-1 rounded-full py-1.5 text-[13px] font-bold" style={d.options!.current === o ? { background: C.primary, color: '#fff' } : { color: C.sub }}>{o}</button>
            ))}
          </div>
        </div>
      )}
      {/* 开关 */}
      {d.toggles?.map((t, i) => (
        <div key={t.label} className="flex items-center justify-between rounded-xl bg-[#f4f7fc] px-3 py-2.5">
          <span className="text-[13px]" style={{ color: C.ink }}>{t.label}</span>
          <button className={`toggle ${t.on ? 'on' : ''}`} onClick={() => setToggle(i)} aria-label={t.label} />
        </div>
      ))}
      {d.firmware && (
        <p className="rounded-xl bg-[#fff7ec] p-3 text-[11px] leading-relaxed" style={{ color: '#9a7324' }}>
          该模块数据来自项圈固件实时上报。当前展示为模拟数据；真机接入后由固件接口自动刷新（预留 <code>VITE_COLLAR_API</code>）。
        </p>
      )}
      {d.key === 'firmware' && (
        <button className="rounded-full py-3 text-[14px] font-bold text-white" style={{ background: C.primary }}>检查更新</button>
      )}
    </div>
  )
}
