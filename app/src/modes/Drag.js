export default class Delete {
  constructor(store, stage, vm) {
    this.store = store;
    this.state = store.state;
    this.stage = stage;
    this.vm = vm;
    this.shortcut = 'd';
    this.dragging = false;
    this.offset = { };
    this.point = { x: 0, y: 0 };

    this.stage.on('stagemouseup', () => {
      if (!this.active) return;
      this.dragging = false;
      this.vm.$el.classList.remove('dragging');
    });
    this.stage.on('stagemousedown', (event) => {
      if (!this.active) return;
      this.dragging = true;
      this.vm.$el.classList.add('dragging');
      this.offset = {
        x: this.vm.offset.x,
        y: this.vm.offset.y,
      };
      this.point = {
        x: event.stageX,
        y: event.stageY,
      };
    });
    this.stage.on('stagemousemove', (event) => {
      if (!this.active) return;
      if (!this.dragging) return;

      this.vm.offset.x = (event.stageX - this.point.x) + this.offset.x;
      this.vm.offset.y = (event.stageY - this.point.y) + this.offset.y;
    });
  }

  start() {
    // console.log('Poly - start');
    this.active = true;
  }

  stop() {
    // console.log('Poly - stop');
    this.active = false;
    this.dragging = false;
  }

  redraw() {}
}
