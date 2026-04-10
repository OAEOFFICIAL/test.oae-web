// UI Rendering and Modal Helpers

function createModal(id, title, html, confirmText='OK', cancelText='Cancel'){
  removeModal(id);
  const overlay = document.createElement('div');
  overlay.id = id; overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999';
  const box = document.createElement('div'); box.style.cssText='max-width:720px;width:90%;background:var(--card);padding:18px;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,0.2);color:var(--oae-dark)';
  const header = document.createElement('div'); header.innerHTML=`<h3 style="margin:0 0 8px">${title}</h3>`;
  const body = document.createElement('div'); body.innerHTML = html; body.style.marginBottom='12px';
  const actions = document.createElement('div'); actions.style.cssText='display:flex;gap:8px;justify-content:flex-end';
  const btnCancel = document.createElement('button'); btnCancel.className='btn secondary'; btnCancel.innerText=cancelText;
  const btnConfirm = document.createElement('button'); btnConfirm.className='btn'; btnConfirm.innerText=confirmText;
  actions.appendChild(btnCancel); actions.appendChild(btnConfirm);
  box.appendChild(header); box.appendChild(body); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);
  return {overlay, btnConfirm, btnCancel};
}

function removeModal(id){ const existing = document.getElementById(id); if(existing) existing.remove(); }

function showConfirm(title, html, onConfirm){
  const m = createModal('oae-modal', title, html, 'Proceed', 'Cancel');
  m.btnConfirm.addEventListener('click', ()=>{ removeModal('oae-modal'); try{ onConfirm(); }catch(e){ console.error(e); } });
  m.btnCancel.addEventListener('click', ()=>{ removeModal('oae-modal'); });
}

function lockTopicsUI() {
  document.querySelectorAll('.subject-checkbox, .topic-checkbox input, #novel-select, input[name="mode"]').forEach(el => { if (el) el.disabled = true; });
  let banner = document.getElementById('exam-locked-banner');
  if (!banner) {
    banner = document.createElement('div'); banner.id = 'exam-locked-banner';
    banner.style.cssText = 'background:#fff3cd;padding:10px;border:1px solid #ffeeba;border-radius:6px;margin:10px 0;font-weight:600';
    banner.innerHTML = 'Topics locked for this exam session.';
    const form = document.getElementById('quiz-start-form'); if (form) form.prepend(banner);
  } else banner.style.display = 'block';
}

function lockExamForNetworkIssue() {
  if (typeof stopHeartbeat === 'function') stopHeartbeat();
  if (window.Quiz) window.Quiz.stopTimer();
  document.getElementById('quiz-container').querySelectorAll('button, input, select').forEach(el=> el.disabled = true);
  if (typeof sendSecurityEvent === 'function') sendSecurityEvent('network-lock', { message: 'Heartbeat failed. Exam locked due to network interruption.' });
  const container = document.getElementById('quiz-container');
  const lockMsg = document.createElement('div'); lockMsg.style.cssText='padding:12px;background:#fff1f0;border:1px solid #ffd6d6;border-radius:8px;margin:12px 0;';
  lockMsg.innerHTML = '<strong>Network lost — exam locked.</strong> Your session has been flagged and sent for review. Contact support.';
  container.prepend(lockMsg);
  try { 
    if(window.Quiz && window.Quiz.sessionJWT) {
      fetch(`${API_BASE_URL}/exam/finish?terminated=true`, { method: 'POST', headers: { 'Authorization': 'Bearer '+window.Quiz.sessionJWT }}).catch(()=>{}); 
    }
  } catch(e){}
}

