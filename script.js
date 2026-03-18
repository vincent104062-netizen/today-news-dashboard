const newsList = document.getElementById("newsList");
const updateTime = document.getElementById("updateTime");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const statusText = document.getElementById("statusText");
const datePicker = document.getElementById("datePicker");
const keywordInput = document.getElementById("keywordInput");
const severitySelect = document.getElementById("severitySelect");
const loadBtn = document.getElementById("loadBtn");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

const BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

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

function buildDateRange(dateKey) {
  return {
    start: `${dateKey}T00:00:00.000Z`,
    end: `${dateKey}T23:59:59.999Z`
  };
}

function getPrimaryDescription(cve) {
  const descriptions = cve.descriptions || [];
  const zh = descriptions.find(d => d.lang === "zh");
  const en = descriptions.find(d => d.lang === "en");
  return (zh || en || descriptions[0] || {}).value || "No description.";
}

function getCwe(cve) {
  const weaknesses = cve.weaknesses || [];
  for (const w of weaknesses) {
    for (const desc of (w.description || [])) {
      if (desc.value) return desc.value;
    }
  }
  return "N/A";
}

function getCvssInfo(cve) {
  const metrics = cve.metrics || {};

  if (metrics.cvssMetricV31 && metrics.cvssMetricV31.length) {
    const item = metrics.cvssMetricV31[0];
    return {
      version: "CVSS v3.1",
      score: item.cvssData?.baseScore ?? "N/A",
      severity: item.cvssData?.baseSeverity ?? "N/A"
    };
  }

  if (metrics.cvssMetricV30 && metrics.cvssMetricV30.length) {
    const item = metrics.cvssMetricV30[0];
    return {
      version: "CVSS v3.0",
      score: item.cvssData?.baseScore ?? "N/A",
      severity: item.cvssData?.baseSeverity ?? "N/A"
    };
  }

  if (metrics.cvssMetricV2 && metrics.cvssMetricV2.length) {
    const item = metrics.cvssMetricV2[0];
    return {
      version: "CVSS v2",
      score: item.cvssData?.baseScore ?? "N/A",
      severity: item.baseSeverity ?? "N/A"
    };
  }

  return {
    version: "N/A",
    score: "N/A",
    severity: "N/A"
  };
}

function buildApiUrl() {
  const selectedDateKey = datePicker.value;
  const keyword = keywordInput.value.trim();
  const severity = severitySelect.value;

  const { start, end } = buildDateRange(selectedDateKey);
  const params = new URLSearchParams({
    pubStartDate: start,
    pubEndDate: end,
    resultsPerPage: "20"
  });

  params.append("noRejected", "");

  if (keyword) {
    params.set("keywordSearch", keyword);
  }

  if (severity) {
    params.set("cvssV3Severity", severity);
  }

  return `${BASE_URL}?${params.toString()}`;
}

function summarize(total, dateKey) {
  if (!total) return `${dateKey} 沒有符合條件的 CVE。`;
  return `${dateKey} 共找到 ${total} 筆符合條件的 CVE。`;
}

function renderItems(vulnerabilities) {
  newsList.innerHTML = "";

  if (!vulnerabilities.length) {
    newsList.innerHTML = `<div class="empty-state">沒有符合條件的 CVE，請調整日期、關鍵字或嚴重度後再試。</div>`;
    return;
  }

  vulnerabilities.forEach(item => {
    const cve = item.cve;
    const id = cve.id;
    const published = cve.published;
    const description = getPrimaryDescription(cve).slice(0, 260);
    const cwe = getCwe(cve);
    const cvss = getCvssInfo(cve);
    const detailUrl = `https://nvd.nist.gov/vuln/detail/${id}`;

    const card = document.createElement("div");
    card.className = "news-card";
    card.innerHTML = `
      <div class="news-header">
        <span class="news-source">${id}</span>
        <span class="news-time">${formatDateTime(published)}</span>
      </div>
      <a class="news-title" href="${detailUrl}" target="_blank" rel="noopener noreferrer">${id}</a>
      <div class="meta-row">
        <span class="meta-pill">${cvss.version}</span>
        <span class="meta-pill">Score: ${cvss.score}</span>
        <span class="meta-pill">Severity: ${cvss.severity}</span>
        <span class="meta-pill">CWE: ${cwe}</span>
      </div>
      <p class="news-desc">${description}</p>
    `;
    newsList.appendChild(card);
  });
}

async function loadCves() {
  const selectedDateKey = datePicker.value;
  if (!selectedDateKey) {
    statusText.textContent = "請先選擇日期。";
    return;
  }

  updateTime.textContent = new Date().toLocaleString("zh-TW");
  selectedDateLabel.textContent = selectedDateKey;
  statusText.textContent = "正在查詢 NVD CVE API...";
  newsList.innerHTML = `<p class="loading">資料載入中，請稍候...</p>`;

  loadBtn.disabled = true;
  todayBtn.disabled = true;
  yesterdayBtn.disabled = true;

  try {
    const apiUrl = buildApiUrl();
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const vulnerabilities = Array.isArray(data.vulnerabilities) ? data.vulnerabilities : [];
    renderItems(vulnerabilities);
    statusText.textContent = summarize(data.totalResults || vulnerabilities.length, selectedDateKey);
  } catch (error) {
    newsList.innerHTML = `<div class="error-state">NVD 資料載入失敗，請稍後再試或調整查詢條件。</div>`;
    statusText.textContent = "查詢失敗";
  } finally {
    loadBtn.disabled = false;
    todayBtn.disabled = false;
    yesterdayBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadCves);

todayBtn.addEventListener("click", () => {
  datePicker.value = formatKey(getTodayDate());
  loadCves();
});

yesterdayBtn.addEventListener("click", () => {
  datePicker.value = formatKey(getYesterdayDate());
  loadCves();
});

datePicker.value = formatKey(getTodayDate());
loadCves();
