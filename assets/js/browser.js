// browser.js — Phase 1 album modal + carousel (interactive)
// Overwrites previous browser.js — uses your album JSON files in assets/albums/*.json

const DATA_DIR = "assets/albums";
const SONGS_SUBDIR = "songs"; // we fetch songs from assets/albums/songs/<file>

async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.status);
    return await res.json();
  } catch (err) {
    console.warn("fetchJSON error:", path, err.message);
    return null;
  }
}

/* ----------------------
   Modal utilities (dynamically create the modal)
   ---------------------- */
function createModalDOM() {
  // if already present, return existing
  if (document.getElementById("qsd-modal")) return;

  const modal = document.createElement("div");
  modal.id = "qsd-modal";
  modal.className = "qsd-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="qsd-modal-backdrop" id="qsd-modal-backdrop"></div>
    <div class="qsd-modal-content" role="dialog" aria-modal="true" aria-labelledby="qsd-modal-title">
      <button class="qsd-modal-close" id="qsd-modal-close" aria-label="Close">✖</button>
      <div class="qsd-modal-grid">
        <div class="qsd-cover" id="qsd-modal-cover"><img src="" alt="" /></div>
        <div class="qsd-meta">
          <h2 id="qsd-modal-title"></h2>
          <p id="qsd-modal-artist" class="muted tiny"></p>
          <p id="qsd-modal-release" class="muted tiny"></p>
          <p id="qsd-modal-desc"></p>
          <div class="qsd-modal-buttons">
            <button id="qsd-view-tracklist" class="btn small">🎵 View Tracklist</button>
            <button id="qsd-view-links" class="btn small">🔗 View Links</button>
          </div>
        </div>
      </div>

      <div id="qsd-modal-body" class="qsd-modal-body" aria-live="polite"></div>
      <div class="qsd-modal-footer">
        <small id="qsd-modal-footer-note" class="muted tiny"></small>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Events
  const close = () => closeModal();
  document.getElementById("qsd-modal-close").addEventListener("click", close);
  document.getElementById("qsd-modal-backdrop").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    const modalEl = document.getElementById("qsd-modal");
    if (!modalEl || modalEl.getAttribute("aria-hidden") === "true") return;
    if (e.key === "Escape") close();
  });
}

