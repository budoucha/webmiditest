const app = new PIXI.Application({
  background: '#555',
  resizeTo: window
});

document.querySelector('canvas#sketch').replaceWith(app.view);

document.addEventListener('midiInput', e => {
  const data = e.detail;
});
