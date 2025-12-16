import './bootstrap'
import { createIcons, icons } from 'lucide'

// Make lucide available globally
window.lucide = { createIcons, icons }

// Global Alert System
// Prevent showing duplicate consecutive alerts of the same message/type within a short window
let _lastAlert = { message: null, type: null, ts: 0 }
function showAlert(message, type = 'info', duration = 4000) {
  // Deduplicate identical alerts shown in quick succession (e.g., two flows both reporting success)
  try {
    const now = Date.now()
    if (
      message === _lastAlert.message &&
      type === _lastAlert.type &&
      now - _lastAlert.ts < 1200
    ) {
      return
    }
    _lastAlert = { message, type, ts: now }

    let container = document.getElementById('ui-alert-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'ui-alert-container'
      container.className = 'ui-alert-container'
      document.body.appendChild(container)
    }

    const alertEl = document.createElement('div')
    alertEl.className = `ui-alert ui-alert-${type}`

    // Icon mapping for different alert types
    const iconMap = {
      info: 'info',
      success: 'check-circle',
      warning: 'alert-triangle',
      error: 'alert-circle',
    }

    // Create icon element
    const iconEl = document.createElement('div')
    iconEl.className = 'ui-alert-icon'
    iconEl.innerHTML = `<i data-lucide="${
      iconMap[type] || 'bell'
    }" style="width: 20px; height: 20px;"></i>`

    const text = document.createElement('div')
    text.className = 'ui-alert-text'
    text.textContent = message

    const closeBtn = document.createElement('button')
    closeBtn.className = 'ui-alert-close'
    closeBtn.innerHTML = '✕'
    closeBtn.onclick = () => {
      alertEl.classList.add('ui-alert-hide')
      setTimeout(() => alertEl.remove(), 300)
    }

    // Progress bar for auto-dismiss
    const progressBar = document.createElement('div')
    progressBar.className = 'ui-alert-progress'
    const progressInner = document.createElement('div')
    progressInner.className = 'ui-alert-progress-inner'
    progressBar.appendChild(progressInner)

    alertEl.appendChild(iconEl)
    alertEl.appendChild(text)
    alertEl.appendChild(closeBtn)
    alertEl.appendChild(progressBar)
    container.appendChild(alertEl)

    // Initialize Lucide icons for the new alert
    setTimeout(() => createIcons({ icons }), 10)

    // Trigger entrance animation
    setTimeout(() => alertEl.classList.add('ui-alert-show'), 10)

    // Animate progress bar
    progressInner.style.transition = `width ${duration}ms linear`
    setTimeout(() => (progressInner.style.width = '0%'), 10)

    // Auto remove
    setTimeout(() => {
      if (!alertEl) return
      alertEl.classList.add('ui-alert-hide')
      setTimeout(() => alertEl.remove(), 300)
    }, duration)
  } catch (e) {
    // Fallback to native alert if something goes wrong
    try {
      alert(message)
    } catch (err) {
      console.log('Alert:', message)
    }
  }
}

// Make showAlert globally available
window.showAlert = showAlert
