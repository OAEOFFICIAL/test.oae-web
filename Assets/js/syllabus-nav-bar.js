// ===== NAVBAR FUNCTIONALITY =====
        document.addEventListener('DOMContentLoaded', function() {
            // Elements
            const hamburgerBtn = document.querySelector('.hamburger-btn');
            const closeBtn = document.querySelector('.close-btn');
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileOverlay = document.getElementById('mobileOverlay');
            const accordionBtns = document.querySelectorAll('.accordion-btn');
            const searchBtns = document.querySelectorAll('.search-btn');
            const searchInputs = document.querySelectorAll('.search-input');
            const loginBtns = document.querySelectorAll('.login-btn, .mobile-login-btn');
            
            // ===== MOBILE MENU TOGGLE =====
            hamburgerBtn.addEventListener('click', function() {
                mobileMenu.classList.add('active');
                mobileOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            
            closeBtn.addEventListener('click', closeMobileMenu);
            mobileOverlay.addEventListener('click', closeMobileMenu);
            
            function closeMobileMenu() {
                mobileMenu.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
                
                // Close all accordions
                accordionBtns.forEach(btn => {
                    btn.classList.remove('active');
                    const target = document.getElementById(btn.getAttribute('data-target'));
                    target.classList.remove('active');
                    target.style.maxHeight = '';
                });
            }
            
            // ===== ACCORDION FUNCTIONALITY =====
            accordionBtns.forEach(button => {
                button.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const content = document.getElementById(targetId);
                    
                    // Close other accordions
                    accordionBtns.forEach(otherBtn => {
                        if (otherBtn !== button) {
                            otherBtn.classList.remove('active');
                            const otherContent = document.getElementById(otherBtn.getAttribute('data-target'));
                            otherContent.classList.remove('active');
                            otherContent.style.maxHeight = '';
                        }
                    });
                    
                    // Toggle current accordion
                    if (content.classList.contains('active')) {
                        content.classList.remove('active');
                        content.style.maxHeight = '';
                        this.classList.remove('active');
                    } else {
                        content.classList.add('active');
                        content.style.maxHeight = content.scrollHeight + 'px';
                        this.classList.add('active');
                    }
                });
            });
            
            // ===== SEARCH FUNCTIONALITY =====
            searchBtns.forEach(button => {
                button.addEventListener('click', function() {
                    const searchContainer = this.closest('.search-container');
                    const searchInput = searchContainer.querySelector('.search-input');
                    performSearch(searchInput.value);
                });
            });
            
            searchInputs.forEach(input => {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        performSearch(this.value);
                    }
                });
            });
            
            function performSearch(query) {
                if (query.trim()) {
                    alert(`Searching syllabus for: "${query}"`);
                    searchInputs.forEach(input => input.value = '');
                    
                    // Close mobile menu if open
                    if (mobileMenu.classList.contains('active')) {
                        closeMobileMenu();
                    }
                } else {
                    searchInputs[0].focus();
                }
            }
            
            // ===== LOGIN FUNCTIONALITY =====
            let isLoggedIn = false;
            
            loginBtns.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    if (!isLoggedIn) {
                        alert('Login/Sign Up form would appear here.\n\nFor demo: Click again to simulate login.');
                        
                        setTimeout(() => {
                            isLoggedIn = true;
                            loginBtns.forEach(btn => {
                                btn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Dashboard';
                                btn.style.background = '#006400';
                            });
                            alert('Successfully logged in! Buttons now show "Dashboard".');
                        }, 1000);
                    } else {
                        alert('Opening Dashboard...');
                    }
                });
            });
            
            // ===== ACTIVE LINK HIGHLIGHTING =====
            const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    if (!this.classList.contains('dropdown-toggle')) {
                        navLinks.forEach(l => l.classList.remove('active'));
                        this.classList.add('active');
                        
                        if (window.innerWidth < 1024) {
                            closeMobileMenu();
                        }
                    }
                });
            });
            
            // ===== KEYBOARD ACCESSIBILITY =====
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeMobileMenu();
                }
            });
            
            // ===== INITIALIZE =====
            console.log('OAE Syllabus Navbar initialized with correct mobile layout.');
        });