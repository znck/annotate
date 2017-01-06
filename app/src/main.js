import Vue from 'vue';
import Electron from 'vue-electron';
import store from './store';
import App from './App.vue';


Vue.use(Electron);
Vue.config.debug = true;

/* eslint-disable no-new */
new Vue({
  name: 'Annotate',
  store,
  ...App,
}).$mount('#app');
