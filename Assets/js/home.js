// Assets/js/home.js — copied from root home.js

(function(){
  // Helper to safely query
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // debug logger (console only; removed on-page overlay)
  function dbg(msg) {
    if (typeof console !== 'undefined') console.log('[home.js]', msg);
  }

  // ---------------------
  // small ui helpers
  // ---------------------
  // lightweight per-menu lock to avoid duplicate toggles from pointerdown+click
  const _menuToggleLock = {};

  function scrollToSection(selector) {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({behavior:'smooth',block:'center'});
  }

  // Alert under maintenance
  function alertMaintenance(name = '') {
    const title = name ? ` "${name}"` : '';
    alert(`🚧 The section${title} is under maintenance. Coming soon!`);
  }

  // Dropdown toggle for desktop Explore menu
  function toggleMenu(e, id) {
    // guard against rapid double-calls (pointerdown then click)
    try {
      const now = Date.now();
      if (_menuToggleLock[id] && now - _menuToggleLock[id] < 250) {
        return; // ignore duplicate
      }
      _menuToggleLock[id] = now;
      setTimeout(() => { try { delete _menuToggleLock[id]; } catch (e){} }, 300);
    } catch (err) {}
    if (e && e.stopPropagation) e.stopPropagation();
    const el = document.getElementById(id);
    if (!el) return;
    const showing = el.classList.contains('show');

    // close others
    $$(".dropdown-menu").forEach(m => {
      m.classList.remove('show');
      m.setAttribute('aria-hidden','true');
      // try to also update any trigger aria-expanded
      const trigger = document.querySelector(`[aria-controls="${m.id}"]`);
      if (trigger) trigger.setAttribute('aria-expanded','false');
    });

    if (!showing) {
      el.classList.add('show');
      el.setAttribute('aria-hidden','false');
      // update trigger's aria-expanded if possible
      if (e && e.currentTarget) {
        try { e.currentTarget.setAttribute('aria-expanded','true'); } catch (err) {}
      } else {
        const trigger = document.querySelector(`[aria-controls="${id}"]`);
        if (trigger) trigger.setAttribute('aria-expanded','true');
      }
      // attach a one-time outside pointerdown listener on next tick
      // use capture phase so we reliably get the event before other handlers
      setTimeout(() => {
        const outsideHandler = function(ev) {
          try {
            if (ev.target && (ev.target.closest('.dropdown') || ev.target.closest('.dropdown-menu') || ev.target.closest('.nav-link-trigger'))) {
              // click was inside dropdown or on trigger — ignore
              return;
            }
          } catch (err) {}
          // close this menu
          try {
            el.classList.remove('show');
            el.setAttribute('aria-hidden','true');
            const trig = document.querySelector(`[aria-controls="${id}"]`);
            if (trig) trig.setAttribute('aria-expanded','false');
          } catch (e) {}
          // remove listener
          document.removeEventListener('pointerdown', outsideHandler, true);
        };
        document.addEventListener('pointerdown', outsideHandler, true);
      }, 0);
    } else {
      el.classList.remove('show');
      el.setAttribute('aria-hidden','true');
      const trigger = document.querySelector(`[aria-controls="${id}"]`);
      if (trigger) trigger.setAttribute('aria-expanded','false');
    }
  }

  // expose toggleMenu early for inline handlers safety
  try { window.toggleMenu = function(e,id){ return toggleMenu(e,id); }; } catch (err) { /* ignore */ }

  // Close dropdowns when clicking outside — but ignore clicks inside a dropdown or its trigger
  document.addEventListener('click', function(e){
    // if click inside any dropdown or on a trigger, do nothing
    if (e.target.closest && (e.target.closest('.dropdown') || e.target.closest('.dropdown-menu') || e.target.closest('.nav-link-trigger'))) {
      return;
    }
    $$(".dropdown-menu").forEach(m => {
      m.classList.remove('show');
      m.setAttribute('aria-hidden','true');
    });
    // also try to set triggers to false
    $$('[aria-controls]').forEach(t => t.setAttribute('aria-expanded','false'));
  });

  // Mobile menu functions
  function openMobileMenu(){
    const mm = document.getElementById('mobile-menu');
    if (!mm) return;
    mm.style.display = 'block';
    mm.setAttribute('aria-hidden','false');
    // move focus to first focusable element
    const btn = mm.querySelector('button, [href], input, [tabindex]');
    if (btn) btn.focus();
  }
  function closeMobileMenu(){
    const mm = document.getElementById('mobile-menu');
    if (!mm) return;
    mm.style.display = 'none';
    mm.setAttribute('aria-hidden','true');
  }
  function toggleMobileSection(id){
    const el = document.getElementById(id);
    if(!el) return;
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }

  // Open panels from hero/focus — show dropdown or alert accordingly
  function openPanel(panel) {
    if (panel === 'learning') {
      const choose = confirm('Open Learning Hub menu? (OK to open dropdown, Cancel to view subjects directly)');
      if (choose) {
        const menu = document.getElementById('explore-menu');
        if (menu) {
          menu.classList.add('show');
          menu.setAttribute('aria-hidden','false');
          const trigger = document.querySelector('[aria-controls="explore-menu"]');
          if (trigger) trigger.setAttribute('aria-expanded','true');
        }
      } else {
        alert('Choose a department: Science / Art / Commercial — These are under maintenance.');
      }
    } else if (panel === 'exams') {
      alertMaintenance('Exams & Tutorials');
    } else if (panel === 'tech') {
      alertMaintenance('Tech Careers');
    } else {
      alertMaintenance(panel);
    }
  }

  // openSub shows a small modal-like prompt of options for learning
  function openSub(group, sub) {
    if (group === 'learning' && sub === 'science') {
      const subjects = ['Physics','Chemistry','Biology','Mathematics','Computer Science'];
      selectFromList('Science subjects', subjects);
    } else if (group === 'learning' && sub === 'art') {
      const subjects = ['Literature','Government','CRS/IRS','Economics'];
      selectFromList('Art subjects', subjects);
    } else if (group === 'learning' && sub === 'commercial') {
      const subjects = ['Accounting','Commerce','Business Studies'];
      selectFromList('Commercial subjects', subjects);
    }
  }

  function selectFromList(title, list) {
    const chosen = prompt(`${title}:\nType the subject name to open (or leave empty to cancel)\n\n${list.join('\n')}`);
    if (!chosen) return;
    const found = list.find(x => x.toLowerCase() === chosen.trim().toLowerCase());
    if (found) {
      alertMaintenance(found);
    } else {
      alert('Not recognized. Please type exactly as shown (or use the Explore menu).');
    }
  }

  // search button (simple demo)
  function setupSearch() {
    const btn = document.getElementById('search-btn');
    if (!btn) return;
    btn.addEventListener('click', function(){
      const q = (document.getElementById('site-search') || {}).value || '';
      const t = q.trim();
      if (!t) {
        alert('Type something to search (demo).');
        return;
      }
      alert(`Searching for "${t}"... (Search results will be added soon)`);
    });
  }

  // prevent dropdown close when interacting inside
  function preventDropdownClose() {
    $$(".dropdown-menu").forEach(menu => {
      // stop propagation on click inside the menu so document click handler doesn't close it
      menu.addEventListener('click', function(e){ e.stopPropagation(); });
    });
  }

  // Accessibility: close menus on Escape
  function setupEscapeHandler() {
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') {
        $$(".dropdown-menu").forEach(m => {
          m.classList.remove('show');
          m.setAttribute('aria-hidden','true');
        });
        closeMobileMenu();
      }
    });
  }

  // ----------------------
  // Scroll reveal using IntersectionObserver
  // ----------------------
  function setupReveal() {
    const revealables = $$('.feature, .focus-card, .hero-left, .hero-right, .hero-card');
    // add default reveal classes if not present
    revealables.forEach((el,i) => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        // alternate left/right for variety
        if (i % 2 === 0) el.classList.add('reveal-left'); else el.classList.add('reveal-right');
      }
    });

    if (!('IntersectionObserver' in window)) {
      // fallback: reveal all
      revealables.forEach(r => r.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // once visible, unobserve for performance
          io.unobserve(entry.target);
        }
      });
    }, {threshold: 0.12});

    revealables.forEach(r => io.observe(r));
  }

  // ===== PRICING TOGGLE FUNCTIONALITY =====
  function togglePricing(period) {
    // Get button elements
    const monthlyBtn = document.getElementById('monthly-toggle');
    const yearlyBtn = document.getElementById('yearly-toggle');
    
    // Get all pricing display divs
    const premiumMonthly = document.getElementById('premium-monthly');
    const premiumYearly = document.getElementById('premium-yearly');
    const eliteMonthly = document.getElementById('elite-monthly');
    const eliteYearly = document.getElementById('elite-yearly');

    if (period === 'monthly') {
      // Show monthly, hide yearly
      if (premiumMonthly) premiumMonthly.style.display = 'block';
      if (premiumYearly) premiumYearly.style.display = 'none';
      if (eliteMonthly) eliteMonthly.style.display = 'block';
      if (eliteYearly) eliteYearly.style.display = 'none';
      
      // Update button appearance
      if (monthlyBtn) {
        monthlyBtn.style.background = 'white';
        monthlyBtn.style.color = 'var(--oae-dark)';
        monthlyBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }
      if (yearlyBtn) {
        yearlyBtn.style.background = 'transparent';
        yearlyBtn.style.color = '#999';
        yearlyBtn.style.boxShadow = 'none';
      }
    } else if (period === 'yearly') {
      // Show yearly, hide monthly
      if (premiumMonthly) premiumMonthly.style.display = 'none';
      if (premiumYearly) premiumYearly.style.display = 'block';
      if (eliteMonthly) eliteMonthly.style.display = 'none';
      if (eliteYearly) eliteYearly.style.display = 'block';
      
      // Update button appearance
      if (yearlyBtn) {
        yearlyBtn.style.background = 'white';
        yearlyBtn.style.color = 'var(--oae-dark)';
        yearlyBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }
      if (monthlyBtn) {
        monthlyBtn.style.background = 'transparent';
        monthlyBtn.style.color = '#999';
        monthlyBtn.style.boxShadow = 'none';
      }
    }
  }

  // ===== PAST QUESTIONS LIBRARY FUNCTIONALITY =====
  
  // Sample data for past questions - can be replaced with API call
  const pastQuestionsData = [
    {
      id: 1,
      exam: 'jamb',
      year: 2023,
      category: 'chemistry',
      title: 'What is the atomic number of Carbon?',
      type: 'Multiple Choice',
      url: '#'
    },
    {
      id: 2,
      exam: 'waec',
      year: 2022,
      category: 'literature',
      title: 'Analyze the theme of sacrifice in the text.',
      type: 'Essay',
      url: '#'
    },
    {
      id: 3,
      exam: 'neco',
      year: 2024,
      category: 'chemistry',
      title: 'Calculate the percentage composition of nitrogen in NH₃.',
      type: 'Calculation',
      url: '#'
    },
    {
      id: 4,
      exam: 'jamb',
      year: 2023,
      category: 'mathematics',
      title: 'Solve the quadratic equation: 2x² + 3x - 2 = 0',
      type: 'Problem',
      url: '#'
    },
    {
      id: 5,
      exam: 'post-utme',
      year: 2023,
      category: 'use-of-english',
      title: 'Correct the grammatical errors in the sentence.',
      type: 'Grammar',
      url: '#'
    },
    {
      id: 6,
      exam: 'waec',
      year: 2023,
      category: 'biology',
      title: 'Describe the process of photosynthesis.',
      type: 'Essay',
      url: '#'
    },
    {
      id: 7,
      exam: 'jamb',
      year: 2024,
      category: 'accounting',
      title: 'Explain the principles of debit and credit in accounting.',
      type: 'Theory',
      url: '#'
    },
    {
      id: 8,
      exam: 'waec',
      year: 2023,
      category: 'physics',
      title: 'Calculate the force required to accelerate a 5kg object at 2m/s².',
      type: 'Calculation',
      url: '#'
    },
    {
      id: 9,
      exam: 'neco',
      year: 2023,
      category: 'economics',
      title: 'Define elasticity of demand and provide examples.',
      type: 'Definition & Examples',
      url: '#'
    },
    {
      id: 10,
      exam: 'jamb',
      year: 2023,
      category: 'government',
      title: 'Discuss the functions of the executive arm of government.',
      type: 'Essay',
      url: '#'
    },
    {
      id: 11,
      exam: 'waec',
      year: 2024,
      category: 'geography',
      title: 'Explain the factors affecting climate distribution.',
      type: 'Essay',
      url: '#'
    },
    {
      id: 12,
      exam: 'neco',
      year: 2023,
      category: 'crs',
      title: 'Discuss the significance of the Ten Commandments.',
      type: 'Essay',
      url: '#'
    },
    {
      id: 13,
      exam: 'jamb',
      year: 2022,
      category: 'history',
      title: 'Outline the causes of the Boer War.',
      type: 'Outline',
      url: '#'
    },
    {
      id: 14,
      exam: 'waec',
      year: 2023,
      category: 'agricultural-science',
      title: 'Describe the different types of farming systems.',
      type: 'Description',
      url: '#'
    },
    {
      id: 15,
      exam: 'neco',
      year: 2024,
      category: 'commerce',
      title: 'Explain the differences between retail and wholesale trade.',
      type: 'Comparison',
      url: '#'
    },
    {
      id: 16,
      exam: 'jamb',
      year: 2023,
      category: 'computer-studies',
      title: 'Define programming and explain its importance.',
      type: 'Definition & Importance',
      url: '#'
    },
    {
      id: 17,
      exam: 'waec',
      year: 2023,
      category: 'islamic-studies',
      title: 'Discuss the importance of Zakat in Islam.',
      type: 'Essay',
      url: '#'
    },
    {
      id: 18,
      exam: 'neco',
      year: 2023,
      category: 'civic-education',
      title: 'Explain the rights and responsibilities of citizens.',
      type: 'Essay',
      url: '#'
    },
    {
      id: 19,
      exam: 'jamb',
      year: 2024,
      category: 'french',
      title: 'Translate the following passage from English to French.',
      type: 'Translation',
      url: '#'
    },
    {
      id: 20,
      exam: 'waec',
      year: 2023,
      category: 'music',
      title: 'Identify the time signature and tempo of the given composition.',
      type: 'Identification',
      url: '#'
    }
  ];

  function setupPastQuestionsLibrary() {
    const categoryFilter = $('#category-filter');
    const examTypeFilter = $('#exam-type-filter');
    const searchInput = $('.pql-search-input');

    if (!categoryFilter || !examTypeFilter || !searchInput) return; // Skip if not on homepage

    // Filter and search handler
    function filterQuestions() {
      const selectedCategory = categoryFilter.value;
      const selectedExam = examTypeFilter.value;
      const searchTerm = searchInput.value.toLowerCase();

      const filtered = pastQuestionsData.filter(q => {
        const categoryMatch = selectedCategory === 'all' || q.category === selectedCategory;
        const examMatch = selectedExam === 'all' || q.exam === selectedExam;
        const searchMatch = !searchTerm || 
          q.title.toLowerCase().includes(searchTerm) ||
          q.category.toLowerCase().includes(searchTerm) ||
          q.exam.toLowerCase().includes(searchTerm);

        return categoryMatch && examMatch && searchMatch;
      });

      renderQuestions(filtered);
    }

    // Render questions to DOM
    function renderQuestions(questions) {
      const resultsContainer = $('.pql-results');
      if (!resultsContainer) return;

      if (questions.length === 0) {
        resultsContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
            <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 16px; display: block;"></i>
            <p style="color: var(--muted); font-size: 1.1rem; margin: 0;">No questions found. Try different filters or keywords.</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = questions.map(q => `
        <div class="pql-question-card" style="background:white;padding:20px;border-radius:12px;border-left:4px solid var(--oae-green);box-shadow:0 4px 12px rgba(0,0,0,0.08);cursor:pointer;transition:all 0.3s ease" 
             onmouseover="this.style.boxShadow='0 8px 20px rgba(31,185,128,0.15)';this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';this.style.transform='translateY(0)'">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
            <span style="background:#1fb98033;color:var(--oae-dark);padding:4px 12px;border-radius:6px;font-size:0.85rem;font-weight:600">${q.exam.toUpperCase()}</span>
            <span style="background:#f0f0f0;color:#666;padding:4px 12px;border-radius:6px;font-size:0.85rem">${q.year}</span>
          </div>
          <h4 style="margin:12px 0;color:var(--oae-dark);font-size:1.05rem">${q.title}</h4>
          <p style="margin:0;color:#666;font-size:0.9rem">${formatSubjectName(q.category)} • ${q.type}</p>
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
            <i class="fas fa-arrow-right" style="color:var(--oae-green);font-size:0.9rem"></i>
            <span style="color:var(--oae-green);font-weight:600;font-size:0.9rem">View Solution</span>
          </div>
        </div>
      `).join('');
    }

    // Helper function to format subject names for display
    function formatSubjectName(category) {
      const subjectNames = {
        'accounting': 'Accounting',
        'agricultural-science': 'Agricultural Science',
        'arabic': 'Arabic',
        'biology': 'Biology',
        'chemistry': 'Chemistry',
        'crs': 'CRS',
        'civic-education': 'Civic Education',
        'commerce': 'Commerce',
        'computer-studies': 'Computer Studies',
        'economics': 'Economics',
        'fine-arts': 'Fine Arts',
        'french': 'French',
        'geography': 'Geography',
        'government': 'Government',
        'hausa': 'Hausa',
        'history': 'History',
        'home-economics': 'Home Economics',
        'igbo': 'Igbo',
        'islamic-studies': 'Islamic Studies',
        'literature': 'Literature',
        'mathematics': 'Mathematics',
        'music': 'Music',
        'phe': 'PHE',
        'physics': 'Physics',
        'use-of-english': 'English',
        'yoruba': 'Yoruba'
      };
      return subjectNames[category] || category.replace('-', ' ').charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
    }

    // Event listeners
    categoryFilter.addEventListener('change', filterQuestions);
    examTypeFilter.addEventListener('change', filterQuestions);
    searchInput.addEventListener('input', filterQuestions);

    // Initial render
    renderQuestions(pastQuestionsData);
  }

  // Initialization
  function init() {
    // debug overlay removed; dbg() logs go to console only
  // init completed (no verbose debug message)
    // Wire functions to window for existing inline handlers
    window.scrollToSection = scrollToSection;
    window.alertMaintenance = alertMaintenance;
    window.toggleMenu = toggleMenu;
    window.togglePricing = togglePricing;
    window.openMobileMenu = openMobileMenu;
    window.closeMobileMenu = closeMobileMenu;
    window.toggleMobileSection = toggleMobileSection;
    window.openPanel = openPanel;
    window.openSub = openSub;
    window.selectFromList = selectFromList;

    setupSearch();
    preventDropdownClose();
    setupEscapeHandler();
    setupReveal();
    setupPastQuestionsLibrary();

    // navbar.js now handles dropdown functionality for .nav-link-trigger buttons
    // so we don't need to attach listeners here
    }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
