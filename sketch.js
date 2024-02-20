const app = new PIXI.Application({
  background: '#555',
  resizeTo: window
});

document.addEventListener('midiInput', e => {
  const data = e.detail;
});
