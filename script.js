/**
 * SpaceOut — AstroClub GLA University
 * Ben 10 themed canvas background + all interactions
 */
'use strict';

const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ══════════════════════════════════════════════════
   1. BEN 10 FULL-PAGE CANVAS BACKGROUND
   Draws: starfield, Omnitrix symbols, alien
   silhouettes, HUD grid, energy particles,
   lightning bolts, circuit traces
══════════════════════════════════════════════════ */
(function () {
  if (noMotion) return;
  const canvas = document.getElementById('ben10-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, scrollY = 0, frame = 0;

  // ── Object pools ──
  let stars      = [];
  let omniSyms   = [];
  let aliens     = [];
  let particles  = [];
  let circuits   = [];
  let lightnings = [];

  const GREEN  = '#00ff41';
  const AMBER  = '#c8ff00';
  const BLUE   = '#00c8ff';

  // ── Factories ──
  function mkStar() {
    return {
      nx: Math.random(), ny: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      baseA: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      spd: Math.random() * 0.01 + 0.003,
      depth: Math.random() * 0.35 + 0.05,
      col: ['rgba(180,255,180,A)','rgba(200,255,80,A)','rgba(180,220,255,A)'][Math.floor(Math.random()*3)]
    };
  }

  function mkOmni() {
    return {
      x: Math.random() * W,
      y: Math.random() * H * 4,
      size: Math.random() * 55 + 20,
      alpha: Math.random() * 0.055 + 0.015,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.004,
      pulse: Math.random() * Math.PI * 2,
      pulseSpd: Math.random() * 0.007 + 0.003,
      depth: Math.random() * 0.25 + 0.05,
      type: Math.floor(Math.random() * 3) // 0=full, 1=ring only, 2=hex
    };
  }

  function mkAlien() {
    return {
      x: Math.random() * W,
      y: Math.random() * H * 4,
      size: Math.random() * 50 + 20,
      alpha: Math.random() * 0.04 + 0.01,
      depth: Math.random() * 0.2 + 0.03,
      pulse: Math.random() * Math.PI * 2,
      pulseSpd: Math.random() * 0.005 + 0.002,
    };
  }

  function mkParticle() {
    const colors = [GREEN, AMBER, BLUE];
    return {
      x: Math.random() * W,
      y: H + 10,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(Math.random() * 0.8 + 0.3),
      r: Math.random() * 2.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.2,
      life: 1,
      decay: Math.random() * 0.004 + 0.001,
      col: colors[Math.floor(Math.random() * colors.length)]
    };
  }

  function mkCircuit() {
    const startX = Math.random() * W;
    const startY = Math.random() * H;
    const segs = [];
    let cx = startX, cy = startY;
    const segCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < segCount; i++) {
      const angle = (Math.floor(Math.random() * 4)) * Math.PI / 2;
      const len = Math.random() * 60 + 20;
      cx += Math.cos(angle) * len;
      cy += Math.sin(angle) * len;
      segs.push({ x: cx, y: cy });
    }
    return {
      start: { x: startX, y: startY },
      segs,
      alpha: Math.random() * 0.06 + 0.01,
      progress: 0,
      spd: Math.random() * 0.004 + 0.001,
      col: Math.random() > 0.4 ? GREEN : AMBER,
      depth: Math.random() * 0.2 + 0.02
    };
  }

  // ── Draw: Omnitrix symbol ──
  function drawOmni(x, y, size, alpha, rot, type) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;

    if (type === 1) {
      // rings only
      ctx.beginPath(); ctx.arc(0,0,size,0,Math.PI*2);
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,size*.65,0,Math.PI*2);
      ctx.strokeStyle = GREEN; ctx.lineWidth = .8; ctx.stroke();
    } else if (type === 2) {
      // hexagon HUD frame
      ctx.beginPath();
      for (let i=0;i<6;i++){
        const a = (i/6)*Math.PI*2 - Math.PI/6;
        i===0 ? ctx.moveTo(Math.cos(a)*size, Math.sin(a)*size)
              : ctx.lineTo(Math.cos(a)*size, Math.sin(a)*size);
      }
      ctx.closePath();
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1.2; ctx.stroke();
      // inner hexagon
      ctx.beginPath();
      for (let i=0;i<6;i++){
        const a = (i/6)*Math.PI*2 - Math.PI/6;
        i===0 ? ctx.moveTo(Math.cos(a)*size*.55, Math.sin(a)*size*.55)
              : ctx.lineTo(Math.cos(a)*size*.55, Math.sin(a)*size*.55);
      }
      ctx.closePath();
      ctx.strokeStyle = AMBER; ctx.lineWidth = .8; ctx.stroke();
    } else {
      // full Omnitrix
      ctx.beginPath(); ctx.arc(0,0,size,0,Math.PI*2);
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1.8; ctx.stroke();

      ctx.beginPath(); ctx.arc(0,0,size*.72,0,Math.PI*2);
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1; ctx.stroke();

      // 10-pointed star
      ctx.beginPath();
      for (let i=0;i<20;i++){
        const ang = (i*Math.PI)/10 - Math.PI/2;
        const r = i%2===0 ? size*.58 : size*.28;
        i===0 ? ctx.moveTo(Math.cos(ang)*r, Math.sin(ang)*r)
              : ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r);
      }
      ctx.closePath();
      ctx.fillStyle = GREEN; ctx.fill();

      // center
      ctx.beginPath(); ctx.arc(0,0,size*.12,0,Math.PI*2);
      ctx.fillStyle = '#ffffff'; ctx.fill();

      // tick marks on outer ring
      for (let i=0;i<12;i++){
        const ang = (i/12)*Math.PI*2;
        const r1 = size*.88, r2 = size*1.02;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang)*r1, Math.sin(ang)*r1);
        ctx.lineTo(Math.cos(ang)*r2, Math.sin(ang)*r2);
        ctx.strokeStyle = GREEN; ctx.lineWidth = .8; ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── Draw: Alien silhouette ──
  function drawAlien(x, y, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;

    // big head
    ctx.beginPath();
    ctx.ellipse(0, -size*.28, size*.32, size*.38, 0, 0, Math.PI*2);
    ctx.fillStyle = GREEN; ctx.fill();

    // body
    ctx.beginPath();
    ctx.ellipse(0, size*.2, size*.22, size*.32, 0, 0, Math.PI*2);
    ctx.fill();

    // arms
    ctx.beginPath();
    ctx.ellipse(-size*.38, size*.1, size*.1, size*.26, Math.PI*.15, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size*.38, size*.1, size*.1, size*.26, -Math.PI*.15, 0, Math.PI*2);
    ctx.fill();

    // eyes glowing amber
    ctx.globalAlpha = alpha * 2;
    ctx.fillStyle = AMBER;
    ctx.beginPath(); ctx.ellipse(-size*.12, -size*.3, size*.07, size*.09, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( size*.12, -size*.3, size*.07, size*.09, 0, 0, Math.PI*2); ctx.fill();

    // Omnitrix watch glow
    ctx.globalAlpha = alpha * 1.5;
    ctx.fillStyle = GREEN;
    ctx.beginPath(); ctx.arc(-size*.22, size*.28, size*.07, 0, Math.PI*2); ctx.fill();

    ctx.restore();
  }

  // ── Draw: Circuit trace ──
  function drawCircuit(c, parallax) {
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.strokeStyle = c.col;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    const allPts = [c.start, ...c.segs];
    const totalPts = allPts.length;
    const drawn = c.progress * (totalPts - 1);
    const fullSegs = Math.floor(drawn);
    const frac = drawn - fullSegs;

    ctx.beginPath();
    ctx.moveTo(allPts[0].x, allPts[0].y - parallax);

    for (let i = 1; i <= fullSegs && i < totalPts; i++) {
      ctx.lineTo(allPts[i].x, allPts[i].y - parallax);
    }

    if (fullSegs < totalPts - 1) {
      const from = allPts[fullSegs];
      const to   = allPts[fullSegs + 1];
      ctx.lineTo(
        from.x + (to.x - from.x) * frac,
        (from.y + (to.y - from.y) * frac) - parallax
      );
    }

    ctx.stroke();

    // glowing dot at tip
    if (c.progress < 1) {
      const pIdx = Math.min(fullSegs + 1, totalPts - 1);
      const prev = allPts[Math.min(fullSegs, totalPts - 1)];
      const nxt  = allPts[pIdx];
      const tx = prev.x + (nxt.x - prev.x) * Math.min(frac, 1);
      const ty = prev.y + (nxt.y - prev.y) * Math.min(frac, 1);
      ctx.beginPath();
      ctx.arc(tx, ty - parallax, 3, 0, Math.PI * 2);
      ctx.fillStyle = c.col;
      ctx.globalAlpha = c.alpha * 3;
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Draw: Shooting stars ──
  let shooters = [];
  function mkShooter() {
    return {
      x: -200, y: Math.random() * H * .5,
      vx: Math.random() * 8 + 6,
      vy: Math.random() * 2 + .5,
      len: Math.random() * 120 + 60,
      alpha: 0, life: 1,
      col: Math.random() > .5 ? GREEN : '#ffffff'
    };
  }
  setInterval(() => {
    if (shooters.length < 3) shooters.push(mkShooter());
  }, 3500);

  // ── Main draw loop ──
  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    // ── Stars ──
    for (const s of stars) {
      s.phase += s.spd;
      const a = s.baseA * (0.5 + 0.5 * Math.sin(s.phase));
      const px = s.nx * W;
      const py = s.ny * H - scrollY * s.depth * .12;
      if (py < -4 || py > H + 4) continue;

      const col = s.col.replace('A', a.toFixed(3));
      ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI*2);
      ctx.fillStyle = col; ctx.fill();

      if (s.r > 1.1) {
        ctx.beginPath(); ctx.arc(px, py, s.r*2.5, 0, Math.PI*2);
        ctx.fillStyle = col.replace(/[\d.]+\)$/, `${(a*.1).toFixed(3)})`);
        ctx.fill();
      }
    }

    // ── Circuits ──
    for (const c of circuits) {
      c.progress = Math.min(c.progress + c.spd, 1.2);
      const par = scrollY * c.depth * .15;
      if (c.progress < 1.2) drawCircuit(c, par);
    }

    // ── Omnitrix symbols ──
    for (const o of omniSyms) {
      o.rot    += o.rotSpd;
      o.pulse  += o.pulseSpd;
      const a   = o.alpha * (0.6 + 0.4 * Math.sin(o.pulse));
      const py  = o.y - scrollY * o.depth * .18;
      if (py < -o.size * 2.5 || py > H + o.size * 2.5) continue;
      drawOmni(o.x, py, o.size, a, o.rot, o.type);
    }

    // ── Alien silhouettes ──
    for (const al of aliens) {
      al.pulse += al.pulseSpd;
      const a   = al.alpha * (0.5 + 0.5 * Math.sin(al.pulse));
      const py  = al.y - scrollY * al.depth * .15;
      if (py < -al.size * 2 || py > H + al.size * 2) continue;
      drawAlien(al.x, py, al.size, a);
    }

    // ── Energy particles ──
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.col;
      ctx.globalAlpha = p.alpha * p.life;
      ctx.fill(); ctx.globalAlpha = 1;
    }
    if (Math.random() < 0.25 && particles.length < 35) particles.push(mkParticle());

    // ── Shooting stars ──
    for (let i = shooters.length - 1; i >= 0; i--) {
      const s = shooters[i];
      s.x += s.vx; s.y += s.vy; s.life -= 0.008;
      s.alpha = s.life;
      if (s.x > W + 300 || s.life <= 0) { shooters.splice(i, 1); continue; }

      const tailX = s.x - s.vx * (s.len / s.vx);
      const tailY = s.y - s.vy * (s.len / s.vx);
      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.6, s.col === GREEN ? `rgba(0,255,65,${(s.alpha*.8).toFixed(2)})` : `rgba(255,255,255,${(s.alpha*.8).toFixed(2)})`);
      grad.addColorStop(1, '#ffffff');
      ctx.beginPath();
      ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  // ── Init / resize ──
  function init() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;

    stars     = Array.from({ length: 180 }, mkStar);
    omniSyms  = Array.from({ length: 12  }, mkOmni);
    aliens    = Array.from({ length: 6   }, mkAlien);
    circuits  = Array.from({ length: 20  }, mkCircuit);
  }

  init();
  draw();

  window.addEventListener('resize', init);
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
})();