function openModal() {
  const modal = document.getElementById("qsd-modal");
  if (!modal) return;
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("qsd-modal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  // subtle hide animation timing compatibility
  setTimeout(() => { modal.style.display = "none"; }, 160);
  document.body.style.overflow = "";
}

function emptyModalBody() {
  const body = document.getElementById("qsd-modal-body");
  if (body) body.innerHTML = "";
}

/* ----------------------
   Album -> modal rendering
   ---------------------- */
async function showAlbumModal(album) {
  createModalDOM();

  // fill header/meta
  const titleEl = document.getElementById("qsd-modal-title");
  const artistEl = document.getElementById("qsd-modal-artist");
  const releaseEl = document.getElementById("qsd-modal-release");
  const descEl = document.getElementById("qsd-modal-desc");
  const coverImg = document.querySelector("#qsd-modal-cover img");
  const footerNote = document.getElementById("qsd-modal-footer-note");

  titleEl.textContent = album.title || "Untitled";
  artistEl.textContent = Array.isArray(album.artist) ? album.artist.join(" · ") : (album.artist || "QSD");
  releaseEl.textContent = album.releaseDate ? `Released: ${album.releaseDate}` : "";
  descEl.textContent = album.description || "";
  coverImg.src = album.coverArt || "assets/images/albumcovers/emoslay.jpg";
  coverImg.alt = `${album.title} cover`;

  footerNote.textContent = ""; // filled later by links if needed

  // wire buttons
  const tracklistBtn = document.getElementById("qsd-view-tracklist");
  const linksBtn = document.getElementById("qsd-view-links");

  // remove previous listeners by cloning
  tracklistBtn.replaceWith(tracklistBtn.cloneNode(true));
  linksBtn.replaceWith(linksBtn.cloneNode(true));
  const tracklistBtnNew = document.getElementById("qsd-view-tracklist");
  const linksBtnNew = document.getElementById("qsd-view-links");

  // Tracklist handler: fetch song files in album.tracklist (if available)
  tracklistBtnNew.addEventListener("click", async () => {
    const body = document.getElementById("qsd-modal-body");
    body.innerHTML = `<p class="muted">Loading tracklist…</p>`;
    if (!Array.isArray(album.tracklist) || album.tracklist.length === 0) {
      body.innerHTML = `<p class="muted">No tracklist available.</p>`;
      return;
    }

    // fetch each song JSON (best-effort)
    const list = document.createElement("ol");
    list.className = "qsd-tracklist";
    for (const fname of album.tracklist) {
      const cleaned = fname.replace(/^\//, "");
      let songData = null;
      try {
        // try two possible locations: assets/albums/songs/<fname> and assets/albums/<fname>
        songData = await fetchJSON(`${DATA_DIR}/${SONGS_SUBDIR}/${cleaned}`);
        if (!songData) songData = await fetchJSON(`${DATA_DIR}/${cleaned}`);
      } catch (e) {
        songData = null;
      }

      const li = document.createElement("li");
      li.dataset.file = fname;
      li.className = "qsd-tracklist-item";

      const displayTitle = (songData && songData.title) ? songData.title : prettifyFilename(cleaned);
      const feature = songData && songData.feature ? (Array.isArray(songData.feature) ? ` — feat. ${songData.feature.join(", ")}` : ` — feat. ${songData.feature}`) : "";
      li.innerHTML = `<button class="qsd-track-btn">${escapeHtml(displayTitle)}${escapeHtml(feature)}</button>`;

      // placeholder behavior on click — Phase 2 will open the full track view
      li.querySelector("button").addEventListener("click", () => {
        // show a small temporary info panel
        const panel = document.createElement("div");
        panel.className = "qsd-track-panel";
        panel.innerHTML = `
          <h4>${escapeHtml(displayTitle)}</h4>
          <p class="muted tiny">Track details coming soon — full track view will include lyrics, audio player, credits and navigation.</p>
          <p class="muted tiny">Filename: <code>${escapeHtml(cleaned)}</code></p>
        `;
        const bodyEl = document.getElementById("qsd-modal-body");
        bodyEl.prepend(panel);
        // remove after 6s to keep UI tidy
        setTimeout(() => panel.remove(), 6000);
      });

      list.appendChild(li);
    }

    body.innerHTML = "";
    const header = document.createElement("h3");
    header.textContent = "Tracklist";
    body.appendChild(header);
    body.appendChild(list);
  });

  // Links handler: render streaming & buy links
  linksBtnNew.addEventListener("click", () => {
    const body = document.getElementById("qsd-modal-body");
    body.innerHTML = "";
    const header = document.createElement("h3");
    header.textContent = "Links";
    body.appendChild(header);

    const container = document.createElement("div");
    container.className = "qsd-links";

    const platformMap = {
      Spotify: "🟢",
      "Apple Music": "🍎",
      Bandcamp: "🎧",
      YouTube: "▶️",
      SoundCloud: "🔊",
      Tidal: "🔵"
    };

    let any = false;
    if (album.links && typeof album.links === "object" && Object.keys(album.links).length) {
      const list = document.createElement("ul");
      for (const [name, url] of Object.entries(album.links)) {
        any = true;
        const li = document.createElement("li");
        li.innerHTML = `<a href="${url}" target="_blank" rel="noopener">${platformMap[name] || "🔗"} ${escapeHtml(name)}</a>`;
        list.appendChild(li);
      }
      container.appendChild(list);
    }

    if (album.buy && typeof album.buy === "object" && Object.keys(album.buy).length) {
      const buyHeader = document.createElement("h4");
      buyHeader.textContent = "Buy";
      container.appendChild(buyHeader);
      const blist = document.createElement("ul");
      for (const [name, url] of Object.entries(album.buy)) {
        any = true;
        const li = document.createElement("li");
        li.innerHTML = `<a href="${url}" target="_blank" rel="noopener">🛒 ${escapeHtml(name)}</a>`;
        blist.appendChild(li);
      }
      container.appendChild(blist);
    }

    if (!any) {
      container.innerHTML = `<p class="muted">No external links available for this release.</p>`;
    }

    body.appendChild(container);
  });

  // show modal
  emptyModalBody();
  openModal();
}

/* ----------------------
   Helper utilities
   ---------------------- */
function prettifyFilename(filename) {
  return filename.replace(/\.json$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ----------------------
   Album carousel builder
   ---------------------- */
async function loadAlbums() {
  const track = document.getElementById("albums-track");
  const extraTrack = document.getElementById("extra-albums-track");
  if (!track || !extraTrack) return;

  const albumFiles = [
    "jw-heelz.json",
    "jw-theiconicpop.json",
    "py-thesoundtrack.json",
    "qsd-khakishorts.json",
    "qsd1-emoslay.json",
    "qsd2-idhat.json",
    "qsd3-sissypuss.json",
    "qsd4-thecandidates.json",
    "qsd5-psychward.json"
  ];

  for (const file of albumFiles) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album) continue;

    const card = document.createElement("div");
    card.className = "carousel-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", "false");

    const cover = album.coverArt || `assets/images/albumcovers/${file.replace(".json","")}.jpg`;

    card.innerHTML = `
      <img src="${cover}" alt="${escapeHtml(album.title || 'Album cover')}">
      <div class="meta">
        <strong>${escapeHtml(album.title || 'Untitled')}</strong>
        <p class="muted tiny">${escapeHtml(Array.isArray(album.artist) ? album.artist.join(", ") : (album.artist || "QSD"))}</p>
      </div>
    `;

    // click opens modal
    card.addEventListener("click", () => showAlbumModal(album));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") showAlbumModal(album); });

    // decide which carousel
    if (album.carousel === "main" || album.carousel === "primary" || album.carousel === undefined) {
      track.appendChild(card);
    } else {
      extraTrack.appendChild(card);
    }
  }
}

/* ----------------------
   Init
   ---------------------- */
document.addEventListener("DOMContentLoaded", () => {
  createModalDOM(); // ensure modal DOM exists
  loadAlbums();
});
