document.addEventListener('DOMContentLoaded', () => {
    // Elementi del DOM
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    const buyVowelBtn = document.getElementById('buy-vowel-btn');
    const solveBtn = document.getElementById('solve-btn');
    const nextRoundBtn = document.getElementById('next-round-btn');
    const keyboardContainer = document.getElementById('keyboard');

    const puzzleBoard = document.getElementById('puzzle-board');
    const categoryDisplay = document.getElementById('category');
    
    const messageOverlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');
    const closeMessageBtn = document.getElementById('close-message-btn');
    const solveInputContainer = document.getElementById('solve-input-container');
    const solveInput = document.getElementById('solve-input');
    const submitSolveBtn = document.getElementById('submit-solve-btn');
    const cancelSolveBtn = document.getElementById('cancel-solve-btn');

    const roundTitle = document.getElementById('round-title');
    const roundDescription = document.getElementById('round-description');
    
    // Stato del gioco
    let playerScores = [0, 0, 0]; // TOT
    let roundScores = [0, 0, 0];  // ORA
    let playerJolly = [0, 0, 0];
    let currentPlayerIndex = 0;
    let currentPhrase = '';
    let guessedLetters = [];
    let currentRoundIndex = 0;
    let wheelSpinning = false;
    let currentWheelAngle = 0; 
    let allConsonantsRevealed = false;
    let currentSpinValue = null;
    let gameState = '';
    
    // Variabili per l'audio e l'animazione realistica
    let audioCtx = null;
    let lastTickIndex = -1;
    let spinAnimationId = null;
    let spinStartTime = null;
    let spinDuration = 5000; // 5 secondi per rallentamento ancora più graduale
    let startAngle = 0;
    let targetAngle = 0;
    
    const VOWELS = ['A', 'E', 'I', 'O', 'U'];
    const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');

    // Configurazioni ruota per round (24 spicchi)
    const wheelConfigs = {
        ROUND1: [300, 350, 400, 'PASSAMANO', 450, 500, 550, 'JOLLY', 600, 650, 'BANCA ROTTA', 700, 750, 800, 850, 900, 300, 400, 500, 600, 700, 800, 900, 'PASSAMANO'],
        ROUND2: [400, 450, 500, 'PASSAMANO', 550, 600, 650, 'JOLLY', 700, 750, 'BANCA ROTTA', 800, 850, 900, 950, 1000, 450, 550, 650, 750, 850, 950, 1000, 'PASSAMANO'],
        FINALE: [500, 600, 700, 'PASSAMANO', 800, 900, 1000, 'JOLLY', 1100, 1200, 'BANCA ROTTA', 1300, 900, 1000, 1100, 1200, 700, 800, 900, 1000, 1100, 1200, 1300, 'PASSAMANO']
    };
    let wheelSegments = [];
    
    function createWheelSegments() {
        const svg = document.querySelector('#wheel svg');
        svg.innerHTML = '';
        // Calcola la dimensione effettiva del contenitore SVG (responsive)
        let size = svg.clientWidth || svg.parentElement.clientWidth || 600;
        // Aggiorna anche la viewBox per mantenere proporzioni
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        const cx = size / 2;
        const cy = size / 2;
        const r = size / 2;
        const numSegments = wheelSegments.length;
        const angle = 360 / numSegments;
        const colors = [
            '#ff00ff', '#8a2be2', '#0000ff', '#00ffff', '#00ff00', '#ffff00',
            '#ff7f00', '#ff0000', '#ff1493', '#7fffd4', '#1e90ff', '#adff2f',
            '#ffd700', '#ff8c00', '#ff4500', '#dc143c', '#ff69b4', '#40e0d0',
            '#6a5acd', '#00fa9a', '#daa520', '#ff6347', '#ba55d3', '#87cefa'
        ];
        for (let i = 0; i < numSegments; i++) {
            const startAngle = (i * angle) * Math.PI / 180;
            const endAngle = ((i + 1) * angle) * Math.PI / 180;
            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);
            const largeArc = angle > 180 ? 1 : 0;
            const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', colors[i % colors.length]);
            path.setAttribute('stroke', '#fff');
            path.setAttribute('stroke-width', size * 0.008);
            svg.appendChild(path);
            // Testo leggermente ruotato verso l'interno dello spicchio
            const textAngleDeg = (i * angle + angle / 2);
            const textAngle = textAngleDeg * Math.PI / 180;
            const tx = cx + (r * 0.68) * Math.cos(textAngle);
            const ty = cy + (r * 0.68) * Math.sin(textAngle);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', tx);
            text.setAttribute('y', ty);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-family', 'Orbitron');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('font-size', Math.max(size * 0.045, 12));
            text.setAttribute('fill', '#000');
            // Ruota la parola di 90° rispetto al centro
            text.setAttribute('transform', `rotate(${textAngleDeg + 180} ${tx} ${ty})`);
            text.textContent = wheelSegments[i];
            svg.appendChild(text);
        }
    }
    
    const gameRounds = [
        { type: 'CLASSIC', title: 'Round 1', description: 'Gira la ruota e indovina le consonanti!' },
        { type: 'CLASSIC', title: 'Round 2', description: 'Ancora un puzzle da risolvere!' },
        { type: 'FINALE', title: 'Round Finale', description: 'Il vincitore gioca per il super premio!'},
    ];

    // Frasi del gioco - ora caricate dinamicamente
    let phrases = [
        { category: "Città Italiane", phrase: "ROMA CAPUT MUNDI" },
        { category: "Città Italiane", phrase: "NAPOLI CITTA PARTENOPEA" },
        { category: "Città Italiane", phrase: "FIRENZE CULLA DEL RINASCIMENTO" },
        { category: "Luoghi Famosi", phrase: "TORRE DI PISA" },
        { category: "Luoghi Famosi", phrase: "PONTE VECCHIO" },
        { category: "Film Famosi", phrase: "IL SIGNORE DEGLI ANELLI" },
        { category: "Film Famosi", phrase: "RITORNO AL FUTURO" },
        { category: "Programmi TV", phrase: "LA CASA DI CARTA" },
        { category: "Opere Letterarie", phrase: "VENTIMILA LEGHE SOTTO I MARI" },
        { category: "Opere Letterarie", phrase: "I PROMESSI SPOSI" },
        { category: "Modi di Dire", phrase: "TRA IL DIRE E IL FARE" },
        { category: "Modi di Dire", phrase: "CHI TARDI ARRIVA MALE ALLOGGIA" },
        { category: "Cucina", phrase: "SPAGHETTI AGLIO OLIO E PEPERONCINO" },
        { category: "Sport", phrase: "CAMPIONATO DI SERIE A" },
        { category: "Tecnologia", phrase: "INTELLIGENZA ARTIFICIALE" },
        { category: "Musica", phrase: "FESTIVAL DI SANREMO" },
        { category: "Scienza", phrase: "ELETTROENCEFALOGRAFIA" },
        { category: "Storia", phrase: "GIULIO CESARE" },
        { category: "Automobili", phrase: "ALFA ROMEO GIULIA" },
        { category: "Viaggi", phrase: "GIRO DEL MONDO" },
        { category: "Geografia", phrase: "ISOLE CANARIE" },
        { category: "Arte", phrase: "NOTTE STELLATA DI VAN GOGH" },
        { category: "Animali", phrase: "CANE GATTO E CANARINO" },
        { category: "Clima", phrase: "CAMBIAMENTO CLIMATICO" },
    ];
    
    // --- Funzioni Caricamento Frasi JSON ---
    
    // Funzione per scoprire automaticamente TUTTI i file JSON nella cartella phrases
    async function discoverPhraseFiles() {
        try {
            const select = document.getElementById('phrase-file-select');
            const availableFiles = [];
            
            console.log('🔍 Tentativo di lettura directory phrases/ dal server...');
            
            // Prima prova a caricare l'indice dei file (per GitHub Pages)
            try {
                const indexResponse = await fetch('phrases/index.json');
                if (indexResponse.ok) {
                    const indexData = await indexResponse.json();
                    const jsonFiles = indexData.files || [];
                    
                    console.log(`📋 Caricato indice file: ${jsonFiles.length} file JSON disponibili`);
                    
                    // Usa i file dall'indice invece del directory listing
                    for (const filename of jsonFiles.sort()) {
                        try {
                            console.log(`📄 Caricamento ${filename}...`);
                            const jsonResponse = await fetch(`phrases/${filename}`);
                            if (jsonResponse.ok) {
                                const data = await jsonResponse.json();
                                
                                // Verifica formato valido
                                if (typeof data === 'object' && !Array.isArray(data)) {
                                    const categories = Object.keys(data);
                                    if (categories.length > 0) {
                                        const fileInfo = {
                                            path: `phrases/${filename}`,
                                            name: filename
                                                .replace('.json', '')
                                                .replace(/[-_]/g, ' ')
                                                .replace(/\b\w/g, l => l.toUpperCase()),
                                            filename: filename
                                        };
                                        availableFiles.push(fileInfo);
                                        console.log(`✅ ${filename} caricato correttamente`);
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn(`⚠️ Errore caricando ${filename}:`, error);
                        }
                    }
                    
                    // Se abbiamo trovato file dall'indice, salta il directory listing
                    if (availableFiles.length > 0) {
                        console.log('✅ Usato indice file per GitHub Pages');
                        // Salta al popolamento del selettore
                        availableFiles.sort((a, b) => a.filename.localeCompare(b.filename));
                        availableFiles.forEach(file => {
                            const option = document.createElement('option');
                            option.value = file.path;
                            option.textContent = file.name;
                            select.appendChild(option);
                        });
                        
                        console.log(`🎯 Discovery completata: ${availableFiles.length} file trovati:`, 
                            availableFiles.map(f => f.filename));
                        
                        const successDiv = document.createElement('div');
                        successDiv.className = 'fixed top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
                        successDiv.textContent = `🎉 Auto-discovery: ${availableFiles.length} set di frasi trovati!`;
                        document.body.appendChild(successDiv);
                        setTimeout(() => successDiv.remove(), 4000);
                        return;
                    }
                }
            } catch (indexError) {
                console.log('📁 Index.json non disponibile, provo directory listing...');
            }
            
            try {
                // Prova a fare una richiesta alla directory per ottenere il listing
                const dirResponse = await fetch('phrases/');
                if (dirResponse.ok) {
                    const dirHTML = await dirResponse.text();
                    
                    // Estrai i nomi dei file .json dal HTML della directory listing
                    const jsonFiles = [];
                    const regex = /href="([^"]*\.json)"/gi;
                    let match;
                    
                    while ((match = regex.exec(dirHTML)) !== null) {
                        const filename = match[1];
                        if (!filename.includes('/') && filename.endsWith('.json')) {
                            jsonFiles.push(filename);
                        }
                    }
                    
                    console.log(`📂 Directory listing trovato! File JSON: ${jsonFiles.length}`);
                    
                    // Carica informazioni per ogni file trovato
                    for (const filename of jsonFiles.sort()) {
                        try {
                            console.log(`📄 Caricamento ${filename}...`);
                            const jsonResponse = await fetch(`phrases/${filename}`);
                            if (jsonResponse.ok) {
                                const data = await jsonResponse.json();
                                
                                // Verifica formato valido
                                if (typeof data === 'object' && !Array.isArray(data)) {
                                    const categories = Object.keys(data);
                                    if (categories.length > 0) {
                                        const fileInfo = {
                                            path: `phrases/${filename}`,
                                            name: filename
                                                .replace('.json', '')
                                                .replace(/[-_]/g, ' ')
                                                .replace(/\b\w/g, l => l.toUpperCase()),
                                            filename: filename
                                        };
                                        availableFiles.push(fileInfo);
                                        console.log(`✅ ${filename} caricato correttamente`);
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn(`⚠️ Errore caricando ${filename}:`, error);
                        }
                    }
                } else {
                    throw new Error('Directory listing non disponibile');
                }
            } catch (dirError) {
                console.log('� Directory listing non disponibile, uso metodo di fallback...');
                
                // Fallback: prova i file che sappiamo esistere
                const commonFiles = [
                    'Generico.json', 'Naturopatia.json', 'cinema.json', 'classico.json', 'esempio.json'
                ];
                
                for (const filename of commonFiles) {
                    try {
                        const response = await fetch(`phrases/${filename}`, { method: 'HEAD' });
                        if (response.ok) {
                            const jsonResponse = await fetch(`phrases/${filename}`);
                            if (jsonResponse.ok) {
                                const data = await jsonResponse.json();
                                if (typeof data === 'object' && !Array.isArray(data)) {
                                    const categories = Object.keys(data);
                                    if (categories.length > 0) {
                                        availableFiles.push({
                                            path: `phrases/${filename}`,
                                            name: filename.replace('.json', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                            filename: filename
                                        });
                                        console.log(`✅ Fallback: trovato ${filename}`);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        // Continua silenziosamente
                    }
                }
            }
            
            // Ordina per nome file
            availableFiles.sort((a, b) => a.filename.localeCompare(b.filename));
            
            // Popola il selettore
            availableFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file.path;
                option.textContent = file.name;
                select.appendChild(option);
            });
            
            if (availableFiles.length > 0) {
                console.log(`🎯 Discovery completata: ${availableFiles.length} file trovati:`, 
                    availableFiles.map(f => f.filename));
                
                const successDiv = document.createElement('div');
                successDiv.className = 'fixed top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
                successDiv.textContent = `🎉 Auto-discovery: ${availableFiles.length} set di frasi trovati!`;
                document.body.appendChild(successDiv);
                setTimeout(() => successDiv.remove(), 4000);
            } else {
                console.log('📁 Nessun file JSON valido trovato in phrases/');
                
                const infoDiv = document.createElement('div');
                infoDiv.className = 'fixed top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg z-50';
                infoDiv.textContent = '📁 Aggiungi file .json nella cartella phrases/';
                document.body.appendChild(infoDiv);
                setTimeout(() => infoDiv.remove(), 4000);
            }
            
        } catch (error) {
            console.error('❌ Errore nella discovery automatica:', error);
        }
    }
    
    async function loadPhrasesFromJSON(filename) {
        try {
            console.log('Tentativo di fetch del file:', filename);
            const response = await fetch(filename);
            console.log('Response status:', response.status, response.ok);
            
            if (!response.ok) {
                throw new Error(`Errore HTTP: ${response.status}`);
            }
            const jsonData = await response.json();
            console.log('Dati JSON caricati:', jsonData);
            
            // Converte il formato JSON {categoria: [frasi]} nel formato richiesto
            const newPhrases = [];
            for (const [category, phraseList] of Object.entries(jsonData)) {
                phraseList.forEach(phrase => {
                    newPhrases.push({
                        category: category,
                        phrase: phrase.toUpperCase()
                    });
                });
            }
            
            phrases = newPhrases;
            console.log(`Caricate ${phrases.length} frasi da ${filename}`);
            
            // Mostra messaggio di conferma
            const messageDiv = document.createElement('div');
            messageDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
            messageDiv.textContent = `✅ Caricate ${phrases.length} frasi da ${filename}`;
            document.body.appendChild(messageDiv);
            setTimeout(() => messageDiv.remove(), 3000);
            
            // Reset del gioco se necessario
            if (currentPhrase) {
                setupRound();
            }
            
        } catch (error) {
            console.error('Errore nel caricamento delle frasi:', error);
            
            // Mostra messaggio di errore
            const errorDiv = document.createElement('div');
            errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50';
            errorDiv.textContent = `❌ Errore caricando ${filename}`;
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 3000);
        }
    }
    
    // --- Funzioni Audio ---
    
    function playTick(pitchFactor = 1.0) {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'triangle';
            // Frequenza variabile per simulare rallentamento
            const baseFreq = 440 * pitchFactor;
            oscillator.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.05);
            
            // Effetto wobble sulla freccetta
            const pointer = document.querySelector('.pointer');
            if (pointer) {
                pointer.classList.remove('wobble');
                void pointer.offsetWidth; // Forza il reflow
                pointer.classList.add('wobble');
            }
        } catch (error) {
            console.log('Audio non disponibile:', error);
        }
    }
    
    // --- Funzioni Principali di Gioco ---

    function setupRound() {
        const round = gameRounds[currentRoundIndex];
        roundTitle.textContent = round.title;
        roundDescription.textContent = round.description;
        // Scegli ruota per round
        if (round.type === 'FINALE') wheelSegments = wheelConfigs.FINALE;
        else if (currentRoundIndex === 0) wheelSegments = wheelConfigs.ROUND1;
        else wheelSegments = wheelConfigs.ROUND2;
        createWheelSegments();
        
        // Scegli una frase casuale che non sia già stata usata
        const availablePhrases = phrases.filter(p => !p.used);
        const phraseData = availablePhrases[Math.floor(Math.random() * availablePhrases.length)];
        phraseData.used = true; // Marca come usata
        
        currentPhrase = phraseData.phrase.toUpperCase();
        categoryDisplay.textContent = `Categoria: ${phraseData.category}`;
        
        guessedLetters = [];
        roundScores = [0, 0, 0];
        allConsonantsRevealed = false;
        renderPuzzleBoard();
        updateKeyboard();
        updateScores();
        
        // Per il round finale, si danno alcune lettere
        if (round.type === 'FINALE') {
            // Logica speciale per il round finale, es. dare R, S, T, L, N, E
            ['R', 'S', 'T', 'L', 'N', 'E'].forEach(letter => {
                if (currentPhrase.includes(letter) && !guessedLetters.includes(letter)) {
                    guessedLetters.push(letter);
                }
            });
            renderPuzzleBoard();
            showMessage("Round Finale! Hai 3 consonanti e 1 vocale.", false);
        }

        setGameState('SPIN');
        updateActivePlayer();
    }
    
    function updateActivePlayer() {
        // Rimuovi la classe active da tutti i giocatori
        for (let i = 0; i < 3; i++) {
            const playerBox = document.querySelector(`.player-score:nth-child(${i + 1})`);
            if (playerBox) playerBox.classList.remove('active');
        }
        
        // Aggiungi la classe active al giocatore corrente
        const activePlayerBox = document.querySelector(`.player-score:nth-child(${currentPlayerIndex + 1})`);
        if (activePlayerBox) activePlayerBox.classList.add('active');
    }
    
    function renderPuzzleBoard() {
        puzzleBoard.innerHTML = '';
        const rowsSpec = [12, 14, 14, 12];

        // Helper: distribuisce le parole nelle righe senza spezzarle
        function layoutPhraseIntoRows(phrase, rowsSpec) {
            const rows = rowsSpec.map(len => new Array(len).fill(null));
            const words = phrase.trim().split(/\s+/);
            let r = 0, c = 0;
            const maxRow = rowsSpec.length;

            for (let w = 0; w < words.length && r < maxRow; w++) {
                const word = words[w].toUpperCase();
                const rowLen = rowsSpec[r];
                const remaining = rowLen - c;
                const need = (c > 0 ? 1 : 0) + word.length; // spazio + parola se non inizio riga

                if (need > remaining) {
                    // Vai a capo
                    r++; c = 0;
                    if (r >= maxRow) break;
                }

                // Se dopo andare a capo la parola comunque non entra nella riga (parole > 14)
                if (word.length > rowsSpec[r]) {
                    // Inserisci quanto entra e continua (fallback raro)
                    for (let i = 0; i < rowsSpec[r] && i < word.length; i++) {
                        rows[r][i] = word[i];
                    }
                    // avanza al prossimo row per il resto della parola
                    let consumed = rowsSpec[r];
                    let remainChars = word.slice(consumed).split('');
                    r++; c = 0;
                    while (r < maxRow && remainChars.length) {
                        const take = Math.min(rowsSpec[r], remainChars.length);
                        for (let i = 0; i < take; i++) rows[r][i] = remainChars[i];
                        remainChars = remainChars.slice(take);
                        r++; c = 0;
                    }
                    // dopo split forzato passa alla prossima parola
                    continue;
                }

                // Spazio tra parole se necessario
                if (c > 0) {
                    rows[r][c] = ' ';
                    c++;
                }
                // Inserisci la parola
                for (let i = 0; i < word.length && c < rowsSpec[r]; i++) {
                    rows[r][c] = word[i];
                    c++;
                }
            }
            return rows;
        }

        const layout = layoutPhraseIntoRows(currentPhrase, rowsSpec);

        layout.forEach((cells, rIdx) => {
            const row = document.createElement('div');
            row.className = `puzzle-row row-${rIdx + 1}`;
            cells.forEach(char => {
                const letterBox = document.createElement('div');
                letterBox.className = 'letter-box';
                if (char === null || char === ' ') {
                    letterBox.classList.add('space');
                } else {
                    if (guessedLetters.includes(char)) {
                        letterBox.textContent = char;
                        letterBox.classList.add('revealed');
                    } else {
                        letterBox.textContent = '\u00A0';
                    }
                }
                row.appendChild(letterBox);
            });
            puzzleBoard.appendChild(row);
        });
    }

    function spinWheel() {
        if (allConsonantsRevealed) {
            showMessage('Tutte le consonanti sono rivelate: compra vocali o risolvi.', true, 2200);
            return;
        }
        if (wheelSpinning) return;
        
        // Inizializza audio context se necessario
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.log('Audio non disponibile:', error);
            }
        }
        
        setGameState('SPINNING');
        wheelSpinning = true;
        
        const numSegments = wheelSegments.length;
        const segmentDegrees = 360 / numSegments;
        
        // Precalcola l'esito
        const randomStopIndex = Math.floor(Math.random() * numSegments);
        const targetCenter = (randomStopIndex + 0.5) * segmentDegrees;
        const desiredMod = (90 - targetCenter + 360) % 360;
        const base = ((currentWheelAngle % 360) + 360) % 360;
        const needed = (desiredMod - base + 360) % 360;
        const spins = 360 * 3; // giri completi per animazione (ridotto da 5 a 3)
        
        startAngle = currentWheelAngle;
        targetAngle = currentWheelAngle + spins + needed;
        spinStartTime = performance.now();
        lastTickIndex = -1;
        
        // Inizia l'animazione personalizzata
        animateWheelSpin();
        
        // Salva il risultato per dopo
        setTimeout(() => {
            wheelSpinning = false;
            const result = wheelSegments[randomStopIndex];
            handleSpinResult(result);
            currentWheelAngle = targetAngle;
        }, spinDuration);
    }
    
    function animateWheelSpin() {
        if (!wheelSpinning) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - spinStartTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        // Curva che accelera rapidamente all'inizio e rallenta gradualmente
        const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
        const smoothProgress = easeOutCubic(progress);
        
        // Calcola l'angolo corrente
        const currentAngle = startAngle + (targetAngle - startAngle) * smoothProgress;
        
        // Applica la rotazione
        wheel.style.transform = `rotate(${currentAngle}deg)`;
        
        // Calcola il segmento corrente per il suono tick
        const numSegments = wheelSegments.length;
        const segmentDegrees = 360 / numSegments;
        const pointerAngle = 90; // Freccetta alle ore 6
        const normalizedAngle = (currentAngle % 360 + 360) % 360;
        const currentTickIndex = Math.floor(((pointerAngle - normalizedAngle + 360) % 360) / segmentDegrees);
        
        // Riproduci il suono tick quando cambia segmento (con pitch variabile per realismo)
        if (currentTickIndex !== lastTickIndex && progress < 0.95) { // Smetti di fare tick quasi alla fine
            // Frequenza più bassa verso la fine per simulare rallentamento
            const pitchFactor = 1.0 - (progress * 0.3); // Diminuisce del 30% max
            playTick(pitchFactor);
            lastTickIndex = currentTickIndex;
        }
        
        // Continua l'animazione
        if (progress < 1) {
            spinAnimationId = requestAnimationFrame(animateWheelSpin);
        }
    }
    
    function handleSpinResult(result) {
        showMessage(`La ruota si è fermata su: ${result}!`, true, 1600);
        if (result === 'BANCA ROTTA') {
            roundScores[currentPlayerIndex] = 0; // azzera ORA
            updateScores();
            if (tryUseJolly('BANCA ROTTA')) {
                setTimeout(() => setGameState('SPIN'), 1600);
            } else {
                setTimeout(passTurn, 1600);
            }
        } else if (result === 'PASSAMANO' || result === 'PERDI TURNO') { // supporta vecchio testo
            if (tryUseJolly('PASSAMANO')) {
                setTimeout(() => setGameState('SPIN'), 1600);
            } else {
                setTimeout(passTurn, 1600);
            }
        } else if (result === 'JOLLY') {
            // Su JOLLY: il giocatore deve indovinare una consonante per riceverlo
            currentSpinValue = 'JOLLY';
            setGameState('GUESS_CONSONANT');
        } else {
            currentSpinValue = result;
            setGameState('GUESS_CONSONANT');
        }
    }
    
    function checkLetter(letter, value) {
        if (guessedLetters.includes(letter)) return; // Non dovrebbe succedere con la UI disabilitata

        guessedLetters.push(letter);
        updateKeyboard();
        const count = currentPhrase.split(letter).length - 1;

        // Caso speciale: se si sta giocando per il JOLLY
        if (value === 'JOLLY') {
            if (count > 0) {
                showMessage(`Bravo! Hai trovato ${count} "${letter}" e VINCI UN JOLLY!`, true, 2000);
                renderPuzzleBoard();
                setTimeout(() => {
                    showJollyAnimation(currentPlayerIndex);
                    playerJolly[currentPlayerIndex]++;
                    updateScores();
                    evaluateConsonantsLeft();
                    setTimeout(() => {
                        if (!checkWinCondition()) {
                            if (!allConsonantsRevealed) setGameState('SPIN');
                            else {
                                showMessage('Consonanti finite: compra vocali o risolvi.', true, 1800);
                                setGameState('ONLY_VOWELS');
                            }
                        }
                    }, 1200);
                }, 1200);
            } else {
                showMessage(`La lettera "${letter}" non c'è. Niente Jolly!`, true, 2000);
                setTimeout(() => {
                    if (tryUseJolly('LETTERA ERRATA')) {
                        setTimeout(() => setGameState('SPIN'), 1000);
                    } else {
                        setTimeout(passTurn, 1000);
                    }
                }, 1200);
            }
            return;
        }

        if (count > 0) {
            showMessage(`Trovata! Ci sono ${count} "${letter}".`, true, 2000);
            if (value) { // Se è una consonante con valore
                roundScores[currentPlayerIndex] += count * value;
            }
            renderPuzzleBoard();
            updateScores();
            evaluateConsonantsLeft();
            // Dopo una lettera corretta, il giocatore può continuare
            setTimeout(() => {
                if (!checkWinCondition()) {
                    if (!allConsonantsRevealed) setGameState('SPIN');
                    else {
                        showMessage('Consonanti finite: compra vocali o risolvi.', true, 1800);
                        setGameState('ONLY_VOWELS');
                    }
                }
            }, 2000);
        } else {
            showMessage(`La lettera "${letter}" non c'è.`, true, 2000);
            if (tryUseJolly('LETTERA ERRATA')) {
                setTimeout(() => setGameState('SPIN'), 2000);
            } else {
                setTimeout(passTurn, 2000);
            }
        }
    }
    
    function passTurn() {
        currentPlayerIndex = (currentPlayerIndex + 1) % playerScores.length;
        const playerName = document.getElementById(`player-${currentPlayerIndex}-name`).value;
        updateActivePlayer();
        showMessage(`Ora è il turno di ${playerName}`, true, 1500);
        setGameState('SPIN');
    }
    
    function checkWinCondition() {
        const phraseLetters = [...new Set(currentPhrase.replace(/[^A-Z]/g, ''))];
        const allGuessed = phraseLetters.every(letter => guessedLetters.includes(letter));
        if (allGuessed) {
            endRound();
            return true;
        }
        return false;
    }

    function endRound() {
        setGameState('ROUND_OVER');
        playerScores[currentPlayerIndex] += roundScores[currentPlayerIndex];
        updateScores();
        const playerName = document.getElementById(`player-${currentPlayerIndex}-name`).value;
        showMessage(`Round completato! ${playerName} vince il montepremi del round!`, false);
        
        // Cambia la label del pulsante se siamo all'ultimo round
        if (currentRoundIndex === gameRounds.length - 1) {
            nextRoundBtn.textContent = '🔄 RICOMINCIA';
        } else {
            nextRoundBtn.textContent = '➡️ PROSSIMO ROUND';
        }
        
        nextRoundBtn.classList.remove('hidden');
    }
    
    // --- Funzioni UI e Stato ---
    
    function setGameState(newState) {
        gameState = newState;
        updateUI();
    }

    function updateUI() {
        // Gestione pulsanti principali
        const canSpin = gameState === 'SPIN' && !wheelSpinning && !allConsonantsRevealed;
        spinBtn.disabled = !canSpin;
        buyVowelBtn.disabled = !['SPIN','ONLY_VOWELS','BUY_VOWEL'].includes(gameState) || roundScores[currentPlayerIndex] < 500;
        solveBtn.disabled = !['SPIN','ONLY_VOWELS'].includes(gameState);

        // Gestione tastiera
        updateKeyboard();

         // Gestione UI round finale
        if (gameRounds[currentRoundIndex].type === 'FINALE') {
            spinBtn.style.display = 'none';
            buyVowelBtn.style.display = 'none';
        } else {
            spinBtn.style.display = 'block';
            buyVowelBtn.style.display = 'block';
        }
    }

    function createKeyboard() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        letters.split('').forEach(letter => {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = letter;
            key.dataset.key = letter;
            key.addEventListener('click', () => handleKeyPress(letter));
            keyboardContainer.appendChild(key);
        });
    }

    function updateKeyboard() {
        const keys = keyboardContainer.querySelectorAll('.key');
        keys.forEach(key => {
            const letter = key.dataset.key;
            let disabled = true;

            if (guessedLetters.includes(letter)) {
                disabled = true;
            } else if (gameState === 'GUESS_CONSONANT' && CONSONANTS.includes(letter)) {
                disabled = false;
            } else if ((gameState === 'BUY_VOWEL' || gameState === 'ONLY_VOWELS') && VOWELS.includes(letter)) {
                disabled = false;
            }
            
            key.disabled = disabled;
        });
    }
    
    function handleKeyPress(letter) {
        if (gameState === 'GUESS_CONSONANT') {
            checkLetter(letter, currentSpinValue);
        } else if (gameState === 'BUY_VOWEL' || gameState === 'ONLY_VOWELS') {
            if (roundScores[currentPlayerIndex] >= 500) {
                roundScores[currentPlayerIndex] -= 500;
                updateScores();
                checkLetter(letter, null);
                setGameState('SPIN');
            } else {
                showMessage('Fondi insufficienti per vocale.', true, 1600);
            }
        }
    }

    function updateScores() {
        for (let i=0;i<playerScores.length;i++) {
            const totEl = document.getElementById(`tot-${i}`);
            const oraEl = document.getElementById(`ora-${i}`);
            const jEl = document.getElementById(`jolly-${i}`);
            if (totEl) totEl.textContent = `€${playerScores[i]}`;
            if (oraEl) oraEl.textContent = `€${roundScores[i]}`;
            if (jEl) jEl.textContent = playerJolly[i];
        }
    }

    function tryUseJolly(reason) {
        if (playerJolly[currentPlayerIndex] > 0) {
            playerJolly[currentPlayerIndex]--;
            updateScores();
            showMessage(`Usi un Jolly (${reason}) e mantieni il turno.`, true, 1700);
            return true;
        }
        return false;
    }

    function evaluateConsonantsLeft() {
        const consonantsInPhrase = [...new Set(currentPhrase.replace(/[^A-Z]/g,'').split('').filter(ch => CONSONANTS.includes(ch)))];
        allConsonantsRevealed = consonantsInPhrase.every(c => guessedLetters.includes(c));
        if (allConsonantsRevealed) {
            setGameState('ONLY_VOWELS');
        }
    }

    function showMessage(text, autoHide = true, duration = 2000) {
        messageText.textContent = text;
        messageOverlay.classList.remove('hidden');
        closeMessageBtn.style.display = autoHide ? 'none' : 'block';
        
        if (autoHide) {
            setTimeout(hideMessage, duration);
        }
    }

    function hideMessage() {
        messageOverlay.classList.add('hidden');
    }
    
    // --- Event Listeners ---

    spinBtn.addEventListener('click', spinWheel);
    
    buyVowelBtn.addEventListener('click', () => {
        if (roundScores[currentPlayerIndex] >= 500) {
            setGameState('BUY_VOWEL');
        } else {
            showMessage("Non hai abbastanza soldi!", true, 2000);
        }
    });
    
    solveBtn.addEventListener('click', () => {
        setGameState('SOLVE');
        showMessage("Risolvi la frase!", false);
        solveInputContainer.classList.remove('hidden');
        messageOverlay.classList.add('hidden');
    });
    
    submitSolveBtn.addEventListener('click', () => {
        const solution = solveInput.value.trim().toUpperCase();
        if (solution === currentPhrase) {
            // Rivela tutte le lettere per l'effetto visivo
            const allLetters = [...new Set(currentPhrase.replace(/[^A-Z]/g, ''))];
            allLetters.forEach(l => {
                if (!guessedLetters.includes(l)) guessedLetters.push(l);
            });
            renderPuzzleBoard();
            solveInputContainer.classList.add('hidden');
            endRound();
        } else {
            solveInputContainer.classList.add('hidden');
            showMessage("Soluzione sbagliata!", true, 2000);
            if (tryUseJolly('SOLUZIONE ERRATA')) {
                setTimeout(() => setGameState('SPIN'), 2000);
            } else {
                setTimeout(passTurn, 2000);
            }
        }
        solveInput.value = '';
    });

    cancelSolveBtn.addEventListener('click', () => {
        solveInputContainer.classList.add('hidden');
        solveInput.value = '';
        setGameState('SPIN');
    });

    nextRoundBtn.addEventListener('click', () => {
        currentRoundIndex++;
        nextRoundBtn.classList.add('hidden');
        if (currentRoundIndex < gameRounds.length) {
            setupRound();
        } else {
            // Determina il vincitore finale e riavvia la partita
            let maxScore = Math.max(...playerScores);
            let winners = playerScores.map((score, index) => score === maxScore ? index : -1).filter(i => i !== -1);
            let message;
            if (winners.length === 1) {
                const winnerName = document.getElementById(`player-${winners[0]}-name`).value;
                message = `Il gioco è finito! Il vincitore è ${winnerName} con €${maxScore}!`;
            } else {
                message = `Il gioco è finito in pareggio con €${maxScore}!`;
            }
            showMessage(message, false);
            closeMessageBtn.onclick = () => {
                // Reset state
                currentRoundIndex = 0;
                playerScores = [0, 0, 0];
                roundScores = [0, 0, 0];
                playerJolly = [0, 0, 0];
                // Reset phrases used
                phrases.forEach(p => delete p.used);
                nextRoundBtn.classList.add('hidden');
                setupRound();
                hideMessage();
            };
        }
    });

    closeMessageBtn.addEventListener('click', hideMessage);

    // --- Event Listener per Caricamento Frasi ---
    const phraseFileSelect = document.getElementById('phrase-file-select');
    const loadPhrasesBtn = document.getElementById('load-phrases-btn');
    
    loadPhrasesBtn.addEventListener('click', () => {
        const selectedFile = phraseFileSelect.value;
        console.log('Tentativo di caricamento file:', selectedFile);
        
        if (selectedFile === 'default') {
            // Ricarica le frasi default
            location.reload();
        } else {
            loadPhrasesFromJSON(selectedFile);
        }
    });

    // --- Animazione Jolly ---
    function showJollyAnimation(playerIdx) {
        const jollyEl = document.getElementById(`jolly-${playerIdx}`);
        if (!jollyEl) return;
        jollyEl.style.transition = 'none';
        jollyEl.style.transform = 'scale(1.5)';
        jollyEl.style.color = '#00ffff';
        setTimeout(() => {
            jollyEl.style.transition = 'all 0.6s cubic-bezier(0.4,2,0.4,1)';
            jollyEl.style.transform = 'scale(1)';
            jollyEl.style.color = '';
        }, 100);
    }

    // --- Inizializzazione ---
    createKeyboard();
    createWheelSegments();
    setupRound();
    
    // Scopri automaticamente i file JSON disponibili
    discoverPhraseFiles();
});