/* ══════════════════════════════════════════════════
   2. SHOOTING STARS in hero (CSS-injected)
══════════════════════════════════════════════════ */
(function () {
  if (noMotion) return;
  const layer = document.querySelector('.ss-layer');
  if (!layer) return;

  const pals = [
    'linear-gradient(90deg,transparent,#00ff41,#fff,transparent)',
    'linear-gradient(90deg,transparent,#c8ff00,#fff,transparent)',
    'linear-gradient(90deg,transparent,#fff,#00ff41,transparent)',
  ];

  function fire() {
    const el = document.createElement('div');
    el.className = 's-star';
    el.style.cssText = `
      top:${Math.random()*45+3}%;
      left:-240px;
      width:${Math.random()*130+70}px;
      background:${pals[Math.floor(Math.random()*pals.length)]};
      animation-duration:${(Math.random()*4+5).toFixed(1)}s;
      animation-delay:0s;
    `;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 10000);
  }

  setTimeout(fire, 600);
  setTimeout(fire, 2400);
  setInterval(() => { fire(); if (Math.random()>.5) setTimeout(fire,700); }, 4200);
})();


/* ══════════════════════════════════════════════════
   3. PARALLAX — hero character + content
══════════════════════════════════════════════════ */
(function () {
  if (noMotion) return;
  const char    = document.querySelector('.hero-character');
  const content = document.querySelector('.hero-content');
  const hero    = document.querySelector('.hero');
  if (!char || !hero) return;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const s = window.scrollY;
        if (s > hero.offsetHeight * 1.2) { ticking = false; return; }
        char.style.transform = `translateY(${s * .22}px)`;
        if (content) content.style.transform = `translateY(${s * .09}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();


/* ══════════════════════════════════════════════════
   4. INTERSECTION OBSERVER — reveal
══════════════════════════════════════════════════ */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (noMotion) { els.forEach(e => e.classList.add('visible')); return; }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  els.forEach(e => obs.observe(e));
})();


/* ══════════════════════════════════════════════════
   5. COUNTDOWN — Oct 26 2026 09:00 IST
══════════════════════════════════════════════════ */
(function () {
  const TARGET = new Date('2026-10-26T09:00:00+05:30');
  const d = document.getElementById('cd-days');
  const h = document.getElementById('cd-hours');
  const m = document.getElementById('cd-mins');
  const s = document.getElementById('cd-secs');
  if (!d) return;
  const pad = n => String(n).padStart(2,'0');
  function tick() {
    const diff = TARGET - new Date();
    if (diff <= 0) {
      d.textContent=h.textContent=m.textContent=s.textContent='00';
      const lbl = document.querySelector('.cd-label');
      if (lbl) lbl.textContent='SpaceOut is LIVE!'; return;
    }
    d.textContent = pad(Math.floor(diff/86400000));
    h.textContent = pad(Math.floor(diff/3600000)%24);
    m.textContent = pad(Math.floor(diff/60000)%60);
    s.textContent = pad(Math.floor(diff/1000)%60);
  }
  tick(); setInterval(tick, 1000);
})();


/* ══════════════════════════════════════════════════
   6. FAQ ACCORDION
══════════════════════════════════════════════════ */
(function () {
  const btns = document.querySelectorAll('.faq-q');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btns.forEach(b => {
        b.setAttribute('aria-expanded','false');
        const a = document.getElementById(b.getAttribute('aria-controls'));
        if (a) a.hidden = true;
      });
      if (!open) {
        btn.setAttribute('aria-expanded','true');
        const a = document.getElementById(btn.getAttribute('aria-controls'));
        if (a) a.hidden = false;
      }
    });
    btn.addEventListener('keydown', e => {
      if (e.key==='Escape') {
        btn.setAttribute('aria-expanded','false');
        const a = document.getElementById(btn.getAttribute('aria-controls'));
        if (a) a.hidden = true;
      }
    });
  });
})();


/* ══════════════════════════════════════════════════
   7. NAVBAR scroll
══════════════════════════════════════════════════ */
(function () {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 50
      ? 'rgba(0,0,0,.97)' : 'rgba(0,0,0,.92)';
  }, { passive: true });
})();


/* ══════════════════════════════════════════════════
   8. SMOOTH SCROLL
══════════════════════════════════════════════════ */
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e){
      const href = this.getAttribute('href');
      if (href==='#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = (document.querySelector('.navbar')?.offsetHeight||0)+10;
      window.scrollTo({ top: target.getBoundingClientRect().top+window.scrollY-offset, behavior: noMotion?'auto':'smooth' });
      target.setAttribute('tabindex','-1'); target.focus({preventScroll:true});
    });
  });
})();


/* ══════════════════════════════════════════════════
   9. QR CODE — via qrserver.com API
══════════════════════════════════════════════════ */
(function () {
  const img = document.getElementById('qr-img');
  if (!img) return;
  img.onerror = function() {
    // offline fallback
    this.alt = 'Visit: unstop.com to register for SpaceOut';
    this.style.cssText = 'width:180px;height:180px;background:#0a1a0d;display:flex;align-items:center;justify-content:center;font-size:10px;color:#00ff41;text-align:center;padding:10px;';
  };
})();
