// override console.log
const oldConsoleLog = console.log;
console.log = (...msg) => {
    // const msgStr = msg.join(' ');
    const msgStr = msg.map(arg => {
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
      }).join(' '); // 引数をスペースで区切って結合
    oldConsoleLog.apply(console, msg);
    const outputElement = document.getElementById('output');
    outputElement.innerHTML += msgStr + '<br>';
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
    if (event.port.type !== "input") return;
    const name = event.port.name?? null;
    console.log("MIDI device:", name);
}

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
} else {
    console.log("Web MIDI API is not supported in this browser.");
}
