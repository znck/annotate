import Vue from 'vue';
import Vuex from 'vuex';
import isArray from 'lodash/isArray';
import _ from 'lodash';
import createjs from './modes/create';

Vue.use(Vuex);

export const historyPlugin = (store) => {
  const save = (state, type) => ({
    __mutaion: type,
    ..._.cloneDeep(state),
  });

  const restore = (state) => {
    store.commit('__RESTORE_STATE__', _.cloneDeep(state));
  };

  const watching = ['ADD_POINT', 'ADD_ROI', 'REMOVE_ROI', 'SET_MODE'];
  let history = [save(store.state)];
  let position = 0;

  store.subscribe(({ type }, state) => {
    if (type === 'RESET') {
      history = history.splice(0, 1);
      position = 0;
    } else if (watching.indexOf(type) > -1) {
      history = history.splice(0, position + 1);
      history.push(save(state, type));
      position += 1;
    }
  });

  historyPlugin.undo = () => {
    if (position > 0) {
      position -= 1;
      restore(history[position]);
    }
  };

  historyPlugin.redo = () => {
    if (position < history.length - 1) {
      position += 1;
      restore(history[position]);
    }
  };
};

let id = 0;

export default new Vuex.Store({
  plugins: [historyPlugin],
  state: {
    points: [],
    rois: [],
    stroke: createjs.Graphics.getHSL(150, 70, 50),
    fill: createjs.Graphics.getHSL(150, 70, 50, 0.25),
    mode: 'none',
  },
  mutations: {
    __RESTORE_STATE__(state, { points, rois, stroke, fill, mode }) {
      state.points = points;
      state.rois = rois;
      state.stroke = stroke;
      state.fill = fill;
      state.mode = mode;
    },
    ADD_POINT(state, point) {
      state.points.push(point);
    },
    CLEAR_POINTS(state) {
      state.points.splice(0, state.points.length);
    },
    ADD_ROI(state, roi) {
      const rois = isArray(roi) ? roi : [roi];

      state.rois.push(...rois.map((r) => {
        r.id = id;
        id += 1;

        return r;
      }));

      const color = [Math.random() * 360, 70 + (Math.random() * 60), 50];
      state.stroke = createjs.Graphics.getHSL(...color);
      state.fill = createjs.Graphics.getHSL(...[...color, 0.25]);
    },
    REMOVE_ROI(state, index) {
      state.rois.splice(index, 1);
    },
    NEXT_COLOR(state) {
      const color = [Math.random() * 360, 70 + (Math.random() * 60), 50];

      state.stroke = createjs.Graphics.getHSL(...color);
      state.fill = createjs.Graphics.getHSL(...[...color, 0.25]);
    },
    SET_MODE(state, mode) {
      state.mode = mode;
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
    mode(state) {
      return state.mode;
    },
  },
  actions: {
    setMode({ commit, state }, mode) {
      if (state.mode === mode) return;
      commit('SET_MODE', mode);
    },
  },
});
