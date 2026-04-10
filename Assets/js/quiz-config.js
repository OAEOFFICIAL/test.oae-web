/**
 * OAE Quiz Configuration Handler
 * Manages mode switching, subject selection, and quiz start.
 */
(function() {
  const subjects = [
    { id: 'english', name: 'English', cap: 60 },
    { id: 'mathematics', name: 'Mathematics', cap: 40 },
    { id: 'physics', name: 'Physics', cap: 40 },
    { id: 'chemistry', name: 'Chemistry', cap: 40 },
    { id: 'biology', name: 'Biology', cap: 40 },
    { id: 'economics', name: 'Economics', cap: 40 },
    { id: 'accounting', name: 'Accounting', cap: 40 },
    { id: 'government', name: 'Government', cap: 40 },
    { id: 'literature', name: 'Literature', cap: 40 },
    { id: 'crs', name: 'CRS', cap: 40 }
  ];

  let currentMode = 'exam';
  const modeCards = document.querySelectorAll('.mode-card');
  const selectedModeInput = document.getElementById('selected-mode');
  const subjectContainer = document.getElementById('subject-container');
  const subjectMessage = document.getElementById('subject-message');
  const studyFilters = document.getElementById('study-filters');
  const topicFilter = document.getElementById('topic-filter');
  const yearFilter = document.getElementById('year-filter');
  const timeLimitInput = document.getElementById('time-limit');
  const allowHintsCheck = document.getElementById('allow-hints');
  const selectedSubjectsText = document.getElementById('selected-subjects-text');
  const questionCountDisplay = document.getElementById('question-count-display');
  const startBtn = document.getElementById('start-quiz-btn');

  const loader = new QuizDataLoader();

  function updateUIForMode() {
    if (currentMode === 'exam') {
      timeLimitInput.value = 105;
      timeLimitInput.disabled = true;
      allowHintsCheck.disabled = true;
      allowHintsCheck.checked = false;
      studyFilters.style.display = 'none';
      subjectMessage.textContent = 'English is required. Select exactly 3 more subjects.';
    } else if (currentMode === 'quiz') {
      timeLimitInput.disabled = false;
      timeLimitInput.value = 30;
      allowHintsCheck.disabled = false;
      studyFilters.style.display = 'none';
      subjectMessage.textContent = 'Select any combination of subjects.';
    } else {
      timeLimitInput.disabled = false;
      timeLimitInput.value = 30;
      allowHintsCheck.disabled = false;
      studyFilters.style.display = 'block';
      subjectMessage.textContent = 'Select subjects and optionally filter by topic/year.';
    }
    renderSubjects();
    updateSummary();
  }

  function renderSubjects() {
    subjectContainer.innerHTML = '';
    const selected = getSelectedSubjects();
    
    subjects.forEach(subj => {
      const isEnglishExam = (currentMode === 'exam' && subj.id === 'english');
      const isDisabled = (currentMode === 'exam' && !isEnglishExam && selected.length >= 4 && !selected.includes(subj.id));
      
      const item = document.createElement('div');
      item.className = 'subject-checkbox-item' + (isDisabled ? ' disabled' : '');
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `subj-${subj.id}`;
      checkbox.value = subj.id;
      checkbox.checked = selected.includes(subj.id);
      if (isEnglishExam) checkbox.disabled = true;
      
      const label = document.createElement('label');
      label.htmlFor = `subj-${subj.id}`;
      label.textContent = `${subj.name} (${subj.cap} Qs)`;
      
      item.appendChild(checkbox);
      item.appendChild(label);
      
      // Event listener for checkbox change
      checkbox.addEventListener('change', function(e) {
        if (currentMode === 'exam') {
          const currentSelected = getSelectedSubjects();
          if (currentSelected.length > 4) {
            this.checked = false;
            alert('Exam mode allows maximum 4 subjects (English + 3 others).');
            return;
          }
        }
        renderSubjects();  // refresh disabled states
        updateSummary();
        if (currentMode === 'study' && this.checked) {
          loadFilters();
        }
      });
      
      subjectContainer.appendChild(item);
    });
  }

  function getSelectedSubjects() {
    const checkboxes = subjectContainer.querySelectorAll('input[type="checkbox"]');
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
  }

  function updateSummary() {
    const selected = getSelectedSubjects();
    let totalQ = 0;
    selected.forEach(id => {
      const subj = subjects.find(s => s.id === id);
      if (subj) totalQ += subj.cap;
    });
    const names = selected.map(id => subjects.find(s => s.id === id)?.name || id).join(', ');
    selectedSubjectsText.textContent = names || 'None';
    questionCountDisplay.textContent = `${totalQ} questions`;
  }

  async function loadFilters() {
    const selected = getSelectedSubjects();
    if (selected.length === 0) return;
    topicFilter.disabled = false;
    yearFilter.disabled = false;
    try {
      const topics = await loader.getAvailableTopics(selected[0]);
      topicFilter.innerHTML = '<option value="">All Topics</option>';
      topics.forEach(t => topicFilter.add(new Option(t, t)));
      const years = await loader.getAvailableYears(selected[0]);
      yearFilter.innerHTML = '<option value="">All Years</option>';
      years.forEach(y => yearFilter.add(new Option(y, y)));
    } catch (e) {
      console.warn('Could not load filters', e);
    }
  }

  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentMode = card.dataset.mode;
      selectedModeInput.value = currentMode;
      updateUIForMode();
    });
  });

  startBtn.addEventListener('click', async () => {
    const selected = getSelectedSubjects();
    if (selected.length === 0) return alert('Please select at least one subject.');
    if (currentMode === 'exam' && selected.length !== 4) {
      return alert('Exam mode requires exactly 4 subjects (English + 3 others).');
    }
    
    const container = document.getElementById('quiz-container');
    container.innerHTML = `<div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i> Loading questions...</div>`;
    
    const examType = document.querySelector('input[name="examType"]:checked').value;
    const timeLimit = parseInt(timeLimitInput.value);
    const allowHints = allowHintsCheck.checked;
    const shuffle = document.getElementById('shuffle-options').checked;
    
    let filters = { examType };
    if (currentMode === 'study') {
      if (topicFilter.value) filters.topics = [topicFilter.value];
      if (yearFilter.value) filters.year = yearFilter.value;
    }
    
    try {
      let allQuestions = [];
      for (const subjId of selected) {
        const questions = await loader.loadSubject(subjId);
        let filtered = loader.filterQuestions(questions, filters);
        const cap = subjects.find(s => s.id === subjId)?.cap || 40;
        allQuestions.push(...loader.selectRandomQuestions(filtered, cap));
      }
      allQuestions = loader.shuffleArray(allQuestions);
      
      const engine = new QuizEngine({
        mode: currentMode,
        subjects: selected,
        timeLimit,
        allowHints,
        shuffleOptions: shuffle,
        examType
      });
      engine.initialize(allQuestions);
      
      const renderer = new QuizRenderer(engine, 'quiz-container');
      engine.onQuizComplete = (res) => renderer.renderResults(res);
      engine.startTimer();
      renderer.renderQuiz();
    } catch (e) {
      container.innerHTML = `<div style="color:red;padding:20px;">Error: ${e.message}</div>`;
    }
  });

  // Initialize
  updateUIForMode();
})();