function renderQuizUI() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';
  const Quiz = window.Quiz;

  const totalQuestions = Object.values(Quiz.perSubjectQuestions).reduce((s, arr) => s + arr.length, 0);
  if (totalQuestions === 0) {
    container.innerHTML = '<p class="note">No questions available. Check your selection.</p>';
    return;
  }

  const header = document.createElement('div'); header.className = 'quiz-header';
  header.innerHTML = `
    <div>
      <div class="quiz-title">Smart Quiz Arena</div>
      <div class="small">Mode: ${Quiz.mode === 'exam' ? 'Exam (1h45m - Strict)' : 'Study (Flexible)'}</div>
    </div>
    <div class="timer" id="timer-display">0m 0s</div>
  `;
  container.appendChild(header);

  const tabs = document.createElement('div'); tabs.style.cssText = 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap';
  Quiz.chosenSubjects.forEach(s => {
    const count = (Quiz.perSubjectQuestions[s] || []).length;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn-nav';
    btn.innerText = `${s.toUpperCase()} (${count})`;
    btn.dataset.sub = s;
    btn.style.fontWeight = '800';
    btn.addEventListener('click', () => { Quiz.currentSubject = s; renderSubjectQuestions(s); updateNavigationButtons(s); });
    tabs.appendChild(btn);
  });
  container.appendChild(tabs);

  const progWrap = document.createElement('div'); progWrap.style.margin = '12px 0';
  progWrap.innerHTML = `<div class="progress" id="progress-bar"><i style="width:0%"></i></div>`;
  container.appendChild(progWrap);

  const subjArea = document.createElement('div'); subjArea.id = 'subject-area'; container.appendChild(subjArea);

  const navWrap = document.createElement('div'); navWrap.id = 'global-nav'; navWrap.style.marginTop = '12px'; container.appendChild(navWrap);

  const footer = document.createElement('div'); footer.className = 'footer-bar'; footer.style.marginTop = '12px';
  const reviewBtn = Quiz.mode === 'study' ? '<button class="btn secondary" id="review-btn">Toggle Explanations</button>' : '';
  footer.innerHTML = `
    <div>
      <button class="btn" id="submit-btn">Submit Quiz</button>
      ${reviewBtn}
    </div>
    <div id="score-box" class="small">Answered: 0/${totalQuestions}</div>
  `;
  container.appendChild(footer);

  document.getElementById('submit-btn').addEventListener('click', () => {
    const msg = Quiz.mode === 'exam' ?
      '<p>You are about to submit your exam. Submission is final and you will not be able to review or change answers during the exam. Are you sure you want to proceed?</p>' :
      '<p>Submit your answers? You can review explanations in study mode after submission.</p>';
    showConfirm('Confirm Submission', msg, () => { if(typeof finishQuiz === 'function') finishQuiz(); });
  });
  if (Quiz.mode === 'study') {
    const rb = document.getElementById('review-btn'); if (rb) rb.addEventListener('click', toggleReview);
  }

  renderSubjectQuestions(Quiz.currentSubject);
  updateNavigationButtons(Quiz.currentSubject);
  updateProgressBar();
  if(Quiz.secondsLeft) updateTimerDisplay(Quiz.secondsLeft);
}

