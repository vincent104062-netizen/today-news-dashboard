const newsList = document.getElementById("newsList");
const updateTime = document.getElementById("updateTime");
const todayLabel = document.getElementById("todayLabel");
const statusText = document.getElementById("statusText");
const refreshBtn = document.getElementById("refreshBtn");

const sources = [
  {
    name: "中時新聞網",
    domainQuery: "site:chinatimes.com"
  },
  {
    name: "聯合新聞網",
    domainQuery: "site:udn.com"
  },
  {
    name: "自由時報",
    domainQuery: "site:ltn.com.tw"
  },
  {
    name: "ETtoday",
    domainQuery: "site:ettoday.net"
  }
];

function getTodayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "時間未知";
  return date.toLocaleString("zh-TW");
}

function getGoogleNewsRssUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
}

function getRss2JsonUrl(rssUrl) {
  return `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
}

async function fetchSourceNews(source) {
  const rssUrl = getGoogleNewsRssUrl(source.domainQuery);
  const apiUrl = getRss2JsonUrl(rssUrl);

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(`${source.name} 載入失敗`);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items.map(item => ({
    source: source.name,
    title: item.title || "未命名新聞",
    link: item.link || "#",
    pubDate: item.pubDate || "",
    description: item.description || ""
  }));
}

function stripHtml(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

function filterTodayNews(items) {
  const today = getTodayKey();
  return items.filter(item => {
    const d = new Date(item.pubDate);
    if (Number.isNaN(d.getTime())) return false;
    return getTodayKey(d) === today;
  });
}

function summarize(items) {
  if (!items.length) {
    return "今天目前沒有抓到可顯示的新聞。";
  }
  return `共整理 ${items.length} 則今日新聞。`;
}

function renderNews(items) {
  newsList.innerHTML = "";

  if (!items.length) {
    newsList.innerHTML = `<div class="empty-state">今天目前沒有抓到新聞，可能是來源尚未更新，請稍後再試。</div>`;
    return;
  }

  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "news-card";

    const desc = stripHtml(item.description).trim().slice(0, 120) || "點擊查看完整新聞內容。";

    card.innerHTML = `
      <div class="news-header">
        <span class="news-source">${item.source}</span>
        <span class="news-time">${formatDateTime(item.pubDate)}</span>
      </div>
      <a class="news-title" href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
      <p class="news-desc">${desc}</p>
    `;

    newsList.appendChild(card);
  });
}

async function loadNews() {
  newsList.innerHTML = `<p class="loading">新聞載入中，請稍候...</p>`;
  statusText.textContent = "正在抓取今日新聞...";
  updateTime.textContent = new Date().toLocaleString("zh-TW");
  todayLabel.textContent = getTodayKey();

  try {
    const results = await Promise.allSettled(sources.map(fetchSourceNews));

    let merged = [];

    results.forEach(result => {
      if (result.status === "fulfilled") {
        merged = merged.concat(result.value);
      }
    });

    merged = filterTodayNews(merged)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 20);

    renderNews(merged);
    statusText.textContent = summarize(merged);
  } catch (error) {
    newsList.innerHTML = `<div class="error-state">新聞載入失敗，請稍後重新整理。</div>`;
    statusText.textContent = "載入失敗";
  }
}

refreshBtn.addEventListener("click", loadNews);

loadNews();
