const BIRTH_DATE_KEY = 'birth_date'

Page({
  data: {
    birthDate: '',
    today: '',
  },
  onLoad() {
    const saved = wx.getStorageSync(BIRTH_DATE_KEY) || ''
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    this.setData({
      birthDate: saved,
      today: todayStr,
    })
  },
  onDateChange(e: WechatMiniprogram.PickerChange) {
    this.setData({
      birthDate: e.detail.value as string,
    })
  },
  saveBirthDate() {
    const { birthDate } = this.data
    if (!birthDate) {
      wx.showToast({ title: '请选择生日', icon: 'none' })
      return
    }
    wx.setStorageSync(BIRTH_DATE_KEY, birthDate)
    wx.showToast({ title: '保存成功', icon: 'success' })
    // 通知首页刷新，避免返回时页面生命周期未触发导致修改不生效
    const channel = this.getOpenerEventChannel?.()
    if (channel && typeof channel.emit === 'function') {
      channel.emit('birthDateChanged')
    }
    setTimeout(() => {
      wx.navigateBack()
    }, 800)
  },
})
