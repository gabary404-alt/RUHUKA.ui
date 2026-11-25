/* Motion stays within the artwork. Both illustrations work as still images without JS. */
(function () {
  'use strict';

  const motionPreference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: true };
  const svgNamespace = 'http://www.w3.org/2000/svg';

  function prepareBranch(figure) {
    if (motionPreference.matches || !('IntersectionObserver' in window)) return;
    const art = figure.querySelector('img');
    if (!art) return;

    const watch = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      watch.disconnect();
      Promise.resolve(typeof art.decode === 'function' ? art.decode() : undefined).then(() => {
        if (art.naturalWidth && !motionPreference.matches) swayBranch(figure, art);
      }).catch(() => { /* The still illustration remains visible. */ });
    }, { threshold: 0.3 });
    watch.observe(figure);
  }

  function swayBranch(figure, art) {
    const patch = document.createElement('canvas');
    patch.width = 360;
    patch.height = 305;
    patch.className = 'branch-wind';
    patch.setAttribute('aria-hidden', 'true');
    const context = patch.getContext('2d', { alpha: false });
    if (!context) return;
    const width = patch.width;
    const height = patch.height;
    // Normalize the responsive source once. Image srcset can report a
    // density-adjusted naturalWidth, so sampling it directly shifts the patch.
    const source = document.createElement('canvas');
    source.width = 1200;
    source.height = 800;
    const sourceContext = source.getContext('2d');
    if (!sourceContext) return;
    sourceContext.drawImage(art, 0, 0, source.width, source.height);
    const duration = 4100;
    const step = 3;

    function paint(now) {
      const progress = Math.min(1, (now - start) / duration);
      if (progress === 1 || motionPreference.matches) {
        patch.remove();
        return;
      }
      const gust = Math.sin(progress * Math.PI) * Math.sin(progress * Math.PI * 3) * 11;
      for (let y = 0; y < height; y += step) {
        const band = Math.min(step, height - y);
        // The left edge is anchored. Fade the wind before the book begins.
        const vertical = Math.max(0, Math.min(1, (305 - y) / 45));
        const offset = gust * vertical * (0.35 + y / height * 0.65);
        const pivot = width * 0.7;
        context.drawImage(source, 0, y, pivot, band, 0, y, pivot + offset, band);
        context.drawImage(source, pivot, y, (width - pivot), band,
          pivot + offset, y, width - pivot - offset, band);
      }
      requestAnimationFrame(paint);
    }

    const start = performance.now();
    figure.append(patch);
    requestAnimationFrame(paint);
  }

  const turnInterval = 1000;
  const turnDuration = 820;
  // Matching curve points follow the right page, curled page and left page.
  const poses = [
    [476,367, 514,288,633,283,748,311, 994,452, 982,449,962,450,951,450, 860,420,746,418,667,544],
    [476,367, 472,268,568,234,629,264, 811,412, 765,382,748,395,747,422, 718,415,689,458,667,544],
    [476,367, 435,259,420,248,455,268, 646,365, 607,371,604,391,623,420, 647,437,664,491,667,544],
    [476,367, 403,307,325,310,264,332, 153,357, 223,437,265,506,270,568, 412,510,558,467,667,544],
  ];

  function drawPage(points) {
    const values = points.map(value => Math.round(value * 10) / 10);
    return 'M' + values.slice(0, 2).join(',') + ' C' + values.slice(2, 8).join(' ') +
      ' L' + values.slice(8, 10).join(',') + ' C' + values.slice(10, 16).join(' ') +
      ' C' + values.slice(16).join(' ') + ' Z';
  }

  function preparePageTurn(figure, index) {
    const image = figure.querySelector('img');
    if (!image || !('IntersectionObserver' in window)) return;
    const stage = document.createElement('div');
    stage.className = 'book-stage';
    const control = document.createElement('button');
    control.className = 'book-toggle';
    control.type = 'button';

    const overlay = document.createElementNS(svgNamespace, 'svg');
    overlay.setAttribute('viewBox', '0 0 1200 800');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.add('book-leaf');
    const paperId = 'book-paper-' + index;
    overlay.innerHTML = '<defs><linearGradient id="' + paperId + '" x1="0%" y1="65%" x2="100%" y2="35%">' +
      '<stop stop-color="#a2936e"/><stop offset=".27" stop-color="#f3e5bf"/>' +
      '<stop offset=".60" stop-color="#fff8e6"/><stop offset=".83" stop-color="#decca2"/><stop offset="1" stop-color="#faf0d4"/>' +
      '</linearGradient></defs><path class="book-shadow" fill="#604e2e"/>' +
      '<path class="book-paper" fill="url(#' + paperId + ')" stroke="#8b7953" stroke-width="1.15"/>';
    const sheet = overlay.querySelector('.book-paper');
    const shadow = overlay.querySelector('.book-shadow');
    const paper = overlay.querySelector('linearGradient');
    image.replaceWith(stage);
    stage.append(image, overlay);
    figure.append(control);

    let paused = false;
    let visible = false;
    let timer, animation;
    const playing = () => visible && !paused && !motionPreference.matches && !document.hidden;

    function stop() {
      clearTimeout(timer);
      cancelAnimationFrame(animation);
      overlay.style.opacity = '0';
    }

    function startTurn() {
      if (!playing()) return;
      const started = performance.now();
      timer = setTimeout(startTurn, turnInterval);

      function frame(now) {
        const time = Math.min(1, (now - started) / turnDuration);
        if (time === 1 || !playing()) {
          overlay.style.opacity = '0';
          return;
        }
        const travel = time * time * (3 - 2 * time);
        const segment = Math.min(poses.length - 2, Math.floor(travel * (poses.length - 1)));
        const step = travel * (poses.length - 1) - segment;
        const path = drawPage(poses[segment].map((point, i) => point + (poses[segment + 1][i] - point) * step));
        const lift = Math.sin(time * Math.PI);
        sheet.setAttribute('d', path);
        shadow.setAttribute('d', path);
        shadow.setAttribute('transform', 'translate(' + (5 + lift * 15) + ' ' + (4 + lift * 18) + ')');
        shadow.setAttribute('opacity', String(lift * .27));
        const lighting = 50 - 50 * Math.cos(time * Math.PI);
        paper.setAttribute('x1', lighting + '%');
        paper.setAttribute('x2', (100 - lighting) + '%');
        overlay.style.opacity = String(Math.min(1, time * 19, (1 - time) * 17));
        animation = requestAnimationFrame(frame);
      }
      animation = requestAnimationFrame(frame);
    }

    function sync() {
      stop();
      control.hidden = motionPreference.matches;
      control.textContent = paused ? 'Resume page turns' : 'Pause page turns';
      if (playing()) timer = setTimeout(startTurn, turnInterval);
    }

    control.addEventListener('click', () => { paused = !paused; sync(); });
    document.addEventListener('visibilitychange', sync);
    if (motionPreference.addEventListener) motionPreference.addEventListener('change', sync);
    else if (motionPreference.addListener) motionPreference.addListener(sync);

    const watch = new IntersectionObserver(([entry]) => {
      const inView = entry.isIntersecting && entry.intersectionRatio >= .25;
      if (visible !== inView) {
        visible = inView;
        sync();
      }
    }, { threshold: .25 });
    watch.observe(stage);
    sync();
  }

  document.querySelectorAll('.hero-art').forEach(prepareBranch);
  document.querySelectorAll('.academic-art').forEach(preparePageTurn);
})();

