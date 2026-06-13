# 爱余生 (AiYuSheng)

> 生命计算器 — 让每一秒都值得被看见

一款简洁的微信小程序，通过可视化的方式展示你已度过的生命时光，提醒你珍惜当下。

## 功能

- **生日设置** — 选择你的出生日期，本地存储，隐私安全
- **生命计数** — 实时计算已活天数、年数
- **进度可视化** — 进度条直观展示生命进程（超预期时变为金色）
- **超额庆祝** — 超过人均预期寿命时，「剩余」变「已赚」🎉

## 截图

| 首页 | 设置 |
|:---:|:---:|
| 生命数据一览 | 自定义生日 |

## 技术栈

- **框架**：微信小程序原生 + glass-easel 组件化
- **语言**：TypeScript
- **样式**：Less
- **渲染**：Skyline 渲染引擎
- **数据存储**：`wx.setStorageSync` 本地缓存

## 项目结构

```
miniprogram/
├── components/
│   └── navigation-bar/    # 自定义导航栏
├── pages/
│   ├── index/             # 首页 - 生命计算器
│   ├── settings/          # 设置页 - 生日选择
│   └── logs/
├── utils/
├── app.ts
├── app.json
└── app.less
```

## 开发

```bash
# 安装依赖
npm install

# 使用微信开发者工具打开项目根目录即可预览和调试
```

## 作者

♥ Made by [twinsant](https://github.com/twinsant)
