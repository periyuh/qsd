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

async function loadSite() {
  const siteData = await loadJSON('assets/data/site.json');
  const site = siteData.site;

  // Hero
  document.getElementById('logo').src = site.logo;
  document.getElementById('site-name').textContent = site.name;
  document.getElementById('site-tagline').textContent = site.tagline;

  // Chaos quotes
  const quotesData = await loadJSON(site.chaosQuotesJSON);
  const quoteEl = document.getElementById('chaos-quote');
  let currentQuote = 0;
  function rotateQuote() {
    quoteEl.textContent = quotesData.quotes[currentQuote];
    currentQuote = (currentQuote + 1) % quotesData.quotes.length;
  }
  rotateQuote();
  setInterval(rotateQuote, 5000);

  // About Cards
  const aboutCardsEl = document.getElementById('about-cards');
  const aboutCards = [
    {title:"What is QSD?", content:"QueenServeantDonked is a chaos-driven music collective blending satire, identity, and absurdity."},
    {title:"Who’s Involved?", content:"JinnaWoods · Barbiebitch · Periyuh · Cameron Reid · + Guests"},
    {title:"How It Works", content:"Every April Fool’s Day, something new drops. Albums connect through recurring sounds, characters, and inside jokes."}
  ];
  aboutCards.forEach(card=>{
    const div=document.createElement('div');
    div.className='about-card';
    div.innerHTML=`<h3>${card.title}</h3><p>${card.content}</p>`;
    aboutCardsEl.appendChild(div);
  });

  // Albums Carousel
  const albumFiles = [
    "jw-heelz.json","jw-theiconicpop.json","py-thesoundtrack.json",
    "qsd-khakishorts.json","qsd1-emoslay.json","qsd2-idhat.json",
    "qsd3-sissypuss.json","qsd4-thecandidates.json","qsd5-psychward.json"
  ];
  const albums = await fetchAllJSON(site.albumsJSON, albumFiles);
  const albumsEl = document.getElementById('albums-carousel');
  albums.forEach(album=>{
    const div=document.createElement('div');
    div.className='carousel-card';
    div.innerHTML=`
      <img src="${album.cover}" alt="${album.title}">
      <div class="meta">
        <strong>${album.title}</strong>
        <span class="muted">${album.year}</span>
      </div>`;
    albumsEl.appendChild(div);
  });

  // Artists
  const artistFiles = ["cameronreid.json","periyuh.json"];
  const artists = await fetchAllJSON(site.artistsJSON, artistFiles);
  const artistsGrid = document.getElementById('artists-grid');
  artists.forEach(artist=>{
    const div=document.createElement('div');
    div.className='artist-card';
    div.innerHTML=`
      <img src="${artist.image}" alt="${artist.name}">
      <h4>${artist.name}</h4>
      <p>${artist.bio}</p>`;
    artistsGrid.appendChild(div);
  });

  // Footer
  document.getElementById('footer-text').textContent=`© 2025 ${site.name} — Hosted on ElasticStage`;
  const footerLinksEl=document.getElementById('footer-links');
  for(const[name,url] of Object.entries(site.links)){
    const a=document.createElement('a');
    a.href=url; a.textContent=name; a.target='_blank'; a.rel='noopener';
    footerLinksEl.appendChild(a);
  }

  // Enter Chaos scroll
  document.getElementById('enter-chaos').addEventListener('click',()=>{
    document.getElementById('about-qsd').scrollIntoView({behavior:'smooth'});
  });
}

document.addEventListener('DOMContentLoaded', loadSite);
