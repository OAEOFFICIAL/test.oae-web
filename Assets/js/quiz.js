// Department navigation (adjust routes as needed)
    function goDept(slug){
      const route = '/quizzes/department/' + encodeURIComponent(slug);
      window.location.href = route;
    }

    // Subject / CTA click handling (graceful fallback if data-subject present)
    document.addEventListener('click', function(e){
      const t = e.target.closest('a.btn');
      if(!t) return;

      // data-subject attribute -> custom route
      const subject = t.getAttribute('data-subject');
      if(subject){
        e.preventDefault();
        const slug = subject.toString().trim().toLowerCase().replace(/\s+/g,'-');
        window.location.href = '/quizzes/subject/' + encodeURIComponent(slug);
        return;
      }

      // data-exam -> allow default href or custom handling
      const exam = t.getAttribute('data-exam');
      if(exam){
        // allow default navigation for now
        return;
      }

      // data-action=start -> allow
    });

    // Make department cards keyboard-accessible (Enter/Space)
    document.querySelectorAll('.dept').forEach(function(el){
      el.addEventListener('keydown', function(ev){
        if(ev.key === 'Enter' || ev.key === ' '){
          ev.preventDefault();
          el.click();
        }
      });
    });