/* browser.js — loads albums, notable songs, artists into carousels/lists */

const DATA_DIR = "assets/albums";
const SONGS_DIR = `${DATA_DIR}/songs`;
const ARTISTS_DIR = "assets/artists";
const IMAGES_DIR = "assets/images";

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

/* ----- Albums ----- */
async function loadAlbums() {
  const track = document.getElementById("albums-track");
  const extraTrack = document.getElementById("extra-albums-track");
  if (!track || !extraTrack) return;

  const albumFiles = [
    "qsd1-emoslay.json",
    "qsd2-idhat.json",
    "qsd-khakishorts.json",
    "qsd3-sissypuss.json",
    "qsd4-thecandidates.json",
    "qsd5-psychward.json",
    "jw-heelz.json",
    "jw-theiconicpop.json",
    "py-thesoundtrack.json"
  ];

  for (const file of albumFiles) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album) continue;

    const safeName = file.replace(".json", "").replace(/^qsd\d?-/, "");
    const cover = `${IMAGES_DIR}/albumcovers/${safeName}.jpg`;

    const card = document.createElement("div");
    card.className = "carousel-card";
    card.innerHTML = `
      <img src="${cover}" alt="${album.title}" 
           onerror="this.src='${album.coverArt || cover}'">
      <div class="meta">
        <strong>${album.title}</strong>
        <p class="muted tiny">${album.artist || "QSD"}</p>
      </div>
    `;
    card.addEventListener("click", () => {
      alert(`Album: ${album.title}`); // TODO: open modal
    });

    if (file.startsWith("qsd")) {
      track.appendChild(card);
    } else {
      extraTrack.appendChild(card);
    }
  }
}

/* ----- Songs ----- */
async function loadSongs() {
  const songsEl = document.getElementById("songs-list");
  if (!songsEl) return;

  const notable = [
    "dontbeshy.json",
    "dourthing.json",
    "thenewbreakingpoint.json",
    "sissypuss.json",
    "icon.json"
  ];

  for (const file of notable) {
    const song = await fetchJSON(`${SONGS_DIR}/${file}`);
    if (!song) continue;

    const li = document.createElement("li");
    li.textContent = song.title;
    li.addEventListener("click", () => {
      alert(`Play: ${song.title}`); // TODO: hook into player.js
    });
    songsEl.appendChild(li);
  }
}

/* ----- Artists ----- */
async function loadArtists() {
  const track = document.getElementById("artists-track");
  if (!track) return;

  const files = ["cameronreid.json"]; // expand later
  for (const file of files) {
    const artist = await fetchJSON(`${ARTISTS_DIR}/${file}`);
    if (!artist) continue;

    const card = document.createElement("div");
    card.className = "carousel-card";
    card.innerHTML = `
      <img src="${IMAGES_DIR}/artists/${artist.folder}/${artist.gallery?.[0] || ""}" 
           alt="${artist.name}">
      <div class="meta">
        <strong>${artist.name}</strong>
      </div>
    `;
    card.addEventListener("click", () => {
      alert(`Artist: ${artist.name}`); // TODO: open modal
    });

    track.appendChild(card);
  }
}

/* ----- Init ----- */
document.addEventListener("DOMContentLoaded", () => {
  loadAlbums();
  loadSongs();
  loadArtists();
});
