/* site.js — dynamic homepage loader for QSD
   - Reads: assets/data/site.json
   - Reads chaos lines and specified album + artist JSON files
   - Graceful fallbacks & console debug
*/

async function safeFetchJSON(path) {
  try {
    const res = await fetch(path, {cache: "no-store"});
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn("safeFetchJSON failed:", path, err.message);
    return null;
  }
}

// helper to load a set of files from a folder (file names must be provided)
async function fetchAllFromFolder(folder, files) {
  const out = [];
  for (const f of files) {
    try {
      const p = `${folder.replace(/\/$/, "")}/${f}`;
      const json = await safeFetchJSON(p);
      if (json) out.push(json);
      else console.warn("missing or invalid JSON:", p);
    } catch (e) {
      console.warn("fetchAllFromFolder error:", e);
    }
  }
  return out;
}

function makeEl(html) {
  const container = document.createElement('div');
  container.innerHTML = html.trim();
  return container.firstElementChild;
}

/* Render helpers */
function renderAboutCards(container) {
  const cards = [
    { title: "What is QSD?", content: "QueenServeantDonked is a project by periyuh — a chaos-driven music collective blending satire, identity, and sonic absurdity." },
    { title: "Who’s Involved?", content: "A rotating cast of collaborators and features — producers, vocalists, and performance artists join the chaos." },
    { title: "How it works", content: "Every April Fool's Day we drop albums and experiments. Songs remix, reappear, and borrow each other's energy." }
  ];
  const emojis = ["💥","🧃","🫀","🦄","👀","🔥"];
  cards.forEach(c => {
    const emoji = emojis[Math.floor(Math.random()*emojis.length)];
    const el = makeEl(`<div class="about-card"><h3>${emoji} ${c.title}</h3><p>${c.content}</p></div>`);
    container.appendChild(el);
  });
}

function renderAlbums(container, albums) {
  container.innerHTML = "";
  albums.forEach(album => {
    const cover = album.coverArt || album.cover || album.image || "assets/images/albumcovers/tstetshd.jpg";
    const title = album.title || album.name || album.titleLong || "Untitled";
    const year = album.releaseDate || album.year || "";
    const card = makeEl(`
      <div class="carousel-card" data-album="${title}">
        <img src="${cover}" alt="${title}" loading="lazy">
        <div class="meta"><strong>${title}</strong><div class="muted">${year}</div></div>
      </div>
    `);
    card.addEventListener('click', () => openAlbumModal(album));
    container.appendChild(card);
  });
}

function renderArtists(container, artists) {
  container.innerHTML = "";
  artists.forEach(a => {
    const img = a.image || "assets/images/artists/cameronreid/2.jpg";
    const name = a.name || a.title || "Unknown";
    const bio = a.bio ? (a.bio.length > 180 ? a.bio.slice(0,180)+"…" : a.bio) : "No bio provided.";
    const card = makeEl(`<div class="artist-card"><img src="${img}" alt="${name}"><h4>${name}</h4><p>${bio}</p></div>`);
    card.addEventListener('click', () => openArtistModal(a));
    container.appendChild(card);
  });
}

/* Modal functions (simple) */
function openModal(html) {
  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');
  content.innerHTML = html;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
}
function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  document.getElementById('modal-content').innerHTML = "";
}
function openAlbumModal(album) {
  // Build a simple album modal: title, description, tracklist (if present)
  const title = album.title || album.name || "Untitled";
  let html = `<h2>${title}</h2>`;
  if (album.artist) html += `<p class="muted"><strong>${Array.isArray(album.artist) ? album.artist.join(", ") : album.artist}</strong></p>`;
  if (album.releaseDate) html += `<p class="muted">Released: ${album.releaseDate}</p>`;
  if (album.description) html += `<p>${album.description}</p>`;
  if (album.tracklist && Array.isArray(album.tracklist)) {
    html += `<h3>Tracklist</h3><ol>`;
    album.tracklist.forEach(t => {
      // t may be a filename or string; show as-is (future: fetch song JSON)
      html += `<li>${t.replace(/\.json$/,"")}</li>`;
    });
    html += `</ol>`;
  }
  if (album.links) {
    html += `<h4>Links</h4><p>`;
    for (const [k,v] of Object.entries(album.links)) {
      html += `<a href="${v}" target="_blank" rel="noopener">${k}</a> `;
    }
    html += `</p>`;
  }
  openModal(html);
}
function openArtistModal(artist) {
  const name = artist.name || "Unknown";
  let html = `<h2>${name}</h2>`;
  if (artist.aka) html += `<p class="muted">AKA: ${(Array.isArray(artist.aka)?artist.aka.join(", "):artist.aka)}</p>`;
  if (artist.bio) html += `<p>${artist.bio}</p>`;
  if (artist.links) {
    html += `<h4>Links</h4><p>`;
    for (const [k,v] of Object.entries(artist.links)) {
      html += `<a href="${v}" target="_blank" rel="noopener">${k}</a> `;
    }
    html += `</p>`;
  }
  if (artist.gallery && Array.isArray(artist.gallery) && artist.gallery.length) {
    html += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">`;
    artist.gallery.slice(0,6).forEach(g => html += `<img src="${g}" style="width:80px;border-radius:8px">`);
    html += `</div>`;
  }
  openModal(html);
}

