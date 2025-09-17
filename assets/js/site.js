/* site.js — loads wiki info (bio, timeline, etc) */

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.error("fetchJSON error:", path, err.message);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const siteData = await fetchJSON("assets/data/site.json");
  if (!siteData) return;

  // Bio
  const bioEl = document.getElementById("site-bio");
  if (bioEl) bioEl.textContent = siteData.bio || "";

  // Timeline
  const timelineEl = document.getElementById("site-timeline");
  if (timelineEl && Array.isArray(siteData.timeline)) {
    timelineEl.innerHTML = siteData.timeline
      .map(item => `<li>${item}</li>`)
      .join("");
  }
});
