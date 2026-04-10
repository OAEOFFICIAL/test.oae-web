// ============================================
        // DOM ELEMENTS - Store references to all interactive elements
        // ============================================
        const hamburger = document.getElementById('hamburger');
        const closeMenu = document.getElementById('close-menu');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');
        const mobileDepartmentToggle = document.getElementById('mobile-department-toggle');
        const mobileDepartmentMenu = document.getElementById('mobile-department-menu');
        const settingsButton = document.getElementById('settings-button');
        const mobileSettings = document.getElementById('mobile-settings');
        const bottomSettings = document.getElementById('bottom-settings');
        const closeSettings = document.getElementById('close-settings');
        const settingsModal = document.getElementById('settings-modal');
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const fontSizeSelect = document.getElementById('font-size-select');
        const colorOptions = document.querySelectorAll('.color-option');
        const searchInput = document.getElementById('search-input');
        const searchButton = document.querySelector('.search-button');
        
        // ============================================
        // LOCAL STORAGE KEYS - For saving user preferences
        // ============================================
        const STORAGE_KEYS = {
            THEME: 'oae_theme',
            FONT_SIZE: 'oae_font_size',
            ACCENT_COLOR: 'oae_accent_color',
            BOOKMARKS: 'oae_bookmarks'
        };
        
        // ============================================
        // INITIALIZE SETTINGS - Load saved preferences on page load
        // ============================================
        function initializeSettings() {
            // Load dark mode preference
            const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                darkModeToggle.checked = true;
            }
            
            // Load font size preference
            const savedFontSize = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || 'medium';
            fontSizeSelect.value = savedFontSize;
            document.body.classList.remove('font-small', 'font-medium', 'font-large');
            document.body.classList.add(`font-${savedFontSize}`);
            
            // Load accent color preference
            const savedAccentColor = localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR) || 'green';
            colorOptions.forEach(option => {
                const checkIcon = option.querySelector('i');
                option.classList.remove('active');
                checkIcon.style.display = 'none';
                
                if (option.dataset.color === savedAccentColor) {
                    option.classList.add('active');
                    checkIcon.style.display = 'block';
                }
            });
        }
        
        // ============================================
        // MOBILE MENU FUNCTIONS - Open/close mobile menu
        // ============================================
        function openMobileMenu() {
            mobileMenu.classList.add('active');
            menuOverlay.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
        
        function closeMobileMenu() {
            mobileMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            // Close department dropdown if open
            mobileDepartmentMenu.classList.remove('active');
        }
        
        // ============================================
        // SETTINGS MODAL FUNCTIONS - Open/close settings
        // ============================================
        function openSettingsModal() {
            settingsModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            closeMobileMenu(); // Close mobile menu if open
        }
        
        function closeSettingsModal() {
            settingsModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // ============================================
        // SAVE SETTING - Save user preference to localStorage
        // ============================================
        function saveSetting(key, value) {
            localStorage.setItem(key, value);
            localStorage.setItem('oae_settings_updated', new Date().toISOString());
        }
        
        // ============================================
        // SEARCH FUNCTIONALITY - Handle search input
        // ============================================
        function performSearch(query) {
            if (query.trim() !== '') {
                console.log('Searching for:', query);
                // In a real app, this would filter content or make an API call
                alert(`Searching for: "${query}"\n\nIn a full implementation, this would filter study materials or make an API call.`);
            }
        }
        
        // ============================================
        // EVENT LISTENERS - Set up all interactive elements
        // ============================================
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize settings from localStorage
            initializeSettings();
            
            // Mobile menu event listeners
            hamburger.addEventListener('click', openMobileMenu);
            closeMenu.addEventListener('click', closeMobileMenu);
            menuOverlay.addEventListener('click', closeMobileMenu);
            
            // Mobile department dropdown toggle
            mobileDepartmentToggle.addEventListener('click', function() {
                mobileDepartmentMenu.classList.toggle('active');
            });
            
            // Settings modal event listeners
            settingsButton.addEventListener('click', openSettingsModal);
            mobileSettings.addEventListener('click', function(e) {
                e.preventDefault();
                openSettingsModal();
                closeMobileMenu();
            });
            bottomSettings.addEventListener('click', openSettingsModal);
            closeSettings.addEventListener('click', closeSettingsModal);
            settingsModal.addEventListener('click', function(e) {
                if (e.target === settingsModal) {
                    closeSettingsModal();
                }
            });
            
            // Dark mode toggle
            darkModeToggle.addEventListener('change', function() {
                if (this.checked) {
                    document.body.classList.add('dark-mode');
                    saveSetting(STORAGE_KEYS.THEME, 'dark');
                } else {
                    document.body.classList.remove('dark-mode');
                    saveSetting(STORAGE_KEYS.THEME, 'light');
                }
            });
            
            // Font size selector
            fontSizeSelect.addEventListener('change', function() {
                const fontSize = this.value;
                document.body.classList.remove('font-small', 'font-medium', 'font-large');
                document.body.classList.add(`font-${fontSize}`);
                saveSetting(STORAGE_KEYS.FONT_SIZE, fontSize);
            });
            
            // Accent color selector
            colorOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const color = this.dataset.color;
                    
                    // Update UI
                    colorOptions.forEach(opt => {
                        const checkIcon = opt.querySelector('i');
                        opt.classList.remove('active');
                        checkIcon.style.display = 'none';
                    });
                    
                    this.classList.add('active');
                    const checkIcon = this.querySelector('i');
                    checkIcon.style.display = 'block';
                    
                    saveSetting(STORAGE_KEYS.ACCENT_COLOR, color);
                    
                    // In a real app, this would update the accent color throughout the UI
                    console.log('Accent color changed to:', color);
                });
            });
            
            // Desktop search functionality
            if (searchInput) {
                // Search on Enter key
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        performSearch(this.value);
                    }
                });
                
                // Search on button click
                if (searchButton) {
                    searchButton.addEventListener('click', function() {
                        performSearch(searchInput.value);
                    });
                }
            }
            
            // Mobile search functionality
            const mobileSearchInput = document.querySelector('.mobile-search-input');
            const mobileSearchButton = document.querySelector('.mobile-search-button');
            
            if (mobileSearchInput && mobileSearchButton) {
                mobileSearchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        performSearch(this.value);
                        closeMobileMenu();
                    }
                });
                
                mobileSearchButton.addEventListener('click', function() {
                    performSearch(mobileSearchInput.value);
                    closeMobileMenu();
                });
            }
            
            // Bookmarks functionality
            const bookmarksLink = document.getElementById('bookmarks-link');
            const mobileBookmarks = document.getElementById('mobile-bookmarks');
            
            function handleBookmarksClick(e) {
                e.preventDefault();
                // In Phase 1, bookmarks are stored locally
                let bookmarks = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || '[]');
                
                if (bookmarks.length === 0) {
                    alert('You have no bookmarks saved.\n\nBookmarks are stored locally on this device only.');
                } else {
                    alert(`You have ${bookmarks.length} bookmarks saved locally on this device.\n\nBookmarks are stored locally on this device only.`);
                }
                
                // Close mobile menu if open
                closeMobileMenu();
            }
            
            if (bookmarksLink) bookmarksLink.addEventListener('click', handleBookmarksClick);
            if (mobileBookmarks) mobileBookmarks.addEventListener('click', handleBookmarksClick);
            
            // Keyboard navigation for accessibility
            document.addEventListener('keydown', function(e) {
                // Escape key closes modals/menus
                if (e.key === 'Escape') {
                    if (mobileMenu.classList.contains('active')) {
                        closeMobileMenu();
                    }
                    if (settingsModal.classList.contains('active')) {
                        closeSettingsModal();
                    }
                }
            });
            
            // Focus trap for accessibility in modals
            function createFocusTrap(modal) {
                const focusableElements = modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                if (focusableElements.length === 0) return;
                
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                modal.addEventListener('keydown', function(e) {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                e.preventDefault();
                                lastElement.focus();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement.focus();
                            }
                        }
                    }
                });
            }
            
            // Set up focus traps for accessibility
            createFocusTrap(settingsModal);
            createFocusTrap(mobileMenu);
            
            // Initialize sample bookmarks for demonstration
            if (!localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) {
                const sampleBookmarks = [
                    { id: 1, title: 'JAMB Mathematics 2023', type: 'past-question' },
                    { id: 2, title: 'Organic Chemistry Reactions', type: 'topic' },
                    { id: 3, title: 'WAEC English Comprehension', type: 'practice' }
                ];
                localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(sampleBookmarks));
            }
        });