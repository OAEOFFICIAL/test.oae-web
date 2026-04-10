// API and Security Utilities
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:4000/api' : '/api';

async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error('Failed to load ' + path);
  return r.json();
}

async function sendSecurityEvent(eventType, details) {
  try {
    const payload = { type: eventType, details: details || {}, ts: Date.now() };
    const headers = { 'Content-Type': 'application/json' };
    if (window.Quiz && window.Quiz.sessionJWT) headers['Authorization'] = 'Bearer ' + window.Quiz.sessionJWT;
    await fetch(`${API_BASE_URL}/exam/security/event`, { method: 'POST', headers, body: JSON.stringify(payload) }).catch(()=>{});
  } catch (e) { console.warn('security event failed', e); }
}

function startHeartbeat() {
  stopHeartbeat();
  if (!window.Quiz) return;
  window.Quiz.heartbeatFailures = 0;
  if (!window.Quiz.sessionJWT) return;
  window.Quiz.heartbeatTimer = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/exam/heartbeat`, { method: 'GET', headers: { 'Authorization': 'Bearer '+window.Quiz.sessionJWT } });
      if (!res.ok) throw new Error('heartbeat failed');
      window.Quiz.heartbeatFailures = 0;
    } catch (e) {
      window.Quiz.heartbeatFailures++;
      sendSecurityEvent('heartbeat-failure', { count: window.Quiz.heartbeatFailures });
      // Policy A: after 3 consecutive failures, lock exam
      if (window.Quiz.heartbeatFailures >= 3 && typeof lockExamForNetworkIssue === 'function') {
        lockExamForNetworkIssue();
      }
    }
  }, 10000);
}

function stopHeartbeat() {
  if (window.Quiz && window.Quiz.heartbeatTimer) { 
    clearInterval(window.Quiz.heartbeatTimer); 
    window.Quiz.heartbeatTimer = null; 
  }
}

// detect and report copy/context/devtools/visibility
function bindSecurityListeners() {
  document.addEventListener('copy', (e) => { 
    e.preventDefault(); 
    try { navigator.clipboard && navigator.clipboard.writeText(''); } catch(ex){} 
    sendSecurityEvent('copy', { url: location.href }); 
  });
  document.addEventListener('contextmenu', (e) => { 
    if (window.Quiz && window.Quiz.mode === 'exam') {
      e.preventDefault(); 
      sendSecurityEvent('contextmenu', { x: e.clientX, y: e.clientY });
    }
  });
  document.addEventListener('visibilitychange', () => { 
    sendSecurityEvent('visibility', { visible: document.visibilityState }); 
  });
  // naive devtools detection via key presses
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ) {
      sendSecurityEvent('devtools-open', { key: e.key });
    }
  });
}
