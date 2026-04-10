/**
 * OAE Quiz Core Engine
 * Handles state, timer, scoring, and question logic.
 * Does NOT manipulate the DOM.
 */

class QuizEngine {
  constructor(config) {
    this.config = {
      mode: config.mode || 'exam',           // 'exam', 'quiz', 'study'
      subjects: config.subjects || [],        // Array of subject objects with questions
      totalQuestions: config.totalQuestions || 180,
      timeLimit: config.timeLimit || 105,     // minutes (1h45m = 105)
      shuffleOptions: config.shuffleOptions !== false,
      allowHints: config.allowHints || false,
      allowSkip: config.allowSkip !== false,
      examType: config.examType || 'JAMB'
    };

    // Core state
    this.questions = [];               // Flat array of all questions for the session
    this.currentIndex = 0;
    this.userAnswers = new Map();      // questionId -> selectedOptionIndex
    this.visitedQuestions = new Set();
    this.startTime = null;
    this.endTime = null;
    this.paused = false;
    this.remainingSeconds = this.config.timeLimit * 60;
    this.timerInterval = null;
    this.completed = false;
    
    // Callbacks (set by UI layer)
    this.onTimerTick = null;           // (remainingSeconds, formattedTime) => {}
    this.onTimerEnd = null;            // () => {}
    this.onQuestionChange = null;      // (question, index, total) => {}
    this.onQuizComplete = null;        // (results) => {}
    this.onStateSave = null;           // (state) => {}
  }

  /**
   * Initialize the quiz with prepared questions
   */
  initialize(questions) {
    this.questions = this.prepareQuestions(questions);
    this.currentIndex = 0;
    this.userAnswers.clear();
    this.visitedQuestions.clear();
    this.completed = false;
    this.paused = false;
    this.remainingSeconds = this.config.timeLimit * 60;
  }

  /**
   * Shuffle options and normalize question structure
   */
  prepareQuestions(questions) {
  return questions
    .filter(q => q && Array.isArray(q.options) && q.options.length > 0)
    .map((q, idx) => {
      const originalOptions = [...q.options];
      let shuffledOptions = [...originalOptions];
      let correctAnswerIndex = q.answer;
      
      if (this.config.shuffleOptions) {
        const indexed = originalOptions.map((opt, i) => ({ opt, originalIndex: i }));
        for (let i = indexed.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
        }
        shuffledOptions = indexed.map(item => item.opt);
        correctAnswerIndex = indexed.findIndex(item => item.originalIndex === q.answer);
      }

      return {
        ...q,
        originalOptions: originalOptions,
        options: shuffledOptions,
        answer: correctAnswerIndex,
        originalAnswer: q.answer,
        questionNumber: idx + 1
      };
    });
}

  /**
   * Start the timer
   */
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.startTime = Date.now();
    this.paused = false;
    
