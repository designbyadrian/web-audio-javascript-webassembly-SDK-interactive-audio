import { SuperpoweredGlue, SuperpoweredWebAudio } from './superpowered/SuperpoweredWebAudio.js';

import notes from './notes/index.js';

var webaudioManager = null; // The SuperpoweredWebAudio helper class managing Web Audio for us.
var Superpowered = null; // A Superpowered instance.
var audioNode = null;    // This example uses one audio node only.
var content = null;      // The <div> displaying everything.

let pitch = 0;
let pitchValue;

// click on play/pause
function togglePlayback(e) {
    let button = document.getElementById('playPause');
    if (button.value == 1) {
        button.value = 0;
        button.innerText = 'PLAY';
        webaudioManager.audioContext.suspend();
    } else {
        button.value = 1;
        button.innerText = 'PAUSE';
        webaudioManager.audioContext.resume();
    }
}

function playNote(e) {
    console.log("play", { play:this.value, pitch })
    audioNode.sendMessageToAudioScope({ play:this.value, pitch });
}

function playKey({key}) {
    const note = notes.filter(note => note.key === key)[0];

    if (note) {
        audioNode.sendMessageToAudioScope({ play:note.url, pitch });
    }
}

function pitchChange(e) {
    pitch = parseInt(this.value, 10);
    pitchValue.innerHTML = pitch;
}

function onMessageFromAudioScope(message) {
    if (message.loaded) {
        // UI: innerHTML may be ugly but keeps this example small

        let html = '';

        notes.forEach(note => {
            html += `<button class="btn-note" value="${note.url}">${note.name}</button>`
        })

        html += `<br/>-1200 <input id="pitch" type="range" min="-1200" max="1200" value="0"></input> 1200`;

        html += `<br />Pitch: <span id="pitch-value">0</span>`;

        content.innerHTML = html;

        for (const node of document.getElementsByClassName('btn-note')) {
            node.addEventListener('mousedown', playNote);
            node.addEventListener('touchstart', playNote);
        }
        document.addEventListener('keydown', playKey);

        pitchValue = document.getElementById('pitch-value');

        document.getElementById('pitch').addEventListener('input', pitchChange);

        webaudioManager.audioContext.resume();

    } else console.log('Message received from the audio node: ' + JSON.stringify(message));
}

// when the START button is clicked
async function start() {
    content.innerText = 'Creating the audio context and node...';
    webaudioManager = new SuperpoweredWebAudio(44100, Superpowered);
    let currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    audioNode = await webaudioManager.createAudioNodeAsync(currentPath + '/processor.js', 'MyProcessor', onMessageFromAudioScope);

    // audioNode -> audioContext.destination (audio output)
    webaudioManager.audioContext.suspend();
    audioNode.connect(webaudioManager.audioContext.destination);

    content.innerText = 'Downloading and decoding music...';
}

async function loadJS() {
    // download and instantiate Superpowered
    Superpowered = await SuperpoweredGlue.fetch('./superpowered/superpowered.wasm');
    Superpowered.Initialize({
        licenseKey: 'ExampleLicenseKey-WillExpire-OnNextUpdate',
        enableAudioAnalysis: false,
        enableFFTAndFrequencyDomain: false,
        enableAudioTimeStretching: true,
        enableAudioEffects: true,
        enableAudioPlayerAndDecoder: true,
        enableCryptographics: false,
        enableNetworking: false
    });

    // display the START button
    content = document.getElementById('content');
    content.innerHTML = '<button id="startButton">START</button>';
    document.getElementById('startButton').addEventListener('click', start);
}

loadJS();
