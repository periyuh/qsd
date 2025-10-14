const DATA_DIR = "assets/albums";

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

    const card = document.createElement("div");
    card.className = "carousel-card";
    card.innerHTML = `
      <img src="${album.coverArt}" alt="${album.title}">
      <div class="meta">
        <strong>${album.title}</strong>
        <span class="muted">${album.artist || "QSD"}</span>
      </div>
    `;

    card.addEventListener("click", () => {
      alert(`Album: ${album.title}`); // Placeholder for modal
    });

    if (album.carousel === "main") {
      track.appendChild(card);
    } else {
      extraTrack.appendChild(card);
    }
  }
}

document.addEventListener("DOMContentLoaded", loadAlbums);
