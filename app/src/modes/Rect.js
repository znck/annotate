import { toRect } from './helpers';
import createjs from './create';

export default class Rect {
  constructor(store, stage, vm) {
    this.store = store;
    this.state = store.state;
    this.stage = stage;
    this.vm = vm;
    this.shortcut = 'r';
    this.shape = null;
    this.hover = null;
    this.active = false;

    this.vm.$watch(function points() {
      return this.$store.state.points;
    }, () => {
      if (!this.active) return;

      this.drawRect();
      this.stage.update();
    });

    this.stage.on('stagemouseup', (event) => {
      if (!this.active) return;
      if (event.nativeEvent.button !== 0) return;
      // console.log('Rect - UP');
      const point = this.vm.toImage({
        x: event.stageX,
        y: event.stageY,
      });
      this.addPoint(this.vm.toValidPoint(point));
    });

    this.stage.on('stagemousemove', (event) => {
      if (!this.active) return;
      this.hover = { x: event.stageX, y: event.stageY };
      this.drawRect();
      this.stage.update();
    });
  }

  start() {
    // console.log('Rect - start');
    this.active = true;
  }

  stop() {
    // console.log('Rect - stop');
    this.active = false;
    this.stage.removeChild(this.shape);

    if (this.state.points.length) {
      this.store.commit('CLEAR_POINTS');
    }
    this.stage.update();
  }

  redraw() {
    if (this.hover) this.drawRect();
  }

  drawRect() {
    this.stage.removeChild(this.shape);
    if (!this.state.points.length) return;
    if (!this.hover) return;

    const start = this.vm.toCanvas(this.state.points[0]);
    const { x, y, w, h } = toRect(start, this.hover);

    this.shape = new createjs.Shape();
    this.shape.graphics
      .beginFill(this.state.fill)
      .beginStroke(this.state.stroke)
      .rect(x, y, w, h);

    this.stage.addChild(this.shape);
  }

  addPoint(point) {
    if (!this.state.points.length) {
      this.store.commit('ADD_POINT', point);
      return;
    }

    this.stage.removeChild(this.shape);

    const start = this.state.points[0];
    const end = point;
    const { x, y, w, h } = toRect(start, end);

    this.store.commit('CLEAR_POINTS', false);
    this.store.commit('ADD_ROI', {
      type: 'rectangle',
      position: { x, y },
      size: { w, h },
      _meta: {
        stroke: this.state.stroke,
        fill: this.state.fill,
      },
    });
  }
}
