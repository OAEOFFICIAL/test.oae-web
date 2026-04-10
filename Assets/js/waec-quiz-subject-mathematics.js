function startQuiz(subject, difficulty) {
      // Redirect to quiz page with parameters
      const quizUrl = `../../../quiz.htm?exam=waec&subject=${subject}&difficulty=${difficulty}`;
      window.location.href = quizUrl;
    }
