import type { PetBehavior } from '@/domain/types'

/** 轻量猫咪 SVG，按行为切换姿态/道具（沿用 V4 原型的画法） */
export function PetSvg({ behavior, size = 78 }: { behavior: PetBehavior; size?: number }) {
  const common = (
    <defs>
      <linearGradient id="fur" x1="0" x2="1">
        <stop stopColor="#eaa45b" />
        <stop offset="1" stopColor="#cf7743" />
      </linearGradient>
    </defs>
  )

  if (behavior === 'running') {
    return (
      <svg viewBox="0 0 120 90" width={size} height={(size * 90) / 120} aria-hidden>
        {common}
        <ellipse cx="58" cy="54" rx="30" ry="18" fill="url(#fur)" />
        <circle cx="87" cy="40" r="20" fill="url(#fur)" />
        <path d="M73 28 L77 10 L87 25 M94 24 L105 11 L106 31" fill="url(#fur)" />
        <circle cx="80" cy="38" r="2.8" fill="#20322f" />
        <circle cx="94" cy="37" r="2.8" fill="#20322f" />
        <path d="M34 55q-20-8-24-1" fill="none" stroke="#cf7743" strokeWidth="7" strokeLinecap="round" />
        <path d="M45 66l-17 13M66 67l-5 14M78 59l13 13" stroke="#cf7743" strokeWidth="7" strokeLinecap="round" />
      </svg>
    )
  }

  const sleeping = behavior === 'sleeping'
  const eye = sleeping ? (
    <path d="M47 43q5 5 10 0M68 43q5 5 10 0" fill="none" stroke="#20322f" strokeWidth="2.4" strokeLinecap="round" />
  ) : (
    <>
      <circle cx="52" cy="43" r="3.6" fill="#20322f" />
      <circle cx="72" cy="43" r="3.6" fill="#20322f" />
    </>
  )

  return (
    <svg viewBox="0 0 120 100" width={size} height={(size * 100) / 120} aria-hidden>
      {common}
      <ellipse cx="60" cy="69" rx="31" ry="23" fill="url(#fur)" />
      <circle cx="62" cy="44" r="25" fill="url(#fur)" />
      <path d="M43 29 L47 7 L57 27 M72 26 L84 8 L85 31" fill="url(#fur)" />
      {eye}
      <path d="M59 50q4 3 7 0" fill="none" stroke="#fff" strokeWidth="2" />
      <ellipse cx="61" cy="52" rx="2.8" ry="2" fill="#8a4f3a" />
      <path d="M31 69q-20 6-13 21q4 7 16 0" fill="none" stroke="#cf7743" strokeWidth="7" strokeLinecap="round" />
      {behavior === 'eating' && (
        <>
          <ellipse cx="62" cy="80" rx="24" ry="7" fill="#84a49a" />
          <path d="M41 75h42l-5 12H47z" fill="#d7e6e0" />
        </>
      )}
      {behavior === 'drinking' && (
        <>
          <ellipse cx="62" cy="80" rx="24" ry="7" fill="#84a49a" />
          <path d="M48 77q14 6 28 0" fill="none" stroke="#78aee2" strokeWidth="3" />
        </>
      )}
      {behavior === 'playing' && (
        <>
          <circle cx="92" cy="72" r="12" fill="#e5a860" />
          <path d="M86 72h12M92 66v12" stroke="#fff2d8" strokeWidth="2" />
        </>
      )}
      {behavior === 'litter' && (
        <>
          <rect x="28" y="70" width="65" height="14" rx="5" fill="#b6c9c0" />
          <path d="M37 69q20-10 47 0" fill="#d7c4a7" />
        </>
      )}
      {behavior === 'looking' && (
        <path d="M17 39q8-7 16 0" fill="none" stroke="#7b9e93" strokeWidth="3" />
      )}
      {sleeping && (
        <text x="90" y="25" fontSize="18" fill="#7b9e93" fontWeight="700">
          Z
        </text>
      )}
    </svg>
  )
}
