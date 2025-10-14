const DATA_DIR = "assets/albums";
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
    "qsd5-psychward.json"
  ];

  for (const file of albumFiles) {
    const album = await fetchJSON(`${DATA_DIR}/${file}`);
    if (!album) continue;

    const safeName = file.replace(".json", "").replace(/^qsd\d?-/, "");
    const cover = `${IMAGES_DIR}/albumcovers/${safeName}.jpg`;

    const card = document.createElement("div");
    card.className = "carousel-card";
    card.innerHTML = `
      <img src="${cover}" alt="${album.title}" onerror="this.src='${album.coverArt || cover}'">
      <div class="meta">
        <strong>${album.title}</strong>
        <p class="muted tiny">${album.artist || "QSD"}</p>
      </div>
    `;
    card.addEventListener("click", () => {
      alert(`Album: ${album.title}`); // TODO: modal
    });

    if (file.startsWith("qsd")) {
      track.appendChild(card);
    } else {
      extraTrack.appendChild(card);
    }
  }
}
