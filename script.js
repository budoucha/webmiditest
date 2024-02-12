// override console.log
const oldConsoleLog = console.log;
console.log = (msg) => {
    oldConsoleLog(msg);
    const outputElement = document.getElementById('output');
    outputElement.innerHTML += msg + '<br>';
    outputElement.scrollTop = outputElement.scrollHeight;
};

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

const onMIDIMessage = (message) => {
    const data = message.data;
    const command = data[0]; // ↑↓:176 , ←→: 224
    const note = data[1];
    const velocity = (data.length > 2) ? data[2] : 0;
    console.log(`command: ${command},\tnote: ${note},\tvelocity: ${velocity}`);
}

const onMIDIConnectionChange = (event) => {
    console.log("MIDI connection event:", event);
}

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
} else {
    console.log("Web MIDI API is not supported in this browser.");
}
