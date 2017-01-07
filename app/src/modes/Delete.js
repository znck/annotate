export default class Delete {
  constructor(store, stage, vm) {
    this.store = store;
    this.state = store.state;
    this.stage = stage;
    this.vm = vm;
    this.shortcut = 'd';

    this.vm.$on('shape.click', (event, { index }) => {
      if (!this.active) return;

      if (event.nativeEvent.button !== 0) return;

      this.store.commit('REMOVE_ROI', index);
    });
  }

  start() {
    // console.log('Poly - start');
    this.active = true;
  }

  stop() {
    // console.log('Poly - stop');
    this.active = false;
  }

  redraw() {}
}
