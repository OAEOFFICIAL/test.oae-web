// Add animation styles to all pages
document.addEventListener('DOMContentLoaded', function() {
    // Add scroll reveal to all sections
    document.querySelectorAll('section').forEach(section => {
        if (!section.classList.contains('scroll-reveal')) {
            section.classList.add('scroll-reveal');
        }
    });

    // Add content card styles to feature blocks
    document.querySelectorAll('.feature').forEach(feature => {
        if (!feature.classList.contains('content-card')) {
            feature.classList.add('content-card', 'bounce-hover');
        }
    });

    // Add section header styles to h2 elements
    document.querySelectorAll('h2').forEach(heading => {
        if (!heading.classList.contains('section-header')) {
            heading.classList.add('section-header');
        }
    });

    // Add enhanced list styles to ul elements
    document.querySelectorAll('ul:not(.nav-links)').forEach(list => {
        if (!list.classList.contains('enhanced-list')) {
            list.classList.add('enhanced-list', 'custom-bullets');
        }
    });

    // Add bounce hover to buttons and links
    document.querySelectorAll('button:not(.nav-toggle), .cta, .btn-primary, .btn-outline').forEach(button => {
        if (!button.classList.contains('bounce-hover')) {
            button.classList.add('bounce-hover');
        }
    });

    // Add fade-in to paragraphs
    document.querySelectorAll('p:not(.meta)').forEach(para => {
        if (!para.classList.contains('fade-in')) {
            para.classList.add('fade-in');
        }
    });

    // Handle intersection observer for scroll reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    });

    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
});

