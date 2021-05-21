import { SuperpoweredWebAudio, SuperpoweredTrackLoader } from './superpowered/SuperpoweredWebAudio.js';

import notes from './notes/index.js';

const players = {};

class MyProcessor extends SuperpoweredWebAudio.AudioWorkletProcessor {
    // runs after the constructor
    onReady() {
        notes.forEach(({url}) => {
            const player = new this.Superpowered.AdvancedAudioPlayer(this.samplerate, 2, 2, 0, 0.501, 2, false);
            //player.outputBuffer = new Superpowered.Float32Buffer(256);
            players[url] = player;
            SuperpoweredTrackLoader.downloadAndDecode(url, this);
        })
    }

    onMessageFromMainScope(message) {
        if (message.SuperpoweredLoaded) {
            const { buffer, url } = message.SuperpoweredLoaded;
            const player = players[url];

            const pointer = this.Superpowered.arrayBufferToWASM(buffer);

            player.openMemory(pointer, false, false);
            player.loaded = true;

            this.sendMessageToMainScope({loadedOne: url, bufferSize: buffer.byteLength})

            if (Object.keys(players).every(k => players[k].loaded)) {
                this.sendMessageToMainScope({ loaded: true });
            }
        }

        if (message.play) {
            const player = players[message.play];
            this.sendMessageToMainScope({playing: message})
            player.pitchShiftCents = message.pitch;
            player.seek(0);
            player.play();
        }
    }

    processAudio(inputBuffer, outputBuffer, buffersize, parameters) {
        let mix = false;

        Object.keys(players).forEach((key, idx) => {
            const player = players[key];

            // outputBuffer.pointer -> player.outputBuffer
            const hasAudioOutput = player.processStereo(outputBuffer.pointer, mix, buffersize, 1);

            mix |= hasAudioOutput;

            if (!mix) {
                for (let n = 0; n < buffersize * 2; n++) outputBuffer.array[n] = 0;
            };
        })

    }
}

if (typeof AudioWorkletProcessor === 'function') registerProcessor('MyProcessor', MyProcessor);
export default MyProcessor;
