// Utility: fetch JSON file
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

// ======================
// Load Albums
// ======================
async function loadAlbums() {
  const container = document.getElementById("albums");
  if (!container) return; // only run on pages with #albums

  // List your QSD album JSONs here:
  const albumFiles = [
    "qsd3-sissypuss.json",
    "qsd4-thecandidates.json"
    // add more QSD album JSONs as you make them
  ];

  for (const file of albumFiles) {
    const album = await fetchJSON(`assets/data/${file}`);

    const card = document.createElement("div");
    card.className = "album-card";
    card.innerHTML = `
      <img src="${album.coverArt}" alt="${album.title}" class="cover">
      <h3>${album.title}</h3>
      <p>${album.artist}</p>
      <small>${album.releaseDate}</small>
    `;

    card.addEventListener("click", () => showAlbum(album));
    container.appendChild(card);
  }
}

// ======================
// Show Album & Tracklist
// ======================
function showAlbum(album) {
  const container = document.getElementById("albums");
  container.innerHTML = `
    <button id="back-home">← Back</button>
    <h2>${album.title}</h2>
    <img src="${album.coverArt}" alt="${album.title}" class="cover-large">
    <p>${album.description}</p>
    <div class="links">
      ${Object.entries(album.links || {}).map(
        ([name, url]) => `<a href="${url}" target="_blank">${name}</a>`
      ).join(" | ")}
    </div>
    <h3>Tracklist</h3>
    <ul id="tracklist"></ul>
  `;

  // Add back button listener
  document.getElementById("back-home").addEventListener("click", () => {
    container.innerHTML = "";
    loadAlbums();
  });

  // Load tracklist
  const list = document.getElementById("tracklist");
  album.tracklist.forEach(trackFile => {
    const li = document.createElement("li");
    li.textContent = trackFile.replace(".json", "");
    li.className = "track-btn";
    li.addEventListener("click", () => showTrack(trackFile));
    list.appendChild(li);
  });
}

// ======================
// Show Track Modal
// ======================
async function showTrack(file) {
  const track = await fetchJSON(`assets/data/qsd-songs/${file}`);
  const base = file.replace(".json", "");
  const audioPath = `assets/audio/${base}.opus`;

  const modal = document.getElementById("modal");
  const info = document.getElementById("track-info");

  info.innerHTML = `
    <h3>${track.title}</h3>
    <p><b>Featuring:</b> ${track.feature || "—"}</p>
    <p><b>Length:</b> ${track.length || "?"}</p>
    <p>${track.bio || ""}</p>
    ${track.coverArt ? `<img src="${track.coverArt}" alt="${track.title}" class="cover-small">` : ""}
    <audio src="${audioPath}" controls></audio>
  `;

  openModal();
}

// ======================
// Modal Controls
// ======================
function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

document.getElementById("modal-close")?.addEventListener("click", closeModal);

// Run when page loads
document.addEventListener("DOMContentLoaded", loadAlbums);
