const demoNews = [
  { title: "中時電子報：今日頭條示例", link: "https://www.chinatimes.com/" },
  { title: "聯合新聞網：今日焦點示例", link: "https://udn.com/news/index" },
  { title: "自由時報：熱門新聞示例", link: "https://news.ltn.com.tw/" },
  { title: "ETtoday：即時新聞示例", link: "https://www.ettoday.net/" }
];

const newsList = document.getElementById("newsList");
newsList.innerHTML = "";

demoNews.forEach((news) => {
  const li = document.createElement("li");
  li.innerHTML = `<a href="${news.link}" target="_blank">${news.title}</a>`;
  newsList.appendChild(li);
});
