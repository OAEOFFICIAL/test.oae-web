// Advanced JAMB Quiz Engine (Core Logic & State)

window.Quiz = {
  subjectsData: {},           
  chosenSubjects: [],        
  perSubjectQuestions: {},   
  answers: {},               
  currentSubject: null,      
  timer: null,
  secondsLeft: 0,
  mode: 'study',
  isSubmitted: false,
  sessionJWT: null,
  session: null, 
  heartbeatTimer: null,
  heartbeatFailures: 0,

  async buildFromSelection(selection) {
    this.chosenSubjects = selection.subjects;
    this.mode = selection.mode;
    this.examType = selection.examType || 'JAMB';
    this.quizType = selection.quizType || 'exam';
    this.selectedTopics = selection.topics || {}; 
    this.selectedNovel = selection.novel || null; 
    this.perSubjectQuestions = {};
    this.answers = {};
    this.currentSubject = this.chosenSubjects[0] || null;
    this.isSubmitted = false;

    if (this.mode === 'exam' && this.session && this.session.payload) {
      try {
        const payload = this.session.payload;
        if (payload.perSubjectQuestions) {
          for (const s of this.chosenSubjects) {
            const list = payload.perSubjectQuestions[s] || [];
            this.perSubjectQuestions[s] = list.map(q => ({ ...q, subject: s }));
          }
        } else if (payload.passages) {
          payload.passages.forEach(p => {
            const subject = p.subject || 'english';
            this.perSubjectQuestions[subject] = this.perSubjectQuestions[subject] || [];
            const mapped = (p.questions || []).map(q => ({ ...q, subject }));
            this.perSubjectQuestions[subject] = this.perSubjectQuestions[subject].concat(mapped);
          });
        }
      } catch (e) {
        console.warn('Failed to initialize from server payload', e);
      }
    } else {
      const promises = this.chosenSubjects.map(async s => {
        if (this.subjectsData[s]) return this.subjectsData[s];

        try {
          const topics = this.selectedTopics[s] || [];
          const topicsParam = topics.length > 0 ? `&topics=${encodeURIComponent(topics.join(','))}` : '';
          const novelParam = this.selectedNovel ? `&novel=${encodeURIComponent(this.selectedNovel)}` : '';
          const examTypeParam = this.examType ? `&examType=${encodeURIComponent(this.examType)}` : '';
          const quizTypeParam = this.quizType ? `&quizType=${encodeURIComponent(this.quizType)}` : '';
          
          const response = await fetch(`${API_BASE_URL}/questions?subject=${s}${examTypeParam}${quizTypeParam}${topicsParam}${novelParam}&mode=study`);

          if (response.ok) {
            const data = await response.json();
            this.subjectsData[s] = { questions: data.questions };
            return { questions: data.questions };
          }
        } catch (apiError) {
          console.warn(`API unavailable for ${s}, falling back to local loading`, apiError);
        }

        try {
          // Uses loadJSON from quiz-api.js
          const data = await loadJSON(`data/${s}.json`);
          this.subjectsData[s] = data;
          return data;
        } catch (localError) {
          console.error(`Failed to load ${s} from both API and local`, localError);
          return { questions: [] };
        }
      });

      const results = await Promise.all(promises);

      for (let i = 0; i < this.chosenSubjects.length; i++) {
        const s = this.chosenSubjects[i];
        const data = results[i] || { questions: [] };
        const required = (s === 'english') ? 60 : 40;

        let questionsToUse = (data.questions || []).slice();

        if (questionsToUse.length > required) {
          const topicsForSubject = this.selectedTopics[s] || [];
          if (topicsForSubject.length > 0) {
            questionsToUse = questionsToUse.filter(q => topicsForSubject.includes(q.topic));
          }
          const shuffled = questionsToUse.slice().sort(() => Math.random() - 0.5);
          questionsToUse = shuffled.slice(0, required);
        }

        this.perSubjectQuestions[s] = questionsToUse.map(q => ({ ...q, subject: s }));
      }
    }

    if (this.mode === 'exam' && this.perSubjectQuestions['english']) {
      this.perSubjectQuestions['english'] = this.perSubjectQuestions['english'].slice().sort((a,b) => {
        const orderVal = (t) => (t && t.toLowerCase && t.toLowerCase().includes('novel')) ? 2 : 1;
        return orderVal(a.type) - orderVal(b.type);
      });
    }

    this.globalOrder = [];
    for (const subj of this.chosenSubjects) {
      const list = this.perSubjectQuestions[subj] || [];
      for (let i = 0; i < list.length; i++) {
        this.globalOrder.push({ subject: subj, localIndex: i });
      }
    }

    this.getGlobalIndex = function(subject, localIndex) {
      for (let i = 0; i < this.globalOrder.length; i++) {
        const e = this.globalOrder[i];
        if (e.subject === subject && e.localIndex === localIndex) return i;
      }
      return -1;
    };

    if (this.mode === 'exam') this.secondsLeft = 105 * 60; else this.secondsLeft = (selection.studySeconds || 30) * 60;

    // renderQuizUI from quiz-ui.js
    if (typeof renderQuizUI === 'function') renderQuizUI();
    this.startTimer();
  },

  startTimer() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.secondsLeft--;
      if (typeof updateTimerDisplay === 'function') updateTimerDisplay(this.secondsLeft);
      if (this.secondsLeft <= 0) { 
        clearInterval(this.timer); 
        this.finishQuiz(); 
      }
    }, 1000);
  },

  stopTimer() { clearInterval(this.timer); },

  selectOption(subject, localIndex, optIndex, el) {
    if (this.isSubmitted) return; 
    const key = `${subject}:${localIndex}`;
    this.answers[key] = optIndex;
    
    const opts = document.querySelectorAll(`.option[data-sub="${subject}"][data-local="${localIndex}"]`);
    opts.forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    
    if (typeof updateProgressBar === 'function') updateProgressBar();
    if (typeof updateNavigationButtons === 'function') updateNavigationButtons(subject);
    
    const q = (this.perSubjectQuestions[subject] || [])[localIndex];
    if (this.mode === 'study') {
      const ex = document.getElementById(`ex-${subject}-${localIndex}`);
      if (ex) {
        const userAns = optIndex;
        const correct = q && q.answer !== undefined ? q.answer : null;
        if (userAns !== null && correct !== null) {
          const isCorrect = userAns === correct;
          ex.style.display = 'block';
          const learnUrl = (q && q.learn_more_url) ? q.learn_more_url : (`../Syllabus/notes/${(q && q.topicSlug) ? q.topicSlug : 'general'}.htm`);
          ex.innerHTML = `<strong>${isCorrect ? 'Correct' : 'Incorrect'}</strong> — <div style="margin-top:6px">${q.explanation || 'No explanation available.'}</div><div style="margin-top:8px"><a class='btn small' href='${learnUrl}' target='_blank'>Visit notes</a></div>`;
        }
      }
    }

    if (this.mode === 'exam' && this.sessionJWT) {
      const payload = { questionId: q && q.id, answer: optIndex, ts: Date.now() };
      fetch(`${API_BASE_URL}/exam/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+this.sessionJWT }, body: JSON.stringify(payload) })
        .then(r => r.json())
        .then(res => {
          if (res && res.status === 'rejected') {
            if (typeof sendSecurityEvent === 'function') sendSecurityEvent('answer-rejected', { reason: res.reason, questionId: payload.questionId });
            if (typeof lockExamForNetworkIssue === 'function') lockExamForNetworkIssue();
          }
        }).catch(err => { 
          if(typeof sendSecurityEvent === 'function') sendSecurityEvent('answer-submit-failed', { error: String(err) }); 
        });
    }
  },

  jumpTo(subject, localIndex) {
    this.currentSubject = subject;
    if (typeof renderSubjectQuestions === 'function') renderSubjectQuestions(subject);
    const el = document.getElementById(`question-${subject}-${localIndex}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  calculateScores() {
    let correct = 0; let total = 0;
    for (const s of this.chosenSubjects) {
      const list = this.perSubjectQuestions[s] || [];
      total += list.length;
      list.forEach((q, i) => {
        const key = `${s}:${i}`;
        if (this.answers[key] !== undefined && this.answers[key] === q.answer) correct++;
      });
    }
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const over400 = total ? Math.round((correct / total) * 400) : 0;
    const over180 = total ? Math.round((correct / total) * 180) : 0;
    return { correct, total, percent, over400, over180 };
  },

  finishQuiz() {
    this.stopTimer(); 
    this.isSubmitted = true;
    
    if (this.mode === 'exam' && this.sessionJWT) {
      const payload = { answers: this.answers, ts: Date.now() };
      fetch(`${API_BASE_URL}/exam/finish`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+this.sessionJWT }, body: JSON.stringify(payload) })
        .then(r => r.json())
        .then(data => {
          const scores = data && data.scores ? data.scores : this.calculateScores();
          if (typeof renderFinishScreen === 'function') renderFinishScreen(scores);
        }).catch(err => {
          console.error('Finish request failed, using local calc', err);
          const scores = this.calculateScores(); 
          if (typeof renderFinishScreen === 'function') renderFinishScreen(scores);
        });
      return;
    }
  
    const scores = this.calculateScores();
    const container = document.getElementById('quiz-container'); 
    if(container) container.innerHTML = '';
    if (typeof renderFinishScreen === 'function') renderFinishScreen(scores);
  }
};

