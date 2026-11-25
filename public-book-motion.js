/* Motion stays within the artwork. Both illustrations work as still images without JS. */
(function () {
  'use strict';

  const motionPreference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: true };
  const svgNamespace = 'http://www.w3.org/2000/svg';

  function prepareBranch(figure) {
    const art = figure.querySelector('img');
    if (!art || !('IntersectionObserver' in window)) return;
    const patch = document.createElement('canvas');
    patch.width = 400;
    patch.height = 330;
    patch.className = 'branch-wind';
    patch.setAttribute('aria-hidden', 'true');
    patch.hidden = true;
    const context = patch.getContext('2d', { alpha: false });
    if (!context) return;

    // Use illustration coordinates independently of the responsive image size.
    const source = document.createElement('canvas');
    source.width = patch.width;
    source.height = patch.height;
    const sourceContext = source.getContext('2d');
    if (!sourceContext) return;

    const control = document.createElement('button');
    control.type = 'button';
    control.className = 'book-toggle branch-toggle';
    art.after(patch);
    figure.append(control);

    let visible = false, paused = false, ready = false, animation;
    let previous = 0;
    const playing = () => ready && visible && !paused && !document.hidden && !motionPreference.matches;

    function paint(now) {
      if (!playing()) return;
      if (!previous || now - previous >= 32) {
        previous = now;
        const breeze = 17 * Math.sin(now / 760) + 8 * Math.sin(now / 1480);
        const {width, height} = patch;
        const bend = 222;
        const fade = 310;
        // The trunk and paper stay still. Narrow strips let the tips rise and fall.
        for (let x = 0; x < width; x += 4) {
          const leverage = Math.min(1, x / 235, (width - x - 4) / 48);
          const crest = bend + Math.round(leverage * (breeze + 4 * Math.sin(now / 490 - x / 125)));
          context.drawImage(source, x, 0, 4, bend, x, 0, 4, crest);
          context.drawImage(source, x, bend, 4, fade - bend, x, crest, 4, fade - crest);
        }
        patch.hidden = false;
      }
      animation = requestAnimationFrame(paint);
    }

    function sync() {
      cancelAnimationFrame(animation);
      previous = 0;
      patch.hidden = true;
      control.hidden = !ready || motionPreference.matches;
      control.textContent = paused ? 'Resume the breeze' : 'Pause the breeze';
      if (playing()) animation = requestAnimationFrame(paint);
    }

    function loadArt() {
      if (!art.naturalWidth) return;
      sourceContext.clearRect(0, 0, source.width, source.height);
      sourceContext.drawImage(art, 0, 0, 1200, 800);
      context.drawImage(source, 0, 0);
      ready = true;
      sync();
    }

    control.addEventListener('click', () => { paused = !paused; sync(); });
    document.addEventListener('visibilitychange', sync);
    if (motionPreference.addEventListener) motionPreference.addEventListener('change', sync);
    else if (motionPreference.addListener) motionPreference.addListener(sync);
    const watch = new IntersectionObserver(([entry]) => {
      const inView = entry.isIntersecting && entry.intersectionRatio >= .18;
      if (visible !== inView) { visible = inView; sync(); }
    }, { threshold: .18 });
    watch.observe(figure);
    art.addEventListener('load', loadArt);
    if (art.complete) loadArt();
    sync();
  }

  const turnInterval = 1750;
  const turnDuration = 1160;
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

