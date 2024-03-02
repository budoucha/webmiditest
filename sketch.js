const app = new PIXI.Application({
  background: '#555',
  resizeTo: window
});

document.querySelector('canvas#sketch').replaceWith(app.view);

const marker = new PIXI.Text('+', { fill: 'white' });
app.stage.addChild(marker);
marker.x = app.view.width / 2;
marker.y = app.view.height / 2;

const moveMarker = ([x, y]) => {
  const ratio = 5;
  marker.x += x * ratio;
  marker.y -= y * ratio;
}

const axisInput = [0, 0];
setInterval(() => moveMarker(axisInput), 10);

document.addEventListener('midiInput', e => {
  const data = e.detail;
});
