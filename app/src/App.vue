<template>
  <div class="app-container" @drop.stop.prevent="onDrop" @dragover.prevent="onDragStart" @dragenter.prevent="onDragStart" @dragleave="onDragEnd" @dragend="onDragEnd">
    <div class="controls" v-if="current">
      <button class="btn" type="button" @click="$refs.canvas.$emit('setmode', 'rect')">Rect</button>
      <button class="btn" type="button" @click="$refs.canvas.$emit('setmode', 'poly')">FreeForm</button>
      <button class="btn" type="button" @click="prev">Prev</button>
      <span style="padding: 5px 10px">{{ index + 1 }} of {{ files.length }}</span>
      <button class="btn" type="button" @click="next">Next</button>
    </div>
    <div class="workarea">
      <div class="dropzone" v-if="hasDragOver">
        Has Files!
      </div>
      <canvas-box v-if="current && !hasDragOver" :file="current" ref="canvas"></canvas-box>
    </div>
  </div>
</template>

<script>
import CanvasBox from './components/Canvas.vue'

export default {
  components: {
    CanvasBox
  },
  data () {
    return {
      files: [],
      index: 0,
      hasDragOver: false
    }
  },
  computed: {
    current () {
      return this.files[this.index]
    }
  },
  methods: {
    onDragStart () {
      if (this.hasDragOver === false) this.hasDragOver = true
    },
    onDragEnd () {
      this.hasDragOver = false
    },
    onDrop (event) {
      this.onDragEnd()

      this.files.push(...event.dataTransfer.files)
    },
    prev () {
      if (this.index > 0) this.index -= 1
    },
    next () {
      if (this.index < this.files.length - 1) this.index += 1
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
}

html,
body { height: 100%; }

.app-container {
  display: flex;
  height: 100%;
  flex-direction: column;
}
.workarea {
  flex: 1;
  display: flex;
}
.controls {
  padding: 8px;
}
.btn {
  color: #454545;
  padding: 5px 16px;
  margin: 0 4px;
  cursor: pointer;
  background: transparent;
  border: 1px solid #cfcfcf;
}
.btn.active {
  background: #cfcfcf;
}
.btn:hover {
  background: #efefef;
}
</style>
