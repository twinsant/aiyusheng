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

Component({
  data: {
    items: [] as { label: string; value: string; highlight: boolean }[],
    hasBirthDate: false,
    ratioPercent: 0,
    ratioText: '',
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
      const remainingDays = LIFE_EXPECTANCY_DAYS - livedDays
      const remainingYears = remainingDays / 365.25

      this.setData({
        hasBirthDate,
        ratioPercent: Math.min(ratio, 100),
        ratioText: `${ratio.toFixed(2)}%`,
        items: [
          { label: '出生', value: formatDateCN(birthDate), highlight: false },
          { label: '今天', value: todayStr, highlight: false },
          { label: '已活', value: `${formatNumber(livedDays)} 天（${livedYears.toFixed(2)} 年）`, highlight: true },
          { label: '人均预期', value: `${LIFE_EXPECTANCY_YEARS} 年（${formatNumber(LIFE_EXPECTANCY_DAYS)} 天）`, highlight: false },
          { label: '剩余', value: `约 ${formatNumber(Math.round(remainingDays))} 天（${remainingYears.toFixed(1)} 年）`, highlight: false },
        ],
      })
    },
    goToSettings() {
      wx.navigateTo({ url: '/pages/settings/settings' })
    },
  },
})
