import { SuperpoweredWebAudio, SuperpoweredTrackLoader } from './superpowered/SuperpoweredWebAudio.js';

import notes from './notes/index.js';

const players = {};

class MyProcessor extends SuperpoweredWebAudio.AudioWorkletProcessor {
    // runs after the constructor
    onReady() {
        notes.forEach(({url}) => {
            const player = new this.Superpowered.AdvancedAudioPlayer(this.samplerate, 2, 2, 0, 0.501, 2, false);

            players[url] = { player, loaded: false };
            SuperpoweredTrackLoader.downloadAndDecode(url, this);
        })
    }

    onMessageFromMainScope(message) {
        if (message.SuperpoweredLoaded) {
            const { buffer, url } = message.SuperpoweredLoaded;

            players[url].loaded = true;
            players[url].pointer = this.Superpowered.arrayBufferToWASM(buffer);

            const { player } = players[url];

            if (Object.keys(players).every(k => players[k].loaded)) {
                this.sendMessageToMainScope({ loaded: true });
            }
        }

        if (message.play) {
            const { player, pointer } = players[message.play];
            player.openMemory(pointer, false, false);
            player.play();
        }
    }

    processAudio(inputBuffer, outputBuffer, buffersize, parameters) {

        // const { player } = players['../notes/c3.mp3'];

        // if (!player.processStereo(outputBuffer.pointer, false, buffersize, 1)) {
        //     for (let n = 0; n < buffersize * 2; n++) outputBuffer.array[n] = 0;
        // };

        Object.keys(players).forEach((key, idx) => {
            const { player } = players[key];

            if (!player.processStereo(outputBuffer.pointer, idx > 0, buffersize, 1)) {
                for (let n = 0; n < buffersize * 2; n++) outputBuffer.array[n] = 0;
            };
        })

    }
}

if (typeof AudioWorkletProcessor === 'function') registerProcessor('MyProcessor', MyProcessor);
export default MyProcessor;
