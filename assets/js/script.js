/* script.js — QSD Archive: albums, tracks, artists with carousel + lyrics modal */

const DATA_DIR = "assets/data";
const SONGS_DIR = `${DATA_DIR}/qsd-songs`;
const AUDIO_DIR = "assets/audio";

const ALBUM_FILES = [
  "qsd1-emoslay.json",
  "qsd2-idhat.json",
  "qsd3-sissypuss.json",
  "qsd4-thecandidates.json",
  "qsd5-psychward.json",
  "qsd-khakishorts.json",
];

/* Egg */
console.log(
  "%cQSD REBORN — look in the corners, little secrets hide ✨",
  "color:#ff2ea6;font-weight:700"
);

/* Helpers */
async function fetchJSON(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.warn("fetchJSON error", path, err.message);
    return null;
  }
}

/* UI elements */
const albumDetail = document.getElementById("album-detail");
const albumDetailInner = document.getElementById("detail-inner");
const detailBack = document.getElementById("detail-back");

const modal = document.getElementById("track-modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");
const prevBtn = document.getElementById("prev-track");
const nextBtn = document.getElementById("next-track");

const lyricsModal = document.createElement("div");
lyricsModal.className = "modal hidden";
lyricsModal.innerHTML = `
  <div class="modal-panel">
    <button id="lyrics-close" class="btn small">✕</button>
    <div id="lyrics-body"></div>
  </div>
`;
document.body.appendChild(lyricsModal);
const lyricsClose = lyricsModal.querySelector("#lyrics-close");
const lyricsBody = lyricsModal.querySelector("#lyrics-body");

let currentAlbum = null;
let currentTracks = [];
let currentTrackIndex = 0;

/* Carousel builder */
function makeCarousel(containerId, items, renderCard) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const track = container.querySelector(".carousel-track");
  const prev = container.querySelector(".carousel-prev");
  const next = container.querySelector(".carousel-next");

  track.innerHTML = "";
  items.forEach((item) => track.appendChild(renderCard(item)));

  prev.addEventListener("click", () => {
    track.scrollBy({ left: -200, behavior: "smooth" });
  });
  next.addEventListener("click", () => {
    track.scrollBy({ left: 200, behavior: "smooth" });
  });
}

/* ----- Albums ----- */
async function loadAlbums() {
  const albums = [];
  for (const file of ALBUM_FILES) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (album) albums.push({ ...album, file });
  }

  makeCarousel("albums-carousel", albums, (album) => {
    const safeName = album.file.replace(".json", "").replace(/^qsd\d?-/, "");
    const localCover = `assets/images/albumcovers/${safeName}.jpg`;

    const card = document.createElement("div");
    card.className = "carousel-card";
    card.innerHTML = `
      <img src="${localCover}" alt="${album.title}"
        onerror="this.src='${album.coverArt || "assets/images/albumcovers/thecandidates.jpg"}'">
      <div class="meta">
        <h3>${album.title}</h3>
        <p class="tiny muted">${album.artist}</p>
      </div>
    `;
    card.addEventListener("click", () => showAlbum(album.file, album));
    return card;
  });
}

async function showAlbum(file, albumData = null) {
  const album = albumData || (await fetchJSON(`${DATA_DIR}/${file}`));
  if (!album) return;

  currentAlbum = { file, ...album };
  albumDetail.classList.remove("hidden");

  const safeName = file.replace(".json", "").replace(/^qsd\d?-/, "");
  const localCover = `assets/images/albumcovers/${safeName}.jpg`;

  albumDetailInner.innerHTML = `
    <h2 class="section-title">${album.title}</h2>
    <div class="album-detail-header">
      <img class="cover-large" src="${localCover}"
        onerror="this.src='${album.coverArt || "assets/images/albumcovers/thecandidates.jpg"}'"
        alt="${album.title}">
      <div class="album-text">
        <p class="muted tiny"><b>Released:</b> ${album.releaseDate || "Unknown"}</p>
        <p>${album.description || ""}</p>
      </div>
    </div>
    <h3>Tracklist</h3>
    <ul id="tracklist" class="tracklist"></ul>
  `;

  const tracklistEl = document.getElementById("tracklist");
  const tracks = await Promise.all(
    (album.tracklist || []).map(async (fn) => {
      const t = await fetchJSON(`${SONGS_DIR}/${fn}`);
      return t ? { ...t, filename: fn } : null;
    })
  );
  currentTracks = tracks.filter(Boolean);

  tracklistEl.innerHTML = "";
  currentTracks.forEach((t, idx) => {
    const li = document.createElement("li");
    li.className = "track-item";
    li.textContent = `${idx + 1}. ${t.title}`;
    li.addEventListener("click", () => openTrackModal(idx));
    tracklistEl.appendChild(li);
  });
}

