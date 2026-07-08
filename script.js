(function(){
  const roman = ['I','II','III','IV','V'];
  const sheets = Array.from(document.querySelectorAll('.sheet'));
  const total = sheets.length;
  let current = 0;

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const folioLabel = document.getElementById('folioLabel');
  const dotsWrap = document.getElementById('dots');
  const book = document.getElementById('book');

  // folio marks + dots
  sheets.forEach((s,i)=>{
    const front = s.querySelector('.face.front .page-inner');
    if(front){
      const f = document.createElement('div');
      f.className = 'folio';
      f.textContent = roman[i];
      front.appendChild(f);
    }
    const back = s.querySelector('.face.back');
    const fb = document.createElement('div');
    fb.className = 'folio';
    fb.textContent = roman[i];
    back.appendChild(fb);

    const dot = document.createElement('span');
    dot.className = 'dot';
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function clampRotation(i, r){ return Math.max(-180, Math.min(0, r)); }

  function render(animate){
    sheets.forEach((s,i)=>{
      s.classList.toggle('dragging', false);
      if(!animate) s.style.transition = 'none'; else s.style.transition = '';
      if(i < current){
        s.style.zIndex = 100 + i;
        s.style.transform = 'rotateY(-180deg)';
      } else {
        s.style.zIndex = 300 + (total - i);
        s.style.transform = 'rotateY(0deg)';
      }
      const shadeF = s.querySelector('.face.front .shade');
      const shadeB = s.querySelector('.face.back .shade');
      if(shadeF) shadeF.style.opacity = i < current ? 1 : 0;
      if(shadeB) shadeB.style.opacity = 0;
      if(!animate) void s.offsetWidth; // force reflow so 'none' applies before next change
      if(!animate) s.style.transition = '';
    });
    folioLabel.textContent = roman[current];
    dots.forEach((d,i)=> d.classList.toggle('active', i===current));
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  function goTo(index){
    current = Math.max(0, Math.min(total-1, index));
    render(true);
  }

  prevBtn.addEventListener('click', ()=> goTo(current-1));
  nextBtn.addEventListener('click', ()=> goTo(current+1));

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowRight') goTo(current+1);
    if(e.key === 'ArrowLeft') goTo(current-1);
  });

  /* ---------------- DRAG TO FLIP ---------------- */
  let dragging = null;   // sheet element currently dragged
  let dragMode = null;   // 'next' or 'prev'
  let startX = 0;
  let bookWidth = 1;

  function isInteractive(el){
    return !!(el.closest && el.closest('button, a, input, select, textarea, label'));
  }

  function pointerDown(e){
    const target = e.target;
    if(isInteractive(target)) return;
    const rect = book.getBoundingClientRect();
    bookWidth = rect.width;
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;

    if(x < rect.width * 0.18 && current > 0){
      dragMode = 'prev';
      dragging = sheets[current-1];
      dragging.style.zIndex = 500;
    } else if(current < total - 1){
      dragMode = 'next';
      dragging = sheets[current];
      dragging.style.zIndex = 500;
    } else {
      return;
    }
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    dragging.classList.add('dragging');
    dragging.style.transition = 'none';
    document.addEventListener('mousemove', pointerMove);
    document.addEventListener('touchmove', pointerMove, {passive:false});
    document.addEventListener('mouseup', pointerUp);
    document.addEventListener('touchend', pointerUp);
  }

  function pointerMove(e){
    if(!dragging) return;
    e.preventDefault && e.preventDefault();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaX = x - startX;
    let rotation;
    if(dragMode === 'next'){
      rotation = clampRotation(0, (Math.min(0, deltaX) / bookWidth) * 320);
    } else {
      rotation = clampRotation(0, -180 + (Math.max(0, deltaX) / bookWidth) * 320);
    }
    dragging.style.transform = 'rotateY(' + rotation + 'deg)';
    const shadeF = dragging.querySelector('.face.front .shade');
    const shadeB = dragging.querySelector('.face.back .shade');
    const t = Math.min(1, Math.abs(rotation)/180);
    if(shadeF) shadeF.style.opacity = t;
    if(shadeB) shadeB.style.opacity = 1 - t;
    dragging.dataset.currentRotation = rotation;
  }

  function pointerUp(){
    if(!dragging) return;
    const rotation = parseFloat(dragging.dataset.currentRotation || '0');
    dragging.style.transition = '';
    dragging.classList.remove('dragging');

    if(dragMode === 'next'){
      if(rotation < -90){ goTo(current+1); } else { render(true); }
    } else {
      if(rotation > -90){ goTo(current-1); } else { render(true); }
    }
    dragging = null;
    dragMode = null;
    document.removeEventListener('mousemove', pointerMove);
    document.removeEventListener('touchmove', pointerMove);
    document.removeEventListener('mouseup', pointerUp);
    document.removeEventListener('touchend', pointerUp);
  }

  book.addEventListener('mousedown', pointerDown);
  book.addEventListener('touchstart', pointerDown, {passive:true});

  // add shade overlays
  sheets.forEach(s=>{
    s.querySelector('.face.front').insertAdjacentHTML('beforeend', '<div class="shade"></div>');
    s.querySelector('.face.back').insertAdjacentHTML('beforeend', '<div class="shade" style="background:linear-gradient(to left, rgba(0,0,0,0.5), rgba(0,0,0,0) 55%);"></div>');
  });

  render(false);
})();