const demoNews = [
  {
    title: "中時電子報：今日頭條示例",
    link: "https://www.chinatimes.com/",
    desc: "展示新聞聚合網站第二版的卡片式版面設計。"
  },
  {
    title: "聯合新聞網：今日焦點示例",
    link: "https://udn.com/news/index",
    desc: "第二版加入更新時間與版本標示，讓展示效果更明確。"
  },
  {
    title: "自由時報：熱門新聞示例",
    link: "https://news.ltn.com.tw/",
    desc: "此版本可用來展示 GitHub Commit 後，Vercel 自動部署更新。"
  },
  {
    title: "ETtoday：即時新聞示例",
    link: "https://www.ettoday.net/",
    desc: "後續可再擴充為 RSS 或 API 自動抓取真實新聞資料。"
  }
];

const newsList = document.getElementById("newsList");
const updateTime = document.getElementById("updateTime");

updateTime.textContent = new Date().toLocaleString("zh-TW");

newsList.innerHTML = "";

demoNews.forEach((news) => {
  const card = document.createElement("div");
  card.className = "news-card";
  card.innerHTML = `
    <a href="${news.link}" target="_blank">${news.title}</a>
    <p>${news.desc}</p>
  `;
  newsList.appendChild(card);
});
