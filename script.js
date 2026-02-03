const chords = ['F', 'Bb', 'C', 'Dm', 'Gm', 'Am'];
const romanNumerals = {
    'I': 'F',
    'ii': 'Gm',
    'iii': 'Am',
    'IV': 'Bb',
    'V': 'C',
    'vi': 'Dm'
};

const progressions = {
    'random': null, // Will use random chords
    'pop': ['I', 'V', 'vi', 'IV'], // I-V-vi-IV
    'jazz': ['ii', 'V', 'I'], // ii-V-I
    'classic': ['I', 'IV', 'V', 'I'], // I-IV-V-I
    'sad': ['vi', 'IV', 'I', 'V'] // vi-IV-I-V
};

let chordQueue = [];
let currentBar = 1;
let beatsPerBar = 4;
let tempo = 120;
let beatDuration = 60 / tempo * 1000;
let barDuration = beatsPerBar * beatDuration;
let isPlaying = false;
let barIntervalId;
let currentPattern = 'sustained';
let currentInstrument = 'guitar';
let currentProgression = 'random';
let progressionIndex = 0;

const chordDisplay = document.getElementById('current-chord');
const barDisplay = document.getElementById('bar');
const timeSigSelect = document.getElementById('timeSig');
const tempoInput = document.getElementById('tempo');
const instrumentSelect = document.getElementById('instrument');
const patternSelect = document.getElementById('pattern');
const progressionSelect = document.getElementById('progression');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');

function generateChord() {
    if (currentProgression !== 'random' && progressions[currentProgression]) {
        const progression = progressions[currentProgression];
        const romanNumeral = progression[progressionIndex % progression.length];
        progressionIndex++;
        return romanNumerals[romanNumeral];
    } else {
        return chords[Math.floor(Math.random() * chords.length)];
    }
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
    const filter = audioContext.createBiquadFilter();

    // Set up instrument-specific characteristics
    switch (currentInstrument) {
        case 'guitar':
            oscillator.type = 'square';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, startTime);
            filter.Q.setValueAtTime(1, startTime);
            break;
        case 'piano':
            oscillator.type = 'sine';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3000, startTime);
            filter.Q.setValueAtTime(2, startTime);
            // Piano-like attack/decay envelope
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.1, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            break;
        case 'organ':
            oscillator.type = 'square';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, startTime);
            filter.Q.setValueAtTime(0.5, startTime);
            break;
        case 'strings':
            oscillator.type = 'sawtooth';
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2500, startTime);
            filter.Q.setValueAtTime(1.5, startTime);
            // Add some vibrato for strings
            oscillator.frequency.setValueAtTime(noteFreqs[note] * 2, startTime);
            oscillator.frequency.linearRampToValueAtTime(noteFreqs[note] * 2 * 1.01, startTime + duration * 0.5);
            oscillator.frequency.linearRampToValueAtTime(noteFreqs[note] * 2 * 0.99, startTime + duration);
            break;
        default:
            oscillator.type = 'sine';
    }

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(noteFreqs[note] * 2, startTime);

    // Default envelope for non-piano instruments
    if (currentInstrument !== 'piano') {
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    }

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

function playSustainedChord(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    // Play chord with added octave doubling for richness
    const allNotes = [...notes, ...notes.map(note => note)]; // Double the notes for intensity
    allNotes.forEach((note, index) => {
        const octaveMultiplier = index < notes.length ? 1 : 2; // Higher octave for duplicates
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        // Apply instrument-specific settings
        switch (currentInstrument) {
            case 'guitar': oscillator.type = 'square'; filter.frequency.setValueAtTime(2000, audioContext.currentTime); break;
            case 'piano': oscillator.type = 'sine'; filter.frequency.setValueAtTime(3000, audioContext.currentTime); break;
            case 'organ': oscillator.type = 'square'; filter.frequency.setValueAtTime(1500, audioContext.currentTime); break;
            case 'strings': oscillator.type = 'sawtooth'; filter.frequency.setValueAtTime(2500, audioContext.currentTime); break;
        }

        oscillator.frequency.setValueAtTime(noteFreqs[note] * octaveMultiplier, audioContext.currentTime);
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.8);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.8);
    });
}

function playArpeggioUp(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    // Create a more intense arpeggio that fills the bar
    const extendedNotes = [...notes, ...notes, ...notes]; // Repeat notes 3 times
    const barDurationSeconds = barDuration / 1000;
    const noteDuration = barDurationSeconds / extendedNotes.length; // Distribute evenly across bar

    extendedNotes.forEach((note, index) => {
        playNote(note, audioContext.currentTime + (index * noteDuration), noteDuration * 0.8);
    });
}

function playArpeggioDown(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    // Create a more intense descending arpeggio that fills the bar
    const reversedNotes = [...notes].reverse();
    const extendedNotes = [...reversedNotes, ...reversedNotes, ...reversedNotes]; // Repeat 3 times
    const barDurationSeconds = barDuration / 1000;
    const noteDuration = barDurationSeconds / extendedNotes.length; // Distribute evenly across bar

    extendedNotes.forEach((note, index) => {
        playNote(note, audioContext.currentTime + (index * noteDuration), noteDuration * 0.8);
    });
}

function playBrokenChord(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    // Create a more complex broken chord pattern that fills the bar
    const extendedNotes = [...notes, ...notes, ...notes, ...notes]; // Repeat 4 times for intensity
    const barDurationSeconds = barDuration / 1000;
    const noteDuration = barDurationSeconds / extendedNotes.length; // Distribute evenly across bar

    extendedNotes.forEach((note, index) => {
        playNote(note, audioContext.currentTime + (index * noteDuration), noteDuration * 0.7);
    });
}

function playStrummingPattern(chord) {
    const notes = chordNotes[chord];
    if (!notes) return;

    // Create an intense strumming pattern that fills the bar
    const barDurationSeconds = barDuration / 1000;
    const strumCount = Math.floor(barDurationSeconds * 8); // 8 strums per second
    const strumInterval = barDurationSeconds / strumCount;

    for (let i = 0; i < strumCount; i++) {
        const noteIndex = i % notes.length;
        playNote(notes[noteIndex], audioContext.currentTime + (i * strumInterval), strumInterval * 0.8);
    }
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

instrumentSelect.addEventListener('change', (e) => {
    currentInstrument = e.target.value;
});

patternSelect.addEventListener('change', (e) => {
    currentPattern = e.target.value;
});

progressionSelect.addEventListener('change', (e) => {
    currentProgression = e.target.value;
    progressionIndex = 0; // Reset progression when changing
});

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);
