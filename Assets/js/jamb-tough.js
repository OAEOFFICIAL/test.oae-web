    // Tough Questions Quiz Functions
    function startQuiz(difficulty) {
        // Define quiz parameters for tough questions
        const quizParams = {
            exam: 'jamb',
            subject: 'tough-questions',
            difficulty: difficulty,
            type: 'tough'
        };

        // Build query string
        const queryString = new URLSearchParams(quizParams).toString();

        // Redirect to quiz page
        window.location.href = `/Quizzes/quiz.htm?${queryString}`;
    }

    // Add click event listeners to difficulty cards
    document.addEventListener('DOMContentLoaded', function() {
        const difficultyCards = document.querySelectorAll('.difficulty-card');

        difficultyCards.forEach(card => {
            card.addEventListener('click', function() {
                const difficulty = this.getAttribute('onclick').match(/'([^']+)'/)[1];
                startQuiz(difficulty);
            });
        });

        // Add hover effects for better UX
        difficultyCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Add warning animation
        const warningSection = document.querySelector('.warning-section');
        if (warningSection) {
            setInterval(() => {
                warningSection.style.boxShadow = '0 0 20px rgba(240, 198, 116, 0.5)';
                setTimeout(() => {
                    warningSection.style.boxShadow = 'none';
                }, 1000);
            }, 3000);
        }
    });