/**
 * OAE Quiz Data Loader
 * Fetches subject JSON files and prepares question sets for the quiz engine.
 */

class QuizDataLoader {
  constructor() {
    // Base path for subject JSON files - adjust if needed
    this.basePath = '/Quizzes/data/';  // Change this to your actual JSON folder path
    
    // Subject configuration
    this.subjects = [
      { id: 'english', name: 'English', file: 'english.json', questionCap: 60 },
      { id: 'mathematics', name: 'Mathematics', file: 'mathematics.json', questionCap: 40 },
      { id: 'physics', name: 'Physics', file: 'physics.json', questionCap: 40 },
      { id: 'chemistry', name: 'Chemistry', file: 'chemistry.json', questionCap: 40 },
      { id: 'biology', name: 'Biology', file: 'biology.json', questionCap: 40 },
      { id: 'economics', name: 'Economics', file: 'economics.json', questionCap: 40 },
      { id: 'accounting', name: 'Accounting', file: 'accounting.json', questionCap: 40 },
      { id: 'government', name: 'Government', file: 'government.json', questionCap: 40 },
      { id: 'literature', name: 'Literature', file: 'literature.json', questionCap: 40 },
      { id: 'crs', name: 'CRS', file: 'crs.json', questionCap: 40 }
    ];
    
    // Cache for loaded questions
    this.cache = new Map();
  }

  /**
   * Load a single subject JSON file
   */
  async loadSubject(subjectId) {
    const subject = this.subjects.find(s => s.id === subjectId);
    if (!subject) throw new Error(`Unknown subject: ${subjectId}`);
    
    // Return cached if available
    if (this.cache.has(subjectId)) {
      return this.cache.get(subjectId);
    }
    
    try {
      const response = await fetch(`${this.basePath}${subject.file}`);
      if (!response.ok) throw new Error(`Failed to load ${subject.file}`);
      
      const data = await response.json();
      
      // Extract questions array - handles both structures:
      // 1. Direct array: [ {...}, {...} ]
      // 2. Object with questions property: { subject: "...", questions: [...] }
      let questions = Array.isArray(data) ? data : (data.questions || []);
      
      // Add subject field to each question if not present
      questions = questions.map(q => ({
        ...q,
        subject: q.subject || subjectId,
        exam: q.exam || ['JAMB']
      }));
      
      // Cache the result
      this.cache.set(subjectId, questions);
      
      return questions;
    } catch (error) {
      console.error(`Error loading ${subjectId}:`, error);
      return [];
    }
  }

  /**
   * Load multiple subjects
   */
  async loadSubjects(subjectIds) {
    const results = {};
    await Promise.all(
      subjectIds.map(async id => {
        results[id] = await this.loadSubject(id);
      })
    );
    return results;
  }

  /**
   * Filter questions by criteria (topic, year, etc.)
   */
  filterQuestions(questions, filters = {}) {
    let filtered = [...questions];
    
    // Filter by topics (array)
    if (filters.topics && filters.topics.length > 0) {
      filtered = filtered.filter(q => {
        const qTopic = q.topic || '';
        return filters.topics.some(t => 
          qTopic.toLowerCase().includes(t.toLowerCase())
        );
      });
    }
    
    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(q => q.year == filters.year);
    }
    
    // Filter by level (easy/medium/hard)
    if (filters.level) {
      filtered = filtered.filter(q => q.level === filters.level);
    }
    
    // Filter by exam type (JAMB, WAEC, etc.)
    if (filters.examType) {
      filtered = filtered.filter(q => 
        q.exam && q.exam.includes(filters.examType)
      );
    }
    
    // Filter by section (comprehension, lexis, etc. - English specific)
    if (filters.section) {
      filtered = filtered.filter(q => q.section === filters.section);
    }
    
    return filtered;
  }

  /**
   * Select random questions from a pool up to the required count
   */
  selectRandomQuestions(pool, count) {
    if (pool.length === 0) return [];
    if (count >= pool.length) return this.shuffleArray([...pool]);
    
    // Fisher-Yates shuffle and take first 'count'
    const shuffled = this.shuffleArray([...pool]);
    return shuffled.slice(0, count);
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Build the full question set for a quiz session
   * @param {Array} selectedSubjects - Array of subject IDs to include
   * @param {Object} filters - { topics, year, level, examType, section }
   * @param {Object} options - { enforceCaps: true, questionCaps: { english: 60, ... } }
   */
  async buildQuestionSet(selectedSubjects, filters = {}, options = {}) {
    const enforceCaps = options.enforceCaps !== false;
    const allQuestions = [];
    
    for (const subjectId of selectedSubjects) {
      // Load subject questions
      const questions = await this.loadSubject(subjectId);
      
      // Apply filters
      let filtered = this.filterQuestions(questions, filters);
      
      // Determine how many questions to pick
      const subjectConfig = this.subjects.find(s => s.id === subjectId);
      let questionCount = enforceCaps ? (subjectConfig?.questionCap || 40) : options.customCount || 40;
      
      // For English, ensure 60 (or cap)
      if (subjectId === 'english') {
        questionCount = enforceCaps ? 60 : (options.customCount || 60);
      }
      
      // Check if we have enough questions after filtering
      if (filtered.length < questionCount) {
        console.warn(`${subjectId}: Only ${filtered.length} questions available after filtering (need ${questionCount}). Using all available.`);
        questionCount = filtered.length;
      }
      
      // Select random questions
      const selected = this.selectRandomQuestions(filtered, questionCount);
      
      // Add to the final set
      allQuestions.push(...selected);
    }
    
    // Shuffle the final combined set (so subjects are mixed)
    return this.shuffleArray(allQuestions);
  }

  /**
   * Get available years for a subject (from cached data)
   */
  async getAvailableYears(subjectId) {
    const questions = await this.loadSubject(subjectId);
    const years = new Set();
    questions.forEach(q => {
      if (q.year) years.add(q.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  /**
   * Get available topics for a subject (from cached data)
   */
  async getAvailableTopics(subjectId) {
    const questions = await this.loadSubject(subjectId);
    const topics = new Set();
    questions.forEach(q => {
      if (q.topic) topics.add(q.topic);
    });
    return Array.from(topics).sort();
  }

  /**
   * Get total question count for a subject (unfiltered)
   */
  async getTotalQuestionCount(subjectId) {
    const questions = await this.loadSubject(subjectId);
    return questions.length;
  }

  /**
   * Clear cache (useful if JSON files are updated)
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export for global usage
window.QuizDataLoader = QuizDataLoader;