async function showAlbum(albumFile) {
  const album = await fetchJSON(`assets/data/${albumFile}`);

  // Load all track JSONs
  const tracks = await Promise.all(
    album.tracklist.map(async (file) => {
      const trackData = await fetchJSON(`assets/data/qsd-songs/${file}`);
      return { ...trackData, filename: file };
    })
  );

  // Build tracklist
  const tracklistHtml = tracks.map((t, i) => `
    <li class="track-btn" data-file="${t.filename}">
      ${formatTrack(t, i)}
    </li>
  `).join("");

  const container = document.getElementById("albums");
  container.innerHTML = `
    <button id="back-home">← Back</button>
    <h2>${album.title}</h2>
    <img src="${album.coverArt}" alt="${album.title}" class="cover-large">
    <p>${album.description}</p>
    <p><b>Released:</b> ${album.releaseDate}</p>
    <h3>Tracklist</h3>
    <ul>${tracklistHtml}</ul>
    <h3>Listen</h3>
    <div>
      ${Object.entries(album.links || {}).map(([platform, url]) => 
        `<a href="${url}" target="_blank">${platform}</a>`
      ).join(" | ")}
    </div>
    <h3>Buy</h3>
    <div>
      ${album.buy ? Object.entries(album.buy).map(([platform, url]) => 
        `<a href="${url}" target="_blank">${platform}</a>`
      ).join(" | ") : "No purchase links available."}
    </div>
  `;

  // Back button
  document.getElementById("back-home").onclick = loadAlbums;

  // Add track click listeners
  document.querySelectorAll(".track-btn").forEach(el => {
    el.addEventListener("click", () => showTrack(el.dataset.file));
  });
}
