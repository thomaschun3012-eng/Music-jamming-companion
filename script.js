const chords = ['F', 'Bb', 'C', 'Dm', 'Gm', 'Am'];
let chordQueue = [];
let currentBar = 1;
let beatsPerBar = 4;
let tempo = 120;
let beatDuration = 60 / tempo * 1000;
let barDuration = beatsPerBar * beatDuration;
let isPlaying = false;
let barIntervalId;

const chordDisplay = document.getElementById('current-chord');
const barDisplay = document.getElementById('bar');
const timeSigSelect = document.getElementById('timeSig');
const tempoInput = document.getElementById('tempo');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');

function generateChord() {
    return chords[Math.floor(Math.random() * chords.length)];
}

function generateDuration() {
    return Math.random() < 0.5 ? 1 : 2;
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const noteFreqs = {
    'C': 261.63,
    'C#': 277.18,
    'D': 293.66,
    'D#': 311.13,
    'E': 329.63,
    'F': 349.23,
    'F#': 369.99,
    'G': 392.00,
    'G#': 415.30,
    'A': 440.00,
    'A#': 466.16,
    'B': 493.88
};

const chordNotes = {
    'F': ['F', 'A', 'C'],
    'Bb': ['A#', 'D', 'F'], // Bb is A#
    'C': ['C', 'E', 'G'],
    'Dm': ['D', 'F', 'A'],
    'Gm': ['G', 'A#', 'D'],
    'Am': ['A', 'C', 'E']
};

function playChord(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;
    const oscillators = [];
    notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(noteFreqs[note] * 2, audioContext.currentTime); // Octave up for better sound
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
    });
}

function updateDisplay() {
    chordDisplay.textContent = chordQueue[0].chord;
    const upcomingDivs = document.querySelectorAll('.upcoming-chord');
    for (let i = 0; i < 3; i++) {
        if (i + 1 < chordQueue.length) {
            const next = chordQueue[i + 1];
            upcomingDivs[i].textContent = `${i === 0 ? 'Next:' : 'Then:'} ${next.chord} (${next.bars})`;
        } else {
            upcomingDivs[i].textContent = '';
        }
    }
}

function updateBar() {
    currentBar++;
    barDisplay.textContent = `Bar: ${currentBar}`;
    if (--chordQueue[0].bars === 0) {
        chordQueue.shift();
        chordQueue.push({ chord: generateChord(), bars: generateDuration() });
        updateDisplay();
        playChord(chordQueue[0].chord);
    }
}

function startBarCounter() {
    barIntervalId = setInterval(updateBar, barDuration);
}

function start() {
    if (isPlaying) return;
    isPlaying = true;
    beatsPerBar = parseInt(timeSigSelect.value);
    tempo = parseInt(tempoInput.value);
    beatDuration = 60 / tempo * 1000;
    barDuration = beatsPerBar * beatDuration;
    // Generate initial queue
    chordQueue = [
        { chord: generateChord(), bars: generateDuration() },
        { chord: generateChord(), bars: generateDuration() },
        { chord: generateChord(), bars: generateDuration() },
        { chord: generateChord(), bars: generateDuration() }
    ];
    currentBar = 0;
    updateBar(); // sets to 1, decrements first bars
    updateDisplay();
    playChord(chordQueue[0].chord);
    startBarCounter();
}

function stop() {
    isPlaying = false;
    clearInterval(barIntervalId);
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);
