class WheelOfFortune {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinButton = document.getElementById('spinButton');
        this.resultDiv = document.getElementById('result');
        this.historyList = document.getElementById('historyList');
        
        // Wheel properties
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = 180;
        this.isSpinning = false;
        this.currentAngle = 0;
        
        // Prizes for the wheel
        this.prizes = [
            { text: "🎁 Regalo Speciale", color: "#e74c3c", value: "regalo" },
            { text: "💰 Jackpot!", color: "#f39c12", value: "jackpot" },
            { text: "🍀 Fortuna", color: "#27ae60", value: "fortuna" },
            { text: "⭐ Stella", color: "#3498db", value: "stella" },
            { text: "💎 Diamante", color: "#9b59b6", value: "diamante" },
            { text: "🔥 Fuoco", color: "#e67e22", value: "fuoco" },
            { text: "❄️ Ghiaccio", color: "#1abc9c", value: "ghiaccio" },
            { text: "⚡ Fulmine", color: "#f1c40f", value: "fulmine" }
        ];
        
        this.segmentAngle = (2 * Math.PI) / this.prizes.length;
        this.history = [];
        
        this.init();
    }
    
    init() {
        this.drawWheel();
        this.spinButton.addEventListener('click', () => this.spin());
        this.adjustCanvasSize();
        window.addEventListener('resize', () => this.adjustCanvasSize());
    }
    
    adjustCanvasSize() {
        const container = document.querySelector('.wheel-container');
        const maxSize = Math.min(container.offsetWidth - 40, 400);
        
        if (window.innerWidth <= 768) {
            this.canvas.style.width = Math.min(maxSize, 300) + 'px';
            this.canvas.style.height = Math.min(maxSize, 300) + 'px';
        } else {
            this.canvas.style.width = maxSize + 'px';
            this.canvas.style.height = maxSize + 'px';
        }
    }
    
    drawWheel() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw segments
        for (let i = 0; i < this.prizes.length; i++) {
            const startAngle = i * this.segmentAngle + this.currentAngle;
            const endAngle = (i + 1) * this.segmentAngle + this.currentAngle;
            
            // Draw segment
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            this.ctx.lineTo(this.centerX, this.centerY);
            this.ctx.fillStyle = this.prizes[i].color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Draw text
            this.ctx.save();
            this.ctx.translate(this.centerX, this.centerY);
            this.ctx.rotate(startAngle + this.segmentAngle / 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.prizes[i].text, this.radius * 0.7, 5);
            this.ctx.restore();
        }
        
        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 30, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
        
        // Draw center dot
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 8, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
    }
    
    spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.resultDiv.textContent = "Girando...";
        this.resultDiv.className = "result";
        
        // Random spin duration and rotation
        const minSpins = 5;
        const maxSpins = 10;
        const spins = Math.random() * (maxSpins - minSpins) + minSpins;
        const finalAngle = spins * 2 * Math.PI;
        
        this.animateWheel(finalAngle, 3000);
    }
    
    animateWheel(targetAngle, duration) {
        const startAngle = this.currentAngle;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            this.currentAngle = startAngle + targetAngle * easeOut;
            this.drawWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.finishSpin();
            }
        };
        
        animate();
    }
    
    finishSpin() {
        // Normalize angle to 0-2π range
        const normalizedAngle = (this.currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        
        // Calculate which segment the pointer is on
        // The pointer is at the top (0 degrees), so we need to adjust
        const pointerAngle = (2 * Math.PI - normalizedAngle) % (2 * Math.PI);
        const segmentIndex = Math.floor(pointerAngle / this.segmentAngle);
        const winningPrize = this.prizes[segmentIndex];
        
        // Display result
        this.resultDiv.textContent = `🎉 Hai vinto: ${winningPrize.text}!`;
        this.resultDiv.className = "result winner";
        
        // Add to history
        this.addToHistory(winningPrize);
        
        // Re-enable button
        this.isSpinning = false;
        this.spinButton.disabled = false;
        
        // Play celebration effect
        this.celebrate();
    }
    
    addToHistory(prize) {
        const timestamp = new Date().toLocaleTimeString('it-IT');
        this.history.unshift({ ...prize, time: timestamp });
        
        // Keep only last 10 results
        if (this.history.length > 10) {
            this.history.pop();
        }
        
        this.updateHistoryDisplay();
    }
    
    updateHistoryDisplay() {
        this.historyList.innerHTML = '';
        
        this.history.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.time}</strong> - ${item.text}`;
            li.style.color = item.color;
            this.historyList.appendChild(li);
        });
    }
    
    celebrate() {
        // Add some confetti effect with emojis
        const confetti = ['🎉', '🎊', '⭐', '✨', '🎈'];
        const container = document.querySelector('.container');
        
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = confetti[Math.floor(Math.random() * confetti.length)];
                emoji.style.position = 'fixed';
                emoji.style.left = Math.random() * window.innerWidth + 'px';
                emoji.style.top = '-50px';
                emoji.style.fontSize = '2rem';
                emoji.style.zIndex = '1000';
                emoji.style.pointerEvents = 'none';
                emoji.style.animation = 'fall 3s linear forwards';
                
                document.body.appendChild(emoji);
                
                setTimeout(() => {
                    document.body.removeChild(emoji);
                }, 3000);
            }, i * 100);
        }
    }
}

// Add falling animation for confetti
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WheelOfFortune();
});

// Add some fun sound effects (using Web Audio API)
class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playSpinSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    playWinSound() {
        if (!this.audioContext) return;
        
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
            }, index * 100);
        });
    }
}

// Add sound effects to the original button click
document.addEventListener('DOMContentLoaded', () => {
    const sounds = new SoundEffects();
    const originalButton = document.getElementById('spinButton');
    
    originalButton.addEventListener('click', () => {
        sounds.playSpinSound();
        
        // Play win sound after spin completes (3 seconds delay)
        setTimeout(() => {
            sounds.playWinSound();
        }, 3000);
    });
});