        // Toggle mobile menu
        const hamburger = document.querySelector('.hamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        
        hamburger.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            
            // Change hamburger icon
            const icon = this.querySelector('i');
            if (mobileMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Toggle mobile dropdowns
        document.querySelectorAll('.mobile-dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdown = this.nextElementSibling;
                const icon = this.querySelector('.fa-chevron-down');
                
                // Close other dropdowns
                document.querySelectorAll('.mobile-dropdown').forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('active');
                        other.previousElementSibling.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
                    }
                });
                
                dropdown.classList.toggle('active');
                
                if (dropdown.classList.contains('active')) {
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
        
        // Toggle nested mobile dropdowns
        document.querySelectorAll('.mobile-nested-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Prevent parent dropdown from closing
                const nestedDropdown = this.nextElementSibling;
                const icon = this.querySelector('.fa-chevron-down');
                
                // Close other nested dropdowns in same parent
                const parent = this.closest('.mobile-dropdown');
                if (parent) {
                    parent.querySelectorAll('.mobile-nested-dropdown').forEach(other => {
                        if (other !== nestedDropdown) {
                            other.classList.remove('active');
                            other.previousElementSibling.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
                        }
                    });
                }
                
                nestedDropdown.classList.toggle('active');
                
                if (nestedDropdown.classList.contains('active')) {
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    icon.style.transform = 'rotate(0deg)';
                }
            });
        });
        
        // Search functionality: wait for oaeSearch API with autosuggest
        (function(){
            const searchBtn = document.querySelector('.search-btn');
            const searchInput = document.querySelector('.search-section input');
            if (!searchBtn || !searchInput) return;

            let resultsContainer = null;
            let debounceTimer = null;
            let searchIndex = [];

            function createResultsUI(){
                if(resultsContainer) return resultsContainer;
                resultsContainer = document.createElement('div');
                resultsContainer.id = 'navbar-search-results';
                resultsContainer.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:white;border:1px solid #ddd;border-radius:6px;box-shadow:0 8px 16px rgba(0,0,0,0.1);max-height:340px;overflow-y:auto;z-index:9999;display:none;margin-top:4px;';
                const searchSection = searchInput.closest('.search-section');
                searchSection.style.position = 'relative';
                searchSection.appendChild(resultsContainer);
                return resultsContainer;
            }

            function showSuggestions(q){
                if(!resultsContainer) resultsContainer = createResultsUI();
                if(!searchIndex || searchIndex.length === 0){
                    resultsContainer.innerHTML = '<div style="padding:12px;color:#999;font-size:0.9rem">Loading index...</div>';
                    resultsContainer.style.display = 'block';
                    return;
                }
                
                const results = searchIndex.map(item => {
                    const titleMatch = (item.title||'').toLowerCase().includes(q);
                    const contentMatch = (item.content||'').toLowerCase().includes(q);
                    const score = (titleMatch?3:0) + (contentMatch?1:0);
                    return {...item, score};
                }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,6);

                if(results.length === 0){
                    resultsContainer.innerHTML = '<div style="padding:12px;color:#999;font-size:0.9rem">No results found</div>';
                } else {
                    resultsContainer.innerHTML = results.map(r=>`
                        <a href="${r.url}" style="display:block;padding:10px 12px;border-bottom:1px solid #f0f0f0;text-decoration:none;color:#333;transition:background 0.2s">
                            <div style="font-weight:600;color:#1fb980;font-size:0.95rem">${r.title || r.url}</div>
                            <div style="color:#666;font-size:0.85rem;margin-top:2px">${(r.content||'').slice(0,80)}...</div>
                        </a>
                    `).join('');
                    Array.from(resultsContainer.querySelectorAll('a')).forEach(a=>{
                        a.addEventListener('mouseenter', ()=>a.style.background='#f9f9f9');
                        a.addEventListener('mouseleave', ()=>a.style.background='transparent');
                    });
                }
                resultsContainer.style.display = 'block';
            }

            function performSearch(){
                const q = (searchInput.value||'').trim();
                if(!q) return;
                if(resultsContainer) resultsContainer.style.display = 'none';
                if(window.oaeSearch && typeof window.oaeSearch.doSearch === 'function'){
                    window.oaeSearch.doSearch(q, searchInput);
                }
            }

            // Autosuggest on input
            searchInput.addEventListener('input', function(e){
                clearTimeout(debounceTimer);
                const q = (this.value||'').trim().toLowerCase();
                if(!q){ if(resultsContainer) resultsContainer.style.display = 'none'; return; }
                debounceTimer = setTimeout(()=>{ showSuggestions(q); }, 200);
            });

            searchBtn.addEventListener('click', (e)=>{ e.preventDefault(); performSearch(); });
            searchInput.addEventListener('keypress', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); performSearch(); } });
            searchInput.addEventListener('blur', ()=>{ setTimeout(()=>{ if(resultsContainer) resultsContainer.style.display='none'; }, 150); });

            // Wait for oaeSearch API to be ready (with timeout)
            function initSearch(){
                if(window.oaeSearch && typeof window.oaeSearch.buildIndex === 'function'){
                    window.oaeSearch.buildIndex(false).then(index => {
                        searchIndex = index || [];
                        console.log('Navbar search index ready:', searchIndex.length, 'pages');
                    }).catch(e => console.warn('Search index build failed:', e));
                } else {
                    // API not ready yet, try again after a short delay
                    setTimeout(initSearch, 200);
                }
            }

            // Start initialization
            initSearch();
        })();
        
        // Join OAE button functionality
        document.querySelector('.join-btn').addEventListener('click', function() {
            alert('Join OAE form would open here.');
        });
        
        document.querySelector('.join-btn-mobile').addEventListener('click', function() {
            alert('Join OAE form would open here.');
        });
        
        // Take Quiz button functionality
        document.querySelector('.quiz-btn-mobile').addEventListener('click', function() {
            alert('Quiz would start here.');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.navbar') && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                hamburger.querySelector('i').classList.remove('fa-times');
                hamburger.querySelector('i').classList.add('fa-bars');
                
                // Close all dropdowns
                document.querySelectorAll('.mobile-dropdown, .mobile-nested-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
                
                // Reset all icons
                document.querySelectorAll('.fa-chevron-down').forEach(icon => {
                    icon.style.transform = 'rotate(0deg)';
                });
            }
        });
