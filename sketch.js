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

  [axisX, axisY].forEach((axis, index) => {
    axis.assign.forEach((assign, side) => {
      // アサイン値がアサインモード依存のため前方一致で判定
      if (axis.assign[side].every((v, i) => v == data[i])) {
        //console.log(axis.name, axis.assignMode[side], data);
        const isPitch = axis.assignMode[side] === 'pitch';
        const value = isPitch ? (data[2] << 7) + data[1] : data[2];

        if (axis.assign[0].join() === axis.assign[1].join()) {
          axis.range[0][0] = Math.min(...axis.range[0], ...axis.range[1]);
          axis.range[0][1] = Math.max(...axis.range[0], ...axis.range[1]);
          axis.range[1] = axis.range[0];

          const range = axis.range[side];
          const rangeMax = Math.max(...range);
          const rangeMin = Math.min(...range);

          const cutoffValue = Math.min(Math.max(rangeMin, value), rangeMax);
          const normalize = value => (value - rangeMin) / (rangeMax - rangeMin);

          axisInput[index] = 2 * normalize(cutoffValue) * [-1, 1][side] - 1;
          return;

        }
        const range = axis.range[side];
        const rangeMax = Math.max(...range);
        const rangeMin = Math.min(...range);

        const cutoffValue = Math.min(Math.max(rangeMin, value), rangeMax);
        const normalize = value => (value - rangeMin) / (rangeMax - rangeMin);

        axisInput[index] = normalize(cutoffValue) * [-1, 1][side];
      }
    });
  });
});
