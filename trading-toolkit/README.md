# ⚡ 交易工具箱 | Crypto Trading Toolkit

加密貨幣倉位管理計算器 & 進場點位分析工具

---

## 🚀 Netlify 部署步驟（10 分鐘上線）

### 第一步：建立 GitHub 帳號（如果還沒有）
1. 去 https://github.com 註冊
2. 用 Email 註冊就好，免費

### 第二步：建立 GitHub Repository
1. 登入 GitHub 後，點右上角 **+** → **New repository**
2. Repository name 填：`crypto-trading-toolkit`
3. 選 **Public**
4. 點 **Create repository**

### 第三步：上傳程式碼到 GitHub
在你的 Mac 終端機（Terminal）執行：

```bash
# 1. 解壓縮下載的 ZIP（如果還沒解壓）
cd ~/Downloads
unzip trading-toolkit.zip -d trading-toolkit

# 2. 進入專案資料夾
cd trading-toolkit

# 3. 初始化 Git
git init
git add .
git commit -m "first commit"

# 4. 連結 GitHub（把 YOUR_USERNAME 換成你的 GitHub 帳號名稱）
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crypto-trading-toolkit.git
git push -u origin main
```

### 第四步：連動 Netlify
1. 去 https://app.netlify.com 註冊（用 GitHub 帳號登入最方便）
2. 點 **Add new site** → **Import an existing project**
3. 選 **GitHub** → 授權 → 選 `crypto-trading-toolkit`
4. 設定頁面會自動偵測：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 點 **Deploy site**
6. 等 1-2 分鐘，完成！

### 第五步：自訂網址（選做）
1. Netlify 會給你一個隨機網址，像 `random-name-12345.netlify.app`
2. 點 **Domain settings** → **Edit site name**
3. 改成好記的名字，例如 `crypto-toolkit-tw.netlify.app`

---

## ✏️ 修改 LINE 社群連結

打開 `src/App.jsx`，搜尋 `LINE_COMMUNITY_LINK`，換成你的 LINE 社群邀請連結：

```jsx
href="https://line.me/ti/g2/你的邀請碼"
```

修改後 push 到 GitHub，Netlify 會自動重新部署。

---

## 📱 之後要做的事

- [ ] 把 LINE 社群連結換上去
- [ ] 把網址放到 Threads Bio
- [ ] 截圖工具畫面當素材發 Threads
- [ ] 之後可以加更多工具（K線形態辨識、資金費率查詢等）
