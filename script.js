// Game settings
const levels = {
    easy: { max: 50, attempts: 10 },
    medium: { max: 100, attempts: 7 },
    hard: { max: 200, attempts: 5 }
};

let currentDifficulty = "easy";
let secretNumber;
let attemptsLeft;
let gameOver = false;

// Load best score from localStorage
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
document.getElementById("bestScore").textContent = bestScore;

// Initialize or restart the game
function initGame() {
    const settings = levels[currentDifficulty];
    secretNumber = Math.floor(Math.random() * settings.max) + 1;
    attemptsLeft = settings.attempts;
    gameOver = false;

    // Reset UI
    document.getElementById("attempts").textContent = attemptsLeft;
    setMessage("Make your first guess!", "");

    const input = document.getElementById("guessInput");
    input.value = "";
    input.disabled = false;
    input.max = settings.max;
    input.placeholder = `Enter 1 - ${settings.max}`;

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = false;

    const restartBtn = document.getElementById("restartBtn");
    restartBtn.classList.add("hidden");

    input.focus();
}

// Select difficulty level
function selectDifficulty(level, button) {
    currentDifficulty = level;

    // Update active button
    document.querySelectorAll(".diff-btn").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    // Update range description
    const max = levels[level].max;
    document.getElementById("rangeText").textContent = `Guess a number between 1 and ${max}`;

    // Restart game with new difficulty
    initGame();
}

// Handle player guess
function handleGuess() {
    if (gameOver) return;

    const input = document.getElementById("guessInput");
    const guess = Number(input.value);
    const max = levels[currentDifficulty].max;

    // Validation
    if (input.value.trim() === "" || !Number.isInteger(guess) || guess < 1 || guess > max) {
        shakeElement(input);
        setMessage(`Enter a whole number between 1 and ${max}!`, "error");
        return;
    }

    attemptsLeft--;
    document.getElementById("attempts").textContent = attemptsLeft;

    // Check guess
    if (guess === secretNumber) {
        endGame(true);
        return;
    }

    if (attemptsLeft <= 0) {
        endGame(false);
        return;
    }

    shakeElement(input);

    if (guess < secretNumber) {
        setMessage("Too Low! Try a higher number ↑", "");
    } else {
        setMessage("Too High! Try a lower number ↓", "");
    }

    input.value = "";
    input.focus();
}

// Set feedback message
function setMessage(text, type) {
    const msg = document.getElementById("message");
    msg.textContent = text;
    msg.className = "message " + type;
}

// End game handler
function endGame(won) {
    gameOver = true;
    const input = document.getElementById("guessInput");
    const submitBtn = document.getElementById("submitBtn");
    const restartBtn = document.getElementById("restartBtn");

    input.disabled = true;
    submitBtn.disabled = true;
    restartBtn.classList.remove("hidden");

    if (won) {
        setMessage(`🎉 Correct! The number was ${secretNumber}!`, "success");

        // Calculate score based on remaining attempts
        const score = (attemptsLeft + 1) * 10;
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("bestScore", bestScore);
            document.getElementById("bestScore").textContent = bestScore;
        }
    } else {
        setMessage(`💥 Game Over! The secret number was ${secretNumber}.`, "error");
    }
}

// Visual shake effect
function shakeElement(element) {
    element.classList.remove("shake");
    void element.offsetWidth; // Force reflow
    element.classList.add("shake");
}

// Press Enter to submit
document.getElementById("guessInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        handleGuess();
    }
});

// Start game initially
initGame();
