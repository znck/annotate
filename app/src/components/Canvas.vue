<template>
<div class="canvas-container">
  <canvas id="main" ref="canvas">

  </canvas>
</div>
</template>

<script>
import { mapGetters } from 'vuex'
import isNumber from 'lodash/isNumber'
import debounce from 'lodash/debounce'

import createjs from '../modes/create'
import Renderer from '../renderer'
import Rect from '../modes/Rect'
import Poly from '../modes/Poly'

import { save, load } from '../modes/helpers'

export default {
  name: 'Canvas',
  props: {
    file: {
      required: true
    }
  },
  data () {
    return {
      mode: null,
      image: null,
      offset: { x: 0, y: 0, scale: 1 },
      shapes: []
    }
  },
  computed: {
    ...mapGetters(['rois'])
  },
  created () {
    this.$on('setmode', (mode) => {
      this.mode = this.modes[mode]
    })
  },
  mounted () {
    window.addEventListener('resize', debounce(() => {
      this.fixCanvasSize()
      this.$nextTick(() => {
        this.calcOffset()
        this.redraw()
      })
    }))
    this.fixCanvasSize()

    this.createStage()

    this.modes = {
      rect: new Rect(this.$store, this.stage, this),
      poly: new Poly(this.$store, this.stage, this)
    }
    this.renderer = new Renderer(this.$store, this.stage, this)

    if (!this.image) this.loadImage()
  },
  methods: {
    createStage () {
      this.stage = new createjs.Stage('main')

      this.stage.enableDOMEvents(true)
      this.stage.snapToPixelEnabled = true

      this.stage.update()
    },
    loadImage () {
      const reader = new FileReader()
      reader.onload = () => {
        const image = new Image()

        image.src = reader.result

        this.image = new createjs.Bitmap(image)
        this.image.$image = image

        const filename = `${this.file.path}.tsv`
        const rois = load(filename)
        this.stage.addChild(this.image)
        if (rois.length) {
          this.$store.commit('ADD_ROI', rois)
        }
        this.stage.update()
        this.calcOffset()
      }
      reader.readAsDataURL(this.file)
    },
    calcOffset () {
      const canvas = this.$refs.canvas
      const image = this.image.$image
      const x = parseInt((canvas.width - image.width) / 2)
      const y = parseInt((canvas.height - image.height) / 2)
      const w = image.width
      const h = image.height

      this.offset = { x, y, w, h }
    },
    toImage ({ x, y }) {
      return { x: this.toImageX(x), y: this.toImageY(y) }
    },
    toImageX (x) {
      return x - this.offset.x
    },
    toImageY (y) {
      return y - this.offset.y
    },
    toCanvas ({ x, y }) {
      return { x: this.toCanvasX(x), y: this.toCanvasY(y) }
    },
    toCanvasScale (x) {
      if (!isNumber(x)) {
        const { w, h } = x

        return { w: this.toCanvasScale(w), h: this.toCanvasScale(h) }
      }

      return this.offset.scale * x
    },
    toCanvasX (x) {
      return x + this.offset.x
    },
    toCanvasY (y) {
      return y + this.offset.y
    },
    isValidPoint ({ x, y }) {
      const { width, height } = this.image.$image

      return x >= 0 && y >= 0 && x < width && y < height
    },
    redraw () {
      this.image.x = this.offset.x
      this.image.y = this.offset.y

      const shapes = this.rois.map((roi) => this.renderer.drawRoI(roi))
      this.shapes.forEach(shape => this.stage.removeChild(shape))
      this.shapes = shapes
      this.shapes.forEach(shape => this.stage.addChild(shape))

      if (this.mode) this.mode.redraw()

      this.stage.update()
    },
    fixCanvasSize () {
      if (!this.$refs.canvas) return

      const { width, height } = this.$el.getBoundingClientRect()

      this.$refs.canvas.width = width
      this.$refs.canvas.height = height
    }
  },
  watch: {
    file (c, o) {
      if (this.rois.length) {
        const filename = `${o.path}.tsv`

        save(filename, this.rois)
      }
      this.$store.commit('RESET')
      this.createStage()
      this.loadImage()
    },
    mode (mode, old) {
      if (old) old.stop()
      if (mode) {
        mode.start()
        this.$el.classList.add('crosshair')
      } else {
        this.$el.classList.remove('crosshair')
      }
    },
    rois (rois) {
      if (rois.length > this.shapes.length) {
        const paths = rois.slice(this.shapes.length)
        const shapes = paths.map(path => this.renderer.drawRoI(path))

        console.log(`Adding ${paths.length} new rois`)

        shapes.forEach(shape => this.stage.addChild(shape))
        this.shapes.push(...shapes)
        this.stage.update()
      } else if (rois.length < this.shapes.length) {
        const shapes = this.shapes.splice(rois.length)

        shapes.forEach(shape => this.stage.removeChild(shape))
        this.stage.update()
      }
    },
    offset () {
      this.$nextTick(() => this.redraw())
    }
  }
}
</script>

<style>
.canvas-container {
  flex: 1;
}
.canvas-container.crosshair {
  cursor: crosshair;
}
</style>
