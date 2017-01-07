<template>
<div class="canvas-container" :class=[action]>
  <canvas id="main" ref="canvas">

  </canvas>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import isNumber from 'lodash/isNumber';
import debounce from 'lodash/debounce';
import last from 'lodash/last';
import fs from 'fs';
// const electron = require('electron').remote;

import createjs from '../modes/create';
import Renderer from '../renderer';
import Rect from '../modes/Rect';
import Poly from '../modes/Poly';
import Delete from '../modes/Delete';

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

      const filename = `${this.file}.tsv`;
      const rois = load(filename);
      this.stage.addChild(this.image);
      if (rois.length) {
        this.$store.commit('ADD_ROI', rois);
      }
      this.stage.update();
      this.calcOffset();
    },
    calcOffset() {
      const canvas = this.$refs.canvas;
      const image = this.image.$image;
      const x = parseInt((canvas.width - image.width) / 2, 10);
      const y = parseInt((canvas.height - image.height) / 2, 10);
      const w = image.width;
      const h = image.height;

      const scale = image.width / canvas.width;

      this.offset = {
        x,
        y,
        w,
        h,
        scale,
        canvas: { w: canvas.width, h: canvas.height },
        image: { w: image.width, h: image.height },
      };

      this.$emit('offsetUpdated', this.offset);
    },
    toImage({ x, y }) {
      return { x: this.toImageX(x), y: this.toImageY(y) };
    },
    toImageX(x) {
      return x - this.offset.x;
    },
    toImageY(y) {
      return y - this.offset.y;
    },
    toCanvas({ x, y }) {
      return { x: this.toCanvasX(x), y: this.toCanvasY(y) };
    },
    toCanvasScale(x) {
      if (!isNumber(x)) {
        const { w, h } = x;

        return { w: this.toCanvasScale(w), h: this.toCanvasScale(h) };
      }

      return this.offset.scale * x;
    },
    toCanvasX(x) {
      return x + this.offset.x;
    },
    toCanvasY(y) {
      return y + this.offset.y;
    },
    isValidPoint({ x, y }) {
      const { width, height } = this.image.$image;

      return x >= 0 && y >= 0 && x <= width && y <= height;
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
    offset() {
      this.$nextTick(() => this.redraw());
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
}
</style>
