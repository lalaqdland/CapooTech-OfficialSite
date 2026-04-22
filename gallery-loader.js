(async () => {
  try {
    // 1. Fetch cloud-synced configurations via pure static GET
    const response = await fetch('/data/photos.json');
    if (!response.ok) throw new Error("Failed to load photos.json");
    
    const data = await response.json();
    let rawGallery = data.gallery || [];
    
    // Safety check: Handle both flat arrays ["url"] and object arrays [{"url": "url"}, {"image": "url"}]
    const photos = rawGallery.map(item => {
      if (typeof item === 'string') return item;
      return item.url || item.image || item.src;
    }).filter(Boolean); // remove any empty entries

    if (photos.length === 0) return;

    // 2. Headless Render - Layout A (Floating Bubble Orbs)
    const floatingCatsNode = document.querySelector('.floating-cats');
    if (floatingCatsNode) {
      floatingCatsNode.innerHTML = '';
      photos.forEach((photoUrl, index) => {
        // Orbit variance cycling (1 to 4 paths mapped statically in CSS)
        const animationVariant = (index % 4) + 1;
        const img = document.createElement('img');
        img.src = photoUrl;
        img.className = `orb orb${animationVariant}`;
        img.alt = "";
        floatingCatsNode.appendChild(img);
      });
    }

    // 3. Headless Render - Layout B (Tape Tracks Endless Queues)
    // Create an infinitely sized HTML chunk multiplying the base array
    const createMarqueeGroup = () => {
      const group = document.createElement('div');
      group.className = 'marquee-group';
      // Calculate multiplier so total physical pixels exceeds any ultra-wide screen (>4000px)
      // Assuming avg width = 100px: 40 copies per group = 4000px
      const groupMultiplier = Math.max(6, Math.ceil(40 / photos.length));
      
      let htmlString = '';
      for (let i = 0; i < groupMultiplier; i++) {
        photos.forEach(url => {
          htmlString += `<img src="${url}" alt="" />`;
        });
      }
      group.innerHTML = htmlString;
      return group;
    };

    const attachToTrack = (selector) => {
      const track = document.querySelector(selector);
      if (track) {
        track.innerHTML = ''; // Wipe prefilled placeholders
        // We mandate EXACTLY two identical cloned groups.
        // CSS transform: translateX(-50%) shifts precisely half the width, completing the illusion of endless scroll.
        track.appendChild(createMarqueeGroup());
        track.appendChild(createMarqueeGroup());
      }
    };

    attachToTrack('.edge-top .edge-track');
    attachToTrack('.edge-bottom .edge-track');

  } catch (err) {
    console.error("Gallery Loader Error:", err);
  }
})();
