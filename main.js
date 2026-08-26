    (function () {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* EmailJS: sends a copy of each form submission to the studio inbox.
         Replace EMAILJS_PUBLIC_KEY with the real key from
         EmailJS dashboard → Account → General → Public Key. */
      const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
      const EMAILJS_SERVICE_ID = 'service_pproild';
      if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'YOUR_EMAILJS_PUBLIC_KEY') {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      }
      function sendLeadEmail(templateId, params) {
        if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') return;
        emailjs.send(EMAILJS_SERVICE_ID, templateId, params).catch(err => {
          console.error('EmailJS send failed:', err);
        });
      }

      /* Lenis smooth scroll — gives the page the slow, weighted scroll feel */
      let lenis = null;
      if (!reduced && window.Lenis) {
        lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
      }

      /* preloader: blob loader + live percentage + rotating two-word status,
         then a colour wipe sweeps in, hides the preloader underneath it,
         and exits right to reveal the hero page */
      const pre = document.getElementById('preloader');
      const wipeEl = document.getElementById('preWipe');
      if (pre) {
        if (reduced) {
          pre.classList.add('hide');
          if (wipeEl) wipeEl.remove();
        } else {
          const percentEl = document.getElementById('prePercent');
          const taglineEl = document.getElementById('preTagline');
          const taglines = ['Loading fun', 'Sharpening focus', 'Counting beads', 'Building confidence', 'Almost ready'];
          let tIdx = 0;
          const taglineTimer = setInterval(() => {
            tIdx = (tIdx + 1) % taglines.length;
            taglineEl.textContent = taglines[tIdx];
          }, 550);

          let pct = 0;
          const pctTimer = setInterval(() => {
            pct = Math.min(96, pct + (2 + Math.random() * 6));
            percentEl.textContent = Math.floor(pct);
          }, 100);

          const loaded = new Promise(r => {
            if (document.readyState === 'complete') r();
            else addEventListener('load', r, { once: true });
          });
          const minTime = new Promise(r => setTimeout(r, 1400));

          Promise.all([loaded, minTime]).then(() => {
            clearInterval(pctTimer);
            clearInterval(taglineTimer);
            percentEl.textContent = 100;
            taglineEl.textContent = "Let's go";
            setTimeout(() => {
              if (wipeEl) wipeEl.classList.add('run');
              setTimeout(() => {
                pre.classList.add('hide');
                if (wipeEl) {
                  wipeEl.classList.remove('run');
                  wipeEl.classList.add('exit');
                  setTimeout(() => wipeEl.remove(), 700);
                }
              }, 550);
            }, 250);
          });
        }
      } else if (wipeEl) {
        wipeEl.remove();
      }

      /* word-flash reveal: wrap text in per-word spans, flash through accent color then settle to normal */
      document.querySelectorAll('.wflash').forEach(el => {
        const words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        words.forEach((w, i) => {
          const span = document.createElement('span');
          span.className = 'w';
          span.textContent = w + (i < words.length - 1 ? ' ' : '');
          el.appendChild(span);
        });
      });

      function flashIn(el) {
        if (reduced) { el.classList.add('in'); return; }
        const words = el.querySelectorAll('.w');
        el.classList.add('in');
        words.forEach((w, i) => {
          setTimeout(() => { w.style.color = 'var(--flash)'; }, i * 45);
          setTimeout(() => { w.style.color = ''; }, i * 45 + 260);
        });
      }

      /* hero heading: auto-repeat the word-flash sweep on a loop while it's on screen,
         starting after the initial one-shot reveal (io observer below) has run */
      const heroH1 = document.getElementById('hero-h1');
      if (heroH1 && !reduced) {
        let heroLoopTimer = null;
        const sweepDuration = () => heroH1.querySelectorAll('.w').length * 45 + 700;
        function startHeroLoop() {
          if (heroLoopTimer) return;
          const loop = () => { flashIn(heroH1); heroLoopTimer = setTimeout(loop, sweepDuration() + 2200); };
          heroLoopTimer = setTimeout(loop, sweepDuration() + 2200);
        }
        function stopHeroLoop() { clearTimeout(heroLoopTimer); heroLoopTimer = null; }
        new IntersectionObserver(es => {
          es.forEach(e => e.isIntersecting ? startHeroLoop() : stopHeroLoop());
        }, { threshold: .2 }).observe(heroH1);
      }

      const io = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          if (e.target.classList.contains('wflash')) flashIn(e.target);
          else e.target.classList.add('in');
          io.unobserve(e.target);
        });
      }, { threshold: .16, rootMargin: '0px 0px -6% 0px' });
      document.querySelectorAll('.rise,.wflash').forEach(el => io.observe(el));

      /* stat numbers: count up from 0 to their target once scrolled into view */
      function animateCount(el) {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        if (reduced || !isFinite(target)) {
          el.textContent = prefix + target.toLocaleString('en-US') + suffix;
          return;
        }
        const duration = 1400;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = Math.round(target * eased);
          el.textContent = prefix + value.toLocaleString('en-US') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
      const countIo = new IntersectionObserver(es => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          animateCount(e.target);
          countIo.unobserve(e.target);
        });
      }, { threshold: .5 });
      document.querySelectorAll('.count-up').forEach(el => countIo.observe(el));

      /* nav: shadow on scroll, hide on scroll-down, reveal on scroll-up */
      const nav = document.getElementById('nav');
      let lastScrollY = scrollY;
      addEventListener('scroll', () => {
        nav.style.boxShadow = scrollY > 8 ? '0 1px 0 rgba(0,0,0,.08)' : 'none';
        if (document.documentElement.classList.contains('mnav-open')) return;
        const goingDown = scrollY > lastScrollY;
        if (goingDown && scrollY > 120) { nav.classList.add('hidden'); }
        else { nav.classList.remove('hidden'); }
        lastScrollY = scrollY;
      }, { passive: true });

      /* portrait video lightbox: gallery play buttons on cards carrying a
         data-yt id open a real YouTube embed sized for 9:16 shorts */
      const videoLightbox = document.getElementById('videoLightbox');
      const videoLightboxFrame = document.getElementById('videoLightboxFrame');
      const videoLightboxClose = document.getElementById('videoLightboxClose');
      const videoLightboxFallback = document.getElementById('videoLightboxFallback');
      if (videoLightbox) {
        function openVideoLightbox(ytId) {
          videoLightboxFrame.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&playsinline=1" title="Mastermind Abacus video" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
          videoLightboxFallback.href = `https://youtube.com/shorts/${ytId}`;
          videoLightbox.classList.add('open');
        }
        function closeVideoLightbox() {
          videoLightbox.classList.remove('open');
          videoLightboxFrame.innerHTML = '';
        }
        document.querySelectorAll('.gcard[data-yt] .gcard-play:not([tabindex="-1"])').forEach(btn => {
          btn.addEventListener('click', () => {
            openVideoLightbox(btn.closest('.gcard').dataset.yt);
          });
        });
        videoLightboxClose.addEventListener('click', closeVideoLightbox);
        videoLightbox.addEventListener('click', e => {
          if (e.target === videoLightbox) closeVideoLightbox();
        });
        addEventListener('keydown', e => {
          if (e.key === 'Escape' && videoLightbox.classList.contains('open')) closeVideoLightbox();
        });
      }

      /* hero gallery slider: auto-scrolls, pauses on hover, arrows nudge manually,
         loops back to start once the duplicate set has scrolled past */
      const gallerySlider = document.getElementById('gallerySlider');
      if (gallerySlider) {
        const prevBtn = document.getElementById('galleryPrev');
        const nextBtn = document.getElementById('galleryNext');
        let autoPaused = false;
        let resumeTimer = null;

        function pauseAuto() {
          autoPaused = true;
          clearTimeout(resumeTimer);
          resumeTimer = setTimeout(() => { autoPaused = false; }, 2500);
        }

        gallerySlider.addEventListener('mouseenter', () => { autoPaused = true; });
        gallerySlider.addEventListener('mouseleave', () => { autoPaused = false; });
        gallerySlider.addEventListener('touchstart', () => { autoPaused = true; }, { passive: true });
        gallerySlider.addEventListener('touchend', pauseAuto, { passive: true });
        gallerySlider.addEventListener('pointerdown', () => { autoPaused = true; });
        gallerySlider.addEventListener('pointerup', pauseAuto);

        const isMobile = () => matchMedia('(max-width:760px)').matches;
        const isNarrow = () => matchMedia('(max-width:560px)').matches;
        const CARD_STEP = () => (isNarrow() ? 200 : 240) + 22; // card width + gap

        function scrollToCard(dir) {
          const cards = [...gallerySlider.querySelectorAll('.gcard')];
          const wrapRect = gallerySlider.getBoundingClientRect();
          const centerX = wrapRect.left + wrapRect.width / 2;
          let currentIdx = 0;
          let bestDist = Infinity;
          cards.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            const d = Math.abs((r.left + r.width / 2) - centerX);
            if (d < bestDist) { bestDist = d; currentIdx = i; }
          });
          const targetIdx = Math.min(Math.max(currentIdx + dir, 0), cards.length - 1);
          const target = cards[targetIdx];
          const targetRect = target.getBoundingClientRect();
          const delta = (targetRect.left + targetRect.width / 2) - centerX;
          gallerySlider.scrollBy({ left: delta, behavior: 'smooth' });
        }

        prevBtn.addEventListener('click', () => {
          pauseAuto();
          if (isMobile()) scrollToCard(-1);
          else gallerySlider.scrollBy({ left: -CARD_STEP(), behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
          pauseAuto();
          if (isMobile()) scrollToCard(1);
          else gallerySlider.scrollBy({ left: CARD_STEP(), behavior: 'smooth' });
        });

        if (!reduced) {
          const half = () => gallerySlider.scrollWidth / 2;
          (function autoScroll() {
            if (!autoPaused) {
              gallerySlider.scrollLeft += 0.6;
              if (gallerySlider.scrollLeft >= half()) {
                gallerySlider.scrollLeft -= half();
              }
            }
            requestAnimationFrame(autoScroll);
          })();
        }
      }

      /* custom dropdown component: replaces native <select> (whose option
         list can't be restyled) with a themed button + list, synced to a
         hidden input so form-submit code just reads .value as normal.
         The list is moved to <body> on open — a clip-path'd ancestor (used
         for the form panel's angled corner) clips ANY descendant, including
         position:absolute children, unlike plain overflow:hidden — so the
         list has to live outside that subtree to render/scroll fully. */
      function initCustomSelect(rootId, btnId, currentId, listId, hiddenId) {
        const root = document.getElementById(rootId);
        if (!root) return;
        const btn = document.getElementById(btnId);
        const current = document.getElementById(currentId);
        const hiddenInput = document.getElementById(hiddenId);
        const list = document.getElementById(listId);
        const opts = list.querySelectorAll('.csel-opt');
        const listHome = list.parentElement;

        function positionList() {
          const r = btn.getBoundingClientRect();
          list.style.position = 'fixed';
          list.style.left = r.left + 'px';
          list.style.width = r.width + 'px';
          const spaceBelow = window.innerHeight - r.bottom;
          if (spaceBelow < 320 && r.top > spaceBelow) {
            list.style.bottom = (window.innerHeight - r.top + 8) + 'px';
            list.style.top = 'auto';
            list.style.maxHeight = Math.min(380, r.top - 16) + 'px';
          } else {
            list.style.top = (r.bottom + 8) + 'px';
            list.style.bottom = 'auto';
            list.style.maxHeight = Math.min(380, spaceBelow - 16) + 'px';
          }
        }

        function openList() {
          document.body.appendChild(list);
          positionList();
          list.classList.add('open');
          root.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          addEventListener('scroll', positionList, true);
          addEventListener('resize', positionList);
        }

        function closeList() {
          list.classList.remove('open');
          root.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          list.style.position = '';
          list.style.left = '';
          list.style.top = '';
          list.style.bottom = '';
          list.style.width = '';
          list.style.maxHeight = '';
          listHome.appendChild(list);
          removeEventListener('scroll', positionList, true);
          removeEventListener('resize', positionList);
        }

        btn.addEventListener('click', () => {
          root.classList.contains('open') ? closeList() : openList();
        });

        opts.forEach(opt => {
          opt.addEventListener('click', () => {
            opts.forEach(o => { o.classList.remove('active'); o.setAttribute('aria-selected', 'false'); });
            opt.classList.add('active');
            opt.setAttribute('aria-selected', 'true');
            const value = opt.dataset.value;
            current.textContent = opt.textContent.replace(/\s+/g, ' ').trim();
            btn.classList.toggle('has-value', !!value);
            hiddenInput.value = value;
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            closeList();
          });
        });

        document.addEventListener('click', e => {
          if (root.classList.contains('open') && !root.contains(e.target) && !list.contains(e.target)) {
            closeList();
          }
        });
      }

      initCustomSelect('franchiseeSelect', 'af-franchisee-btn', 'af-franchisee-current', 'af-franchisee-list', 'af-franchisee');
      initCustomSelect('timeSlotSelect', 'dp-time-btn', 'dp-time-current', 'dp-time-list', 'dp-time');

      /* aggressive 5-second demo popup: appears once per session, feeds
         name/phone/date/time into the same WhatsApp booking flow */
      const demoBackdrop = document.getElementById('demoPopupBackdrop');
      if (demoBackdrop && !sessionStorage.getItem('demoPopupSeen')) {
        const demoClose = document.getElementById('demoPopupClose');
        const demoForm = document.getElementById('demoPopupForm');

        function openDemoPopup() {
          if (sessionStorage.getItem('demoPopupSeen')) return;
          demoBackdrop.classList.add('show');
          requestAnimationFrame(() => demoBackdrop.classList.add('in'));
        }
        function closeDemoPopup() {
          sessionStorage.setItem('demoPopupSeen', '1');
          demoBackdrop.classList.remove('in');
          setTimeout(() => demoBackdrop.classList.remove('show'), 300);
        }

        setTimeout(openDemoPopup, 5000);
        demoClose.addEventListener('click', closeDemoPopup);
        demoBackdrop.addEventListener('click', e => {
          if (e.target === demoBackdrop) closeDemoPopup();
        });
        addEventListener('keydown', e => {
          if (e.key === 'Escape' && demoBackdrop.classList.contains('show')) closeDemoPopup();
        });

        /* auto-format the free-typed date field as DD/MM/YYYY while typing */
        const dpDateInput = document.getElementById('dp-date');
        dpDateInput.addEventListener('input', () => {
          let digits = dpDateInput.value.replace(/\D/g, '').slice(0, 8);
          let out = digits;
          if (digits.length > 4) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
          else if (digits.length > 2) out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
          dpDateInput.value = out;
        });

        demoForm.addEventListener('submit', e => {
          e.preventDefault();
          const name = document.getElementById('dp-name').value.trim();
          const phone = document.getElementById('dp-phone').value.trim();
          const date = document.getElementById('dp-date').value.trim();
          const time = document.getElementById('dp-time').value;
          if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            dpDateInput.focus();
            dpDateInput.style.borderColor = 'var(--red)';
            setTimeout(() => { dpDateInput.style.borderColor = ''; }, 1500);
            return;
          }
          if (!time) {
            document.getElementById('dp-time-btn').scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById('dp-time-btn').style.borderColor = 'var(--red)';
            setTimeout(() => { document.getElementById('dp-time-btn').style.borderColor = ''; }, 1500);
            return;
          }
          sendLeadEmail('template_swmz7df', {
            name: name,
            phone: phone,
            preferred_date: date,
            preferred_time: time,
            time: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          });
          const msg = `Hi Mastermind Abacus, I'd like to book a free demo.%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0APreferred date: ${encodeURIComponent(date)}%0APreferred time: ${encodeURIComponent(time)}`;
          window.open(`https://wa.me/919556023002?text=${msg}`, '_blank');
          closeDemoPopup();
        });
      }

      /* 3D presence globe (globe.gl / Three.js): a real textured, rotating
         Earth with orange markers at each country. The CSS globe underneath
         stays as a guaranteed-visible fallback and is only hidden once
         globe.gl confirms a successful first render. */
      (function initGlobeGl() {
        const stageEl = document.getElementById('globeGl');
        const fallbackEl = document.getElementById('cesiumFallback');
        if (!stageEl || typeof Globe === 'undefined') return;

        let switched = false;
        function switchToGlobe() {
          if (switched) return;
          switched = true;
          stageEl.classList.add('ready');
          fallbackEl.classList.add('hide');
        }

        try {
          const locations = [
            { name: 'Cuttack (HQ)', lat: 20.47, lng: 85.88, epicenter: true },
            { name: 'USA', lat: 39, lng: -98 },
            { name: 'UK', lat: 54, lng: -2 },
            { name: 'Canada', lat: 56, lng: -106 },
            { name: 'UAE', lat: 24, lng: 54 },
            { name: 'Singapore', lat: 1, lng: 104 },
            { name: 'Australia', lat: -25, lng: 134 },
            { name: 'Bangladesh', lat: 24, lng: 90 },
            { name: 'New Zealand', lat: -41, lng: 174 },
          ];

          const globeInstance = Globe()(stageEl)
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundColor('rgba(0,0,0,0)')
            .showAtmosphere(true)
            .atmosphereColor('#F26C35')
            .atmosphereAltitude(0.22)
            .htmlElementsData(locations)
            .htmlLat('lat')
            .htmlLng('lng')
            .htmlAltitude(d => d.epicenter ? 0.05 : 0.03)
            .htmlElement(d => {
              const el = document.createElement('div');
              el.className = d.epicenter ? 'globe-html-label globe-html-label--epicenter' : 'globe-html-label';
              el.textContent = d.name;
              return el;
            })
            .width(stageEl.clientWidth)
            .height(stageEl.clientHeight);

          globeInstance.pointOfView({ lat: 15, lng: 80, altitude: 2.1 }, 0);

          // scroll-wheel zooms the camera by default, which hijacks page
          // scroll whenever the cursor happens to be over the globe —
          // disable zoom, keep drag-to-rotate only
          const controls = globeInstance.controls();
          controls.enableZoom = false;
          if (!reduced) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.6;
          }

          addEventListener('resize', () => {
            globeInstance.width(stageEl.clientWidth).height(stageEl.clientHeight);
          });

          // switch away from the CSS fallback once the WebGL renderer has
          // actually painted a frame — a silent construction-time failure
          // would otherwise leave a blank box in place of the working fallback
          requestAnimationFrame(() => requestAnimationFrame(switchToGlobe));
          setTimeout(() => { if (!switched) { /* CSS globe stays visible by default */ } }, 6000);
        } catch (err) {
          /* keep CSS globe visible */
        }
      })();

      /* social rail: single collapsed toggle, expands to show all icons.
         Hidden while the hero gallery is in view on mobile — its fixed position
         otherwise collides with the gallery's right-side nav arrow. */
      const socialRail = document.getElementById('socialRail');
      const socialRailToggle = document.getElementById('socialRailToggle');
      if (socialRail && socialRailToggle) {
        socialRailToggle.addEventListener('click', () => {
          const open = socialRail.classList.toggle('open');
          socialRailToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        document.addEventListener('click', e => {
          if (!socialRail.contains(e.target)) {
            socialRail.classList.remove('open');
            socialRailToggle.setAttribute('aria-expanded', 'false');
          }
        });

        const heroGalleryWrap = document.querySelector('.hero-slider-wrap');
        if (heroGalleryWrap && matchMedia('(max-width:760px)').matches) {
          new IntersectionObserver(es => {
            es.forEach(e => socialRail.classList.toggle('rail-hide', e.isIntersecting));
          }, { threshold: 0.15 }).observe(heroGalleryWrap);
        }
      }

      /* mobile/tablet nav panel toggle — robust scroll-lock that also blocks touch drag */
      const mnavToggle = document.getElementById('mnavToggle');
      const mnavCloseBtn = document.getElementById('mnavClose');
      const mnav = document.getElementById('mnav');
      let lockedScrollY = 0;

      function lockScroll() {
        lockedScrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
      }
      function unlockScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, lockedScrollY);
      }

      function openMnav() {
        document.documentElement.classList.add('mnav-open');
        mnavToggle.setAttribute('aria-expanded', 'true');
        lockScroll();
      }
      function closeMnav() {
        document.documentElement.classList.remove('mnav-open');
        mnavToggle.setAttribute('aria-expanded', 'false');
        unlockScroll();
      }
      mnavToggle.addEventListener('click', () => {
        document.documentElement.classList.contains('mnav-open') ? closeMnav() : openMnav();
      });
      mnavCloseBtn.addEventListener('click', closeMnav);
      mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMnav));

      /* fullscreen student gallery modal (opened from the compact hero video row) */
      const galleryModal = document.getElementById('galleryModal');
      const openGalleryBtn = document.getElementById('openGalleryModal');
      if (galleryModal && openGalleryBtn) {
        const galleryCloseBtn = document.getElementById('galleryModalClose');
        let galleryLockedScrollY = 0;

        function openGalleryModal() {
          galleryLockedScrollY = window.scrollY;
          document.body.style.position = 'fixed';
          document.body.style.top = `-${galleryLockedScrollY}px`;
          document.body.style.left = '0';
          document.body.style.right = '0';
          document.body.style.width = '100%';
          galleryModal.classList.add('open');
          galleryModal.setAttribute('aria-hidden', 'false');
        }
        function closeGalleryModal() {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.left = '';
          document.body.style.right = '';
          document.body.style.width = '';
          window.scrollTo(0, galleryLockedScrollY);
          galleryModal.classList.remove('open');
          galleryModal.setAttribute('aria-hidden', 'true');
        }
        openGalleryBtn.addEventListener('click', openGalleryModal);
        if (galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGalleryModal);
        addEventListener('keydown', e => {
          if (e.key === 'Escape' && galleryModal.classList.contains('open')) closeGalleryModal();
        });
      }

      /* testimonial carousel */
      const stories = [
        { quote: "“My daughter never liked numbers, and it showed in her grades. After just 4 months with Mastermind Abacus, she has overcome her math fear, and her class performance has improved dramatically.”", name: "Amitesh Kulkarni", role: "COO, Tata Power" },
        { quote: "“The structured approach at Mastermind Abacus has turned my son into a confident learner. His maths skills have improved significantly and he's now more motivated than ever!”", name: "Bhushan Sahoo", role: "Manager, Private Sector" },
        { quote: "“This platform has transformed my child's learning experience. The activities are engaging and educational!”", name: "Ruhi Parween", role: "Home-maker" }
      ];
      let ti = 0;
      const tQuote = document.getElementById('t-quote');
      const tPrev = document.getElementById('t-prev');
      const tNext = document.getElementById('t-next');
      if (tQuote && tPrev && tNext) {
        const tName = document.getElementById('t-name');
        const tRole = document.getElementById('t-role');
        const tTabs = document.querySelectorAll('#t-tabs button');
        function renderStory(i) {
          ti = (i + stories.length) % stories.length;
          const s = stories[ti];
          tQuote.textContent = s.quote;
          tName.textContent = s.name;
          tRole.textContent = s.role;
          tTabs.forEach((b, idx) => b.classList.toggle('on', idx === ti));
        }
        tPrev.addEventListener('click', () => renderStory(ti - 1));
        tNext.addEventListener('click', () => renderStory(ti + 1));
        tTabs.forEach(b => b.addEventListener('click', () => renderStory(+b.dataset.i)));
      }

      /* FAQ accordion */
      document.querySelectorAll('.faq-item').forEach(item => {
        const btn = item.querySelector('.faq-q');
        btn.addEventListener('click', () => {
          const open = item.getAttribute('data-open') === 'true';
          document.querySelectorAll('.faq-item[data-open="true"]').forEach(o => {
            if (o !== item) { o.removeAttribute('data-open'); o.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); }
          });
          if (open) { item.removeAttribute('data-open'); btn.setAttribute('aria-expanded', 'false'); }
          else { item.setAttribute('data-open', 'true'); btn.setAttribute('aria-expanded', 'true'); }
        });
      });

      /* assessment form: priority chips (lead-qualifying urgency) + WhatsApp message (no backend on this static page) */
      const assessForm = document.getElementById('assessForm');
      if (assessForm) {
        let selectedPriority = '';
        const chips = document.querySelectorAll('.af-chip');
        chips.forEach(chip => {
          chip.addEventListener('click', () => {
            chips.forEach(c => { c.classList.remove('on'); c.setAttribute('aria-checked', 'false'); });
            chip.classList.add('on');
            chip.setAttribute('aria-checked', 'true');
            selectedPriority = chip.dataset.priority;
          });
        });

        assessForm.addEventListener('submit', e => {
          e.preventDefault();
          if (!selectedPriority) {
            const chipsWrap = document.getElementById('afChips');
            chipsWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
            chipsWrap.style.outline = '2px solid var(--red)';
            chipsWrap.style.outlineOffset = '6px';
            setTimeout(() => { chipsWrap.style.outline = ''; }, 1600);
            return;
          }
          const name = document.getElementById('af-name').value.trim();
          const phone = document.getElementById('af-phone').value.trim();
          const age = document.getElementById('af-age').value.trim();
          const city = document.getElementById('af-city').value.trim();
          const franchisee = document.getElementById('af-franchisee').value.trim();
          sendLeadEmail('template_6jxgazi', {
            name: name,
            phone: phone,
            age: age,
            city: city || 'N/A',
            centre: franchisee || 'N/A',
            timeline: selectedPriority,
            time: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          });
          const msg = `Hi Mastermind Abacus, I'd like to book a free assessment.%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0AChild's age: ${encodeURIComponent(age)}%0AArea: ${encodeURIComponent(city || 'N/A')}%0AFranchisee: ${encodeURIComponent(franchisee || 'N/A')}%0ATimeline: ${encodeURIComponent(selectedPriority)}`;
          assessForm.classList.add('sent');
          setTimeout(() => {
            window.open(`https://wa.me/919556023002?text=${msg}`, '_blank');
          }, 900);
        });
      }

      /* smooth anchor scroll (routed through Lenis when available for consistent easing) */
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
          const t = document.querySelector(a.getAttribute('href'));
          if (!t) return;
          e.preventDefault();
          if (lenis) lenis.scrollTo(t, { offset: 0 });
          else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        });
      });
    })();