window.startFromForm = async function() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const examType = document.querySelector('input[name="examType"]:checked').value;
  const quizType = document.querySelector('input[name="quizType"]:checked').value;
  
  const selectedSubjects = Array.from(document.querySelectorAll('.subject-checkbox:checked')).map(cb => cb.value);
  
  const selectedTopics = {};
  selectedSubjects.forEach(subject => {
    const topicsForSubject = Array.from(document.querySelectorAll(`.topic-checkbox[data-subject="${subject}"] input:checked`)).map(input => input.value);
    if (topicsForSubject.length > 0) {
      selectedTopics[subject] = topicsForSubject;
    }
  });

  if (selectedSubjects.length === 0 || Object.keys(selectedTopics).length === 0) {
    alert('Please select at least one subject and choose topics for it.');
    return;
  }

  if (mode === 'exam') {
    if (selectedSubjects.length < 4) {
      alert('Exam mode requires exactly 4 subjects: English + 3 additional subjects.');
      return;
    }
    if (selectedSubjects.length > 4) {
      alert('Exam mode allows maximum 4 subjects only.');
      return;
    }
    if (!selectedSubjects.includes('english')) {
      alert('English is mandatory in Exam Mode.');
      return;
    }
  }

  const studyMinutes = parseInt(document.getElementById('study-minutes').value || 30, 10);
  const novelEl = document.getElementById('novel-select');
  if (selectedSubjects.includes('english')) {
    const engTopics = selectedTopics['english'] || [];
    if (engTopics.includes('Prescribed Novel Extracts')) {
      const chosenNovel = novelEl ? novelEl.value : '';
      if (!chosenNovel) {
        alert('You selected Prescribed Novel Extracts for English. Please choose a novel from the dropdown.');
        return;
      }
    }
  }
  const selection = { 
    subjects: selectedSubjects, 
    mode: mode, 
    examType: examType,
    quizType: quizType,
    topics: selectedTopics,
    studySeconds: studyMinutes,
    novel: (novelEl ? novelEl.value : null)
  };

  const form = document.getElementById('quiz-start-form');
  if (form) form.hidden = true; 
  
  const cont = document.getElementById('quiz-container');
  if (cont) cont.innerHTML = '';
  
  try {
    if (mode === 'exam') {
      try {
        const res = await fetch(`${API_BASE_URL}/exam/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selection) });
        if (res.ok) {
          const json = await res.json();
          window.Quiz.sessionJWT = json.jwt || null;
          window.Quiz.session = json || null;
          
          if(typeof lockTopicsUI === 'function') lockTopicsUI();
          if(typeof bindSecurityListeners === 'function') bindSecurityListeners();
          if(typeof startHeartbeat === 'function') startHeartbeat();
        } else {
          console.warn('Server start failed, falling back to local mode');
        }
      } catch (e) { console.warn('Could not reach /api/exam/start, falling back to local', e); }
    }

    await window.Quiz.buildFromSelection(selection);

    if (mode === 'exam' && typeof lockTopicsUI === 'function') lockTopicsUI();

  } catch (err) {
    console.error('Error building quiz:', err);
    if(cont) cont.innerHTML = `<p class="note" style="color:red">Error: ${err.message}</p>`;
  }
};
