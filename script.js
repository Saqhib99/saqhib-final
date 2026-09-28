(() => {
  const FRAME_COUNT = 134;
  const FRAME_BG = '#eeeeee';
  const canvas = document.getElementById('sequence-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const sequence = document.querySelector('.sequence');
  const intro = document.getElementById('intro-overlay');
  const topbar = document.getElementById('topbar');
  const pageProgress = document.querySelector('#page-progress span');
  const frameLoader = document.getElementById('frame-loader');
  const loaderFill = document.getElementById('loader-fill');
  const loaderPercent = document.getElementById('loader-percent');

  const frames = new Array(FRAME_COUNT);
  const edgeColors = new Array(FRAME_COUNT);
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 2;
  sampleCanvas.height = 2;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  let loaded = 0;
  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawn = -1;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function frameSrc(index) {
    return `frames/frame_${String(index + 1).padStart(4, '0')}.jpg`;
  }

  function updateLoader() {
    const pct = Math.round((loaded / FRAME_COUNT) * 100);
    loaderFill.style.width = `${pct}%`;
    loaderPercent.textContent = `${pct}%`;
    if (loaded === FRAME_COUNT) {
      setTimeout(() => frameLoader.classList.add('loaded'), 450);
    }
  }

  function preloadFrames() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = frameSrc(i);
      img.onload = () => {
        loaded++;
        updateLoader();
        if (i === 0 || lastDrawn < 0) drawFrame(Math.round(currentFrame));
      };
      img.onerror = () => {
        loaded++;
        updateLoader();
      };
      frames[i] = img;
    }
  }

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastDrawn = -1;
    drawFrame(Math.round(currentFrame));
  }

  function frameEdgeColor(index, img) {
    if (edgeColors[index]) return edgeColors[index];
    try {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      sampleCtx.clearRect(0, 0, 2, 2);
      sampleCtx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
      sampleCtx.drawImage(img, iw - 1, 0, 1, 1, 1, 0, 1, 1);
      sampleCtx.drawImage(img, 0, ih - 1, 1, 1, 0, 1, 1, 1);
      sampleCtx.drawImage(img, iw - 1, ih - 1, 1, 1, 1, 1, 1, 1);
      const data = sampleCtx.getImageData(0, 0, 2, 2).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2];
      }
      edgeColors[index] = `rgb(${Math.round(r / 4)}, ${Math.round(g / 4)}, ${Math.round(b / 4)})`;
    } catch (_) {
      edgeColors[index] = FRAME_BG;
    }
    return edgeColors[index];
  }

  function drawFrame(index) {
    index = Math.max(0, Math.min(FRAME_COUNT - 1, index));
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;
    if (index === lastDrawn && canvas.width) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = frameEdgeColor(index, img);
    ctx.fillRect(0, 0, w, h);

    // Desktop keeps the whole 16:9 frame visible. On portrait phones we give
    // the sequence a modest zoom so it remains readable instead of becoming a
    // tiny strip in the middle of a tall screen. The sampled edge colour still
    // fills the remaining canvas, so there is no visible rectangular edge.
    const containScale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const portraitPhone = w <= 700 && h > w * 1.25;
    const scale = portraitPhone
      ? Math.min(h / img.naturalHeight, (w / img.naturalWidth) * 1.38)
      : containScale;

    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    lastDrawn = index;
  }

  function getSequenceProgress() {
    const rect = sequence.getBoundingClientRect();
    const scrollable = sequence.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / Math.max(1, scrollable)));
  }

  function updateOnScroll() {
    const p = getSequenceProgress();
    targetFrame = p * (FRAME_COUNT - 1);

    // Keep the opening dark/violet, then reveal the supplied sequence.
    const introFade = Math.max(0, Math.min(1, 1 - p / 0.095));
    intro.style.opacity = introFade;
    intro.style.transform = `scale(${1 + (1 - introFade) * 0.035})`;
    intro.style.pointerEvents = introFade > 0.03 ? 'auto' : 'none';

    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const overall = total > 0 ? window.scrollY / total : 0;
    pageProgress.style.width = `${Math.max(0, Math.min(1, overall)) * 100}%`;
    topbar.classList.toggle('scrolled', window.scrollY > 24);
  }

  function animate() {
    currentFrame += (targetFrame - currentFrame) * 0.105;
    const rounded = Math.round(currentFrame);
    if (rounded !== lastDrawn) drawFrame(rounded);
    requestAnimationFrame(animate);
  }

  window.addEventListener('scroll', updateOnScroll, { passive: true });
  window.addEventListener('resize', sizeCanvas);
  window.addEventListener('orientationchange', () => setTimeout(sizeCanvas, 120));

  preloadFrames();
  requestAnimationFrame(() => {
    sizeCanvas();
    updateOnScroll();
    animate();
  });

  // Work carousel data. Instagram uses the official /embed/ reel page;
  // YouTube Shorts use the standard embeddable player. This keeps the videos
  // playable inside the portfolio instead of showing decorative placeholders.
  const projects = [
    {
      title: 'School Video',
      type: 'Story edit',
      platform: 'Instagram',
      url: 'https://www.instagram.com/reel/DbxMkGYqu-_/?stkn=MzN1azZ5MGwwYzN0',
      embed: 'https://www.instagram.com/reel/DbxMkGYqu-_/embed/'
    },
    {
      title: 'Cafe Video',
      type: 'Lifestyle / food',
      platform: 'Instagram',
      url: 'https://www.instagram.com/reel/DbdWXoFqtaz/?stkn=cjc3OWwzZWJpOGdh',
      embed: 'https://www.instagram.com/reel/DbdWXoFqtaz/embed/'
    },
    {
      title: 'Real Estate',
      type: 'Property edit',
      platform: 'Instagram',
      url: 'https://www.instagram.com/reel/Dbf0E9TKJnz/?stkn=cGZ4Y3hxM2k2ZDJ1',
      embed: 'https://www.instagram.com/reel/Dbf0E9TKJnz/embed/'
    },
    {
      title: 'High Visual',
      type: 'Visual-heavy edit',
      platform: 'Instagram',
      url: 'https://www.instagram.com/reel/DbdFnkKKTQ9/?stkn=NnF3Mm04NGgydzRr',
      embed: 'https://www.instagram.com/reel/DbdFnkKKTQ9/embed/'
    },
    {
      title: 'Motion Graphics',
      type: 'Explainer',
      platform: 'YouTube',
      url: 'https://youtube.com/shorts/UuwNBRbZbsM?si=Dy-5zuk0KljiJ1Yr',
      embed: 'https://www.youtube-nocookie.com/embed/UuwNBRbZbsM?rel=0&playsinline=1'
    },
    {
      title: 'Introduction',
      type: 'Personal brand',
      platform: 'Instagram',
      url: 'https://www.instagram.com/reel/DXcJ_zqiK70/?stkn=NTNvbm45cjljdHAx',
      embed: 'https://www.instagram.com/reel/DXcJ_zqiK70/embed/'
    },
    {
      title: 'College Event',
      type: 'Event film',
      platform: 'Instagram',
      url: 'https://www.instagram.com/reel/DUas6bxkQcw/?stkn=eHU1eGpmcWltOG8z',
      embed: 'https://www.instagram.com/reel/DUas6bxkQcw/embed/'
    }
  ];

  const workTrack = document.getElementById('work-track');
  projects.forEach((project, i) => {
    const card = document.createElement('article');
    card.className = 'work-card';
    card.innerHTML = `
      <div class="work-card-topline">
        <span class="work-number">${String(i + 1).padStart(2, '0')}</span>
        <span class="work-platform">${project.platform}</span>
      </div>
      <div class="work-media">
        <div class="work-media-loader" aria-hidden="true"><span></span><em>Loading video…</em></div>
        <iframe
          class="work-embed"
          src="${project.embed}"
          title="${project.title} — ${project.platform} video"
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      </div>
      <div class="work-card-content">
        <span class="work-type">${project.type}</span>
        <h3>${project.title}</h3>
        <a class="work-link" href="${project.url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${project.title} on ${project.platform}">
          View original <b>↗</b>
        </a>
      </div>
    `;

    const iframe = card.querySelector('.work-embed');
    iframe.addEventListener('load', () => card.classList.add('media-loaded'));
    workTrack.appendChild(card);
  });

  const cardStep = () => {
    const card = workTrack.querySelector('.work-card');
    const styles = getComputedStyle(workTrack);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    return card ? card.getBoundingClientRect().width + gap : 300;
  };
  document.getElementById('work-next').addEventListener('click', () => workTrack.scrollBy({ left: cardStep(), behavior: 'smooth' }));
  document.getElementById('work-prev').addEventListener('click', () => workTrack.scrollBy({ left: -cardStep(), behavior: 'smooth' }));

  let dragStart = 0;
  let scrollStart = 0;
  let dragging = false;
  workTrack.addEventListener('pointerdown', e => {
    dragging = true;
    dragStart = e.clientX;
    scrollStart = workTrack.scrollLeft;
    workTrack.classList.add('dragging');
    workTrack.setPointerCapture(e.pointerId);
  });
  workTrack.addEventListener('pointermove', e => {
    if (!dragging) return;
    workTrack.scrollLeft = scrollStart - (e.clientX - dragStart);
  });
  const endDrag = e => {
    if (!dragging) return;
    dragging = false;
    workTrack.classList.remove('dragging');
    try { workTrack.releasePointerCapture(e.pointerId); } catch (_) {}
  };
  workTrack.addEventListener('pointerup', endDrag);
  workTrack.addEventListener('pointercancel', endDrag);

  // Reveal-on-scroll.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Lightweight 3D hover tilt for cards and portrait.
  const canHover = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (canHover) {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        const max = card.classList.contains('portrait-wrap') ? 4 : 3;
        card.style.transform = `perspective(1000px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
      });
      card.addEventListener('mouseleave', () => card.style.transform = '');
    });
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