    this.timerInterval = setInterval(() => {
      if (this.paused || this.completed) return;
      
      this.remainingSeconds--;
      
      if (this.onTimerTick) {
        this.onTimerTick(this.remainingSeconds, this.formatTime(this.remainingSeconds));
      }
      
      // Auto-submit when time reaches 0
      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 0;
        if (this.onTimerTick) {
          this.onTimerTick(0, this.formatTime(0));
        }
        this.finishQuiz();
      }
    }, 1000);
  }

  /**
   * Pause timer (for study mode breaks)
   */
  pauseTimer() {
    this.paused = true;
  }

  /**
   * Resume timer
   */
  resumeTimer() {
    this.paused = false;
  }

  /**
   * Stop timer completely
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Format seconds to HH:MM:SS or MM:SS
   */
  formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get current question
   */
  getCurrentQuestion() {
    if (this.questions.length === 0) return null;
    return this.questions[this.currentIndex];
  }

  /**
   * Navigate to specific question by index
   */
  goToQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
      this.visitedQuestions.add(index);
      if (this.onQuestionChange) {
        this.onQuestionChange(this.getCurrentQuestion(), index, this.questions.length);
      }
      return true;
    }
    return false;
  }

  /**
   * Next question
   */
  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      return this.goToQuestion(this.currentIndex + 1);
    }
    return false;
  }

  /**
   * Previous question
   */
  previousQuestion() {
    if (this.currentIndex > 0) {
      return this.goToQuestion(this.currentIndex - 1);
    }
    return false;
  }

  /**
   * Save answer for current question
   */
  saveAnswer(questionId, selectedOptionIndex) {
    this.userAnswers.set(questionId, selectedOptionIndex);
    
    // Auto-save state if callback provided
    if (this.onStateSave) {
      this.onStateSave(this.getState());
    }
  }

  /**
   * Get saved answer for a question
   */
  getAnswer(questionId) {
    return this.userAnswers.get(questionId);
  }

  /**
   * Check if current question has been answered
   */
  isCurrentQuestionAnswered() {
    const q = this.getCurrentQuestion();
    if (!q) return false;
    return this.userAnswers.has(q.id);
  }

  /**
   * Calculate results
   */
  calculateResults() {
    const subjectStats = {};
    let totalCorrect = 0;
    let totalQuestions = this.questions.length;
    let totalMarks = 0;
    let obtainedMarks = 0;

    this.questions.forEach(q => {
      const subject = q.subject || this.config.subjects[0] || 'General';
      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          total: 0,
          correct: 0,
          marksObtained: 0,
          marksTotal: 0
        };
      }
      
      subjectStats[subject].total++;
      subjectStats[subject].marksTotal += q.marks || 1;
      totalMarks += q.marks || 1;
      
      const selected = this.userAnswers.get(q.id);
      if (selected !== undefined && selected === q.answer) {
        subjectStats[subject].correct++;
        subjectStats[subject].marksObtained += q.marks || 1;
        totalCorrect++;
        obtainedMarks += q.marks || 1;
      }
    });

    // Calculate percentages per subject
    Object.keys(subjectStats).forEach(subj => {
      const stat = subjectStats[subj];
      stat.percentage = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;
    });

    const totalPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const timeTaken = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

    return {
      mode: this.config.mode,
      totalQuestions,
      totalCorrect,
      totalPercentage: Math.round(totalPercentage * 10) / 10,
      totalMarks,
      obtainedMarks,
      timeTaken,
      timeTakenFormatted: this.formatTime(timeTaken),
      subjectStats,
      questions: this.questions,
      userAnswers: Object.fromEntries(this.userAnswers),
      completed: this.completed || this.remainingSeconds === 0,
      date: new Date().toISOString()
    };
  }

  /**
   * Finish quiz (submit)
   */
  finishQuiz() {
    if (this.completed) return;
    
    this.completed = true;
    this.stopTimer();
    this.endTime = Date.now();
    
    const results = this.calculateResults();
    if (this.onQuizComplete) {
      this.onQuizComplete(results);
    }
    return results;
  }

  /**
   * Get current state for saving (e.g., to localStorage)
   */
  getState() {
    return {
      config: this.config,
      currentIndex: this.currentIndex,
      userAnswers: Array.from(this.userAnswers.entries()),
      visitedQuestions: Array.from(this.visitedQuestions),
      remainingSeconds: this.remainingSeconds,
      startTime: this.startTime,
      questions: this.questions.map(q => ({
        id: q.id,
        options: q.options,
        answer: q.answer
      }))
    };
  }

  /**
   * Restore state (e.g., from localStorage)
   */
  restoreState(savedState) {
    if (!savedState) return false;
    
    try {
      this.currentIndex = savedState.currentIndex;
      this.userAnswers = new Map(savedState.userAnswers);
      this.visitedQuestions = new Set(savedState.visitedQuestions);
      this.remainingSeconds = savedState.remainingSeconds;
      this.startTime = savedState.startTime;
      
      // Restore shuffled options mapping (we need to rebuild full questions)
      // This is handled externally by reloading original questions and reapplying state
      
      return true;
    } catch (e) {
      console.error('Failed to restore state:', e);
      return false;
    }
  }

  /**
   * Get unanswered questions count
   */
  getUnansweredCount() {
    return this.questions.filter(q => !this.userAnswers.has(q.id)).length;
  }

  /**
   * Get answered questions count
   */
  getAnsweredCount() {
    return this.userAnswers.size;
  }

  /**
   * Get question by ID
   */
  getQuestionById(id) {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Check if hint is allowed for current mode
   */
  isHintAllowed() {
    return this.config.mode !== 'exam' && this.config.allowHints;
  }

  /**
   * Check if explanation is allowed for current mode
   */
  isExplanationAllowed() {
    return this.config.mode !== 'exam';
  }
}

// Export for use in other modules (if using modules)
// For global usage:
window.QuizEngine = QuizEngine;