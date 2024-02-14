// override console.log
const oldConsoleLog = console.log;
console.log = (...args) => {
    const msgStr = args.map(arg => {
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, null, 2)
                    .replace(/\n/g, '<br>')
                    .replace(/\s/g, '&nbsp;')
            } catch (error) {
                return 'Unable to stringify object';
            }
        } else {
            return String(arg);
        }
    }).join(' ');
    oldConsoleLog.apply(console, args);
    const outputElement = document.getElementById('output');
    outputElement.innerHTML += msgStr + '<br>';
    // 行数が1000を超えたら、古い行を削除
    while (outputElement.children.length > 1000) {
        outputElement.removeChild(outputElement.firstChild);
    }
    // 一番下にスクロール
    outputElement.scrollTop = outputElement.scrollHeight;
};

// mode switch
const modeSwitch = document.getElementById('richMode');
modeSwitch.addEventListener('change', (event) => {
    richMode = event.target.checked;
});
let richMode = modeSwitch.checked;


const onMIDISuccess = (midiAccess) => {
    const inputs = midiAccess.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        input.value.onmidimessage = onMIDIMessage;
    }
    midiAccess.onstatechange = onMIDIConnectionChange;
}

const onMIDIFailure = () => {
    console.log("Failed to get MIDI access.");
}

const outputRich = (data) => {
    const status = data[0] && 0xF0;
    const channel = data[0] && 0x0F;
    if (status == 0x80) { // 128-143 Note Off
        console.log(status);
        if (channel == 9) { // 137 pad release
            const pad = data[1];
            console.log(`released pad: ${pad}`);
            return;
        }
        const note = data[1];
        const octave = Math.floor(note / 12) - 1;
        const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][note % 12];
        console.log(`released ${note}(${noteName}${octave})`);
        return;
    }
    if (status == 0x90) { // 144-159 Note On
        if (channel == 9) { // 153 pad press
            const pad = data[1];
            const velocity = (data.length > 2) ? data[2] : 0;
            console.log(`pad: ${pad},\tvelocity: ${velocity}`);
            return;
        }
        const note = data[1];
        const octave = Math.floor(note / 12) - 1;
        const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][note % 12];
        const velocity = (data.length > 2) ? data[2] : 0;
        console.log(`${note}(${noteName}${octave}),\tvelocity: ${velocity}`);
        return;
    }
    if (status == 0xB0) { // 176-191 Control Change
        const control = data[1];
        const value = data[2];
        console.log(`control: ${control},\tvalue: ${value}`);
        return;
    }
    if (status == 0xC0) { // 192-207 Program Change
        const program = data[1];
        console.log(`program: ${program}`);
        return;
    }
    if (status == 0xD0) { // 208-223 channel pressure
        const velocity = data[1];
        if (channel == 0x9) { // 217 pad aftertouch
            console.log(`pad velocity: ${velocity}`);
            return;
        }
        console.log(`pad velocity: ${velocity}`);
        return;
    }
    if (status == 0xE0) {// 224-239 pitch bend 
        const pitch = (data[2] << 7) + data[1];
        console.log(`pitch: ${pitch}`);
        return;
    }
    // other
    console.log(...data);
}

const onMIDIMessage = (message) => {
    const data = message.data;
    if (richMode) {
        outputRich(data);
        return;
    }
    console.log(...data);
}

const onMIDIConnectionChange = (event) => {
    if (event.port.type !== "input") return;
    const name = event.port.name ?? null;
    console.log("MIDI device:", name);
}

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
} else {
    console.log("Web MIDI API is not supported in this browser.");
}
