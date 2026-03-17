const newsList = document.getElementById("newsList");
const updateTime = document.getElementById("updateTime");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const statusText = document.getElementById("statusText");
const datePicker = document.getElementById("datePicker");
const loadBtn = document.getElementById("loadBtn");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

const sources = [
  { name: "中時新聞網", domainQuery: "site:chinatimes.com" },
  { name: "聯合新聞網", domainQuery: "site:udn.com" },
  { name: "自由時報", domainQuery: "site:ltn.com.tw" },
  { name: "ETtoday", domainQuery: "site:ettoday.net" }
];

function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayDate() {
  return new Date();
}

function getYesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
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

function filterByDate(items, selectedDateKey) {
  return items.filter(item => {
    const d = new Date(item.pubDate);
    if (Number.isNaN(d.getTime())) return false;
    return formatKey(d) === selectedDateKey;
  });
}

function summarize(items, dateKey) {
  if (!items.length) {
    return `${dateKey} 沒有抓到可顯示的新聞。`;
  }
  return `${dateKey} 共整理 ${items.length} 則新聞。`;
}

function renderNews(items) {
  newsList.innerHTML = "";

  if (!items.length) {
    newsList.innerHTML = `<div class="empty-state">這一天目前沒有抓到新聞，請改選其他日期再試。</div>`;
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

async function loadNewsBySelectedDate() {
  const selectedDateKey = datePicker.value;
  if (!selectedDateKey) {
    statusText.textContent = "請先選擇日期。";
    return;
  }

  newsList.innerHTML = `<p class="loading">新聞載入中，請稍候...</p>`;
  statusText.textContent = "正在抓取新聞...";
  updateTime.textContent = new Date().toLocaleString("zh-TW");
  selectedDateLabel.textContent = selectedDateKey;

  try {
    const results = await Promise.allSettled(sources.map(fetchSourceNews));

    let merged = [];

    results.forEach(result => {
      if (result.status === "fulfilled") {
        merged = merged.concat(result.value);
      }
    });

    merged = filterByDate(merged, selectedDateKey)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 20);

    renderNews(merged);
    statusText.textContent = summarize(merged, selectedDateKey);
  } catch (error) {
    newsList.innerHTML = `<div class="error-state">新聞載入失敗，請稍後重新整理。</div>`;
    statusText.textContent = "載入失敗";
  }
}

loadBtn.addEventListener("click", loadNewsBySelectedDate);

todayBtn.addEventListener("click", () => {
  datePicker.value = formatKey(getTodayDate());
  loadNewsBySelectedDate();
});

yesterdayBtn.addEventListener("click", () => {
  datePicker.value = formatKey(getYesterdayDate());
  loadNewsBySelectedDate();
});

datePicker.value = formatKey(getTodayDate());
loadNewsBySelectedDate();
