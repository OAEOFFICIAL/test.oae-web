// Animate intro progress bar on load
    document.addEventListener('DOMContentLoaded', function(){
      const prog = document.getElementById('intro-progress');
      if(prog){
        // small delay so it feels intentional
        setTimeout(()=> prog.style.width = '78%', 220);
      }
    });

    // IntersectionObserver for reveal animations
    (function(){
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(prefersReduced) {
        // show all immediately
        document.querySelectorAll('.reveal').forEach(el=>{
          el.classList.add('in-view');
        });
        document.querySelectorAll('.subject.reveal').forEach(el=>{
          el.classList.add('in-view');
        });
        return;
      }

      const revealEls = document.querySelectorAll('.reveal');
      const subjectEls = document.querySelectorAll('.subject.reveal');

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

      revealEls.forEach(el => observer.observe(el));
      subjectEls.forEach(el => observer.observe(el));
    })();

    // Make combo boxes keyboard accessible
    document.querySelectorAll('.combo').forEach(function(el){
      el.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter' || ev.key === ' '){
          ev.preventDefault();
          el.click();
        }
      });
    });
