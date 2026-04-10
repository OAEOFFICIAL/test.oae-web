// Motivational quotes for JAMB students
const jambQuotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    "The expert in anything was once a beginner.",
    "Believe you can and you're halfway there.",
    "Success is the sum of small efforts repeated day in and day out.",
    "The only way to do great work is to love what you do.",
    "Your time is limited, don't waste it living someone else's life.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't watch the clock; do what it does. Keep going.",
    "Success usually comes to those who are too busy to be looking for it.",
    "The secret of getting ahead is getting started.",
    "The best way to predict the future is to create it.",
    "Your JAMB score is not your destiny, it's just one step in your journey.",
    "Every expert was once a beginner. Start where you are.",
    "Small progress is still progress. Keep moving forward.",
    "The only bad question is the one you didn't ask.",
    "Your potential is limitless. Your preparation determines your success.",
    "Focus on progress, not perfection.",
    "Today's preparation determines tomorrow's achievement.",
    "Learning is a journey, not a destination.",
    "Your dreams are valid. Your goals are achievable.",
    "The key to success is starting before you're ready.",
    "Education is not preparation for life; education is life itself.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "Success is built on daily habits, not occasional heroic efforts.",
    "Every accomplished scholar was once a struggling student.",
    "Your dedication today creates your success tomorrow.",
    "The only limit to your achievement is your commitment to learning.",
    "Excellence is not a skill. It's an attitude."
];

function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * jambQuotes.length);
    return jambQuotes[randomIndex];
}

function updateQuote() {
    const quoteBox = document.getElementById('quote-box');
    if (quoteBox) {
        const quote = getRandomQuote();
        quoteBox.innerHTML = `<div class="quote-text">"${quote}"</div>`;
        quoteBox.classList.add('fade-in');
    }
}

// Update quote when page loads
document.addEventListener('DOMContentLoaded', updateQuote);