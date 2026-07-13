const BIRTH_DATE_KEY = 'birth_date'
const WISH_KEY = 'life_wish'
const DEFAULT_BIRTH_DATE = '1970-01-01'
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

function todayCN(): string {
  const t = new Date()
  return formatDateCN(`${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`)
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
    birthDate: '',
    hasBirthDate: false,
    isDefaultBirth: false,
    wish: '',
    wishDate: '',
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
      const rawWish = wx.getStorageSync(WISH_KEY)
      let wish = ''
      let wishDate = ''
      if (typeof rawWish === 'string') {
        wish = rawWish
      } else if (rawWish) {
        wish = rawWish.text || ''
        wishDate = rawWish.date || ''
      }

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
        isDefaultBirth: !hasBirthDate,
        birthDate: formatDateCN(birthDate),
        wish,
        wishDate,
        exceeded,
        ratioPercent: Math.min(ratio, 100),
        ratioText: `${ratio.toFixed(2)}%`,
        items: [
          { label: '出生', value: formatDateCN(birthDate), highlight: false },
          { label: '今天', value: todayStr, highlight: false },
          { label: '已活', value: `${formatNumber(livedDays)} 天（${livedYears.toFixed(2)} 年）`, highlight: true },
          { label: '预期', value: `${LIFE_EXPECTANCY_YEARS} 年（${formatNumber(LIFE_EXPECTANCY_DAYS)} 天）`, highlight: false },
          extraItem,
        ],
      })
    },
    goToSettings() {
      wx.navigateTo({
        url: '/pages/settings/settings',
        events: {
          birthDateChanged: () => {
            this.loadData()
          },
        },
      })
    },
    onEditWish() {
      wx.showModal({
        title: '剩下的时间还想干点什么？',
        editable: true,
        placeholderText: '写下一句话，记下来',
        content: this.data.wish,
        success: (res) => {
          if (!res.confirm) return
          const wish = (res.content || '').trim()
          const wishDate = wish ? todayCN() : ''
          wx.setStorageSync(WISH_KEY, { text: wish, date: wishDate })
          this.setData({ wish, wishDate })
        },
      })
    },
    onShareImage() {
      try {
        wx.showLoading({ title: '\u751F\u6210\u56FE\u7247\u4E2D...' })
        const query = this.createSelectorQuery()
        query.select('#shareCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res || !res[0]) { wx.hideLoading(); return }
            const canvas = res[0].node as WechatMiniprogram.Canvas
            const ctx = canvas.getContext('2d') as WechatMiniprogram.CanvasRenderingContext2D
            const dpr = wx.getSystemInfoSync().pixelRatio

            const W = 750
            // 先计算总高度
            const items = this.data.items.filter((i) => i.label !== '\u51FA\u751F')
            let totalH = 100 + 10 + 55 + 20 + items.length * 80 + 80 + 100

            canvas.width = W * dpr
            canvas.height = totalH * dpr
            ctx.scale(dpr, dpr)

            // 白色背景
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, W, totalH)

            let y = 70

            // 标题
            ctx.fillStyle = '#333333'
            ctx.font = 'bold 36px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('\u2665 \u751F\u547D\u8BA1\u7B97\u5668', W / 2, y)

            // 分隔线
            y += 30
            ctx.strokeStyle = '#e8e8e8'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(40, y)
            ctx.lineTo(W - 40, y)
            ctx.stroke()

            // 表头背景
            y += 45
            ctx.fillStyle = '#f5f5f5'
            ctx.fillRect(30, y - 22, W - 60, 46)
            ctx.fillStyle = '#888888'
            ctx.font = '26px sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText('\u9879\u76EE', 60, y + 8)
            ctx.textAlign = 'right'
            ctx.fillText('\u6570\u503C', W - 60, y + 8)

            // 数据行
            for (const item of items) {
              y += 62
              // 行分隔线
              ctx.strokeStyle = '#eeeeee'
              ctx.lineWidth = 1
              ctx.beginPath()
              ctx.moveTo(30, y - 30)
              ctx.lineTo(W - 30, y - 30)
              ctx.stroke()

              // 标签
              ctx.fillStyle = item.highlight ? '#222222' : '#444444'
              ctx.font = item.highlight ? 'bold 28px sans-serif' : '28px sans-serif'
              ctx.textAlign = 'left'
              ctx.fillText(item.label, 60, y + 8)

              // 普通数值
              ctx.textAlign = 'right'
              ctx.font = item.highlight ? 'bold 28px sans-serif' : '28px sans-serif'
              ctx.fillText(item.value, W - 60, y + 8)
            }

            // 进度条行（比例）—— 单独绘制，与 WXML 中独立行结构一致
            y += 62
            // 行分隔线
            ctx.strokeStyle = '#eeeeee'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(30, y - 30)
            ctx.lineTo(W - 30, y - 30)
            ctx.stroke()

            // 标签（middle 基线，与进度条中心对齐）
            ctx.fillStyle = '#444444'
            ctx.font = '28px sans-serif'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText('比例', 60, y)
            ctx.textBaseline = 'alphabetic'

            // 进度条（与"比例"标签垂直居中对齐，水平位于 value-cell 区域内）
            const barX = 230
            const barH = 36
            const barY = y - barH / 2
            const barW = W - 60 - barX  // 右边界与数值行右对齐(x=W-60=690)一致

            // 进度条背景
            ctx.fillStyle = '#f0f0f0'
            ctx.fillRect(barX, barY, barW, barH)

            // 进度条填充
            const pct = Math.min(this.data.ratioPercent, 100)
            if (pct > 0) {
              const fillW = Math.round(pct / 100 * barW)
              ctx.fillStyle = this.data.exceeded ? '#d4a017' : '#07c160'
              ctx.fillRect(barX, barY, fillW, barH)
            }

            // 百分比文字居中（使用 middle 基线精确居中于进度条）
            ctx.fillStyle = '#333333'
            ctx.font = 'bold 24px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(this.data.ratioText, barX + barW / 2, barY + barH / 2)
            ctx.textBaseline = 'alphabetic'

            // 底部文字
            y += 90
            ctx.fillStyle = '#999999'
            ctx.font = '26px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('\u5269\u4E0B\u7684\u65F6\u95F4\u8FD8\u60F3\u5E72\u70B9\u4EC0\u4E48\uFF1F', W / 2, y)

            // 心愿记录
            if (this.data.wish) {
              y += 44
              ctx.fillStyle = '#576b95'
              ctx.font = '28px sans-serif'
              const wishLabel = this.data.wishDate ? `自 ${this.data.wishDate} 起：${this.data.wish}` : this.data.wish
              ctx.fillText(wishLabel, W / 2, y)
            }

            y += 42
            ctx.fillStyle = '#bbbbbb'
            ctx.font = '22px sans-serif'
            ctx.fillText('\u2665 Made by twinsant', W / 2, y)

            // 导出图片
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
            }, 300)
          })
      } catch (_e) {
        wx.hideLoading()
        wx.showToast({ title: '\u751F\u6210\u5931\u8D25', icon: 'none' })
      }
    },
  },
})
