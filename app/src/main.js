import Vue from 'vue'
import Electron from 'vue-electron'
import store from './store'

Vue.use(Electron)
Vue.config.debug = true

import App from './App'

/* eslint-disable no-new */
new Vue({
  store,
  ...App
}).$mount('#app')
