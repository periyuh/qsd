/* site.js — handles homepage wiki-style info */

async function loadSiteInfo() {
  try {
    const res = await fetch('assets/data/site.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const site = await res.json();

    // Title + banner
    const titleEl = document.getElementById('site-title');
    const taglineEl = document.getElementById('site-tagline');
    const bioEl = document.getElementById('site-bio');
    const logosEl = document.getElementById('site-logos');
    const timelineEl = document.getElementById('site-timeline');

    if (titleEl) titleEl.textContent = site.title;
    if (taglineEl) taglineEl.textContent = site.tagline;
    if (bioEl) bioEl.textContent = site.bio;

    if (logosEl) {
      logosEl.innerHTML = `
        <img src="${site.logos.main}" alt="QSD logo" class="logo-main">
        <img src="${site.logos.centered}" alt="QSD centered" class="logo-centered">
        <img src="${site.logos.banner}" alt="QSD banner" class="logo-banner">
      `;
    }

    if (timelineEl && site.timeline) {
      timelineEl.innerHTML = site.timeline.map(ev =>
        `<li><b>${ev.year}</b> — ${ev.event}</li>`
      ).join('');
    }

  } catch (err) {
    console.error('Failed to load site.json:', err.message);
  }
}

document.addEventListener('DOMContentLoaded', loadSiteInfo);