/* Wire modal close */
function wireModal() {
  document.addEventListener('click', (ev) => {
    const action = ev.target.getAttribute && ev.target.getAttribute('data-action');
    if (action === 'close') closeModal();
    if (ev.target.closest && ev.target.closest('.modal-close')) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === "Escape") closeModal(); });
}

/* Main loader */
async function loadSite() {
  try {
    const siteRaw = await safeFetchJSON('assets/data/site.json');
    if (!siteRaw || !siteRaw.site) {
      console.error("site.json missing or malformed");
      return;
    }
    const site = siteRaw.site;

    // Set hero basics
    const logoEl = document.getElementById('logo');
    if (logoEl) logoEl.src = site.logo || 'assets/images/qsdicons/QSD - New Logo.png';
    if (document.getElementById('site-name')) document.getElementById('site-name').textContent = site.name || "QueenServeantDonked";
    if (document.getElementById('site-tagline')) document.getElementById('site-tagline').textContent = site.tagline || "";

    // Chaos quotes
    const chaosPath = site.chaosQuotesJSON || 'assets/data/chaoslines.json';
    const chaosData = await safeFetchJSON(chaosPath);
    const quotes = (chaosData && Array.isArray(chaosData.quotes)) ? chaosData.quotes : ["welcome to chaos"];
    const quoteEl = document.getElementById('chaos-quote');
    if (quoteEl) {
      let idx = 0;
      function showQuote() {
        quoteEl.style.opacity = 0;
        setTimeout(()=> {
          quoteEl.textContent = quotes[idx % quotes.length];
          quoteEl.style.opacity = 1;
          idx++;
        }, 250);
      }
      showQuote();
      setInterval(showQuote, 5000);
    }

    // About cards
    const aboutEl = document.getElementById('about-cards');
    if (aboutEl) renderAboutCards(aboutEl);

    // Albums: we can't auto-scan folder in browser — use a curated list (safe)
    // If you want to change the list add filenames here. These should exist under assets/albums/.
    const albumFiles = [
      "jw-heelz.json","jw-theiconicpop.json","py-thesoundtrack.json",
      "qsd-khakishorts.json","qsd1-emoslay.json","qsd2-idhat.json",
      "qsd3-sissypuss.json","qsd4-thecandidates.json","qsd5-psychward.json"
    ];
    const albums = await fetchAllFromFolder(site.albumsJSON || 'assets/albums', albumFiles);
    const albumsEl = document.getElementById('albums-carousel');
    if (albumsEl) renderAlbums(albumsEl, albums);

    // Artists: expects per-artist single JSON files (e.g. assets/artists/cameronreid.json)
    const artistFiles = ["cameronreid.json","periyuh.json"]; // add more file names here when you add new artist JSONs
    const artists = await fetchAllFromFolder(site.artistsJSON || 'assets/artists', artistFiles);
    const artistsEl = document.getElementById('artists-grid');
    if (artistsEl) renderArtists(artistsEl, artists);

    // Footer links
    const footerTextEl = document.getElementById('footer-text');
    if (footerTextEl) footerTextEl.textContent = `© ${new Date().getFullYear()} ${site.name || "QueenServeantDonked"} — Hosted on ElasticStage`;

    const footerLinksEl = document.getElementById('footer-links');
    if (footerLinksEl && site.links) {
      footerLinksEl.innerHTML = "";
      for (const [k,v] of Object.entries(site.links)) {
        const a = document.createElement('a');
        a.href = v;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = k;
        footerLinksEl.appendChild(a);
      }
    }

    // Enter Chaos button scroll
    const enter = document.getElementById('enter-chaos');
    if (enter) {
      enter.addEventListener('click', () => {
        const node = document.getElementById('about-qsd');
        if (node) node.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Modal wiring
    wireModal();

  } catch (err) {
    console.error("loadSite failed:", err);
  }
}

/* start */
document.addEventListener('DOMContentLoaded', loadSite);
