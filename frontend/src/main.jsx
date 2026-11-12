import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setupIonicReact } from '@ionic/react'

// Ionic core + utility CSS. Imported before index.css so the app's own
// rules win where they overlap.
import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

// The app is dark-themed by design, so force Ionic's dark palette
// instead of following the OS setting.
import '@ionic/react/css/palettes/dark.class.css'

import './index.css'
import App from './App.jsx'

setupIonicReact()
document.documentElement.classList.add('ion-palette-dark')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
