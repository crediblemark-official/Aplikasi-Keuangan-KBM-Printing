import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
/* Ionic Core CSS */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

import './style.css'

const app = createApp(App)

app.use(IonicVue, {
  mode: 'md',
  animated: true,
})
app.use(createPinia())
app.use(router)

router.isReady().then(() => {
  app.mount('#app')
})