function renderSubjectQuestions(subject) {
  const Quiz = window.Quiz;
  const subjArea = document.getElementById('subject-area'); subjArea.innerHTML = '';
  const list = Quiz.perSubjectQuestions[subject] || [];

  if (subject === 'english') {
    const compQuestions = list.filter(q => q && (q.passage || q.passageTitle));
    const firstWithPassage = compQuestions[0] || null;
    const passageYear = firstWithPassage ? (firstWithPassage.year || '') : null;
    const passageText = firstWithPassage ? (firstWithPassage.passage || '') : '';
    const compCount = compQuestions.length;
    
    if (passageYear && passageText && compCount > 0) {
      const instructionBanner = document.createElement('div');
      instructionBanner.style.cssText = 'padding:10px;margin-bottom:12px;background:rgba(111,214,200,0.15);border-left:4px solid var(--oae-green);border-radius:4px;';
      instructionBanner.innerHTML = `<div class="small"><strong>Use the passage below to answer questions 1–${compCount}</strong></div>`;
      subjArea.appendChild(instructionBanner);
      
      const passPanel = document.createElement('div'); passPanel.className = 'passage-panel';
      passPanel.style.cssText = 'margin-bottom:12px;padding:10px;border-radius:6px;background:var(--card);border:1px solid rgba(0,0,0,0.04)';
      passPanel.innerHTML = `<div class="small" style="font-weight:700;margin-bottom:6px">${passageYear}</div>`;

      // Render as DOM instead of canvas to ensure accessibility.
      // We apply user-select:none to deter casual copying, but allow screen readers to access the text.
      const p = document.createElement('div'); p.className = 'passage-text'; 
      p.style.cssText = 'white-space:pre-wrap;line-height:1.5;color:var(--oae-dark);padding:6px;margin-top:6px;'; 
      if (Quiz.mode === 'exam') {
        p.style.userSelect = 'none'; // Basic copy protection
        p.style.webkitUserSelect = 'none';
        p.oncontextmenu = (e)=>{ e.preventDefault(); if(typeof sendSecurityEvent==='function') sendSecurityEvent('contextmenu', { subject, passageYear }); };
      }
      p.innerText = passageText;
      
      // Invisible watermark overlay for security tracking
      if (Quiz.mode === 'exam') {
        const wm = (Quiz.session && Quiz.session.userId) ? `ID:${Quiz.session.userId}` : `User:${location.hostname}`;
        const watermark = document.createElement('div');
        watermark.innerText = wm;
        watermark.style.cssText = 'position:absolute; opacity:0.02; pointer-events:none; left:10px; top:10px; font-size:18px; transform:rotate(-15deg); user-select:none; z-index:1;';
        passPanel.style.position = 'relative';
        passPanel.appendChild(watermark);
      }

      passPanel.appendChild(p);
      subjArea.appendChild(passPanel);
    }
  }

  const qContainer = document.createElement('div'); qContainer.id = `questions-${subject}`;
  qContainer.style.cssText = 'max-height: 560px; overflow-y:auto; padding:8px; border-radius:6px;';
  subjArea.appendChild(qContainer);

  list.forEach((q, idx) => {
    const card = document.createElement('div'); card.id = `question-${subject}-${idx}`; card.className = 'question-card';
    const headerDiv = document.createElement('div'); headerDiv.className = 'small';
    const gIdx = (typeof Quiz.getGlobalIndex === 'function') ? Quiz.getGlobalIndex(subject, idx) : -1;
    const globalNum = (gIdx >= 0) ? (gIdx + 1) : (idx + 1);
    headerDiv.innerHTML = `<strong>${subject.toUpperCase()} Q${globalNum}</strong> <span class="small muted">(${q.year || 'N/A'})</span>`;
    card.appendChild(headerDiv);

    const questionWrap = document.createElement('div'); questionWrap.style.marginTop = '8px';
    const p = document.createElement('div'); p.style.cssText = 'padding:8px;background:rgba(0,0,0,0.02);border-radius:4px;line-height:1.5;';
    
    // In exam mode, add lightweight deterrence CSS
    if (Quiz.mode === 'exam') {
      p.style.userSelect = 'none';
      p.style.webkitUserSelect = 'none';
      questionWrap.oncontextmenu = (e)=>{ e.preventDefault(); if(typeof sendSecurityEvent==='function') sendSecurityEvent('contextmenu', { subject, idx }); };
    }
    p.innerHTML = `<strong>${q.question}</strong>`; 
    questionWrap.appendChild(p);
    card.appendChild(questionWrap);

    const optsDiv = document.createElement('div'); optsDiv.className = 'options'; optsDiv.id = `opts-${subject}-${idx}`;
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button'); btn.className = 'option'; btn.type = 'button';
      btn.dataset.sub = subject; btn.dataset.local = idx; btn.dataset.opt = i;
      const letter = String.fromCharCode(65 + i);
      btn.innerText = `${letter}. ${opt}`;
      btn.addEventListener('click', (e) => { Quiz.selectOption(subject, idx, i, e.currentTarget); });
      optsDiv.appendChild(btn);
    });
    card.appendChild(optsDiv);

    const exBlock = document.createElement('div'); exBlock.className = 'small'; exBlock.id = `ex-${subject}-${idx}`; exBlock.style.cssText = 'margin-top:8px; color:#666; padding:8px; background:rgba(0,0,0,0.02); border-radius:6px; display:none;';
    exBlock.innerHTML = `<strong>Explanation:</strong> ${q.explanation || 'Explanation unavailable'}`;
    card.appendChild(exBlock);

    qContainer.appendChild(card);
  });

  const navWrap = document.getElementById('global-nav'); navWrap.innerHTML = '';
  const navTitle = document.createElement('div'); navTitle.className = 'small'; navTitle.innerHTML = `<strong>Jump to ${subject.toUpperCase()} question</strong>`; navWrap.appendChild(navTitle);
  const navGrid = document.createElement('div'); navGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(36px,1fr));gap:6px;margin-top:8px;';
  list.forEach((q, idx) => {
    const nbtn = document.createElement('button'); nbtn.type = 'button'; nbtn.className = 'btn-nav'; nbtn.id = `nav-${subject}-${idx}`; nbtn.innerText = idx+1;
    nbtn.addEventListener('click', () => { Quiz.jumpTo(subject, idx); });
    navGrid.appendChild(nbtn);
  });
  navWrap.appendChild(navGrid);
}

