// Quiz Mobile Menu Toggle
        const quizHamburger = document.getElementById('quizHamburger');
        const quizMobileMenu = document.getElementById('quizMobileMenu');
        
        quizHamburger.addEventListener('click', function() {
            quizMobileMenu.classList.toggle('active');
            
            // Change hamburger icon
            const icon = this.querySelector('i');
            if (quizMobileMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Toggle mobile dropdowns
        document.querySelectorAll('.quiz-mobile-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdown = this.nextElementSibling;
                const icon = this.querySelector('.fa-chevron-down');
                
                // Close other dropdowns
                document.querySelectorAll('.quiz-mobile-dropdown').forEach(other => {
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
        
        // Quiz Search Functionality
        const quizSearchBtn = document.querySelector('.quiz-search-btn');
        const quizSearchInput = document.querySelector('.quiz-search-container input');
        
        quizSearchBtn.addEventListener('click', function() {
            if (quizSearchInput.value.trim()) {
                alert(`Searching quizzes for: "${quizSearchInput.value}"`);
                quizSearchInput.value = '';
            } else {
                quizSearchInput.focus();
            }
        });
        
        quizSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (this.value.trim()) {
                    alert(`Searching quizzes for: "${this.value}"`);
                    this.value = '';
                }
            }
        });
        
        // Join/Dashboard Button Toggle (Demo)
        const quizJoinBtn = document.getElementById('quizJoinBtn');
        const quizJoinMobile = document.getElementById('quizJoinMobile');
        let isLoggedIn = false;
        
        quizJoinBtn.addEventListener('click', function() {
            if (!isLoggedIn) {
                // User is joining
                alert('Join OAE form would open here. For demo: Click again to simulate login.');
                // For demo purposes, toggle to Dashboard
                setTimeout(() => {
                    isLoggedIn = true;
                    quizJoinBtn.textContent = 'Dashboard';
                    quizJoinBtn.style.background = '#218838';
                    
                    // Update mobile button too
                    quizJoinMobile.innerHTML = '<i class="fas fa-tachometer-alt"></i> Dashboard';
                    quizJoinMobile.style.background = '#218838';
                }, 1000);
            } else {
                // User is accessing dashboard
                alert('Opening Quiz Dashboard with: My Progress, Attempt History, Score Analytics');
            }
        });
        
        // Mobile join button
        quizJoinMobile.addEventListener('click', function() {
            if (!isLoggedIn) {
                alert('Join OAE form would open here.');
                setTimeout(() => {
                    isLoggedIn = true;
                    quizJoinBtn.textContent = 'Dashboard';
                    quizJoinBtn.style.background = '#218838';
                    this.innerHTML = '<i class="fas fa-tachometer-alt"></i> Dashboard';
                    this.style.background = '#218838';
                }, 1000);
            } else {
                alert('Opening Quiz Dashboard');
            }
        });
        
        // Demo dashboard link
        document.getElementById('quizDemo').addEventListener('click', function(e) {
            e.preventDefault();
            alert('Dashboard would show:\n• My Progress (75% complete)\n• Attempt History (42 quizzes)\n• Score Analytics (Average: 82%)\n• Recent Activity\n• Logout option');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.quiz-navbar') && quizMobileMenu.classList.contains('active')) {
                quizMobileMenu.classList.remove('active');
                quizHamburger.querySelector('i').classList.remove('fa-times');
                quizHamburger.querySelector('i').classList.add('fa-bars');
                
                // Close all dropdowns
                document.querySelectorAll('.quiz-mobile-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
                
                // Reset all icons
                document.querySelectorAll('.quiz-mobile-toggle .fa-chevron-down').forEach(icon => {
                    icon.style.transform = 'rotate(0deg)';
                });
            }
        });