import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import FontAwesomeIcon from '@/assets/fontawesome'

const app = createApp(App)

app.use(createPinia())
app.component("FontAwesomeIcon", FontAwesomeIcon)

app.mount('body')