function updateNavigationButtons(subject) {
  const Quiz = window.Quiz;
  const list = Quiz.perSubjectQuestions[subject] || [];
  list.forEach((q, idx) => {
    const btn = document.getElementById(`nav-${subject}-${idx}`);
    const key = `${subject}:${idx}`;
    if (btn) {
      if (Quiz.answers[key] !== undefined) { btn.style.background = 'rgba(111,214,200,0.3)'; btn.style.borderColor = 'var(--oae-green)'; }
      else { btn.style.background = 'transparent'; btn.style.borderColor = 'rgba(0,0,0,0.1)'; }
    }
  });
  Array.from(document.querySelectorAll('button[data-sub]')).forEach(t => { t.style.opacity = (t.dataset.sub === subject) ? '1' : '0.7'; });
}

function updateTimerDisplay(sec) { const el = document.getElementById('timer-display'); if (!el) return; const m = Math.floor(sec/60); const s = sec%60; el.innerText = `${m}m ${s}s`; }

function updateProgressBar() {
  const Quiz = window.Quiz;
  const total = Object.values(Quiz.perSubjectQuestions).reduce((s, a) => s + a.length, 0);
  const answered = Object.keys(Quiz.answers).length;
  const pct = total ? Math.round((answered/total)*100) : 0;
  const bar = document.querySelector('#progress-bar > i'); if (bar) bar.style.width = pct + '%';
  const scoreBox = document.getElementById('score-box'); if (scoreBox) scoreBox.innerText = `Answered: ${answered}/${total}`;
}

