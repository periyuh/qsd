async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

// Load albums into homepage
async function loadAlbums() {
  const albumsDiv = document.getElementById("albums");
  if (!albumsDiv) return;

  // Hardcoded list of album JSONs for now
  const albumFiles = [
    "qsd4-thecandidates.json",
    "qsd3-sissypuss.json"
    // add more here
  ];

  for (const file of albumFiles) {
    const album = await fetchJSON(`assets/data/${file}`);

    const card = document.createElement("div");
    card.className = "album-card";
    card.innerHTML = `
      <h3>${album.title}</h3>
      <p>${album.artist}</p>
      <small>${album.releaseDate}</small>
    `;

    card.addEventListener("click", () => showAlbum(album));
    albumsDiv.appendChild(card);
  }
}

// Show album tracklist
function showAlbum(album) {
  const container = document.getElementById("albums");
  container.innerHTML = `<h2>${album.title} — ${album.artist}</h2>`;

  album.tracklist.forEach(file => {
    const trackBtn = document.createElement("button");
    const baseName = file.split("/").pop().replace(".json", "");

    trackBtn.textContent = baseName;
    trackBtn.addEventListener("click", () => showTrack(file));
    container.appendChild(trackBtn);
  });
}

// Show track info + audio in modal
async function showTrack(file) {
  const track = await fetchJSON(`assets/data/${file}`);
  const baseName = file.split("/").pop().replace(".json", "");
  const audioPath = `assets/audio/${baseName}.opus`;

  const infoDiv = document.getElementById("track-info");
  infoDiv.innerHTML = `
    <h3>${track.title}</h3>
    <p>${track.feature || ""}</p>
    <p>Length: ${track.length || "?"}</p>
    <p>${track.bio || ""}</p>
    <audio src="${audioPath}" controls></audio>
  `;

  openModal();
}

// Modal controls
function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

document.getElementById("modal-close").addEventListener("click", closeModal);

// Run on load
loadAlbums();
