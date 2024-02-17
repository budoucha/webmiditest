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
    const axisConfig = document.getElementById('axisConfig');
    axisConfig.style.display = richMode ? 'block' : 'none';
});
modeSwitch.dispatchEvent(new Event('change')); // 初期値反映


const inputQueue = { // 最新10入力を保持
    maxLength: 10,
    queue: [],
    push: (value) => {
        inputQueue.queue.push(value);
        if (inputQueue.queue.length > inputQueue.maxLength) {
            inputQueue.queue.shift();
        }
    },
    getMode: () => { // 最頻値を取得
        const mode = inputQueue.queue.reduce((acc, cur) => {
            // indexで使う関係上配列は文字に変換される
            if (acc[cur]) {
                acc[cur]++;
            } else {
                acc[cur] = 1;
            }
            return acc;
        }, {});
        const max = Math.max(...Object.values(mode));
        return Object.keys(mode).find(key => mode[key] === max);
    },
    reset: () => {
        inputQueue.queue = [];
    }
};

const axisX = {
    type: "axis",
    name: "axisX",
};
const axisY = {
    type: "axis",
    name: "axisY",
};
const initAxis = axis => {
    if (axis.type !== "axis") return;
    axis.assign = [null, null];
    axis.range = [[null, null], [null, null]];
    axis.default = [null, null];
    updateAxisTexts(axis);
}
const updateAxisTexts = (axis) => {
    if (axis.type !== "axis") return;
        document.querySelector(`#axisConfig > .${axis.name}.minus  span.value.stick`).textContent = axis.assign[0];
        document.querySelector(`#axisConfig > .${axis.name}.plus span.value.stick`).textContent = axis.assign[1];
        document.querySelector(`#axisConfig > .${axis.name}.minus span.value.range`).textContent = `${axis.range[0][0]} ~ ${axis.range[0][1]}`;
        document.querySelector(`#axisConfig > .${axis.name}.plus  span.value.range`).textContent = `${axis.range[1][0]} ~ ${axis.range[1][1]}`;
}
const clearButton = document.querySelector('#axisConfig button.clear');
clearButton.addEventListener('click', () => {
    initAxis(axisX);
    initAxis(axisY);
});
clearButton.dispatchEvent(new Event('click')); // 初期化


const axisConfigs = [
    { axis: axisX, assignTo: 1, buttonId: "assignXplus", direction: "right", label: "X+" },
    { axis: axisX, assignTo: 0, buttonId: "assignXminus", direction: "left", label: "X-" },
    { axis: axisY, assignTo: 1, buttonId: "assignYplus", direction: "up", label: "Y+" },
    { axis: axisY, assignTo: 0, buttonId: "assignYminus", direction: "down", label: "Y-" },
]

axisConfigs.forEach(config => {
    const button = document.querySelector(`#axisConfig > #${config.buttonId} > button`);
    button.addEventListener('mousedown', () => {
        inputQueue.reset();
        console.log(`tilt the joystick ${config.direction}`);
    });
    button.addEventListener('mouseup', () => {
        const mode = inputQueue.getMode().split(","); // 最頻値、文字列から配列を復元する
        // ピッチベンドの場合第一値のみで判定、それ以外は両方で判定
        const assignMode = mode[0] >= 0xE0 ? 'pitch' : 'default';
        const assigned = { pitch: mode[0], default: mode }[assignMode];
        const assignTo = config.assignTo;
        const axis = config.axis;
        axis.assign[assignTo] = assigned;
        // 正負のもう一方が未設定の場合はデフォルト挙動として同じ値を設定
        if (axis.assign[1 - assignTo] === null) {
            axis.assign[1 - assignTo] = assigned;
        }

        const ranges = {
            pitch: [ // isSame? 0: 異なる, 1: 両方同じ
                [[8192, 0], [8192, 16383]],
                [[8192, 0], [8192, 16383]] // pitch bendが片方でしか設定されていない場合の事は考慮しない
            ],
            default: [ // isSame? 0: 異なる, 1: 両方同じ
                [[0, 127], [0, 127]],
                [[64, 0], [64, 127]]
            ]
        };
        const isSame = JSON.stringify(axis.assign[0]) === JSON.stringify(axis.assign[1]);
        const range = ranges[assignMode][{ false: 0, true: 1 }[isSame]];

        axis.range = range;
        axis.default = [range[0][0], range[1][0]];

        if (axis.assign[assignTo]) {
            console.log(`axis ${config.label} is assigned to: ${axis.assign[assignTo]}`);
            updateAxisTexts(axis);
        } else {
            console.log(`axis ${config.label} is not assigned`);
        }
    });
});

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
    const status = data[0] & 0xF0;
    const channel = data[0] & 0x0F;
    if (status == 0x80) { // 128-143 Note Off
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
    inputQueue.push([data[0], data[1]]);
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
