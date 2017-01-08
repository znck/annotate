<template>
<div class="canvas-container" :class=[action]>
  <canvas id="main" ref="canvas">

  </canvas>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import isNumber from 'lodash/isNumber';
import int from 'lodash/toInteger';
import debounce from 'lodash/debounce';
import last from 'lodash/last';
import fs from 'fs';
// const electron = require('electron').remote;

import createjs from '../modes/create';
import Renderer from '../renderer';
import Rect from '../modes/Rect';
import Poly from '../modes/Poly';
import Delete from '../modes/Delete';
import Drag from '../modes/Drag';

import { save, load } from '../modes/helpers';

export default {
  name: 'Canvas',
  props: {
    file: {
      required: true,
    },
    action: {
      required: true,
      type: String,
    },
  },
  data() {
    return {
      image: null,
      offset: { x: 0, y: 0, scale: 1 },
      modes: {},
      shapes: {},
    };
  },
  computed: {
    mode() {
      return this.modes[this.action];
    },
    ...mapGetters(['rois']),
  },
  created() {
    this.$on('scale', (scale) => {
      this.offset.scale = scale;
    });
  },
  mounted() {
    window.addEventListener('resize', debounce(() => {
      this.fixCanvasSize();
      this.$nextTick(() => {
        this.calcOffset();
        this.redraw();
      });
    }));
    this.fixCanvasSize();

    this.createStage();

    this.modes = {
      rect: new Rect(this.$store, this.stage, this),
      poly: new Poly(this.$store, this.stage, this),
      del: new Delete(this.$store, this.stage, this),
      drag: new Drag(this.$store, this.stage, this),
    };
    this.renderer = new Renderer(this.$store, this.stage, this);

    if (!this.image) this.loadImage();
  },
  methods: {
    createStage() {
      this.stage = new createjs.Stage('main');

      this.stage.enableDOMEvents(true);
      this.stage.snapToPixelEnabled = true;

      this.stage.update();
    },
    loadImage() {
      const image = new window.Image();
      const ext = last(this.file.split('.'));
      image.src = `data:image/${ext};base64,${fs.readFileSync(this.file).toString('base64')}`;

      this.image = new createjs.Bitmap(image);
      this.image.$image = image;
      this.image.$dims = { width: image.width, height: image.height };

      const filename = `${this.file}.tsv`;
      const rois = load(filename);
      const canvas = this.$refs.canvas;

      this.stage.addChild(this.image);
      if (rois.length) {
        this.$store.commit('ADD_ROI', rois);
      }
      this.stage.update();
      this.offset = {
        x: 0,
        y: 0,
        w: image.width,
        h: image.height,
        scale: 1,
        original: { w: image.width, h: image.height },
        canvas: { w: canvas.width, h: canvas.height },
      };
      this.calcOffset();
    },
    calcOffset() {
      const canvas = this.$refs.canvas;
      const { width, height } = this.image.$dims;

      this.offset.w = int(width * this.offset.scale);
      this.offset.h = int(height * this.offset.scale);

      const x = parseInt((canvas.width - this.offset.w) / 2, 10);
      const y = parseInt((canvas.height - this.offset.h) / 2, 10);

      this.offset.x = x;
      this.offset.y = y;
    },
    toImage({ x, y }) {
      return { x: this.toImageX(x), y: this.toImageY(y) };
    },
    toImageX(x) {
      return int((x - this.offset.x) / this.offset.scale);
    },
    toImageY(y) {
      return int((y - this.offset.y) / this.offset.scale);
    },
    toCanvas({ x, y }) {
      return { x: this.toCanvasX(x), y: this.toCanvasY(y) };
    },
    toCanvasScale(x) {
      if (!isNumber(x)) {
        const { w, h } = x;

        return { w: this.toCanvasScale(w), h: this.toCanvasScale(h) };
      }

      return int(this.offset.scale * x);
    },
    toCanvasX(x) {
      return int((x * this.offset.scale) + this.offset.x);
    },
    toCanvasY(y) {
      return int((y * this.offset.scale) + this.offset.y);
    },
    isValidPoint({ x, y }) {
      const { width, height } = this.image.$image;

      return x >= 0 && y >= 0 && x <= width && y <= height;
    },
    toValidPoint({ x, y }) {
      const { width, height } = this.image.$image;

      if (x < 0) x = 0;
      else if (x > width) x = width;
      if (y < 0) y = 0;
      else if (y > height) y = height;

      return { x, y };
    },
    subscribeEvents(payload) {
      payload.shape.on('click', event => this.$emit('shape.click', event, payload));
    },
    fixCanvasSize() {
      if (!this.$refs.canvas) return;

      const { width, height } = this.$el.getBoundingClientRect();

      this.$refs.canvas.width = width;
      this.$refs.canvas.height = height;
    },
    redraw() {
      this.image.x = this.offset.x;
      this.image.y = this.offset.y;
      this.image.scaleX = this.image.scaleY = this.offset.scale;

      Object.values(this.shapes).forEach(shape => this.stage.removeChild(shape));

      this.shapes = {};

      this.rois.forEach((roi, index) => {
        const shape = this.renderer.drawRoI(roi);
        this.stage.addChild(shape);
        this.subscribeEvents({ shape, index, roi });
        this.shapes[roi.id] = shape;
      });

      if (this.mode) this.mode.redraw();

      this.stage.update();
    },
  },
  watch: {
    rois(rois) {
      const ids = [];
      rois.forEach((roi, index) => {
        if (!(roi.id in this.shapes)) {
          const shape = this.renderer.drawRoI(roi);
          this.stage.addChild(shape);
          this.shapes[roi.id] = shape;
          this.subscribeEvents({ shape, index, roi });
        }
        ids.push(roi.id);
      });

      Object.keys(this.shapes).forEach((id) => {
        if (ids.indexOf(parseInt(id, 10)) < 0) {
          this.stage.removeChild(this.shapes[id]);
          delete this.shapes[id];
        }
      });

      this.stage.update();
    },
    file(c, o) {
      if (this.rois.length) {
        const filename = `${o}.tsv`;

        save(filename, this.rois);
      }
      this.$store.commit('RESET');
      this.stage.removeAllChildren();
      this.stage.update();
      this.loadImage();
    },
    mode(mode, old) {
      if (old) old.stop();
      if (mode) mode.start();
    },
    'offset.x': function onOffsetXChanged() {
      this.$nextTick(() => this.redraw());
    },
    'offset.y': function onOffsetYChanged() {
      this.$nextTick(() => this.redraw());
    },
    'offset.scale': function onScaleChanged() {
      this.calcOffset();
    },
    offset(offset) {
      this.$emit('offsetUpdated', offset);
    },
  },
};
</script>

<style lang="scss">
.canvas-container {
  flex: 1;
  &.rect, &.poly {
    cursor: crosshair;
  }
  &.del {
    cursor: not-allowed;
  }
  &.drag {

  }
  &.drag.dragging {
    cursor: move;
  }
}
</style>
