document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality with mobile support
    const tabs = document.querySelectorAll('.legal-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs and sections
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.legal-section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding section
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        
        // Scroll to top of section on mobile
        if (window.innerWidth <= 768) {
          document.querySelector('.legal-content').scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      });
    });
  
    // Form submissions
    const contactForm = document.getElementById('contactForm');
    const feedbackForm = document.getElementById('feedbackForm');
    
    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Form submission logic
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
      });
    }
    
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Form submission logic
        alert('Thank you for your feedback! We appreciate your input.');
        this.reset();
      });
    }
  
    // Mobile menu toggle (if you have one)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', function() {
        // Your mobile menu toggle logic here
      });
    }
    
    // Fix for iOS viewport height
    function setViewportHeight() {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
  });

// Add this JavaScript to your site
// Add this JavaScript to your site
document.addEventListener('DOMContentLoaded', function() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const closeBtn = document.querySelector('.mobile-close-btn');
  const navOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  
  // Toggle menu when hamburger is clicked
  menuBtn.addEventListener('click', function() {
    document.body.classList.toggle('menu-open');
  });
  
  // Close menu when X button is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      document.body.classList.remove('menu-open');
    });
  }
  
  // Close menu when overlay is clicked
  if (navOverlay) {
    navOverlay.addEventListener('click', function() {
      document.body.classList.remove('menu-open');
    });
  }
  
  // Close menu when a link is clicked
  mobileNavLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      document.body.classList.remove('menu-open');
    });
  });
});


