import { useEffect, useState } from 'react'
import { useAuth } from '@/store/useAuth'
import { useStore } from '@/store/useStore'
import { MonitorSmartphone, MapPin, HeartPulse, User, Sparkles } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { StatusBar } from '@/mobile/MobileShell'
import { NavProvider, type SubKey } from '@/mobile/nav'
import { Devices } from '@/mobile/screens/Devices'
import { Location } from '@/mobile/screens/Location'
import { Duxiaodu } from '@/mobile/screens/Duxiaodu'
import { Health } from '@/mobile/screens/Health'
import { Mine } from '@/mobile/screens/Mine'
import { CollarScreen } from '@/mobile/screens/sub/Collar'
import { PersonaScreen } from '@/mobile/screens/sub/Persona'
import { VoiceLibScreen } from '@/mobile/screens/sub/VoiceLib'
import { LinkedScreen } from '@/mobile/screens/sub/Linked'
import { WidgetScreen } from '@/mobile/screens/sub/Widget'
import { AccountScreen } from '@/mobile/screens/sub/Account'
import { SuperDuScreen } from '@/mobile/screens/sub/SuperDu'
import { FenceScreen } from '@/mobile/screens/sub/Fence'
import { VoiceCallSheet } from '@/mobile/VoiceCallSheet'
import { PetBubble } from '@/mobile/PetBubble'
import { useMobileUi } from '@/mobile/useMobileUi'
// 复用已实现的功能弹层，保证交互真实可用
import { Toaster } from '@/components/Toaster'
import { TrailDrawer } from '@/components/TrailDrawer'
import { CameraModal } from '@/modals/CameraModal'
import { CameraFloat } from '@/components/map/CameraFloat'
import { FenceModal } from '@/modals/FenceModal'
import { LostModal } from '@/modals/LostModal'
import { ShareCardModal } from '@/modals/ShareCardModal'
import { VoiceModal } from '@/modals/VoiceModal'
import { ChatModal } from '@/modals/ChatModal'
import { AutomationModal } from '@/modals/AutomationModal'
import { DeviceModal } from '@/modals/DeviceModal'
import { DeviceControlModal } from '@/modals/DeviceControlModal'
import { MapBuilderModal } from '@/modals/MapBuilderModal'
import { AvatarPanel } from '@/modals/AvatarPanel'
import { EventModal, ActionModal, SoundModal, FriendsModal, LiveLocateModal } from '@/modals/MiscModals'
import { AuthModal } from '@/modals/AuthModal'
import { DesktopWidgetModal } from '@/modals/DesktopWidgetModal'

export type MTab = 'devices' | 'location' | 'duxiaodu' | 'health' | 'mine'

const NAV: { key: MTab; icon: any; label: string }[] = [
  { key: 'devices', icon: MonitorSmartphone, label: '设备' },
  { key: 'location', icon: MapPin, label: '定位' },
  { key: 'duxiaodu', icon: Sparkles, label: '小度' },
  { key: 'health', icon: HeartPulse, label: '健康' },
  { key: 'mine', icon: User, label: '我的' },
]

export function MobileApp() {
  const [tab, setTab] = useState<MTab>('devices')
  const authInit = useAuth((s) => s.init)
  const authRecovery = useAuth((s) => s.recovery)
  const openModal = useStore((s) => s.openModal)
  const bubble = useMobileUi((s) => s.bubble)

  useEffect(() => { authInit() }, [authInit])
  useEffect(() => { if (authRecovery) openModal('auth') }, [authRecovery, openModal])

  const nav = (k: MTab) => () => setTab(k)

  const renderSub = (sub: SubKey) => {
    switch (sub) {
      case 'collar': return <CollarScreen />
      case 'persona': return <PersonaScreen />
      case 'voice': return <VoiceLibScreen />
      case 'linked': return <LinkedScreen />
      case 'widget': return <WidgetScreen />
      case 'account': return <AccountScreen />
      case 'superdu': return <SuperDuScreen />
      case 'fence': return <FenceScreen />
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#c9d6ef] py-0 sm:py-6">
      <div className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden sm:h-[904px] sm:max-h-[95vh] sm:rounded-[44px] sm:border-[10px] sm:border-[#11131c] sm:shadow-[0_30px_80px_rgba(20,40,80,.42)]" style={{ background: G.page }}>
        <NavProvider render={renderSub}>
          <StatusBar />

          <main className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 pt-1">
            {tab === 'devices' && <Devices go={setTab} />}
            {tab === 'location' && <Location />}
            {tab === 'duxiaodu' && <Duxiaodu go={setTab} />}
            {tab === 'health' && <Health />}
            {tab === 'mine' && <Mine />}
          </main>

          {/* 底部 5-Tab，小度居中凸起 */}
          <nav className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-around border-t border-[#eef0f5] bg-white/97 px-2 pb-6 pt-1.5 backdrop-blur-xl">
            {NAV.map((n) => {
              const active = tab === n.key
              const I = n.icon
              if (n.key === 'duxiaodu') {
                return (
                  <button key={n.key} data-testid={`mtab-${n.key}`} onClick={nav(n.key)} className="flex w-[74px] flex-col items-center">
                    <span className="grid h-[52px] w-[52px] -translate-y-3 place-items-center rounded-full text-white shadow-[0_8px_20px_rgba(61,127,255,.45)]" style={{ background: G.primary }}>
                      <I size={24} strokeWidth={2} />
                    </span>
                    <span className="-mt-2 text-[10px] font-bold" style={{ color: active ? C.primary : C.faint }}>{n.label}</span>
                  </button>
                )
              }
              return (
                <button key={n.key} data-testid={`mtab-${n.key}`} onClick={nav(n.key)} className="flex w-[74px] flex-col items-center gap-1 py-1.5">
                  <I size={22} strokeWidth={active ? 2.3 : 1.9} color={active ? C.primary : C.faint} />
                  <span className="text-[10px] font-bold" style={{ color: active ? C.primary : C.faint }}>{n.label}</span>
                </button>
              )
            })}
          </nav>
        </NavProvider>

        {/* 功能弹层（复用完整版，交互真实） */}
        <Toaster />
        <TrailDrawer />
        <CameraModal />
        <CameraFloat />
        <FenceModal />
        <LostModal />
        <ShareCardModal />
        <VoiceModal />
        <ChatModal />
        <AutomationModal />
        <DeviceModal />
        <DeviceControlModal />
        <MapBuilderModal />
        <AvatarPanel />
        <EventModal />
        <ActionModal />
        <SoundModal />
        <FriendsModal />
        <LiveLocateModal />
        <AuthModal />
        <DesktopWidgetModal />
        <VoiceCallSheet />
        {bubble && <PetBubble />}
      </div>
    </div>
  )
}