function renderFinishScreen(scores) {
  const container = document.getElementById('quiz-container'); container.innerHTML = '';
  const Quiz = window.Quiz;
  const resultHeader = document.createElement('div'); resultHeader.className='quiz-wrap'; resultHeader.innerHTML = `<div class="center"><h2 style="color: var(--oae-dark);">Quiz Submitted</h2><p class="small">Your performance across all questions:</p></div>`; container.appendChild(resultHeader);

  const scoreWrap = document.createElement('div'); scoreWrap.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:12px 0;';
  scoreWrap.innerHTML = `
    <div class="score-card"><div class="score-label">Percentage</div><div class="score-value">${scores.percent}%</div><div class="score-detail">${scores.correct}/${scores.total}</div></div>
    <div class="score-card"><div class="score-label">Out of 400</div><div class="score-value">${scores.over400}</div><div class="score-detail">Scaled score</div></div>
    <div class="score-card"><div class="score-label">Out of 180</div><div class="score-value">${scores.over180}</div><div class="score-detail">Alternative scale</div></div>
  `;
  container.appendChild(scoreWrap);

  const detailWrap = document.createElement('div'); detailWrap.className='quiz-wrap'; detailWrap.innerHTML = `<h3 style="color: var(--oae-dark);">Detailed Results</h3><div id="results-detail"></div>`; container.appendChild(detailWrap);
  const detailDiv = detailWrap.querySelector('#results-detail');

  Quiz.chosenSubjects.forEach(subject => {
    const list = Quiz.perSubjectQuestions[subject] || [];
    const correctCount = list.reduce((c, q, i) => { const key = `${subject}:${i}`; return c + ((Quiz.answers[key] !== undefined && Quiz.answers[key] === q.answer) ? 1 : 0); }, 0);
    const subjectSec = document.createElement('div'); subjectSec.style.cssText='margin-bottom:16px;padding:12px;background:rgba(0,0,0,0.01);border-radius:8px;border-left:4px solid var(--oae-green);';
    subjectSec.innerHTML = `<strong>${subject.toUpperCase()}</strong> <span class="small" style="color:var(--muted);">${correctCount}/${list.length} correct</span>`;

    const qList = document.createElement('div'); qList.style.marginTop = '8px';
    list.forEach((q, idx) => {
      const key = `${subject}:${idx}`;
      const userAns = Quiz.answers[key];
      const isCorrect = (userAns !== undefined && userAns === q.answer);
      const row = document.createElement('div');
      row.style.cssText = `padding:10px;margin:4px 0;border-radius:4px;background:${isCorrect ? 'rgba(134,237,193,0.12)' : 'rgba(255,200,200,0.08)'};border-left:3px solid ${isCorrect ? '#4ec398' : '#ff7777'};`;
      const userAnsText = (userAns !== undefined && q.options[userAns]!==undefined) ? `${String.fromCharCode(65+userAns)}. ${q.options[userAns]}` : 'Not answered';
      const correctText = (q.answer !== undefined && q.options[q.answer]!==undefined) ? `${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}` : 'N/A';
      row.innerHTML = `
        <div class="small"><strong>${subject.toUpperCase()} Q${idx+1}:</strong> ${q.question}</div>
        <div class="small" style="margin-top:6px;">Your answer: <strong>${userAnsText}</strong></div>
        <div class="small" style="margin-top:4px;">Correct answer: <strong>${correctText}</strong></div>
        <div class="small" style="margin-top:6px;padding:6px;background:rgba(0,0,0,0.04);border-radius:4px;color:var(--muted);"><strong>Explanation:</strong> ${q.explanation || 'No explanation available.'}</div>
      `;
      if (q.learn_more_url) {
        const notesDiv = document.createElement('div'); notesDiv.style.cssText = 'margin-top:8px;';
        notesDiv.innerHTML = `<a class='btn small' href='${q.learn_more_url}' target='_blank'>📖 Visit notes</a>`;
        row.appendChild(notesDiv);
      }
      qList.appendChild(row);
    });
    subjectSec.appendChild(qList);
    detailDiv.appendChild(subjectSec);
  });

  const finalFooter = document.createElement('div'); finalFooter.className='footer-bar'; finalFooter.style.marginTop='16px'; finalFooter.innerHTML = `<button class="btn" id="restart-btn">Start New Quiz</button> <button class="btn secondary" id="back-btn">Back to Home</button>`; container.appendChild(finalFooter);
  document.getElementById('restart-btn').addEventListener('click', () => location.reload());
  document.getElementById('back-btn').addEventListener('click', () => location.href = '../Index.htm');
}

function toggleReview() {
  const Quiz = window.Quiz;
  if (Quiz.mode !== 'study') return;
  const subject = Quiz.currentSubject;
  const list = Quiz.perSubjectQuestions[subject] || [];
  list.forEach((q, idx) => {
    const ex = document.getElementById(`ex-${subject}-${idx}`);
    if (ex) ex.style.display = (ex.style.display === 'block') ? 'none' : 'block';
  });
}
