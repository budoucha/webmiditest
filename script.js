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
    // pitch bend
    if (data[0] == 224) {
        const pitch = (data[2] << 7) + data[1];
        console.log(`pitch: ${pitch}`);
        return;
    }
    // control change
    if (data[0] == 176) { // 0xB0, 0xB* control change
        const control = data[1];
        const value = data[2];
        console.log(`control: ${control},\tvalue: ${value}`);
        return;
    }
    // key press
    if (data[0] == 144) { // 0x90, 0x9* note on
        const note = data[1];
        const octave = Math.floor(note / 12) - 1;
        const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][note % 12];
        const velocity = (data.length > 2) ? data[2] : 0;
        console.log(`${note}(${noteName}${octave}),\tvelocity: ${velocity}`);
        return;
    }
    // key release
    if (data[0] == 128) { // 0x80, 0x8* note off
        const note = data[1];
        const octave = Math.floor(note / 12) - 1;
        const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][note % 12];
        console.log(`released ${note}(${noteName}${octave})`);
        return;
    }
    // pad press
    if (data[0] == 153) { // 0x99, 0x9* note on
        const pad = data[1];
        const velocity = (data.length > 2) ? data[2] : 0;
        console.log(`pad: ${pad},\tvelocity: ${velocity}`);
        return;
    }
    // pad release
    if (data[0] == 137) { // 0x89, 0x8* note off
        const pad = data[1];
        console.log(`released pad: ${pad}`);
        return;
    }
    // pad velocity change?
    if (data[0] == 217) { // 0xD9 0xD* pad velocity change?
        const velocity = data[1];
        console.log(`pad velocity: ${velocity}`);
        return;
    }
    // program change
    if (data[0] == 201) { // 0xC9 0xC* program change
        const program = data[1];
        console.log(`program: ${program}`);
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
