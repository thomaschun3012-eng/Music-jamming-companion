const chords = ['F', 'Bb', 'C', 'Dm', 'Gm', 'Am'];
let chordQueue = [];
let currentBar = 1;
let beatsPerBar = 4;
let tempo = 120;
let beatDuration = 60 / tempo * 1000;
let barDuration = beatsPerBar * beatDuration;
let isPlaying = false;
let barIntervalId;
let currentPattern = 'sustained';

const chordDisplay = document.getElementById('current-chord');
const barDisplay = document.getElementById('bar');
const timeSigSelect = document.getElementById('timeSig');
const tempoInput = document.getElementById('tempo');
const patternSelect = document.getElementById('pattern');
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

function playNote(note, startTime, duration = 0.5) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(noteFreqs[note] * 2, startTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.15, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function playSustainedChord(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    notes.forEach(note => {
        playNote(note, audioContext.currentTime, 1.0);
    });
}

function playArpeggioUp(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    const noteDuration = beatDuration / 1000 / 2; // Half beat per note
    notes.forEach((note, index) => {
        playNote(note, audioContext.currentTime + (index * noteDuration), noteDuration);
    });
}

function playArpeggioDown(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    const reversedNotes = [...notes].reverse();
    const noteDuration = beatDuration / 1000 / 2; // Half beat per note
    reversedNotes.forEach((note, index) => {
        playNote(note, audioContext.currentTime + (index * noteDuration), noteDuration);
    });
}

function playBrokenChord(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    const noteDuration = beatDuration / 1000 / 4; // Quarter beat per note
    notes.forEach((note, index) => {
        playNote(note, audioContext.currentTime + (index * noteDuration * 2), noteDuration);
    });
}

function playStrummingPattern(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    // Down-up strumming pattern: down, up, down, up
    const strumPattern = [0, 0.1, 0.2, 0.3]; // Time offsets in seconds
    strumPattern.forEach((offset, index) => {
        const noteIndex = index % notes.length;
        playNote(notes[noteIndex], audioContext.currentTime + offset, 0.15);
    });
}

function playChord(chord) {
    switch (currentPattern) {
        case 'sustained':
            playSustainedChord(chord);
            break;
        case 'arpeggio':
            playArpeggioUp(chord);
            break;
        case 'arpeggio-down':
            playArpeggioDown(chord);
            break;
        case 'broken':
            playBrokenChord(chord);
            break;
        case 'strumming':
            playStrummingPattern(chord);
            break;
        default:
            playSustainedChord(chord);
    }
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

patternSelect.addEventListener('change', (e) => {
    currentPattern = e.target.value;
});

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);