/* ===== Site Search (client-side index + UI) ===== */
(function(){
    let PAGES = [
        'Index.htm','jamb.htm','jambSyllabus.htm','exams.htm','learning-hub.htm','communities.htm',
        'tech-careers.htm','media.htm','resources.htm','About.htm','contact.htm','signup.htm','login.htm',
        'terms.htm','privacy.htm','waec.htm','neco.htm','gce.htm','JambQuiz/index.htm',
        'Syllabus/JambMathematicsSyllabus.htm','Syllabus/JambPhysicsSyllabus.htm','Syllabus/JambChemistrySyllabus.htm',
        'Syllabus/JambBiologySyllabus.htm','Syllabus/JambEnglishSyllabus.htm','Syllabus/JambLiteratureSyllabus.htm',
        'Syllabus/JambEconomicsSyllabus.htm','Syllabus/JambGovernmentSyllabus.htm','Syllabus/JambHistorySyllabus.htm',
        'Syllabus/JambAccountingSyllabus.htm','Syllabus/JambCommerceSyllabus.htm'
    ];

    // Attempt to load a fuller pages list from `Assets/data/site-pages.json` if present.
    // If that fails, fall back to crawling `Index.htm` for links to build the pages list dynamically.
    async function loadPagesList(){
        try{
            const res = await fetch('Assets/data/site-pages.json', {cache:'no-store'});
            if(res && res.ok){
                const js = await res.json();
                if(Array.isArray(js) && js.length) { PAGES = js; return; }
            }
        }catch(e){ /* ignore if file not present */ }

        // fallback: crawl Index.htm and gather .htm links (shallow crawl)
        try{
            const discovered = new Set();
            async function fetchAndCollect(url){
                try{
                    const r = await fetch(url, {cache:'no-store'});
                    if(!r.ok) return;
                    const txt = await r.text();
                    const parser = new DOMParser();
                    const d = parser.parseFromString(txt, 'text/html');
                    Array.from(d.querySelectorAll('a[href]')).forEach(a => {
                        try{
                            const h = a.getAttribute('href') || '';
                            if(h && h.toLowerCase().endsWith('.htm')){
                                const clean = h.replace(/^\/+/, '');
                                // normalize fragment removal
                                const nofrag = clean.split('#')[0];
                                // ignore mailto / http external
                                if(nofrag.startsWith('http') || nofrag.startsWith('mailto:')) return;
                                discovered.add(nofrag);
                            }
                        }catch(e){}
                    });
                }catch(e){}
            }
            await fetchAndCollect('Index.htm');
            // also try JambQuiz index if exists
            await fetchAndCollect('JambQuiz/index.htm');
            // fetch discovered pages shallowly to find more links (limit to 200)
            const arr = Array.from(discovered).slice(0,200);
            for(const p of arr){ await fetchAndCollect(p); }
            if(discovered.size) PAGES = Array.from(discovered);
        }catch(e){ /* swallow errors, leave PAGES as initial */ }
    }

    const STORAGE_KEY = 'oae_search_index';
    const STORAGE_TIME = 'oae_search_index_time';

    async function buildIndex(force=false){
        try{
            await loadPagesList();
            const now = Date.now();
            const prev = localStorage.getItem(STORAGE_TIME);
            if(!force && prev && (now - parseInt(prev,10) < 1000*60*60*24*7)){
                const cached = localStorage.getItem(STORAGE_KEY);
                if(cached) return JSON.parse(cached);
            }

            const index = [];
            for(const page of PAGES){
                try{
                    const res = await fetch(page, {cache: 'no-store'});
                    if(!res.ok) continue;
                    const text = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const title = (doc.querySelector('title')||{textContent:page}).textContent;
                    // extract visible text
                    const body = doc.body ? doc.body.innerText.replace(/\s+/g,' ').trim() : '';
                    index.push({url: page, title, content: body});
                }catch(e){
                    // ignore fetch failures
                    console.warn('Indexing failed for', page, e);
                }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
            localStorage.setItem(STORAGE_TIME, String(now));
            return index;
        }catch(e){
            console.error('buildIndex error', e);
            return [];
        }
    }

    function createResultsContainer(){
        let container = document.getElementById('search-results');
        if(container) return container;
        container = document.createElement('div');
        container.id = 'search-results';
        container.setAttribute('aria-live','polite');
        container.style.position = 'absolute';
        container.style.zIndex = 99999;
        container.style.minWidth = '280px';
        container.style.maxWidth = '680px';
        container.style.background = 'white';
        container.style.border = '1px solid rgba(0,0,0,0.08)';
        container.style.borderRadius = '8px';
        container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)';
        container.style.display = 'none';
        container.style.padding = '8px';
        document.body.appendChild(container);
        return container;
    }

    function positionResults(el, container){
        const rect = el.getBoundingClientRect();
        container.style.left = (window.scrollX + rect.left) + 'px';
        container.style.top = (window.scrollY + rect.bottom + 8) + 'px';
    }

    function renderResults(results, container){
        container.innerHTML = '';
        if(!results || results.length === 0){
            container.innerHTML = '<div style="padding:12px;color:#666">No results found. Try different keywords.</div>';
            return;
        }
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none'; ul.style.margin = '0'; ul.style.padding = '0'; ul.style.maxHeight='380px'; ul.style.overflow='auto';
        results.slice(0,12).forEach(r => {
            const li = document.createElement('li');
            li.style.padding = '10px 8px'; li.style.borderBottom = '1px solid rgba(0,0,0,0.04)';
            const a = document.createElement('a');
            a.href = r.url; a.textContent = r.title || r.url; a.style.color = '#008000'; a.style.fontWeight='600'; a.style.textDecoration='none';
            const p = document.createElement('div'); p.textContent = (r.snippet|| r.content.slice(0,180) + '...'); p.style.color='#555'; p.style.fontSize='0.95rem'; p.style.marginTop='6px';
            li.appendChild(a); li.appendChild(p); ul.appendChild(li);
        });
        container.appendChild(ul);
    }

    async function doSearch(query, inputEl){
        const q = (query || '').trim().toLowerCase();
        const container = createResultsContainer();
        if(!q){ container.style.display='none'; return; }
        const index = await buildIndex();
        const results = index.map(item => {
            const score = ((item.title||'').toLowerCase().includes(q)?2:0) + ((item.content||'').toLowerCase().includes(q)?1:0);
            return {...item, score};
        }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
        // add snippet
        results.forEach(r=>{ const idx = r.content.toLowerCase().indexOf(q); if(idx>=0){ r.snippet = r.content.slice(Math.max(0,idx-60), idx+160).replace(/\n/g,' '); } });
        renderResults(results, container);
        positionResults(inputEl, container);
        container.style.display = 'block';
    }

    function attach(){
        const input = document.getElementById('site-search');
        const btn = document.getElementById('search-btn');
        if(!input || !btn) return;
        const container = createResultsContainer();
        btn.addEventListener('click', (e)=>{ e.preventDefault(); doSearch(input.value, input); });
        input.addEventListener('keydown', (ev)=>{ if(ev.key === 'Enter'){ ev.preventDefault(); doSearch(input.value, input); } if(ev.key==='Escape'){ container.style.display='none'; } });
        // close on outside click
        document.addEventListener('click', (ev)=>{ if(!container.contains(ev.target) && ev.target !== input && ev.target !== btn){ container.style.display='none'; } });
    }

    // attach on DOM ready
    document.addEventListener('DOMContentLoaded', ()=>{
        // ensure header exists (inject from Index.htm) and header search exists on pages that don't include it
        try{ ensureNavbar && ensureNavbar(); }catch(e){}
        try{ ensureHeaderSearch && ensureHeaderSearch(); }catch(e){}
        attach();
        // build index in background
        buildIndex(false).then(()=>{/* indexed */}).catch(()=>{});
    });

    /* Inject navbar from Index.htm if the page lacks one */
    async function ensureNavbar(){
        try{
            if (document.querySelector('.navbar')) return; // already present
            const res = await fetch('/Index.htm', {cache:'no-store'});
            if (!res.ok) return;
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const header = doc.querySelector('header.navbar');
            if (!header) return;
            const clone = header.cloneNode(true);

            // Force sticky behavior at highest priority
            clone.style.cssText = 'position:sticky !important; top:0 !important; z-index:999 !important; will-change:transform;';

            // make all anchors root-relative so links work from subfolders
            clone.querySelectorAll('a[href]').forEach(a=>{
                try{
                    const h = a.getAttribute('href')||'';
                    if (h.startsWith('http') || h.startsWith('#') || h.startsWith('mailto:')) return;
                    // convert to root-relative
                    const clean = h.replace(/^\/+/, '');
                    a.setAttribute('href', '/' + clean);
                }catch(e){}
            });

            // Ensure search input exists in injected header
            try{
                if(!clone.querySelector('#site-search')){
                    const brand = clone.querySelector('.brand');
                    const searchContainer = document.createElement('div');
                    searchContainer.className = 'search';
                    searchContainer.setAttribute('role','search');
                    searchContainer.style.marginLeft = '16px';
                    searchContainer.style.flex = '1';
                    searchContainer.style.maxWidth = '480px';
                    const input = document.createElement('input');
                    input.id = 'site-search'; input.type = 'search'; input.placeholder = 'Search lessons, exams, services...'; input.setAttribute('aria-label','Search input');
                    const btn = document.createElement('button'); btn.id = 'search-btn'; btn.type = 'button'; btn.textContent = 'Search'; btn.title = 'Search';
                    searchContainer.appendChild(input); searchContainer.appendChild(btn);
                    if(brand && brand.parentNode === clone){ clone.insertBefore(searchContainer, brand.nextSibling); } else { clone.insertBefore(searchContainer, clone.firstChild); }
                }
            }catch(e){ console.warn('ensureNavbar: add search failed', e); }

            // Wire up all dropdown triggers in the cloned navbar with simple toggle
            try{
                clone.querySelectorAll('.nav-link-trigger').forEach(trigger => {
                    const menuId = trigger.getAttribute('aria-controls');
                    if(!menuId) return;
                    const menu = clone.querySelector(`#${menuId}`);
                    if(!menu) return;
                    trigger.addEventListener('click', function(e){
                        e.stopPropagation();
                        const showing = menu.classList.contains('show');
                        clone.querySelectorAll('.dropdown-menu').forEach(m=>{ m.classList.remove('show'); m.setAttribute('aria-hidden','true'); });
                        clone.querySelectorAll('[aria-controls]').forEach(t=>{ try{ t.setAttribute('aria-expanded','false'); }catch(e){} });
                        if(!showing){ menu.classList.add('show'); menu.setAttribute('aria-hidden','false'); try{ trigger.setAttribute('aria-expanded','true'); }catch(e){} }
                    });
                });
            }catch(e){ console.warn('ensureNavbar: wire triggers failed', e); }

            // insert at top of body
            document.body.insertBefore(clone, document.body.firstChild);
        }catch(e){ console.warn('ensureNavbar failed', e); }
    }

    /* Inject a search input into the header if missing (helps propagate without editing every file) */
    function ensureHeaderSearch(){
        const nav = document.querySelector('.navbar');
        if(!nav) return;
        // if a site-search already exists anywhere, or the nav already
        // contains a search implementation, skip injection to avoid duplicates
        if (document.getElementById('site-search')) return;
        if (nav.querySelector('.search-section, .search, #site-search')) return;
        // create container
        const container = document.createElement('div');
        container.className = 'search';
        container.setAttribute('role','search');
        container.style.marginLeft = '16px';
        container.style.flex = '1';
        container.style.maxWidth = '480px';
        const input = document.createElement('input');
        input.id = 'site-search'; input.type = 'search'; input.placeholder = 'Search lessons, exams, careers...'; input.setAttribute('aria-label','Search input');
        const btn = document.createElement('button'); btn.id = 'search-btn'; btn.type = 'button'; btn.textContent = 'Search'; btn.title = 'Search';
        container.appendChild(input); container.appendChild(btn);
        // insert after brand if possible
        const brand = nav.querySelector('.brand');
        if(brand && brand.parentNode === nav){
            nav.insertBefore(container, brand.nextSibling);
        } else {
            nav.insertBefore(container, nav.firstChild);
        }
        // wire up local listeners to call doSearch
        btn.addEventListener('click', (e)=>{ e.preventDefault(); doSearch(input.value, input); });
        input.addEventListener('keydown', (ev)=>{ if(ev.key === 'Enter'){ ev.preventDefault(); doSearch(input.value, input); } });
    }

    /* Animated counters (for homepage stats) */
    function animateCounters(){
        const elems = document.querySelectorAll('.counter');
        if(!elems || elems.length===0) return;
        const obs = new IntersectionObserver((entries, ob) => {
            entries.forEach(entry => {
                if(!entry.isIntersecting) return;
                const el = entry.target;
                if(el.dataset.animated) return;
                el.dataset.animated = '1';
                const target = parseInt(el.getAttribute('data-target')||'0',10);
                const duration = 2000; // Slightly longer duration for smoother animation
                let start = null;
                const startVal = 0;
                function step(ts){
                    if(!start) start = ts;
                    const progress = Math.min((ts - start)/duration, 1);
                    // Use easeOutExpo for smoother ending
                    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    const current = Math.floor(easeProgress * (target - startVal) + startVal);
                    el.textContent = current.toLocaleString() + '+';
                    if(progress < 1){
                        requestAnimationFrame(step);
                    } else {
                        // final
                        el.textContent = target.toLocaleString() + '+';
                        ob.unobserve(el);
                    }
                }
                requestAnimationFrame(step);
            });
        }, {threshold:0.2}); // Trigger animation slightly earlier
        elems.forEach(e=>obs.observe(e));
    }

    function formatNumber(n){
        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // start counters on DOM ready as well
    document.addEventListener('DOMContentLoaded', ()=>{ try{ animateCounters(); }catch(e){} });

    // Expose search API for navbar.js and other scripts
    try {
        window.oaeSearch = window.oaeSearch || {};
        window.oaeSearch.buildIndex = buildIndex;
        window.oaeSearch.doSearch = doSearch;
        window.oaeSearch.createResultsContainer = createResultsContainer;
        window.oaeSearch.renderResults = renderResults;
        window.oaeSearch.positionResults = positionResults;
    } catch (e) {
        console.warn('Failed to expose oaeSearch API:', e);
    }

})();