import { useStore } from '@/store/useStore'
import { useAuth } from '@/store/useAuth'
import { isCloudEnabled } from '@/lib/supabase'
import { Cloud, Mail, LogOut, ChevronRight, ShieldCheck } from 'lucide-react'
import { C, G } from '@/mobile/theme'
import { Card } from '@/mobile/MobileShell'
import { SubScreen } from '@/mobile/nav'
import { useMobileUi } from '@/mobile/useMobileUi'

export function AccountScreen() {
  const openModal = useStore((s) => s.openModal)
  const toast = useStore((s) => s.toast)
  const authUser = useAuth((s) => s.user)
  const signOut = useAuth((s) => s.signOut)
  const homeOwnerId = useAuth((s) => s.homeOwnerId)
  const baiduName = useMobileUi((s) => s.baiduName)
  const setBaiduName = useMobileUi((s) => s.setBaiduName)

  // 百度账号登录：已配置 OAuth 则跳转真实授权；否则演示登录（占位）。
  const startBaiduLogin = () => {
    const url = import.meta.env.VITE_BAIDU_OAUTH_URL as string | undefined
    if (url) { window.location.href = url; return }
    setBaiduName('百度用户 · twinkle')
    toast('success', '已通过百度账号登录（演示）')
  }

  return (
    <SubScreen title="账号与云端同步">
      {/* 百度账号 */}
      <Card className="!p-4">
        <div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} color={C.primary} /><b className="text-[14px]" style={{ color: C.ink }}>百度账号</b></div>
        {baiduName ? (
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white" style={{ background: G.primary }}>百</span>
            <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>{baiduName}</b><span className="text-[11px]" style={{ color: C.green }}>已登录 · 百度账号体系</span></div>
            <button className="shrink-0 text-[13px] font-semibold" style={{ color: C.danger }} onClick={() => { setBaiduName(null); toast('info', '已退出百度账号') }}>退出</button>
          </div>
        ) : (
          <>
            <button onClick={startBaiduLogin} className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-[14px] font-bold text-white active:scale-95" style={{ background: G.primary }}>
              使用百度账号登录
            </button>
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: C.sub }}>支持百度账号（UUAP / 百度账号体系）。配置 <code>VITE_BAIDU_OAUTH_URL</code> 后将跳转真实授权页；当前为演示登录。</p>
          </>
        )}
      </Card>

      {/* 邮箱 / 云端同步 */}
      <Card className="mt-3 !p-3.5" onClick={() => openModal('auth')}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Mail size={19} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>邮箱账号 / 云端同步</b><span className="text-[11px]" style={{ color: C.sub }}>{authUser ? authUser.email : isCloudEnabled ? '登录后多端同步与备份' : '云端未配置（本地模式）'}</span></div>
          <ChevronRight size={16} color={C.faint} />
        </div>
      </Card>

      {/* 同步状态 */}
      <Card className="mt-3 !p-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px]" style={{ background: C.primarySoft }}><Cloud size={19} color={C.primary} /></span>
          <div className="min-w-0 flex-1"><b className="block text-[14px]" style={{ color: C.ink }}>家庭 ID 与数据同步</b><span className="text-[11px]" style={{ color: C.sub }}>{homeOwnerId ? `家庭 ID：${homeOwnerId.slice(0, 8)}…` : '当前：我的家'}</span></div>
          <span className="shrink-0 rounded-full bg-[#e6f7ee] px-2 py-0.5 text-[11px] font-bold" style={{ color: C.green }}>{authUser || baiduName ? '已同步' : '本地'}</span>
        </div>
      </Card>

      {(authUser || baiduName) && (
        <button onClick={() => { if (authUser) signOut(); if (baiduName) setBaiduName(null); toast('info', '已退出登录') }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#f0d4d2] bg-white py-3 text-[14px] font-bold" style={{ color: C.danger }}>
          <LogOut size={16} /> 退出登录
        </button>
      )}
    </SubScreen>
  )
}
