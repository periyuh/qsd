async function loadSiteData() {
  const res = await fetch("assets/data/site.json");
  const data = await res.json();

  document.querySelector(".header h1").textContent = data.title;
  document.querySelector(".funny-text").textContent = data.bio;

  const logoImg = document.querySelector(".header img");
  if (logoImg) logoImg.src = data.logos.main;
}

document.addEventListener("DOMContentLoaded", loadSiteData);
