// login.js — client-side behavior for login page
document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-msg');
  const pass = document.getElementById('login-password');
  const toggle = document.querySelector('.password-toggle');

  function setMsg(text, ok){ msg.textContent = text; msg.style.color = ok ? 'green' : '#b00020'; }

  if (toggle && pass) {
    toggle.addEventListener('click', function(){
      if (pass.type === 'password') { pass.type = 'text'; toggle.textContent = 'Hide'; }
      else { pass.type = 'password'; toggle.textContent = 'Show'; }
      pass.focus();
    });
  }

  form.addEventListener('submit', function(e){
    e.preventDefault(); msg.textContent = '';
    const data = new FormData(form);
    const email = (data.get('email')||'').trim();
    const password = data.get('password')||'';
    if (!email || !password) { setMsg('Please provide email and password.', false); return; }
  if (password === 'demo') { setMsg('Login successful (demo). Redirecting...', true); setTimeout(()=> window.location='Index.htm',800); }
    else { setMsg('Invalid credentials (demo). Try password: demo', false); }
  });
});
