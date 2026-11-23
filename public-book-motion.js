/* Motion stays within the artwork. Both illustrations work as still images without JS. */
(function () {
  'use strict';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svgNamespace = 'http://www.w3.org/2000/svg';

  function prepareBranch(figure) {
    if (motionPreference.matches || !('IntersectionObserver' in window)) return;
    const art = figure.querySelector('img');
    if (!art) return;

    const watch = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      watch.disconnect();
      art.decode().then(() => {
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

  // Each set follows the same Bézier commands: hinge top, leading edge, hinge bottom.
  const right = [476,367, 514,288,633,283,748,311, 994,452, 860,420,746,418,667,544];
  const raised = [476,367, 470,276,563,238,620,259, 783,400, 757,376,688,436,667,544];
  const left = [476,367, 403,307,325,310,264,332, 153,357, 223,437,265,506,270,568, 412,510,558,467,667,544];
  const opening = [...right.slice(0, 10), 982,449, 962,450, 951,450, ...right.slice(10)];
  const lift = [...raised.slice(0, 10), 774,404, 759,408, 744,408, ...raised.slice(10)];

  function pagePath(points) {
    const [x,y,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t] = points;
    return `M${x},${y} C${a},${b} ${c},${d} ${e},${f} L${g},${h} C${i},${j} ${k},${l} ${m},${n} C${o},${p} ${q},${r} ${s},${t} 667,544 Z`;
  }

  function drawPage(points) {
    const values = points.map(value => Math.round(value * 10) / 10);
    const start = values.slice(0, 2).join(',');
    const outer = values.slice(2, 8).join(' ');
    const corner = values.slice(8, 10).join(',');
    const bottom = values.slice(10, 16).join(' ');
    const hinge = values.slice(16).join(' ');
    return 'M' + start + ' C' + outer + ' L' + corner + ' C' + bottom + ' C' + hinge + ' Z';
  }

  function preparePageTurn(figure, index) {
    const image = figure.querySelector('img');
    if (!image) return;
    const control = document.createElement('button');
    control.className = 'book-toggle';
    control.type = 'button';
    control.setAttribute('aria-label', 'Turn a page in the illustrated book');

    const stage = document.createElement('span');
    stage.className = 'book-stage';
    const overlay = document.createElementNS(svgNamespace, 'svg');
    overlay.setAttribute('viewBox', '0 0 1200 800');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.add('book-leaf');
    const gradientId = 'page-paper-' + index;
    overlay.innerHTML = '<defs><linearGradient id="' + gradientId + '"><stop stop-color="#ae9d75"/><stop offset=".35" stop-color="#f9edce"/><stop offset=".83" stop-color="#f1e1bb"/><stop offset="1" stop-color="#fff5df"/></linearGradient></defs><path fill="url(#' + gradientId + ')" stroke="#877653" stroke-width="1.3" stroke-opacity=".7"/>';
    const sheet = overlay.querySelector('path');
    const caption = document.createElement('span');
    caption.className = 'book-toggle-label';
    caption.textContent = 'Turn a page';
    const status = document.createElement('span');
    status.className = 'book-turn-status';
    status.setAttribute('role', 'status');

    image.replaceWith(control);
    stage.append(image, overlay);
    control.append(stage, caption);
    figure.append(status);

    let turns = 0;
    let turning = false;
    control.addEventListener('click', () => {
      if (turning) return;
      turns++;
      if (motionPreference.matches) {
        stage.classList.toggle('book-turned');
        status.textContent = 'Turned page ' + turns + '.';
        return;
      }
      turning = true;
      status.textContent = '';
      const start = performance.now();
      function frame(now) {
        const time = Math.min(1, (now - start) / 790);
        if (time === 1 || motionPreference.matches) {
          overlay.style.opacity = '0';
          status.textContent = 'Turned page ' + turns + '.';
          turning = false;
          return;
        }
        const firstHalf = time < 0.5;
        const from = firstHalf ? opening : lift;
        const to = firstHalf ? lift : left;
        const motion = firstHalf ? time * 2 : (time - 0.5) * 2;
        const ease = motion * motion * (3 - 2 * motion);
        sheet.setAttribute('d', drawPage(from.map((value, point) => value + (to[point] - value) * ease)));
        overlay.style.opacity = String(Math.min(1, time * 18, (1 - time) * 14));
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  document.querySelectorAll('.hero-art').forEach(prepareBranch);
  document.querySelectorAll('.academic-art').forEach(preparePageTurn);
})();

