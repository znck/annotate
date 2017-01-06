<template>
  <div class="app-container" @drop.stop.prevent="onDrop" @dragover.prevent="onDragStart" @dragenter.prevent="onDragStart" @dragleave="onDragEnd" @dragend="onDragEnd">
    <div class="controls" v-if="current">
      <div class="btn-group" data-toggle="buttons">
        <label class="btn btn-outline-secondary mb-0" :class="{ active: mode === 'none' }">
          <input type="radio" value="none" v-model="mode"> None
        </label>
        <label class="btn btn-outline-secondary mb-0" :class="{ active: mode === 'rect' }">
          <input type="radio" value="rect" v-model="mode"> Rect
        </label>
        <label class="btn btn-outline-secondary mb-0" :class="{ active: mode === 'poly' }">
          <input type="radio" value="poly" v-model="mode"> FreeForm
        </label>
      </div>

      <div class="btn-group float-right">
        <a href class="btn btn-outline-secondary" @click.prevent="prev">Save &amp; Prev</a>
        <a class="btn btn-outline-secondary">{{ index + 1 }} of {{ files.length }}</a>
        <a href class="btn btn-outline-secondary" @click.prevent="next">Save &amp; Next</a>
      </div>
    </div>
    <div class="workarea">
      <dropzone v-if="hasDragOver"></dropzone>
      <placeholder v-if="!hasDragOver && files.length === 0"></placeholder>
      <canvas-box v-if="current && !hasDragOver" :file="current" :action="mode" ref="canvas"></canvas-box>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import unique from 'lodash/array/unique';
import fs from 'fs';
import glob from 'glob';

import CanvasBox from './components/Canvas.vue';
import Placeholder from './components/Placeholder.vue';
import Dropzone from './components/Dropzone.vue';

export default {
  components: {
    CanvasBox,
    Dropzone,
    Placeholder,
  },
  data() {
    return {
      files: [],
      index: 0,
      mode: 'none',
      hasDragOver: false,
    };
  },
  created() {
    ipcRenderer.on('onOpen', (_, paths) => {
      this.onOpen(paths);
    });
  },
  computed: {
    current() {
      return this.files[this.index];
    },
  },
  methods: {
    onDragStart() {
      if (this.hasDragOver === false) this.hasDragOver = true;
    },
    onDragEnd() {
      this.hasDragOver = false;
    },
    onDrop(event) {
      this.onDragEnd();

      const files = [];

      for (let i = 0; i < event.dataTransfer.files.length; i += 1) {
        files.push(event.dataTransfer.files[i].path);
      }

      if (files.length) {
        this.onOpen(files);
      }
    },
    onOpen(paths) {
      const dirs = paths.filter(path => fs.statSync(path).isDirectory());
      this.files.push(...paths.filter(path => fs.statSync(path).isFile())
                              .filter(file => this.isImage(file)));
      if (dirs.length) {
        dirs.forEach((dir) => {
          const files = glob.sync(`${dir}/*`);
          this.files.push(...files.filter(path => fs.statSync(path).isFile())
                                  .filter(file => this.isImage(file)));
        });
      }

      this.files = unique(this.files);
    },
    isImage(file) {
      return /(png|jpg|tiff|jpeg|bmp)$/i.test(file);
    },
    prev() {
      if (this.index > 0) this.index -= 1;
    },
    next() {
      if (this.index < this.files.length - 1) this.index += 1;
    },
  },
};
</script>

<style lang="scss">
$enable-rounded:            false;
$enable-shadows:            false;
$enable-gradients:          false;
$enable-transitions:        true ;
$enable-hover-media-query:  false;
$enable-grid-classes:       true;
$enable-print-styles:       true;
$font-family-base: inherit;

$btn-secondary-border: #777;

@import '../node_modules/bootstrap/scss/bootstrap';

* {
  margin: 0;
  padding: 0;
}

html,
body { height: 100%; font-size: 14px; }

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
  cursor: pointer;
}
</style>
