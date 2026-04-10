 // CRS Quiz Functions
    function startQuiz(difficulty) {
        // Define quiz parameters for CRS
        const quizParams = {
            exam: 'jamb',
            subject: 'crs',
            difficulty: difficulty
        };

        // Build query string
        const queryString = new URLSearchParams(quizParams).toString();

        // Redirect to quiz page
        window.location.href = `../../../quiz.htm?${queryString}`;
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
    });