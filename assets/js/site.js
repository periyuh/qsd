async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

async function fetchAllJSON(folder, files) {
  const data = [];
  for (const file of files) {
    const json = await loadJSON(`${folder}/${file}`);
    data.push(json);
  }
  return data;
}

function closeSiteModal(overlay) {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

function buildSiteModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "detail-modal artist-modal";
  overlay.appendChild(modal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeSiteModal(overlay);
    }
  });

  return { overlay, modal };
}

function showArtistInfo(artist) {
  const { overlay, modal } = buildSiteModal();
  const linksHtml = artist.links
    ? Object.entries(artist.links)
        .map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`)
        .join("")
    : "";

  modal.innerHTML = `
    <div class="modal-cover-wrap">
      ${artist.image ? `<img class="modal-cover" src="${artist.image}" alt="${artist.name || "Artist image"}">` : ""}
    </div>
    <div class="modal-copy">
      <p class="modal-kicker">Artist</p>
      <h2>${artist.name || "Unnamed artist"}</h2>
      ${artist.bio ? `<p class="modal-description">${artist.bio}</p>` : ""}
      ${linksHtml ? `<div class="artist-links">${linksHtml}</div>` : ""}
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "modal-actions modal-actions-full";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn btn-secondary";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => {
    closeSiteModal(overlay);
  });

  actions.appendChild(closeButton);
  modal.appendChild(actions);
  document.body.appendChild(overlay);
}

async function loadSite() {
  const siteData = await loadJSON("assets/data/site.json");
  const site = siteData.site;
  const defaultTagline = "QueenServeantDonked is a project hosted by producer <strong>periyuh</strong>, as a social experiment revolving around satirical music, experimental sounds, and controversial topics, with albums releasing on April Fool's Day.";

  if (document.getElementById("logo")) {
    document.getElementById("logo").src = site.logo;
  }

  if (document.getElementById("site-name")) {
    document.getElementById("site-name").textContent = site.name;
  }

  const taglineEl = document.getElementById("site-tagline");
  if (taglineEl) {
    taglineEl.innerHTML = site.tagline || defaultTagline;
  }

  const quoteEl = document.getElementById("chaos-quote");
  if (quoteEl) {
    const quotesData = await loadJSON(site.chaosQuotesJSON);
    let currentQuote = 0;

    function rotateQuote() {
      quoteEl.textContent = quotesData.quotes[currentQuote];
      currentQuote = (currentQuote + 1) % quotesData.quotes.length;
    }

    rotateQuote();
    setInterval(rotateQuote, 5000);
  }

  const aboutCardsEl = document.getElementById("about-cards");
  if (aboutCardsEl) {
    const aboutCards = [
      {
        title: "What is QSD?",
        content:
          "QueenServeantDonked is a music project built around satire, recurring characters, and a connected world of albums, tracks, and inside jokes."
      },
      {
        title: "How It Works",
        content:
          "New releases land around April Fool's Day, and each project adds more lore, callbacks, and crossover moments between songs and collaborators."
      }
    ];

    aboutCards.forEach((card) => {
      const div = document.createElement("div");
      div.className = "about-card";
      div.innerHTML = `<h3>${card.title}</h3><p>${card.content}</p>`;
      aboutCardsEl.appendChild(div);
    });
  }

  const artistsGrid = document.getElementById("artists-grid");
  if (artistsGrid) {
    const artistFiles = [
      "periyuh.json",
      "cameronreid.json",
      "jinnawoods.json",
      "kennafannee.json"
      //"vividusbae.json"
    ];
    const artists = await fetchAllJSON(site.artistsJSON, artistFiles);

    artists.forEach((artist) => {
      const div = document.createElement("div");
      div.className = "product";
      div.style.cursor = "pointer";
      div.innerHTML = `
        <img src="${artist.image}" alt="${artist.name}">
        <p><strong>${artist.name}</strong><br><span class="muted">Artist</span></p>`;
      div.onclick = () => showArtistInfo(artist);
      artistsGrid.appendChild(div);
    });
  }

  const footerText = document.getElementById("footer-text");
  if (footerText) {
    footerText.textContent = `© 2026 ${site.name}`;
  }
}

document.addEventListener("DOMContentLoaded", loadSite);
