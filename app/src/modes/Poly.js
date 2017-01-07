import clone from 'lodash/clone';
import { dist } from './helpers';
import createjs from './create';

export default class Poly {
  constructor(store, stage, vm) {
    this.store = store;
    this.state = store.state;
    this.stage = stage;
    this.vm = vm;
    this.shortcut = 'r';
    this.shape = null;
    this.line = null;
    this.hover = null;
    this.threshold = 10;
    this.active = false;

    this.vm.$watch(function points() {
      return this.$store.state.points;
    }, () => {
      if (!this.active) return;

      this.drawPoly();
      this.drawLine();
      this.stage.update();
    });

    this.stage.on('stagemouseup', (event) => {
      if (!this.active) return;
      if (event.nativeEvent.button !== 0) return;

      // console.log('Poly - UP');
      const point = this.vm.toImage({
        x: event.stageX,
        y: event.stageY,
      });

      if (this.vm.isValidPoint(point) && this.isNotIntersecting(point)) {
        this.addPoint(point);
      }
    });

    this.stage.on('stagemousemove', (event) => {
      if (!this.active) return;

      this.hover = { x: event.stageX, y: event.stageY };
      this.drawLine();
      this.stage.update();
    });
  }

  start() {
    // console.log('Poly - start');
    this.active = true;
  }

  stop() {
    // console.log('Poly - stop');
    this.active = false;
    this.stage.removeChild(this.shape);
    this.stage.removeChild(this.line);

    if (this.state.points.length) {
      this.store.commit('CLEAR_POINTS');
    }
    this.stage.update();
  }

  redraw() {
    if (this.hover) this.drawLine();
    this.drawPoly();
  }

  drawLine() {
    this.stage.removeChild(this.line);
    if (!this.state.points.length) return; // Empty.
    if (!this.hover) return;

    const last = this.vm.toCanvas(this.state.points[this.state.points.length - 1]);
    const point = this.hover;

    this.line = new createjs.Shape();
    this.line.graphics
      .beginStroke(this.state.stroke)
      .moveTo(last.x, last.y)
      .lineTo(point.x, point.y);

    this.stage.addChild(this.line);
  }

  drawPoly() {
    if (!this.state.points.length) return; // Empty.

    this.stage.removeChild(this.shape);
    this.shape = new createjs.Shape();

    const { x, y } = this.vm.toCanvas(this.state.points[0]);

    let chain = this.shape.graphics
      .beginStroke(this.state.stroke)
      .beginFill(this.state.fill)
      .moveTo(x, y);

    this.state.points.slice(1).forEach((coord) => {
      const p = this.vm.toCanvas(coord);
      chain = chain.lineTo(p.x, p.y);
    });
    this.stage.addChild(this.shape);
  }

  addPoint(point) {
    if (!this.isClosing(point)) {
      this.store.commit('ADD_POINT', point);
      this.drawPoly();
      this.stage.update();
      return;
    }

    this.stage.removeChild(this.shape);
    this.stage.removeChild(this.line);
    this.shape = this.line = null;

    const points = clone(this.state.points);

    this.store.commit('CLEAR_POINTS', false);
    this.store.commit('ADD_ROI', {
      type: 'polygon',
      coords: points,
      _meta: {
        stroke: this.state.stroke,
        fill: this.state.fill,
      },
    });
  }

  isNotIntersecting() {
    return true; // TODO: Check if it intersects old line.
  }

  isClosing(point) {
    if (this.state.points.length < 2) return false;

    const first = this.state.points[0];

    // console.log('Closing', dist(first, point) < this.threshold, first, point);

    return dist(first, point) < this.threshold;
  }
}
