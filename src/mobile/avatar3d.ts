// 上传照片 → 合成写实 3D 形象（预留接口）。
// 现为模拟实现：返回处理后的照片 dataURL 作为「写实形象」。
// 真机/真实 3D 服务对接：设置 VITE_AVATAR3D_API，实现 postGenerate() 上传照片并轮询生成结果（glb/贴图或渲染图）。

export type Gen3DResult = { image: string; modelUrl?: string }

const API = import.meta.env.VITE_AVATAR3D_API as string | undefined

export async function generate3DAvatar(photoDataUrl: string, onProgress?: (p: number) => void): Promise<Gen3DResult> {
  if (API) return postGenerate(photoDataUrl, onProgress)
  // 模拟生成进度
  for (let p = 10; p <= 100; p += 18) {
    await new Promise((r) => setTimeout(r, 260))
    onProgress?.(Math.min(100, p))
  }
  return { image: photoDataUrl }
}

async function postGenerate(photoDataUrl: string, onProgress?: (p: number) => void): Promise<Gen3DResult> {
  onProgress?.(20)
  const res = await fetch(`${API}/avatar3d/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: photoDataUrl }),
  })
  onProgress?.(100)
  return res.json()
}
