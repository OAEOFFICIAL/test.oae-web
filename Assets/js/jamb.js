// JAMB page interactions: simple search/filter and accordion expansion

document.addEventListener('DOMContentLoaded', function(){
  const search = document.getElementById('jamb-search');
  const grid = document.querySelector('.jamb-grid');
  if(!grid) return;

  // simple client-side filter
  function filter(q){
    q = (q||"").trim().toLowerCase();
    const items = grid.querySelectorAll('.feature');
    let visible = 0;
    items.forEach(item=>{
      const text = (item.innerText||'').toLowerCase();
      const match = q === '' || text.indexOf(q) !== -1;
      item.style.display = match ? '' : 'none';
      if(match) visible++;
    });
    const empty = document.querySelector('.jamb-empty');
    if(empty) empty.style.display = visible ? 'none' : '';
  }

  if(search){
    search.addEventListener('input', e=>filter(e.target.value));
  }

  // accordion toggle for feature cards
  grid.addEventListener('click', function(e){
    const card = e.target.closest('.feature');
    if(!card) return;
    // toggle only when clicking header or a 'more' button
    if(e.target.closest('h3') || e.target.classList.contains('toggle-more')){
      card.classList.toggle('expanded');
    }
  });

  // keyboard support for toggles
  grid.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){
      const card = e.target.closest('.feature');
      if(card){
        card.classList.toggle('expanded');
        e.preventDefault();
      }
    }
  });

  // Expose small API for tests
  window.__jamb_filter = filter;
});
