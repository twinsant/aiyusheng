const BIRTH_DATE_KEY = 'birth_date'
const DEFAULT_BIRTH_DATE = '1979-05-28'
const LIFE_EXPECTANCY_DAYS = 28709
const LIFE_EXPECTANCY_YEARS = 78.6

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatDateCN(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

function roundRect(ctx: WechatMiniprogram.CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  ctx.fill()
}

Component({
  data: {
    items: [] as { label: string; value: string; highlight: boolean }[],
    hasBirthDate: false,
    ratioPercent: 0,
    ratioText: '',
    exceeded: false,
  },
  lifetimes: {
    attached() {
      this.loadData()
    },
  },
  pageLifetimes: {
    show() {
      this.loadData()
    },
  },
  methods: {
    loadData() {
      const saved = wx.getStorageSync(BIRTH_DATE_KEY)
      const birthDate = saved || DEFAULT_BIRTH_DATE
      const hasBirthDate = !!saved

      const birth = parseDate(birthDate)
      const today = new Date()

      const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
      const livedDays = daysBetween(birth, today)
      const livedYears = livedDays / 365.25
      const ratio = (livedDays / LIFE_EXPECTANCY_DAYS) * 100
      const exceeded = livedDays > LIFE_EXPECTANCY_DAYS

      let extraItem: { label: string; value: string; highlight: boolean }
      if (exceeded) {
        const extraDays = livedDays - LIFE_EXPECTANCY_DAYS
        const extraYears = extraDays / 365.25
        extraItem = { label: '已赚', value: `约 ${formatNumber(Math.round(extraDays))} 天（${extraYears.toFixed(1)} 年）🎉`, highlight: true }
      } else {
        const remainingDays = LIFE_EXPECTANCY_DAYS - livedDays
        const remainingYears = remainingDays / 365.25
        extraItem = { label: '剩余', value: `约 ${formatNumber(Math.round(remainingDays))} 天（${remainingYears.toFixed(1)} 年）`, highlight: false }
      }

      this.setData({
        hasBirthDate,
        exceeded,
        ratioPercent: Math.min(ratio, 100),
        ratioText: `${ratio.toFixed(2)}%`,
        items: [
          { label: '出生', value: formatDateCN(birthDate), highlight: false },
          { label: '今天', value: todayStr, highlight: false },
          { label: '已活', value: `${formatNumber(livedDays)} 天（${livedYears.toFixed(2)} 年）`, highlight: true },
          { label: '人均预期', value: `${LIFE_EXPECTANCY_YEARS} 年（${formatNumber(LIFE_EXPECTANCY_DAYS)} 天）`, highlight: false },
          extraItem,
        ],
      })
    },
    goToSettings() {
      wx.navigateTo({ url: '/pages/settings/settings' })
    },
    onShareImage() {
      try {
        wx.showLoading({ title: '生成图片中...' })
        const query = this.createSelectorQuery()
        query.select('#shareCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0]) { wx.hideLoading(); return }
            const canvas = res[0].node as WechatMiniprogram.Canvas
            const ctx = canvas.getContext('2d') as WechatMiniprogram.CanvasRenderingContext2D
            const dpr = wx.getSystemInfoSync().pixelRatio

            const W = 750
            const items = this.data.items.filter(i => i.label !== '出生')
            let totalH = 120 + 10 + 55 + 20 + items.length * 75 + 90

            canvas.width = W * dpr
            canvas.height = totalH * dpr
            ctx.scale(dpr, dpr)

            // 背景
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, W, totalH)

            let y = 80
            // 标题
            ctx.fillStyle = '#333333'
            ctx.font = 'bold 36px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('\u2665 \u751F\u547D\u8BA1\u7B97\u5668', W / 2, y)

            // 分隔线
            y += 25
            ctx.strokeStyle = '#eeeeee'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(40, y)
            ctx.lineTo(W - 40, y)
            ctx.stroke()

            // 表头
            y += 40
            ctx.fillStyle = '#f5f5f5'
            ctx.fillRect(30, y - 22, W - 60, 45)
            ctx.fillStyle = '#888888'
            ctx.font = '26px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText('\u9879\u76EE', 60, y + 8)
            ctx.textAlign = 'right'
            ctx.fillText('\u6570\u503C', W - 60, y + 8)

            // 数据行
            for (const item of items) {
              y += 58
              ctx.strokeStyle = '#eeeeee'
              ctx.lineWidth = 1
              ctx.beginPath()
              ctx.moveTo(30, y - 28)
              ctx.lineTo(W - 30, y - 28)
              ctx.stroke()

              ctx.fillStyle = item.highlight ? '#222222' : '#444444'
              ctx.font = item.highlight ? 'bold 28px sans-serif' : '28px sans-serif'
              ctx.textAlign = 'left'
              ctx.fillText(item.label, 60, y + 6)

              if (item.label === '\u6BD4\u4F8B') {
                // 进度条
                y += 38
                const barX = 180
                const barW = W - 240
                const barH = 34
                ctx.fillStyle = '#f0f0f0'
                roundRect(ctx, barX, y - barW, barH, barW, 6)
                const fillW = Math.min(this.data.ratioPercent, 100) / 100 * barW
                if (fillW > 0) {
                  ctx.fillStyle = this.data.exceeded ? '#d4a017' : '#07c160'
                  roundRect(ctx, barX, y - barW, barH, fillW, 6)
                }
                ctx.fillStyle = '#333333'
                ctx.font = 'bold 24px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText(this.data.ratioText, barX + barH / 2, y - barW / 2 + 9)
              } else {
                ctx.textAlign = 'right'
                ctx.font = item.highlight ? 'bold 28px sans-serif' : '28px sans-serif'
                ctx.fillText(item.value, W - 60, y + 6)
              }
            }

            // 底部文字
            y += 80
            ctx.fillStyle = '#999999'
            ctx.font = '26px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('\u5269\u4E0B\u7684\u65F6\u95F4\u8FD8\u60F3\u5E72\u70B9\u4EC0\u4E48\uFF1F', W / 2, y)

            y += 42
            ctx.fillStyle = '#bbbbbb'
            ctx.font = '22px sans-serif'
            ctx.fillText('\u2665 Made by twinsant', W / 2, y)

            setTimeout(() => {
              wx.canvasToTempFilePath({
                canvas: canvas as any,
                success: (imgRes) => {
                  wx.hideLoading()
                  wx.saveImageToPhotosAlbum({
                    filePath: imgRes.tempFilePath,
                    success: () => wx.showToast({ title: '\u5DF2\u4FDD\u5B58\u5230\u76F8\u518C', icon: 'success' }),
                    fail: () => wx.showToast({ title: '\u4FDD\u5B58\u5931\u8D25', icon: 'none' }),
                  })
                },
                fail: () => { wx.hideLoading(); wx.showToast({ title: '\u751F\u6210\u5931\u8D25', icon: 'none' }) },
              }, this)
            }, 200)
          })
      } catch (_e) {
        wx.hideLoading()
        wx.showToast({ title: '\u751F\u6210\u5931\u8D25', icon: 'none' })
      }
    },
  },
})
