/** 在 canvas 上绘制寻宠分享卡片 */
export function drawShareCard(canvas: HTMLCanvasElement, petName: string, lastRoom: string) {
  const x = canvas.getContext('2d')
  if (!x) return
  const W = canvas.width
  const H = canvas.height
  x.clearRect(0, 0, W, H)
  x.fillStyle = '#2e7f75'
  x.fillRect(0, 0, W, H)
  x.fillStyle = 'rgba(255,255,255,.08)'
  x.beginPath()
  x.arc(610, 180, 210, 0, Math.PI * 2)
  x.fill()
  x.fillStyle = '#fff'
  roundRect(x, 48, 48, W - 96, H - 96, 38)
  x.fill()
  x.fillStyle = '#c85f5b'
  x.font = 'bold 28px sans-serif'
  x.fillText('紧急寻宠 · LOST PET', 86, 106)
  x.fillStyle = '#20322f'
  x.font = 'bold 54px sans-serif'
  x.fillText(`帮我找找${petName}`, 86, 176)
  x.fillStyle = '#fff0df'
  x.beginPath()
  x.arc(W / 2, 350, 135, 0, Math.PI * 2)
  x.fill()
  x.font = '150px serif'
  x.textAlign = 'center'
  x.fillText('🐱', W / 2, 405)
  x.textAlign = 'left'
  x.fillStyle = '#20322f'
  x.font = 'bold 30px sans-serif'
  x.fillText('橘猫 · 佩戴青绿色项圈', 86, 535)
  x.fillStyle = '#6e7f79'
  x.font = '24px sans-serif'
  x.fillText(`最后位置：家附近 · ${lastRoom}`, 86, 585)
  x.fillText('最后更新：刚刚', 86, 625)
  x.fillStyle = '#e9f4ef'
  roundRect(x, 80, 670, W - 160, 112, 24)
  x.fill()
  x.fillStyle = '#2e7f75'
  x.font = 'bold 25px sans-serif'
  x.fillText('发现毛球？请点击卡片联系主人', 108, 720)
  x.font = '20px sans-serif'
  x.fillText('PetLink 已开启走失互寻', 108, 756)
  drawFakeQR(x, 510, 682, 115)
  x.fillStyle = '#96a39f'
  x.font = '18px sans-serif'
  x.fillText('定位信息仅在走失模式期间共享', 86, 850)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawFakeQR(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const n = 9
  const cell = s / n
  ctx.fillStyle = '#fff'
  ctx.fillRect(x, y, s, s)
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if ((i * j + i + j) % 3 === 0 || (i < 3 && j < 3) || (i > 5 && j < 3) || (i < 3 && j > 5)) {
        ctx.fillStyle = '#20322f'
        ctx.fillRect(x + i * cell, y + j * cell, cell * 0.84, cell * 0.84)
      }
    }
}
