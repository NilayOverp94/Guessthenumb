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
let hintUsed = false;
let soundEnabled = localStorage.getItem("soundEnabled") !== "false";

// Audio Context for Web Audio API synthesis
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

// Sound synthesizer
function playSound(type) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        if (type === "click") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === "wrong") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(150, now + 0.18);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === "win") {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + idx * 0.1;
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.2, start);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.35);
            });
        } else if (type === "gameover") {
            const notes = [300, 260, 220, 180];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const start = now + idx * 0.12;
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.18, start);
                gain.gain.linearRampToValueAtTime(0.01, start + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.2);
            });
        } else if (type === "hint") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        }
    } catch (e) {
        // AudioContext may be blocked before first user gesture
    }
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem("soundEnabled", soundEnabled);
    updateSoundButton();
    if (soundEnabled) playSound("click");
}

function updateSoundButton() {
    const btn = document.getElementById("soundToggle");
    if (btn) {
        btn.textContent = soundEnabled ? "🔊" : "🔇";
        btn.title = soundEnabled ? "Sound is ON (Click to mute)" : "Sound is OFF (Click to unmute)";
    }
}

// Load best score from localStorage
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
document.getElementById("bestScore").textContent = bestScore;
updateSoundButton();

// Initialize or restart the game
function initGame() {
    const settings = levels[currentDifficulty];
    secretNumber = Math.floor(Math.random() * settings.max) + 1;
    attemptsLeft = settings.attempts;
    gameOver = false;
    hintUsed = false;

    // Reset UI
    document.getElementById("attempts").textContent = attemptsLeft;
    setMessage("Make your first guess!", "");

    const hintBtn = document.getElementById("hintBtn");
    if (hintBtn) {
        hintBtn.disabled = false;
        hintBtn.textContent = "💡 Need a Hint?";
    }

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
    playSound("click");
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

// Provide a smart hint
function getHint() {
    if (hintUsed || gameOver) return;
    hintUsed = true;
    playSound("hint");

    const hints = [];

    // Even / Odd hint
    if (secretNumber % 2 === 0) {
        hints.push("The secret number is EVEN.");
    } else {
        hints.push("The secret number is ODD.");
    }

    // Divisibility hint
    if (secretNumber % 10 === 0) {
        hints.push("It is a multiple of 10.");
    } else if (secretNumber % 5 === 0) {
        hints.push("It is a multiple of 5.");
    } else if (secretNumber % 3 === 0) {
        hints.push("It is divisible by 3.");
    }

    const selectedHint = hints[Math.floor(Math.random() * hints.length)];
    setMessage(`💡 Hint: ${selectedHint}`, "");

    const hintBtn = document.getElementById("hintBtn");
    if (hintBtn) {
        hintBtn.disabled = true;
        hintBtn.textContent = "✓ Hint Used";
    }
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
        playSound("wrong");
        setMessage(`Enter a whole number between 1 and ${max}!`, "error");
        return;
    }

    attemptsLeft--;
    document.getElementById("attempts").textContent = attemptsLeft;

    // Check guess
    if (guess === secretNumber) {
        playSound("win");
        endGame(true);
        return;
    }

    if (attemptsLeft <= 0) {
        playSound("gameover");
        endGame(false);
        return;
    }

    shakeElement(input);
    playSound("wrong");

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
    const hintBtn = document.getElementById("hintBtn");

    input.disabled = true;
    submitBtn.disabled = true;
    if (hintBtn) hintBtn.disabled = true;
    restartBtn.classList.remove("hidden");

    if (won) {
        setMessage(`🎉 Correct! The number was ${secretNumber}!`, "success");
        triggerConfetti();

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

// Canvas Confetti Celebration
function triggerConfetti() {
    const canvas = document.getElementById("confettiCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#6366f1", "#4ade80", "#f87171", "#facc15", "#38bdf8", "#e879f9"];
    const particles = [];

    for (let i = 0; i < 90; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.7) * 17,
            size: Math.random() * 7 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            alpha: 1,
            gravity: 0.35,
            drag: 0.98
        });
    }

    let animationId;
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = 0;

        particles.forEach(p => {
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.alpha -= 0.009;

            if (p.alpha > 0) {
                active++;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            }
        });

        if (active > 0) {
            animationId = requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationId);
        }
    }

    render();
}

window.addEventListener("resize", () => {
    const canvas = document.getElementById("confettiCanvas");
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// Start game initially
initGame();