/* ----- Track modal ----- */
async function openTrackModal(index) {
  currentTrackIndex = index;
  await renderTrack(index);
  modal.classList.add("show");
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  setTimeout(() => (modal.style.display = "none"), 300);
  document.body.style.overflow = "";
}

async function renderTrack(index) {
  const t = currentTracks[index];
  if (!t) return;
  const base = t.filename.replace(".json", "");
  const audioSrc = `${AUDIO_DIR}/${base}.opus`;

  // Lyrics button logic
  let lyricsUI = "";
  if (Array.isArray(t.lyrics) && t.lyrics.length > 0) {
    if (t.lyrics.length === 1 && t.lyrics[0].toLowerCase().includes("instrumental")) {
      lyricsUI = `<p class="muted tiny">🎵 This song is an instrumental.</p>`;
    } else {
      lyricsUI = `<button class="btn small" id="open-lyrics">📖 Lyrics</button>`;
    }
  } else if (t.lyrics === null || (Array.isArray(t.lyrics) && t.lyrics.length === 0)) {
    lyricsUI = `<p class="muted tiny">❌ Lyrics for this song aren't available.</p>`;
  }

  modalBody.innerHTML = `
    <h3>${t.title}${t.version ? " — " + t.version : ""}</h3>
    <p class="muted tiny">
      ${t.feature ? `feat. ${Array.isArray(t.feature) ? t.feature.join(", ") : t.feature}` : ""}
      ${t.length ? ` • ${t.length}` : ""}
    </p>
    <div style="margin-top:10px">${t.bio || ""}</div>
    <div style="margin-top:10px">${lyricsUI}</div>
    <div id="audio-wrap" style="margin-top:12px">
      <audio controls preload="none" style="width:100%">
        <source src="${audioSrc}" type="audio/ogg">
      </audio>
    </div>
  `;

  // hook lyrics button
  const btn = document.getElementById("open-lyrics");
  if (btn) btn.addEventListener("click", () => openLyrics(t));
}

/* ----- Lyrics modal ----- */
function openLyrics(track) {
  lyricsBody.innerHTML = `
    <h3>${track.title} — Lyrics</h3>
    <pre style="white-space:pre-wrap;margin-top:10px;">${track.lyrics.join("\n")}</pre>
  `;
  lyricsModal.classList.add("show");
  lyricsModal.style.display = "flex";
  lyricsModal.setAttribute("aria-hidden", "false");
}

function closeLyrics() {
  lyricsModal.classList.remove("show");
  lyricsModal.setAttribute("aria-hidden", "true");
  setTimeout(() => (lyricsModal.style.display = "none"), 300);
}

/* ----- Navigation & events ----- */
detailBack?.addEventListener("click", () => {
  albumDetail?.classList.add("hidden");
});

modalClose?.addEventListener("click", closeModal);
lyricsClose?.addEventListener("click", closeLyrics);

prevBtn?.addEventListener("click", async () => {
  currentTrackIndex = (currentTrackIndex - 1 + currentTracks.length) % currentTracks.length;
  await renderTrack(currentTrackIndex);
});
nextBtn?.addEventListener("click", async () => {
  currentTrackIndex = (currentTrackIndex + 1) % currentTracks.length;
  await renderTrack(currentTrackIndex);
});

document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("show") && !lyricsModal.classList.contains("show")) return;
  if (e.key === "Escape") {
    if (lyricsModal.classList.contains("show")) closeLyrics();
    else closeModal();
  }
});

/* ----- Init ----- */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("albums-carousel")) loadAlbums();
});
