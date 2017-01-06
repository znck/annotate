import createjs from './modes/create';

export function rectangle({ x, y, w, h }, { stroke, fill }) {
  const shape = new createjs.Shape();

  // console.log(x, y, w, h, stroke, fill);

  shape.graphics
    .beginStroke(stroke)
    .beginFill(fill)
    .rect(x, y, w, h);

  return shape;
}

export function polygon(points, { stroke, fill }) {
  const shape = new createjs.Shape();

  let chain = shape.graphics
    .beginStroke(stroke)
    .beginFill(fill)
    .moveTo(points[0].x, points[0].y);

  // console.log(points, stroke, fill);
  points.slice(0).forEach((point) => {
    chain = chain.lineTo(point.x, point.y);
  });
  chain.closePath();

  return shape;
}

export default class Renderer {
  constructor(store, stage, vm) {
    this.store = store;
    this.state = store.state;
    this.stage = stage;
    this.vm = vm;
  }

  drawRoI(roi) {
    if (roi.type === 'rectangle') {
      const { x, y } = this.vm.toCanvas(roi.position);
      const { w, h } = roi.size;

      return rectangle({ x, y, w, h }, roi._meta);
    }

    if (roi.type === 'polygon') {
      const points = roi.coords.map(coord => this.vm.toCanvas(coord));

      return polygon(points, roi._meta);
    }

    return undefined;
  }
}
