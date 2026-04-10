// Navbar dropdown & mobile menu functionality

// Toggle dropdown menus on click
document.addEventListener('DOMContentLoaded', () => {
  const dropdownButtons = document.querySelectorAll('.nav-link-trigger');
  
  dropdownButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const menuId = btn.getAttribute('aria-controls');
      const menu = document.getElementById(menuId);
      if (menu) {
        const isOpen = menu.classList.contains('show');
        closeAllDropdowns();
        if (!isOpen) {
          menu.classList.add('show');
          btn.setAttribute('aria-expanded', 'true');
          menu.setAttribute('aria-hidden', 'false');
        }
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      closeAllDropdowns();
    }
  });
});

function closeAllDropdowns() {
  const menus = document.querySelectorAll('.dropdown-menu');
  const buttons = document.querySelectorAll('.nav-link-trigger');
  menus.forEach(menu => {
    menu.classList.remove('show');
    menu.setAttribute('aria-hidden', 'true');
  });
  buttons.forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
  });
}

// Mobile menu toggle
function openMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const toggle = document.querySelector('.mobile-toggle');
  if (menu) {
    const isOpen = menu.classList.contains('show');
    if (isOpen) {
      // close: remove show class, set inline display none (important), hide backdrop
      menu.classList.remove('show');
      try { menu.style.setProperty('display','none','important'); } catch(e) { menu.style.display = 'none'; }
      if (toggle) toggle.classList.remove('active');
      hideBackdrop();
    } else {
      // open: add show class and ensure inline display is visible (important) so inline display:none !important won't block it
      menu.classList.add('show');
      try { menu.style.setProperty('display','block','important'); } catch(e) { menu.style.display = 'block'; }
      if (toggle) toggle.classList.add('active');
      showBackdrop();
    }
  }
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const toggle = document.querySelector('.mobile-toggle');
  if (menu) {
    menu.classList.remove('show');
    try { menu.style.setProperty('display','none','important'); } catch(e) { menu.style.display = 'none'; }
  }
  if (toggle) {
    toggle.classList.remove('active');
  }
  hideBackdrop();
}

function showBackdrop() {
  let backdrop = document.getElementById('mobile-menu-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'mobile-menu-backdrop';
    backdrop.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:block;cursor:pointer;transition:opacity 0.3s ease';
    backdrop.onclick = closeMobileMenu;
    document.body.appendChild(backdrop);
  } else {
    backdrop.style.display = 'block';
  }
}

function hideBackdrop() {
  const backdrop = document.getElementById('mobile-menu-backdrop');
  if (backdrop) {
    backdrop.style.display = 'none';
  }
}

function toggleBackdrop() {
  let backdrop = document.getElementById('mobile-menu-backdrop');
  if (!backdrop) {
    showBackdrop();
  } else {
    const isVisible = backdrop.style.display !== 'none';
    if (isVisible) {
      hideBackdrop();
    } else {
      showBackdrop();
    }
  }
}

function removeBackdrop() {
  hideBackdrop();
}

// Mobile section toggle
function toggleMobileSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const isOpen = section.style.display !== 'none' && section.style.display !== '';
    if (isOpen) {
      section.style.display = 'none';
    } else {
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = '4px';
      section.style.paddingLeft = '12px';
    }
  }
}

// Close mobile menu when a link is clicked
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    const links = mobileMenu.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        setTimeout(closeMobileMenu, 100);
      });
    });
  }
  
  // Close menu when backdrop is clicked
  const backdrop = document.getElementById('mobile-menu-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeMobileMenu);
  }
});

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('site-search');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
});

function performSearch() {
  const searchInput = document.getElementById('site-search');
  const query = searchInput.value.trim();
  
  if (query.length > 0) {
    // For now, just alert. In production, redirect to search results page
    alert(`Search for "${query}" coming soon! We're building this feature.`);
  }
}

// Alert for maintenance pages
function alertMaintenance(pageName) {
  alert(`${pageName} is currently under maintenance. We're building this page!`);
}
