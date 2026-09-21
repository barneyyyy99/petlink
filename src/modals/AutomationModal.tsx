import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Modal } from '@/components/Modal'
import type { AutomationRule, DeviceType, RuleExecMode, RuleTrigger } from '@/domain/types'

const TRIGGERS: { v: RuleTrigger; label: string; needsThreshold?: 'temp' | 'humidity' | 'minutes' }[] = [
  { v: 'enter_room', label: '宠物进入房间' },
  { v: 'leave_room', label: '宠物离开房间' },
  { v: 'temp_above', label: '温度高于', needsThreshold: 'temp' },
  { v: 'humidity_above', label: '湿度高于', needsThreshold: 'humidity' },
  { v: 'stay_over', label: '停留超过（分钟）', needsThreshold: 'minutes' },
  { v: 'bell', label: '拨动找主人铃铛' },
  { v: 'feeder_event', label: '喂食器事件' },
  { v: 'water_event', label: '饮水器事件' },
]
const MODES: { v: RuleExecMode; label: string }[] = [
  { v: 'suggest', label: '先建议，用户确认' },
  { v: 'auto', label: '自动执行' },
  { v: 'notify', label: '仅通知' },
]
const DEV_TYPES: { v: DeviceType; label: string }[] = [
  { v: 'ac', label: '空调' }, { v: 'camera', label: '摄像头' }, { v: 'speaker', label: '音箱' },
  { v: 'smart_screen', label: '智能屏' }, { v: 'feeder', label: '喂食器' }, { v: 'water', label: '饮水器' },
]

const blank = (): Omit<AutomationRule, 'id'> => ({
  name: '新规则', trigger: 'enter_room', targetRoomId: 'current', targetDeviceType: 'ac',
  action: '发送联动建议', mode: 'suggest', enabled: true, threshold: undefined,
})

export function AutomationModal() {
  const open = useStore((s) => s.modal === 'automation')
  const close = useStore((s) => s.closeModal)
  const rules = useStore((s) => s.rules)
  const rooms = useStore((s) => s.homeMap.rooms)
  const addRule = useStore((s) => s.addRule)
  const updateRule = useStore((s) => s.updateRule)
  const removeRule = useStore((s) => s.removeRule)
  const toggleRule = useStore((s) => s.toggleRule)

  const [draft, setDraft] = useState<Omit<AutomationRule, 'id'> | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const triggerLabel = (t: RuleTrigger) => TRIGGERS.find((x) => x.v === t)?.label ?? t
  const modeLabel = (m: RuleExecMode) => MODES.find((x) => x.v === m)?.label ?? m
  const roomLabel = (id: string) => (id === 'current' ? '宠物当前房间' : rooms.find((r) => r.id === id)?.name ?? id)

  const save = () => {
    if (!draft) return
    if (editId) updateRule(editId, draft)
    else addRule(draft)
    setDraft(null)
    setEditId(null)
  }

  const needsThreshold = draft && TRIGGERS.find((t) => t.v === draft.trigger)?.needsThreshold

  return (
    <Modal open={open} onClose={close} title="全屋联动规则" eyebrow="HOME AUTOMATION" desc="默认“建议 + 用户确认”；可修改触发条件、房间、设备与执行模式。" testId="automation-modal">
      {!draft && (
        <div className="flex flex-col gap-2">
          {rules.map((r) => (
            <div key={r.id} data-testid="rule-card" className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-line bg-white p-3">
              <div>
                <b className="text-[13px]">{triggerLabel(r.trigger)}{r.threshold != null ? ` ${r.threshold}` : ''} · {r.name}</b>
                <div className="mt-0.5 text-xs text-muted">{roomLabel(r.targetRoomId)} → {r.action} · {modeLabel(r.mode)}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="btn" onClick={() => { setDraft({ ...r }); setEditId(r.id) }}>编辑</button>
                <button className="btn" onClick={() => removeRule(r.id)}>删除</button>
                <button className={`toggle ${r.enabled ? 'on' : ''}`} aria-label="启停" onClick={() => toggleRule(r.id)} />
              </div>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <button className="btn btn-primary" onClick={() => { setDraft(blank()); setEditId(null) }}>＋ 新建规则</button>
          </div>
        </div>
      )}

      {draft && (
        <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] text-muted">规则名称</label>
            <input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted">触发条件</label>
            <select className="field" value={draft.trigger} onChange={(e) => setDraft({ ...draft, trigger: e.target.value as RuleTrigger })}>
              {TRIGGERS.map((t) => (<option key={t.v} value={t.v}>{t.label}</option>))}
            </select>
          </div>
          {needsThreshold && (
            <div>
              <label className="mb-1 block text-[11px] text-muted">阈值（{needsThreshold === 'temp' ? '℃' : needsThreshold === 'humidity' ? '%' : '分钟'}）</label>
              <input type="number" className="field" value={draft.threshold ?? 0} onChange={(e) => setDraft({ ...draft, threshold: Number(e.target.value) })} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[11px] text-muted">目标房间</label>
            <select className="field" value={draft.targetRoomId} onChange={(e) => setDraft({ ...draft, targetRoomId: e.target.value })}>
              <option value="current">宠物当前房间</option>
              {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-muted">目标设备</label>
            <select className="field" value={draft.targetDeviceType} onChange={(e) => setDraft({ ...draft, targetDeviceType: e.target.value as DeviceType })}>
              {DEV_TYPES.map((d) => (<option key={d.v} value={d.v}>{d.label}</option>))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] text-muted">动作</label>
            <input className="field" value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] text-muted">执行模式</label>
            <select className="field" value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value as RuleExecMode })}>
              {MODES.map((m) => (<option key={m.v} value={m.v}>{m.label}</option>))}
            </select>
          </div>
          <div className="col-span-2 flex gap-2">
            <button className="btn btn-primary" onClick={save}>保存规则</button>
            <button className="btn" onClick={() => { setDraft(null); setEditId(null) }}>取消</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
