import Vue from 'vue';
import Vuex from 'vuex';
import isArray from 'lodash/isArray';
import createjs from './modes/create';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    points: [],
    rois: [],
    stroke: createjs.Graphics.getHSL(150, 70, 50),
    fill: createjs.Graphics.getHSL(150, 70, 50, 0.25),
  },
  mutations: {
    ADD_POINT(state, point) {
      state.points.push(point);
    },
    CLEAR_POINTS(state) {
      state.points.splice(0, state.points.length);
    },
    ADD_ROI(state, roi) {
      if (isArray(roi)) {
        state.rois.push(...roi);
      } else {
        state.rois.push(roi);
      }

      const color = [Math.random() * 360, 70 + (Math.random() * 60), 50];
      state.stroke = createjs.Graphics.getHSL(...color);
      state.fill = createjs.Graphics.getHSL(...[...color, 0.25]);
    },
    NEXT_COLOR(state) {
      const color = [Math.random() * 360, 70 + (Math.random() * 60), 50];

      state.stroke = createjs.Graphics.getHSL(...color);
      state.fill = createjs.Graphics.getHSL(...[...color, 0.25]);
    },
    RESET(state) {
      state.points = [];
      state.rois = [];
      state.stroke = createjs.Graphics.getHSL(150, 70, 50);
      state.fill = createjs.Graphics.getHSL(150, 70, 50, 0.25);
    },
  },
  getters: {
    rois(state) {
      return state.rois;
    },
    points(state) {
      return state.points;
    },
    stroke(state) {
      return state.stroke;
    },
    fill(state) {
      return state.fill;
    },
  },
});
