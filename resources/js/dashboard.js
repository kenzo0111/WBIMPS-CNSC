// Dashboard JavaScript Application

import { jsPDF } from 'jspdf'

// Safety fallbacks: if some edits were reverted or partial bundles loaded,
// define minimal fallbacks to prevent ReferenceErrors at runtime.
// Use safe checks against the window object to avoid referencing
// identifiers that may be declared later in the same module (TDZ).
if (typeof window !== 'undefined') {
  if (typeof window.LS_KEYS === 'undefined') {
    window.LS_KEYS = {
      PRODUCTS: 'spmo_products',
      STOCK_IN: 'spmo_stock_in',
      STOCK_OUT: 'spmo_stock_out',
    }
  }

  if (typeof window.stockInData === 'undefined') window.stockInData = []
  if (typeof window.stockOutData === 'undefined') window.stockOutData = []

  if (typeof window.lsAvailable === 'undefined') {
    // Persistence disabled: localStorage should not be used by the dashboard
    window.lsAvailable = function () {
      return false
    }
  }

  if (typeof window.toggleDeliveryDateOther === 'undefined') {
    window.toggleDeliveryDateOther = function (selectElement) {
      try {
        const otherInput = document.getElementById('po-delivery-date-other')
        if (!otherInput) return
        if (selectElement && selectElement.value === 'others') {
          otherInput.style.display = 'block'
          otherInput.focus()
        } else {
          otherInput.style.display = 'none'
          otherInput.value = ''
        }
      } catch (err) {
        console.warn('toggleDeliveryDateOther fallback error', err)
      }
    }
  }

  if (typeof window.toggleDeliveryDateOtherModal === 'undefined') {
    window.toggleDeliveryDateOtherModal = function (selectElement) {
      try {
        const otherInput = document.getElementById('deliveryDateOther')
        if (!otherInput) return
        if (selectElement && selectElement.value === 'others') {
          otherInput.style.display = 'block'
          otherInput.focus()
        } else {
          otherInput.style.display = 'none'
          otherInput.value = ''
        }
      } catch (err) {
        console.warn('toggleDeliveryDateOtherModal fallback error', err)
      }
    }
  }
}

// Initialize Lucide icons and load user logs
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons()
  // Load session/logs/users from in-memory state (persistence disabled)
  loadUserSession()
  loadUserLogs()
  loadUsers()
  // Load persisted notifications (if any) and update badge
  try {
    if (typeof loadNotifications === 'function') loadNotifications()
    if (typeof updateNotificationBadge === 'function') updateNotificationBadge()
  } catch (e) {}
  // Load persisted status requests
  try {
    if (typeof loadStatusRequests === 'function') loadStatusRequests()
  } catch (e) {}
})

// Application State
const AppState = {
  currentPage: 'dashboard',
  expandedMenus: ['inventory'],
  currentModal: null,
  // current logged in user (basic profile)
  currentUser: {
    id: 'SA000',
    name: 'John Doe',
    email: 'john.doe@cnsc.edu.ph',
    role: 'Student Assistant',
    department: 'IT',
    status: 'Active',
    created: new Date().toISOString().split('T')[0],
  },
  currentProductTab: 'expendable',
  productSearchTerm: '',
  productSortBy: 'Sort By',
  productFilterBy: 'Filter By',
  lowStockThreshold: 20,
  purchaseOrderItems: [
    {
      id: '1',
      stockPropertyNumber: '',
      unit: '',
      description: '',
      detailedDescription: '',
      quantity: 0,
      currentStock: 0,
      unitCost: 0,
      amount: 0,
      generateICS: false,
      generateRIS: false,
      generatePAR: false,
      generateIAR: false,
    },
  ],
  // Wizard step for multi-step PO creation (1-4)
  purchaseOrderWizardStep: 1,
  // Temp storage for multi-step PO wizard field values so they persist between steps
  purchaseOrderDraft: {},

  // ✅ add these for real data
  newRequests: [],
  pendingRequests: [],
  completedRequests: [],
  notifications: [
    {
      id: 'n1',
      title: 'New requisition submitted',
      message: 'REQ-2025-006 has been submitted for approval',
      time: '2h ago',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      type: 'info',
      icon: 'file-plus',
    },
    {
      id: 'n2',
      title: 'Stock level low: Paper A4',
      message: 'Current stock: 15 units. Reorder level: 20 units',
      time: '1d ago',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: false,
      type: 'warning',
      icon: 'alert-triangle',
    },
    {
      id: 'n3',
      title: 'PO #1234 approved',
      message: 'Purchase order has been approved by admin',
      time: '3d ago',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      type: 'success',
      icon: 'check-circle',
    },
    {
      id: 'n4',
      title: 'Stock In completed',
      message: '50 units of Ballpoint Pen received',
      time: '5d ago',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
      type: 'success',
      icon: 'package-check',
    },
  ],
  // Unified status list (replaces hardcoded table rows in status management)
  statusRequests: [],
  currentStatusFilter: 'all',

  // About Us Content
  aboutUsContent: null,
}

function getCsrfToken() {
  const tokenMeta = document.querySelector('meta[name="csrf-token"]')
  return tokenMeta ? tokenMeta.getAttribute('content') : ''
}

// Convert a variety of input date formats to an ISO date string (yyyy-mm-dd)
// If input is blank, unknown, or a textual term like 'Within 30 Days', return null.
function normalizeDateForServer(value) {
  if (!value) return null
  try {
    // If it's already a Date object
    if (value instanceof Date && !isNaN(value)) {
      return value.toISOString().split('T')[0]
    }

    // Trim and normalize strings
    const s = String(value).trim()
    if (s.length === 0) return null

    // Common non-date textual values we should not send to Carbon
    const blacklist = [
      'within 30 days',
      'within 7 days',
      'as soon as possible',
      'tbd',
      'to be determined',
      'n/a',
      'na',
    ]
    if (blacklist.includes(s.toLowerCase())) return null

    // If value looks like a number (unix timestamp)
    if (/^\d+$/.test(s)) {
      const n = Number(s)
      // assume seconds if 10 digits, milliseconds if 13
      const date = s.length === 10 ? new Date(n * 1000) : new Date(n)
      if (!isNaN(date)) return date.toISOString().split('T')[0]
    }

    // Try Date.parse
    const parsed = Date.parse(s)
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().split('T')[0]
    }

    // Last resort: try to extract a yyyy-mm-dd pattern
    const m = s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/)
    if (m) {
      const y = m[1]
      const mo = m[2].padStart(2, '0')
      const d = m[3].padStart(2, '0')
      return `${y}-${mo}-${d}`
    }

    // Not parseable: return null so server won't attempt Carbon::parse on chaotic text
    return null
  } catch (e) {
    return null
  }
}

// Pagination defaults (extendable) for Login Activity Logs
AppState.loginActivityPage = 1
AppState.loginActivityPageSize = 10 // show 10 records per page by default

// Minimal Mock Data container (clean slate)
const MockData = {
  inventory: [],
  categories: [],
  products: [],
  newRequests: [],
  pendingRequests: [],
  completedRequests: [],
  userLogs: [],
  users: [],
}

// ==============================
// Local Storage Persistence Layer
// ==============================
const LS_KEYS = {
  PRODUCTS: 'spmo_products',
  STOCK_IN: 'spmo_stock_in',
  STOCK_OUT: 'spmo_stock_out',
}

// Initialize in-memory stock datasets early so persistence loader can assign safely
let stockInData = []
let stockOutData = []

// Disable localStorage usage for a clean dashboard (no client-side persistence)
function lsAvailable() {
  return false
}

function persistProducts() {
  // no-op (persistence disabled)
}
function persistStockIn() {
  // no-op (persistence disabled)
}
function persistStockOut() {
  // no-op (persistence disabled)
}

function loadPersistedInventoryData() {
  // no-op: persistence disabled, start with clean in-memory sets
  MockData.products = MockData.products || []
  stockInData = []
  stockOutData = []
  return
}

// Initialize with no persisted data
loadPersistedInventoryData()

// ==============
// Status Requests Persistence
// ==============
// Status requests are kept in-memory only (do not persist to localStorage).
// This removes reliance on browser storage for Status Management and keeps
// data in the running AppState. If persistence is needed later, replace
// these helpers with a server-side save/load or another persistence strategy.
function loadStatusRequests() {
  // Ensure the property exists and is an array
  if (!Array.isArray(AppState.statusRequests)) AppState.statusRequests = []
  return AppState.statusRequests
}

function saveStatusRequests() {
  // No-op: intentionally avoid localStorage. Keep AppState.statusRequests in-memory.
  if (!Array.isArray(AppState.statusRequests)) AppState.statusRequests = []
  return AppState.statusRequests
}

// --- Inventory Synchronization Helpers ---
// Low stock notification tracking
AppState.lowStockAlertedIds = AppState.lowStockAlertedIds || []

function maybeNotifyLowStock(product) {
  const threshold = AppState.lowStockThreshold || 20
  if (!product || !product.id) return
  const currentQty = Number(product.quantity) || 0
  const already = AppState.lowStockAlertedIds.includes(product.id)
  if (currentQty < threshold && !already) {
    // push notification (use persistent API when available)
    try {
      if (typeof createNotification === 'function') {
        createNotification({
          title: 'Low stock: ' + product.name,
          message: `${product.name} has only ${currentQty} left (Threshold: ${threshold})`,
          type: 'warning',
          icon: 'alert-triangle',
        })
      } else {
        addNotification(
          'Low stock: ' + product.name,
          `${product.name} has only ${currentQty} left (Threshold: ${threshold})`,
          'warning',
          'alert-triangle'
        )
      }
    } catch (e) {
      // fallback to non-persistent addNotification
      try {
        addNotification(
          'Low stock: ' + product.name,
          `${product.name} has only ${currentQty} left (Threshold: ${threshold})`,
          'warning',
          'alert-triangle'
        )
      } catch (err) {}
    }
    AppState.lowStockAlertedIds.push(product.id)
  } else if (currentQty >= threshold && already) {
    // remove from alerted so future drops will alert again
    AppState.lowStockAlertedIds = AppState.lowStockAlertedIds.filter(
      (id) => id !== product.id
    )
  }
}

function findProductBySku(sku) {
  if (!sku) return null
  return (MockData.products || []).find((p) => p.id === sku.trim())
}

function recalcProductValue(product) {
  if (!product) return
  const qty = Number(product.quantity) || 0
  const uc = Number(product.unitCost) || 0
  product.totalValue = qty * uc
}

function adjustInventoryOnStockIn(newRecord, oldRecord) {
  const product = findProductBySku(newRecord.sku)
  if (!product) return // silently ignore if sku not in products list
  const prevQty = oldRecord ? Number(oldRecord.quantity) || 0 : 0
  const delta = (Number(newRecord.quantity) || 0) - prevQty // add difference
  if (delta !== 0) {
    product.quantity = (Number(product.quantity) || 0) + delta
    // Optionally update unitCost if changed (keep the latest cost as reference)
    if (newRecord.unitCost && newRecord.unitCost !== product.unitCost) {
      product.unitCost = newRecord.unitCost
    }
    recalcProductValue(product)
    maybeNotifyLowStock(product)
    persistProducts()
    // Notify stock in updated
    try {
      const title = `Stock In Updated: ${newRecord.transactionId}`
      const msg = `Updated ${newRecord.quantity} of ${newRecord.productName}`
      if (typeof createNotification === 'function') {
        createNotification({
          title,
          message: msg,
          type: 'info',
          icon: 'package',
        })
      } else {
        addNotification(title, msg, 'info', 'package')
      }
    } catch (e) {}
    // create server-side activity (best-effort)
    try {
      postActivity(
        `Stock In: ${
          newRecord.productName || newRecord.product_name || newRecord.sku || ''
        }`,
        {
          transactionId: newRecord.transactionId || newRecord.id || null,
          sku: newRecord.sku,
          quantity: newRecord.quantity,
        }
      )
    } catch (e) {}
  }
}

// Post activity to server for client-side events (non-blocking)
async function postActivity(action, meta = {}) {
  try {
    const url =
      (window.APP_ROUTES && window.APP_ROUTES.activities) || '/api/activities'
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': (function () {
          const m = document.querySelector('meta[name="csrf-token"]')
          return m ? m.getAttribute('content') : ''
        })(),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ action, meta }),
    })
  } catch (e) {
    console.warn('postActivity failed', e)
  }
}

function adjustInventoryOnStockOut(newRecord, oldRecord) {
  const product = findProductBySku(newRecord.sku)
  if (!product) return
  const prevQty = oldRecord ? Number(oldRecord.quantity) || 0 : 0
  const delta = (Number(newRecord.quantity) || 0) - prevQty // positive if new uses more
  if (delta !== 0) {
    // delta represents change in issued quantity; subtract that from inventory
    product.quantity = Math.max(0, (Number(product.quantity) || 0) - delta)
    recalcProductValue(product)
    maybeNotifyLowStock(product)
    persistProducts()
    // create server-side activity (best-effort)
    try {
      postActivity(
        `Stock Out: ${
          newRecord.productName || newRecord.product_name || newRecord.sku || ''
        }`,
        {
          transactionId: newRecord.transactionId || newRecord.id || null,
          sku: newRecord.sku,
          quantity: newRecord.quantity,
        }
      )
    } catch (e) {}
  }
}

function restoreInventoryFromDeletedStockIn(record) {
  const product = findProductBySku(record?.sku)
  if (!product) return
  product.quantity = Math.max(
    0,
    (Number(product.quantity) || 0) - (Number(record.quantity) || 0) + 0
  ) // removal of an addition => subtract quantity
  recalcProductValue(product)
  maybeNotifyLowStock(product)
  persistProducts()
  try {
    postActivity(
      `Stock In deleted: ${
        record.productName || record.product_name || record.sku || ''
      }`,
      {
        transactionId: record.transactionId || record.id || null,
        sku: record.sku,
        quantity: record.quantity,
      }
    )
  } catch (e) {}
}

function restoreInventoryFromDeletedStockOut(record) {
  const product = findProductBySku(record?.sku)
  if (!product) return
  // Deleting a stock-out means we should add the issued quantity back
  product.quantity =
    (Number(product.quantity) || 0) + (Number(record.quantity) || 0)
  recalcProductValue(product)
  maybeNotifyLowStock(product)
  persistProducts()
  try {
    postActivity(
      `Stock Out deleted: ${
        record.productName || record.product_name || record.sku || ''
      }`,
      {
        transactionId: record.transactionId || record.id || null,
        sku: record.sku,
        quantity: record.quantity,
      }
    )
  } catch (e) {}
}

function refreshProductsViewIfOpen() {
  // If current page is products, re-render to reflect counts
  const productsSection = document.querySelector('.product-tabs')
  if (productsSection) {
    loadPageContent('products')
  }
  // Also refresh metrics if on dashboard
  if (AppState.currentPage === 'dashboard') {
    loadPageContent('dashboard')
  }
}
// --- End Inventory Synchronization Helpers ---

// Utility Functions
function formatCurrency(amount) {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function getBadgeClass(status, type = 'status') {
  const badgeClasses = {
    status: {
      active: 'badge green',
      inactive: 'badge gray',
      draft: 'badge gray',
      submitted: 'badge blue',
      pending: 'badge yellow',
      'under-review': 'badge blue',
      'awaiting-approval': 'badge orange',
      approved: 'badge blue',
      delivered: 'badge green',
      completed: 'badge emerald',
      incoming: 'badge purple',
      received: 'badge blue',
      finished: 'badge emerald',
      cancelled: 'badge red',
      returned: 'badge orange',
    },
    priority: {
      urgent: 'badge red',
      high: 'badge orange',
      medium: 'badge yellow',
      low: 'badge green',
    },
    payment: {
      paid: 'badge green',
      pending: 'badge yellow',
      partial: 'badge orange',
    },
  }

  return badgeClasses[type][status] || 'badge gray'
}

// Helper function to get status background color
function getStatusColor(status) {
  const statusColors = {
    active: '#10b981',
    inactive: '#6b7280',
    draft: '#6b7280',
    submitted: '#3b82f6',
    pending: '#eab308',
    'under-review': '#3b82f6',
    'awaiting-approval': '#f97316',
    approved: '#3b82f6',
    delivered: '#10b981',
    completed: '#059669',
    received: '#3b82f6',
    finished: '#059669',
    cancelled: '#dc2626',
  }
  return statusColors[status] || '#6b7280'
}

// UI Alert / Toast helper
function showAlert(message, type = 'info', duration = 4000) {
  try {
    let container = document.getElementById('ui-alert-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'ui-alert-container'
      container.className = 'ui-alert-container'
      document.body.appendChild(container)
    }

    const alertEl = document.createElement('div')
    alertEl.className = `ui-alert ui-alert-${type}`
    alertEl.setAttribute('role', 'status')

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

    alertEl.appendChild(text)
    alertEl.appendChild(closeBtn)
    container.appendChild(alertEl)

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

// User Login Logging Function
function logUserLogin(email, name, status = 'Success') {
  try {
    if (!window.MockData) window.MockData = {}
    if (!window.MockData.userLogs) window.MockData.userLogs = []

    // Update user status to Active on successful login
    if (status === 'Success') {
      updateUserStatus(email, 'Active')
    }

    // Generate unique log ID
    const logId =
      'LOG' + String(window.MockData.userLogs.length + 1).padStart(3, '0')

    // Get current timestamp
    const now = new Date()
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19)

    // Detect device info (basic detection)
    const userAgent = navigator.userAgent
    let device = 'Unknown Device'
    if (userAgent.indexOf('Windows') !== -1) device = 'Windows PC'
    else if (userAgent.indexOf('Mac') !== -1) device = 'MacBook'
    else if (userAgent.indexOf('Linux') !== -1) device = 'Linux PC'
    else if (userAgent.indexOf('Android') !== -1) device = 'Android Device'
    else if (
      userAgent.indexOf('iPhone') !== -1 ||
      userAgent.indexOf('iPad') !== -1
    )
      device = 'iOS Device'

    // Create log entry
    const logEntry = {
      id: logId,
      email: email || 'unknown@cnsc.edu.ph',
      name: name || 'Unknown User',
      action: 'Login',
      timestamp: timestamp,
      ipAddress: 'N/A', // In production, this would come from server
      device: device,
      status: status,
    }

    // Add to beginning of logs array (newest first)
    window.MockData.userLogs.unshift(logEntry)

    // Keep only last 100 logs to prevent memory issues
    if (window.MockData.userLogs.length > 100) {
      window.MockData.userLogs = window.MockData.userLogs.slice(0, 100)
    }

    // Persistence disabled: keep logs in-memory only

    console.log('User login logged:', logEntry)
    return logEntry
  } catch (error) {
    console.error('Error logging user login:', error)
    return null
  }
}

// Update user status in MockData.users
function updateUserStatus(email, status) {
  try {
    if (!window.MockData) window.MockData = {}
    if (!window.MockData.users) window.MockData.users = []

    // Find user by email and update status
    const user = window.MockData.users.find((u) => u.email === email)
    if (user) {
      user.status = status
      console.log(`User ${email} status updated to ${status}`)

      // Persistence disabled: keep user status in-memory only
    }
  } catch (error) {
    console.error('Error updating user status:', error)
  }
}

// Log user logout
function logUserLogout(email, name) {
  try {
    if (!window.MockData) window.MockData = {}
    if (!window.MockData.userLogs) window.MockData.userLogs = []

    // Update user status to Inactive on logout
    updateUserStatus(email, 'Inactive')

    // Generate unique log ID
    const logId =
      'LOG' + String(window.MockData.userLogs.length + 1).padStart(3, '0')

    // Get current timestamp
    const now = new Date()
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19)

    // Detect device info
    const userAgent = navigator.userAgent
    let device = 'Unknown Device'
    if (userAgent.indexOf('Windows') !== -1) device = 'Windows PC'
    else if (userAgent.indexOf('Mac') !== -1) device = 'MacBook'
    else if (userAgent.indexOf('Linux') !== -1) device = 'Linux PC'
    else if (userAgent.indexOf('Android') !== -1) device = 'Android Device'
    else if (
      userAgent.indexOf('iPhone') !== -1 ||
      userAgent.indexOf('iPad') !== -1
    )
      device = 'iOS Device'

    // Create logout log entry
    const logEntry = {
      id: logId,
      email: email || 'unknown@cnsc.edu.ph',
      name: name || 'Unknown User',
      action: 'Logout',
      timestamp: timestamp,
      ipAddress: 'N/A',
      device: device,
      status: 'Success',
    }

    // Add to beginning of logs array
    window.MockData.userLogs.unshift(logEntry)

    // Keep only last 100 logs
    if (window.MockData.userLogs.length > 100) {
      window.MockData.userLogs = window.MockData.userLogs.slice(0, 100)
    }

    // Persistence disabled: keep logs in-memory only

    console.log('User logout logged:', logEntry)
    return logEntry
  } catch (error) {
    console.error('Error logging user logout:', error)
    return null
  }
}

// Load user logs (no persistence) - keep existing in-memory MockData.userLogs
function loadUserLogs() {
  if (!window.MockData) window.MockData = {}
  window.MockData.userLogs = window.MockData.userLogs || []
  return window.MockData.userLogs
}

// Load users (no persistence) - keep users in-memory only
function loadUsers() {
  if (!window.MockData) window.MockData = {}
  window.MockData.users = window.MockData.users || []
  return window.MockData.users
}

// Load user session from localStorage and update AppState
function loadUserSession() {
  try {
    if (window.CURRENT_USER) {
      const session = {
        id: window.CURRENT_USER.id || 'GUEST',
        name: window.CURRENT_USER.name || 'Guest User',
        email: window.CURRENT_USER.email || '',
        role: window.CURRENT_USER.role || 'User',
        department: window.CURRENT_USER.department || 'N/A',
        loginTime: new Date().toISOString(),
      }

      AppState.currentUser = {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
        department: session.department,
        status: 'Active',
        created: session.loginTime.split('T')[0],
      }

      // Persistence disabled: session kept in AppState only

      updateUserDisplay()
      return
    }

    // Persistence disabled: keep default AppState.currentUser (or window.CURRENT_USER handled above)
  } catch (error) {
    console.error('Error loading user session:', error)
  }
}

// Update user display in the header
function updateUserDisplay() {
  const userAvatar = document.getElementById('header-user-avatar')
  if (userAvatar && AppState.currentUser) {
    const initials = AppState.currentUser.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
    userAvatar.textContent = initials
    userAvatar.title = AppState.currentUser.name
  }

  // Reinitialize Lucide icons after updating display
  setTimeout(() => {
    if (window.lucide) {
      lucide.createIcons()
    }
  }, 100)
}

// Confirmation modal helper that returns a Promise<boolean>
function showConfirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    let modal = document.getElementById('confirm-modal')
    if (!modal) {
      // Fallback quickly
      try {
        resolve(window.confirm(message))
      } catch (e) {
        resolve(false)
      }
      return
    }

    const msgEl = modal.querySelector('#confirm-message')
    const titleEl = modal.querySelector('#confirm-title')
    const okBtn = modal.querySelector('#confirm-ok')
    const cancelBtn = modal.querySelector('#confirm-cancel')

    titleEl.textContent = title
    msgEl.textContent = message

    function cleanup(result) {
      modal.classList.remove('active')
      okBtn.removeEventListener('click', onOk)
      cancelBtn.removeEventListener('click', onCancel)
      document.removeEventListener('keydown', onKeyDown)
      resolve(result)
    }

    function onOk() {
      cleanup(true)
    }
    function onCancel() {
      cleanup(false)
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        cleanup(false)
      }
      if (e.key === 'Enter') {
        cleanup(true)
      }
    }

    okBtn.addEventListener('click', onOk)
    cancelBtn.addEventListener('click', onCancel)
    document.addEventListener('keydown', onKeyDown)

    modal.classList.add('active')
  })
}

// closeConfirm used by close button in markup
function closeConfirm(value = false) {
  const modal = document.getElementById('confirm-modal')
  if (!modal) return
  modal.classList.remove('active')
  // trigger no-op: showConfirm's event listeners will resolve when removed
}

window.showConfirm = showConfirm
window.closeConfirm = closeConfirm

// Safe capitalization helper (handles undefined/null)
function capitalize(s) {
  if (!s) return '-'
  return String(s).charAt(0).toUpperCase() + String(s).slice(1)
}

// Load user requests from localStorage and merge with AppState.statusRequests
function loadUserRequests() {
  // Persistence disabled: do not read user requests from localStorage.
  // AppState.statusRequests should be managed by server-side data or other in-memory flows.
  return []
}

function renderNotifications() {
  const listEl = document.getElementById('notifications-list')
  const badge = document.getElementById('notifications-badge')
  if (!listEl || !badge) return

  listEl.innerHTML = ''
  const unread = (AppState.notifications || []).filter((n) => !n.read).length
  badge.style.display = unread > 0 ? 'flex' : 'none'
  badge.textContent = unread > 9 ? '9+' : unread

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...(AppState.notifications || [])].sort(
    (a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp) : new Date()
      const timeB = b.timestamp ? new Date(b.timestamp) : new Date()
      return timeB - timeA
    }
  )

  if (sortedNotifications.length === 0) {
    listEl.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #9ca3af;">
                <i data-lucide="bell-off" style="width: 48px; height: 48px; margin: 0 auto 12px; opacity: 0.5;"></i>
                <p style="margin: 0; font-size: 14px;">No notifications</p>
            </div>
        `
    lucide.createIcons()
    return
  }

  sortedNotifications.forEach((n) => {
    const typeConfig = {
      success: { bg: '#ecfdf5', iconColor: '#10b981', borderColor: '#6ee7b7' },
      warning: { bg: '#fef3c7', iconColor: '#f59e0b', borderColor: '#fcd34d' },
      error: { bg: '#fee2e2', iconColor: '#ef4444', borderColor: '#fca5a5' },
      info: { bg: '#dbeafe', iconColor: '#3b82f6', borderColor: '#93c5fd' },
    }

    const config = typeConfig[n.type] || typeConfig.info
    const isUnread = !n.read

    const item = document.createElement('div')
    item.className = 'notification-item'
    item.style.cssText = `
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            gap: 12px;
            align-items: flex-start;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            background: ${isUnread ? config.bg : '#ffffff'};
            border-left: 3px solid ${
              isUnread ? config.borderColor : 'transparent'
            };
            position: relative;
        `

    item.innerHTML = `
            <div style="flex-shrink: 0; width: 36px; height: 36px; background: ${
              config.bg
            }; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid ${
      config.borderColor
    };">
                <i data-lucide="${
                  n.icon || 'bell'
                }" style="width: 18px; height: 18px; color: ${
      config.iconColor
    };"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                    <div style="font-size: 13px; font-weight: 600; color: #111827; line-height: 1.4;">${escapeHtml(
                      n.title
                    )}</div>
                    ${
                      isUnread
                        ? '<div style="width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; flex-shrink: 0; margin-top: 3px;"></div>'
                        : ''
                    }
                </div>
                ${
                  n.message
                    ? `<div style="font-size: 12px; color: #6b7280; line-height: 1.4; margin-bottom: 6px;">${escapeHtml(
                        n.message
                      )}</div>`
                    : ''
                }
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="font-size: 11px; color: #9ca3af; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                        ${escapeHtml(n.time)}
                    </div>
                    <button class="notification-action-btn" onclick="event.stopPropagation(); toggleNotificationRead('${
                      n.id
                    }');" style="font-size: 11px; color: ${
      config.iconColor
    }; border: none; background: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; font-weight: 500; transition: all 0.2s;">
                        ${
                          isUnread
                            ? '<i data-lucide="check" style="width: 12px; height: 12px;"></i>'
                            : '<i data-lucide="rotate-ccw" style="width: 12px; height: 12px;"></i>'
                        }
                    </button>
                </div>
            </div>
        `

    // Hover effects
    item.addEventListener('mouseenter', function () {
      this.style.transform = 'translateX(4px)'
      this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
    })

    item.addEventListener('mouseleave', function () {
      this.style.transform = 'translateX(0)'
      this.style.boxShadow = 'none'
    })

    item.addEventListener('click', function (e) {
      if (!e.target.closest('.notification-action-btn')) {
        toggleNotificationRead(n.id)
      }
    })

    listEl.appendChild(item)
  })

  // Reinitialize Lucide icons
  lucide.createIcons()
}

function toggleNotifications(e) {
  e && e.stopPropagation()
  const menu = document.getElementById('notifications-menu')
  const btn = document.getElementById('notifications-btn')
  if (!menu || !btn) return
  const isOpen = menu.style.display === 'block'
  if (isOpen) {
    closeNotifications()
  } else {
    renderNotifications()
    menu.style.display = 'block'
    btn.setAttribute('aria-expanded', 'true')

    // Add animation class
    menu.style.animation =
      'notificationSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'

    setTimeout(() => {
      document.addEventListener('click', outsideNotificationsClick)
    }, 0)
  }
}

function closeNotifications() {
  const menu = document.getElementById('notifications-menu')
  const btn = document.getElementById('notifications-btn')
  if (!menu || !btn) return

  // Add closing animation
  menu.style.animation =
    'notificationSlideOut 0.2s cubic-bezier(0.4, 0, 0.2, 1)'

  setTimeout(() => {
    menu.style.display = 'none'
    btn.setAttribute('aria-expanded', 'false')
  }, 200)

  document.removeEventListener('click', outsideNotificationsClick)
}

function viewAllNotifications() {
  closeNotifications()
  navigateToPage('activity')
}

function outsideNotificationsClick(e) {
  const menu = document.getElementById('notifications-menu')
  const btn = document.getElementById('notifications-btn')
  if (!menu || !btn) return
  if (menu.contains(e.target) || btn.contains(e.target)) return
  closeNotifications()
}

function toggleNotificationRead(id) {
  const n = (AppState.notifications || []).find((x) => x.id === id)
  if (!n) return
  n.read = !n.read // Toggle instead of always setting to true
  renderNotifications()
  try {
    if (typeof saveNotifications === 'function') saveNotifications()
  } catch (e) {}
}

function markAllNotificationsRead() {
  ;(AppState.notifications || []).forEach((n) => (n.read = true))
  renderNotifications()
  try {
    if (typeof saveNotifications === 'function') saveNotifications()
  } catch (e) {}
}

function deleteNotification(id) {
  AppState.notifications = (AppState.notifications || []).filter(
    (n) => n.id !== id
  )
  renderNotifications()
  try {
    if (typeof saveNotifications === 'function') saveNotifications()
  } catch (e) {}
}

function clearAllNotifications() {
  if ((AppState.notifications || []).length === 0) return
  if (confirm('Are you sure you want to clear all notifications?')) {
    AppState.notifications = []
    try {
      // Remove persisted notifications key
      if (lsAvailable()) localStorage.removeItem('AppNotifications')
    } catch (e) {}
    renderNotifications()
  }
}

// Clear mock/localStorage data used by the demo app (products, stock, logs, users, notifications)
async function clearMockLocalData() {
  const ok = await showConfirm(
    'This will remove demo/mock in-memory data (products, stock in/out, users, logs, notifications). Continue?',
    'Clear Mock Data'
  )
  if (!ok) return
  try {
    const keys = [
      LS_KEYS.PRODUCTS,
      LS_KEYS.STOCK_IN,
      LS_KEYS.STOCK_OUT,
      'spmo_userLogs',
      'mockDataUsers',
      'userSession',
      'AppNotifications',
      'spmo_status_requests',
    ]
    keys.forEach((k) => {
      try {
        if (lsAvailable()) localStorage.removeItem(k)
      } catch (e) {}
    })

    // Reset in-memory mock data
    MockData.products = []
    stockInData = []
    stockOutData = []
    if (window.MockData) {
      window.MockData.userLogs = []
      window.MockData.users = []
    }

    // Reset AppState notifications
    AppState.notifications = []
    AppState.statusRequests = []
    AppState.newRequests = []
    AppState.lowStockAlertedIds = []
    renderNotifications()
    try {
      if (typeof saveNotifications === 'function') saveNotifications()
    } catch (e) {}

    showAlert('Mock localStorage data cleared', 'success')
  } catch (e) {
    showAlert('Failed to clear mock data', 'error')
    console.error(e)
  }
}

window.clearMockLocalData = clearMockLocalData

// Add new notification (for demo/testing purposes)
function addNotification(title, message, type = 'info', icon = 'bell') {
  const newNotification = {
    id: 'n' + Date.now(),
    title: title,
    message: message,
    time: 'Just now',
    timestamp: new Date(),
    read: false,
    type: type, // 'success', 'warning', 'error', 'info'
    icon: icon,
  }

  AppState.notifications.unshift(newNotification)
  renderNotifications()

  // Show animation on badge
  const badge = document.getElementById('notifications-badge')
  if (badge) {
    badge.style.animation = 'none'
    setTimeout(() => {
      badge.style.animation = 'badgePulse 2s ease-in-out infinite'
    }, 10)
  }
}

// Sidebar Toggle Function
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  const isCollapsed = sidebar.classList.toggle('collapsed')

  // Store the collapsed state in localStorage
  if (lsAvailable()) {
    try {
      localStorage.setItem('sidebarCollapsed', isCollapsed)
    } catch (e) {}
  }

  // Add/remove tooltips for navigation items
  updateNavTooltips(isCollapsed)

  // Reinitialize Lucide icons for the toggle button
  setTimeout(() => {
    lucide.createIcons()
  }, 100)
}

// Update navigation tooltips based on collapsed state
function updateNavTooltips(isCollapsed) {
  if (isCollapsed) {
    // Add tooltips to all nav buttons
    document.querySelectorAll('.nav-button').forEach((button) => {
      const textElement = button.querySelector('.nav-content span')
      if (textElement) {
        button.setAttribute('data-tooltip', textElement.textContent)
      }
    })
  } else {
    // Remove tooltips when expanded
    document.querySelectorAll('.nav-button').forEach((button) => {
      button.removeAttribute('data-tooltip')
    })
  }
}

// Initialize sidebar state from localStorage
function initializeSidebarState() {
  const sidebar = document.getElementById('sidebar')
  // Persistence disabled: keep default sidebar state (expanded) unless server or AppState changes it
  if (AppState.sidebarCollapsed) {
    sidebar.classList.add('collapsed')
    updateNavTooltips(true)
  }
}

// Navigation Functions
function initializeNavigation() {
  // Handle nav item clicks
  document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
    item.addEventListener('click', () => {
      const pageId = item.getAttribute('data-page')
      navigateToPage(pageId)
    })
  })

  // Handle nav group toggles
  document.querySelectorAll('.nav-header[data-group]').forEach((header) => {
    header.addEventListener('click', () => {
      const groupId = header.getAttribute('data-group')
      toggleNavGroup(groupId)
      // Special-case: when clicking the Status Management header, navigate to the status view
      if (groupId === 'status') navigateToPage('status')
    })
  })

  // Initialize with dashboard page
  navigateToPage('dashboard')

  // Sync DOM with AppState.expandedMenus (honor initial expanded groups)
  document.querySelectorAll('.nav-group').forEach((g) => {
    const header = g.querySelector('.nav-header[data-group]')
    if (!header) return
    const id = header.getAttribute('data-group')
    if (AppState.expandedMenus.includes(id)) {
      g.classList.add('expanded')
    } else {
      g.classList.remove('expanded')
    }
  })
}

function navigateToPage(pageId) {
  AppState.currentPage = pageId
  updateActiveNavigation(pageId)
  loadPageContent(pageId)
}

function updateActiveNavigation(pageId) {
  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.remove('active')
  })

  // Add active class to current page
  const currentNavItem = document.querySelector(`[data-page="${pageId}"]`)
  if (currentNavItem) {
    currentNavItem.classList.add('active')

    // Expand parent group if it's a submenu item
    const parentGroup = currentNavItem.closest('.nav-group')
    if (parentGroup) {
      const groupId = parentGroup
        .querySelector('.nav-header')
        .getAttribute('data-group')
      if (!AppState.expandedMenus.includes(groupId)) {
        AppState.expandedMenus.push(groupId)
        parentGroup.classList.add('expanded')
      }
    }
  }
}

function toggleNavGroup(groupId) {
  const headerElem = document.querySelector(`[data-group="${groupId}"]`)
  if (!headerElem) return
  const group = headerElem.closest('.nav-group')

  const isCurrentlyExpanded =
    group.classList.contains('expanded') ||
    AppState.expandedMenus.includes(groupId)

  if (isCurrentlyExpanded) {
    // Collapse this group
    group.classList.remove('expanded')
    AppState.expandedMenus = AppState.expandedMenus.filter(
      (id) => id !== groupId
    )
  } else {
    // Accordion behavior: collapse all other groups first
    document.querySelectorAll('.nav-group.expanded').forEach((g) => {
      g.classList.remove('expanded')
      const hdr = g.querySelector('.nav-header[data-group]')
      if (hdr) {
        const otherId = hdr.getAttribute('data-group')
        AppState.expandedMenus = AppState.expandedMenus.filter(
          (id) => id !== otherId
        )
      }
    })

    // Expand the requested group
    group.classList.add('expanded')
    if (!AppState.expandedMenus.includes(groupId))
      AppState.expandedMenus.push(groupId)
  }
}

// Page Content Generation
function loadPageContent(pageId) {
  const mainContent = document.getElementById('main-content')

  switch (pageId) {
    case 'dashboard':
      mainContent.innerHTML = generateDashboardPage()
      // ensure notifications badge/menu is in sync
      try {
        renderNotifications()
      } catch (e) {
        /* ignore if not ready */
      }
      break
    case 'categories':
      mainContent.innerHTML = generateCategoriesPage()
      break
    case 'products':
      mainContent.innerHTML = generateProductsPage()
      break
    case 'stock-in':
      mainContent.innerHTML = generateStockInPage()
      break
    case 'stock-out':
      mainContent.innerHTML = generateStockOutPage()
      break
    case 'status':
      // Show all statuses
      initStatusManagement('all')
      break
    case 'incoming':
      initStatusManagement('incoming')
      break
    case 'received':
      initStatusManagement('received')
      break
    case 'finished':
      initStatusManagement('finished')
      break
    case 'cancelled':
      initStatusManagement('cancelled')
      break
    case 'rejected':
      initStatusManagement('rejected')
      break
    case 'returned':
      initStatusManagement('returned')
      break
    case 'new-request':
      mainContent.innerHTML = generateNewRequestPage()
      break
    case 'pending-approval':
      mainContent.innerHTML = generatePendingApprovalPage()
      break
    case 'completed-request':
      mainContent.innerHTML = generateCompletedRequestPage()
      break
    case 'inventory-reports':
      mainContent.innerHTML = generateInventoryReportsPage()
      break
    case 'requisition-reports':
      mainContent.innerHTML = generateRequisitionReportsPage()
      break
    case 'status-report':
      mainContent.innerHTML = generateStatusReportsPage()
      break
    case 'roles': // Roles & Management
      mainContent.innerHTML = generateRolesManagementPage()
      break
    case 'users': // ✅ Users Management
      mainContent.innerHTML = generateUsersManagementPage()
      break
    case 'login-activity': // ✅ Login Activity Logs
      mainContent.innerHTML = generateLoginActivityPage()
      break
    case 'activity': // Activity & Notifications
      mainContent.innerHTML = generateActivityPage()
      break
    case 'about':
      mainContent.innerHTML = generateAboutPage()
      break
    case 'support':
      mainContent.innerHTML = generateSupportPage()
      break
    default:
      mainContent.innerHTML = generateDashboardPage()
  }

  // Reinitialize icons after content update
  lucide.createIcons()

  // Initialize page-specific event listeners
  initializePageEvents(pageId)
}

function generateDashboardPage() {
  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Calculate real statistics from data sources
  const totalProducts = MockData.products ? MockData.products.length : 0
  const lowStockThreshold = 15
  const lowStockItems = MockData.products
    ? MockData.products.filter((p) => p.quantity < lowStockThreshold).length
    : 0

  // Get total users from MockData
  const totalUsers =
    window.MockData && window.MockData.users ? window.MockData.users.length : 0
  const activeUsers =
    window.MockData && window.MockData.users
      ? window.MockData.users.filter((u) => u.status === 'Active').length
      : 0

  // Calculate incoming requests (all status requests that are not finished/cancelled/returned)
  const incomingStatuses = [
    'incoming',
    'submitted',
    'pending',
    'under-review',
    'awaiting-approval',
    'approved',
  ]
  const incomingRequests = (AppState.statusRequests || []).filter((r) =>
    incomingStatuses.includes(r.status)
  ).length

  // Calculate received/delivered today
  const today = new Date().toISOString().split('T')[0]
  const receivedToday = (AppState.statusRequests || []).filter(
    (r) => r.status === 'received' && r.updatedAt === today
  ).length

  // Calculate finished requests
  const finishedRequests = (AppState.statusRequests || []).filter(
    (r) => r.status === 'finished'
  ).length

  // Calculate total value of all products
  const totalInventoryValue = MockData.products
    ? MockData.products.reduce((sum, p) => sum + (p.totalValue || 0), 0)
    : 0

  return `
    <div class="page-header">
      <div class="page-header-content" style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:12px;">
          <h1 class="page-title" style="margin:0;display:flex;align-items:center;gap:8px;">
            <i data-lucide="layout-dashboard" style="width:28px;height:28px;vertical-align:middle;"></i>
            Dashboard Overview
          </h1>
        </div>

        <div style="display:flex;align-items:center;gap:10px;position:relative;">
          <div style="position:relative;">
            <i data-lucide="search" style="width:16px;height:16px;position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;"></i>
            <input id="header-search" type="text" placeholder="Search..." style="padding:8px 12px 8px 34px;border:1px solid #d1d5db;border-radius:6px;width:220px;font-size:14px;">
          </div>

          <!-- Notifications -->
          <button id="notifications-btn" class="btn-secondary notifications-btn" onclick="toggleNotifications(event)" aria-haspopup="true" aria-expanded="false" title="Notifications" style="margin-left:4px;padding:6px 8px;border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative;">
            <i data-lucide="bell" class="icon"></i>
            <span id="notifications-badge" style="position:absolute;top:-6px;right:-6px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;display:none;align-items:center;justify-content:center;background:#ef4444;color:white;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.12);">&nbsp;</span>
          </button>

          <!-- Notifications popup (absolute inside header-actions) -->
          <div id="notifications-menu" style="position:absolute;top:calc(100% + 8px);right:56px;width:340px;display:none;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 8px 24px rgba(15,23,42,0.08);z-index:1000;">
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="bell" style="width: 18px; height: 18px; color: #111827;"></i>
                                <strong style="font-size: 15px; color: #111827;">Notifications</strong>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <button class="notification-header-btn" onclick="markAllNotificationsRead();" title="Mark all as read">
                                    <i data-lucide="check-check" style="width: 16px; height: 16px;"></i>
                                </button>
                                <button class="notification-header-btn" onclick="clearAllNotifications();" title="Clear all">
                                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                                </button>
                            </div>
                        </div>
                        <div id="notifications-list" style="max-height: 360px; overflow-y: auto; overflow-x: hidden;">
                            <!-- notifications injected here -->
                        </div>
                        <div style="padding: 10px 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                            <a href="#" onclick="viewAllNotifications(); return false;" style="color: #667eea; font-size: 13px; font-weight: 500; text-decoration: none; display: flex; align-items: center; gap: 6px; transition: all 0.2s;"
                               onmouseover="this.style.color='#5568d3'; this.style.gap='8px';"
                               onmouseout="this.style.color='#667eea'; this.style.gap='6px';">
                                <i data-lucide="list" style="width: 14px; height: 14px;"></i>
                                View all notifications
                            </a>
                            <button class="btn-secondary" style="padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500;" onclick="closeNotifications()">
                                <i data-lucide="x" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                                Close
                            </button>
                        </div>
                    </div>
                    
                    <!-- Compact User Menu Button (avatar only) -->
                    <div id="header-user-block" class="header-user-block" onclick="toggleUserMenu(event)" title="Profile menu" style="margin-left:6px;">
                        <div id="header-user-avatar">${AppState.currentUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}</div>
                        <i data-lucide="chevron-down" style="width: 16px; height: 16px; color: #6b7280;"></i>

                        <!-- Popup menu (hidden by default) - absolute inside header block -->
                        <div id="user-menu">
                            <!-- User Info Section -->
                            <div style="padding: 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
                                        ${AppState.currentUser.name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .slice(0, 2)
                                          .join('')}
                                    </div>
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 600; color: #111827; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${
                                          AppState.currentUser.name
                                        }</div>
                                        <div style="font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${
                                          AppState.currentUser.email
                                        }</div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: #ede9fe; color: #6b21a8; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                        <i data-lucide="shield" style="width: 10px; height: 10px;"></i>
                                        ${AppState.currentUser.role}
                                    </span>
                                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 11px; font-weight: 600;">
                                        <i data-lucide="building" style="width: 10px; height: 10px;"></i>
                                        ${AppState.currentUser.department}
                                    </span>
                                </div>
                            </div>
                            <!-- Menu Actions -->
                            <button class="btn-menu" style="display:block;width:100%;text-align:left;padding:10px 12px;border:none;background:none;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:8px;color:#374151;font-size:14px;" onclick="openUserModal('edit','current'); closeUserMenu();">
                                <i data-lucide="settings" style="width:16px;height:16px;"></i>
                                Settings
                            </button>
                            <button class="btn-menu" style="display:block;width:100%;text-align:left;padding:10px 12px;border:none;background:none;cursor:pointer;border-radius:6px;display:flex;align-items:center;gap:8px;color:#dc2626;font-size:14px;" onclick="logout()">
                                <i data-lucide="log-out" style="width:16px;height:16px;"></i>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="page-content">
            <!-- Metrics Cards -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-content">
                        <div class="metric-info">
                            <h3>Items</h3>
                            <p class="value">${totalProducts}</p>
                            <p class="change">In inventory</p>
                        </div>
                        <div class="metric-icon blue">
                            <i data-lucide="package" class="icon"></i>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-content">
                        <div class="metric-info">
                            <h3>Low Stock</h3>
                            <p class="value">${lowStockItems}</p>
                            <p class="change">< ${lowStockThreshold} units</p>
                        </div>
                        <div class="metric-icon orange">
                            <i data-lucide="alert-triangle" class="icon"></i>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-content">
                        <div class="metric-info">
                            <h3>Incoming</h3>
                            <p class="value">${incomingRequests}</p>
                            <p class="change">Pending flow</p>
                        </div>
                        <div class="metric-icon yellow">
                            <i data-lucide="clock" class="icon"></i>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">

                    <div class="metric-content">
                        <div class="metric-info">
                            <h3>Received Today</h3>
                            <p class="value">${receivedToday}</p>
                            <p class="change">Marked received</p>
                        </div>
                        <div class="metric-icon green">
                            <i data-lucide="check-circle" class="icon"></i>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-content">
                        <div class="metric-info">
                            <h3>Users</h3>
                            <p class="value">${totalUsers}</p>
                            <p class="change">${activeUsers} active</p>
                        </div>
                        <div class="metric-icon purple">
                            <i data-lucide="users" class="icon"></i>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-content">
                        <div class="metric-info">
                            <h3>Inventory Value</h3>
                            <p class="value currency-value">${formatCurrency(
                              totalInventoryValue
                            )}</p>
                            <p class="change">Total value</p>
                        </div>
                        <div class="metric-icon indigo">
                            <i data-lucide="bar-chart-3" class="icon"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions & Recent Activity -->
            <div class="dashboard-grid">
                <!-- Swapped: Recent Activity first -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Activity</h3>
                    </div>
              <div class="activity-list" id="recent-activity-list">
                <!-- Recent activities will be injected here by dashboard script -->
                <div class="activity-loading" style="padding:16px;color:#6b7280;font-size:14px;">Loading recent activity…</div>
              </div>
                    <div class="activity-footer">
                        <a href="#" class="link">View all activity →</a>
                    </div>
                </div>

                <!-- Quick Actions moved to second column -->
                <div class="card quick-actions">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div class="action-list">
                        <div class="action-item" onclick="navigateToPage('new-request')">
                            <div class="action-icon red">
                                <i data-lucide="plus" class="icon"></i>
                            </div>
                            <div class="action-content">
                                <h4>Create New Request</h4>
                                <p>Start a new purchase order</p>
                            </div>
                        </div>
                        <div class="action-item" onclick="navigateToPage('products')">
                            <div class="action-icon blue">
                                <i data-lucide="package-plus" class="icon"></i>
                            </div>
                            <div class="action-content">
                                <h4>Add New Product</h4>
                                <p>Register new inventory item</p>
                            </div>
                        </div>
                        <div class="action-item" onclick="navigateToPage('stock-in')">
                            <div class="action-icon green">
                                <i data-lucide="truck" class="icon"></i>
                            </div>
                            <div class="action-content">
                                <h4>Stock In</h4>
                                <p>Record incoming inventory</p>
                            </div>
                        </div>
                        <div class="action-item" onclick="navigateToPage('inventory-reports')">
                            <div class="action-icon purple">
                                <i data-lucide="bar-chart-3" class="icon"></i>
                            </div>
                            <div class="action-content">
                                <h4>View Reports</h4>
                                <p>Generate inventory reports</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

// Fetch recent activities from server API (robust: accepts several payload shapes)
async function fetchActivities(limit = 8) {
  try {
    const url =
      (window.APP_ROUTES && window.APP_ROUTES.activities) || '/api/activities'
    const res = await fetch(`${url}?limit=${limit}`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
    })

    // If server returns a successful response, try to normalize it into
    // an array of { action, created_at } items which `renderActivityList` expects.
    if (res.ok) {
      const payload = await res.json()

      // Determine candidate arrays from common shapes
      let data = []
      if (Array.isArray(payload)) data = payload
      else if (Array.isArray(payload.data)) data = payload.data
      else if (Array.isArray(payload.activities)) data = payload.activities
      else if (Array.isArray(payload.results)) data = payload.results
      else if (payload && payload.items && Array.isArray(payload.items))
        data = payload.items

      // Normalise each entry to { action, created_at }
      data = data.map((item) => {
        return {
          action:
            item.action ||
            item.message ||
            item.description ||
            item.title ||
            item.activity ||
            '',
          created_at:
            item.created_at ||
            item.createdAt ||
            item.timestamp ||
            item.time ||
            item.date ||
            new Date().toISOString(),
        }
      })

      // Sort newest-first and limit
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return data.slice(0, limit)
    }
  } catch (e) {
    console.warn('fetchActivities error', e)
  }

  // Fallback: if server fails or no payload, synthesize activities from in-memory
  // MockData.userLogs and AppState.statusRequests so the dashboard still shows activity.
  try {
    const logs = (window.MockData && window.MockData.userLogs) || []
    const statuses = (AppState && AppState.statusRequests) || []

    const mappedLogs = logs.map((l) => ({
      action:
        l.action ||
        l.message ||
        l.note ||
        `User ${l.email || l.user || ''} activity`,
      created_at:
        l.created_at ||
        l.createdAt ||
        l.timestamp ||
        l.time ||
        new Date().toISOString(),
    }))

    const mappedStatuses = statuses.map((s) => ({
      action:
        s.title ||
        s.action ||
        `${s.id || s.requestId || 'REQ'} ${s.status || ''}`.trim(),
      created_at:
        s.updatedAt ||
        s.updated_at ||
        s.createdAt ||
        s.created_at ||
        s.timestamp ||
        new Date().toISOString(),
    }))

    const combined = [...mappedLogs, ...mappedStatuses]
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return combined.slice(0, limit)
  } catch (e) {
    console.warn('fetchActivities fallback error', e)
    return []
  }
}

function timeAgo(iso) {
  try {
    const then = new Date(iso)
    const diff = Date.now() - then.getTime()
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return `${sec}s ago`
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h ago`
    const days = Math.floor(hr / 24)
    return `${days}d ago`
  } catch (e) {
    return ''
  }
}

function renderActivityList(activities) {
  const container = document.getElementById('recent-activity-list')
  if (!container) return
  if (!activities || activities.length === 0) {
    container.innerHTML = `<div style="padding:16px;color:#6b7280;">No recent activity</div>`
    return
  }
  container.innerHTML = activities
    .map((a) => {
      // choose icon by simple heuristics
      let icon = 'activity'
      let color = 'gray'
      const text = (a.action || '').toLowerCase()
      if (text.includes('approve') || text.includes('approved')) {
        icon = 'check'
        color = 'green'
      } else if (text.includes('stock') || text.includes('received')) {
        icon = 'package'
        color = 'blue'
      } else if (text.includes('low stock') || text.includes('alert')) {
        icon = 'alert-triangle'
        color = 'orange'
      } else if (text.includes('user') || text.includes('added')) {
        icon = 'user-plus'
        color = 'purple'
      } else if (text.includes('request') || text.includes('submitted')) {
        icon = 'file-text'
        color = 'red'
      }

      return `
            <div class="activity-item">
                <div class="activity-icon ${color}">
                    <i data-lucide="${icon}" class="icon"></i>
                </div>
                <div class="activity-content">
                    <p>${escapeHtml(a.action || '')}</p>
                    <span class="time">${timeAgo(a.created_at)}</span>
                </div>
            </div>
        `
    })
    .join('')
  if (window.lucide) setTimeout(() => lucide.createIcons(), 10)
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Ensure dashboard calls fetchActivities after page render
const _origLoadPageContent = loadPageContent
loadPageContent = function (pageId) {
  _origLoadPageContent(pageId)
  if (pageId === 'dashboard') {
    // small delay to allow DOM insertion
    setTimeout(async () => {
      const acts = await fetchActivities(8)
      renderActivityList(acts)
    }, 120)
  }
}

function generateCategoriesPage() {
  const categories = MockData.categories || []
  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="folder" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Categories
                    </h1>
                    <p class="page-subtitle">Manage inventory categories</p>
                </div>
                <button class="add-product-btn" onclick="openCategoryModal('create')">
                    <i data-lucide="plus" class="icon"></i>
                    Add Category
                </button>
            </div>
        </div>
        <div class="page-content">
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th style="padding: 16px 24px;">Category ID</th>
                            <th style="padding: 16px 24px;">Category Name</th>
                            <th style="padding: 16px 24px;">Description</th>
                            <th style="padding: 16px 24px;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          categories.length
                            ? categories
                                .map(
                                  (category, index) => `
                            <tr style="${
                              index % 2 === 0
                                ? 'background-color: white;'
                                : 'background-color: #f9fafb;'
                            }">
                                <td style="padding: 16px 24px; font-weight: 500;">${
                                  category.id
                                }</td>
                                <td style="padding: 16px 24px; font-weight: 500;">${
                                  category.name
                                }</td>
                                <td style="padding: 16px 24px; color: #6b7280; max-width: 600px; line-height: 1.5;">${
                                  category.description || ''
                                }</td>
                                <td style="padding: 16px 24px;">
                                    <div class="table-actions">
                                        <button class="icon-action-btn icon-action-warning" title="Edit" onclick="openCategoryModal('edit','${
                                          category.id
                                        }')">
                                            <i data-lucide="edit"></i>
                                        </button>
                                        <button class="icon-action-btn icon-action-danger" title="Delete" onclick="deleteCategory('${
                                          category.id
                                        }')">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `
                                )
                                .join('')
                            : `<tr><td colspan="4" style="text-align:center; padding:32px 12px; color:#6b7280; font-size:14px; font-style:italic;">No categories found</td></tr>`
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `
}

function generateProductsPage() {
  const currentTab = AppState.currentProductTab || 'expendable'
  const filteredProducts = MockData.products.filter(
    (product) => product.type === currentTab.toLowerCase()
  )

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="box" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        List of Products
                    </h1>
                    <p class="page-subtitle">Manage product inventory</p>
                </div>
                <button class="add-product-btn" onclick="openProductModal()">
                    <i data-lucide="plus" class="icon"></i>
                    Add Product
                </button>
            </div>
        </div>
        
        <div class="page-content">
            <!-- Product Tabs -->
            <div class="product-tabs">
                <button class="product-tab ${
                  currentTab === 'expendable' ? 'active' : ''
                }" onclick="switchProductTab('expendable')">
                    Expendable
                </button>
                <button class="product-tab ${
                  currentTab === 'semi-expendable' ? 'active' : ''
                }" onclick="switchProductTab('semi-expendable')">
                    Semi-Expendable
                </button>
                <button class="product-tab ${
                  currentTab === 'non-expendable' ? 'active' : ''
                }" onclick="switchProductTab('non-expendable')">
                    Non-Expendable
                </button>
            </div>

            <!-- Enhanced Filter Bar -->
            <div class="enhanced-filter-bar">
                <div class="filter-left">
                    <div class="enhanced-search">
                        <input type="text" class="form-input" placeholder="Search a Product" id="product-search">
                        <i data-lucide="search" class="search-icon"></i>
                    </div>
                </div>
                <div class="filter-right">
                    <select class="filter-dropdown" id="sort-by">
                        <option>Sort By</option>
                        <option>Product Name (A-Z)</option>
                        <option>Product Name (Z-A)</option>
                        <option>Date (Newest)</option>
                        <option>Date (Oldest)</option>
                        <option>Total Value (High to Low)</option>
                        <option>Total Value (Low to High)</option>
                    </select>
                    <select class="filter-dropdown" id="filter-by">
                        <option>Filter By</option>
                        <option>High Value (>₱5,000)</option>
                        <option>Medium Value (₱1,000-₱5,000)</option>
                        <option>Low Value (<₱1,000)</option>
                        <option>Recent (Last 30 days)</option>
                        <option>Low Quantity (<20)</option>
                    </select>
                </div>
            </div>
            
            <!-- Products Table -->
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit</th>
                            <th>Unit Cost</th>
                            <th>Total Value</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          filteredProducts.length
                            ? filteredProducts
                                .map((product, index) => {
                                  const rowBg =
                                    index % 2 === 0
                                      ? 'background-color: white;'
                                      : 'background-color: #f9fafb;'
                                  return `
                            <tr style="${rowBg}">
                                <td style="font-weight: 500;">${product.id}</td>
                                <td style="font-weight: 500;">${
                                  product.name
                                }</td>
                                <td style="color: #6b7280; max-width: 300px;">${
                                  product.description || ''
                                }</td>
                                <td>${product.quantity ?? 0}</td>
                                <td>${product.unit || '-'}</td>
                                <td>${formatCurrency(
                                  product.unitCost || 0
                                )}</td>
                                <td style="font-weight: 500;">${formatCurrency(
                                  product.totalValue || 0
                                )}</td>
                                <td>${product.date || ''}</td>
                                <td>
                                    <div class="table-actions">
                                        <button class="icon-action-btn icon-action-danger" title="Delete" onclick="deleteProduct('${
                                          product.id
                                        }')">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                        <button class="icon-action-btn icon-action-warning" title="Edit" onclick="openProductModal('edit','${
                                          product.id
                                        }')">
                                            <i data-lucide="edit"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `
                                })
                                .join('')
                            : `<tr><td colspan="9" style="text-align:center; padding:32px 12px; color:#6b7280; font-size:14px; font-style:italic;">No products found</td></tr>`
                        }
                    </tbody>
                </table>
                
                <!-- Enhanced Pagination -->
                <nav class="enhanced-pagination" aria-label="Pagination">
                    <div class="pagination-left" style="margin-left: 16px">
                        ${
                          filteredProducts.length === 0
                            ? 'No entries to display'
                            : `Showing 1 to ${filteredProducts.length} of ${filteredProducts.length} entries`
                        }
                    </div>
                    <div class="pagination-right" style="margin-right: 16px">
                        <button class="pagination-btn" disabled>Previous</button>
                        <button class="pagination-btn active">1</button>
                        <button class="pagination-btn">2</button>
                        <button class="pagination-btn">3</button>
                        <button class="pagination-btn">Next</button>
                    </div>
                </nav>
            </div>
        </div>
    `
}

function generateStockInPage() {
  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="arrow-down-to-line" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Stock In
                    </h1>
                    <p class="page-subtitle">Record incoming inventory and stock receipts</p>
                </div>
                <button class="btn btn-primary" onclick="openStockInModal('create')">
                    <i data-lucide="plus" class="icon"></i>
                    Add Stock In
                </button>
            </div>
        </div>
        
        <div class="page-content">
            <!-- Enhanced Filter Bar (matching Products page style) -->
            <div class="enhanced-filter-bar">
                <div class="filter-left">
                    <div class="enhanced-search">
                        <input type="text" class="form-input" placeholder="Search stock transactions..." id="stock-search">
                        <i data-lucide="search" class="search-icon"></i>
                    </div>
                </div>
                <div class="filter-right">
                    <input type="date" class="form-input" style="width: 160px;" id="date-filter">
                    <select class="filter-dropdown" id="supplier-filter">
                        <option>All Suppliers</option>
                        <option>ABC Office Supplies</option>
                        <option>Tech Solutions Inc.</option>
                        <option>Global Hardware Corp</option>
                    </select>
                    <select class="filter-dropdown" id="sort-stock">
                        <option>Sort By</option>
                        <option>Date (Newest)</option>
                        <option>Date (Oldest)</option>
                        <option>Amount (High to Low)</option>
                        <option>Amount (Low to High)</option>
                        <option>Product Name (A-Z)</option>
                    </select>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Date</th>
                            <th>Product Name</th>
                            <th>SKU</th>
                            <th>Quantity</th>
                            <th>Unit Cost</th>
                            <th>Total Cost</th>
                            <th>Supplier</th>
                            <th>Received By</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="stock-in-table-body">
                        ${renderStockInRows()}
                    </tbody>
                </table>
                
                <!-- 🔹 Pagination -->
                <nav class="enhanced-pagination" aria-label="Pagination">
                    <div class="pagination-left" style="margin-left: 16px">
                        ${
                          stockInData.length === 0
                            ? 'No entries to display'
                            : `Showing 1 to ${stockInData.length} of ${stockInData.length} entries`
                        }
                    </div>
                    <div class="pagination-right" style="margin-right: 16px">
                        <button class="pagination-btn" disabled>Previous</button>
                        <button class="pagination-btn active">1</button>
                        <button class="pagination-btn">2</button>
                        <button class="pagination-btn">3</button>
                        <button class="pagination-btn">Next</button>
                    </div>
                </nav>
            </div>
        </div>
    `
}

function generateStockOutPage() {
  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="arrow-up-from-line" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Stock Out
                    </h1>
                    <p class="page-subtitle">Record outgoing inventory and issued items</p>
                </div>
                <button class="btn btn-primary" onclick="openStockOutModal('create')">
                    <i data-lucide="plus" class="icon"></i>
                    Issue Stock
                </button>
            </div>
        </div>
        
        <div class="page-content">
            <!-- Enhanced Filter Bar -->
            <div class="enhanced-filter-bar">
                <div class="filter-left">
                    <div class="enhanced-search">
                        <input type="text" class="form-input" placeholder="Search stock issues..." id="stockOutSearch">
                        <i data-lucide="search" class="search-icon"></i>
                    </div>
                    <select class="filter-dropdown" id="departmentFilter">
                        <option value="">All Departments</option>
                        <option value="COENG">College of Engineering</option>
                        <option value="CBPA">College of Business and Public Administration</option>
                        <option value="CAS">College of Arts and Sciences</option>
                        <option value="CCMS">College of Computing and Multimedia Studies</option>
                        <option value="OP">Office of the President</option>
                        <option value="VPAA">Office of the Vice President for Academic Affairs</option>
                        <option value="VPRE">Office of the Vice President for Research and Extension</option>
                        <option value="VPFA">Office of the Vice President for Finance Affairs</option>
                    </select>
                    <select class="filter-dropdown" id="statusFilter">
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
                <div class="filter-right">
                    <input type="date" class="filter-dropdown" id="dateFrom" title="From Date" style="width: 150px;">
                    <button class="btn btn-secondary" onclick="clearStockOutFilters()" title="Clear Filters">
                        <i data-lucide="x" class="icon"></i>
                        Clear
                    </button>
                    <button class="btn btn-secondary" onclick="exportStockOut()" title="Export Data">
                        <i data-lucide="download" class="icon"></i>
                        Export
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="sortable" data-sort="issue_id">Issue ID</th>
                                <th class="sortable" data-sort="date">Date</th>
                                <th class="sortable" data-sort="product_name">Product Name</th>
                                <th>SKU</th>
                                <th class="sortable" data-sort="quantity">Quantity</th>
                                <th class="sortable" data-sort="unit_cost">Unit Cost</th>
                                <th class="sortable" data-sort="total_cost">Total Cost</th>
                                <th class="sortable" data-sort="department">Department</th>
                                <th>Issued To</th>
                                <th>Issued By</th>
                                <th>Status</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="stock-out-table-body">
                            ${renderStockOutRows()}
                        </tbody>
                    </table>
                    
                    <!-- 🔹 Pagination -->
                    <nav class="enhanced-pagination" aria-label="Pagination">
                        <div class="pagination-left" style="margin-left: 16px">
                            ${
                              stockOutData.length === 0
                                ? 'No entries to display'
                                : `Showing 1 to ${stockOutData.length} of ${stockOutData.length} entries`
                            }
                        </div>
                        <div class="pagination-right" style="margin-right: 16px">
                            <button class="pagination-btn" disabled>Previous</button>
                            <button class="pagination-btn active">1</button>
                            <button class="pagination-btn">2</button>
                            <button class="pagination-btn">3</button>
                            <button class="pagination-btn">Next</button>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    `
}

function generateNewRequestPage() {
  return `
        <section class="page-header">
            <div class="page-header-content">
                <header>
                    <h1 class="page-title">
                        <i data-lucide="file-plus" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        New Request
                    </h1>
                    <p class="page-subtitle">Create and manage new purchase requests</p>
                </header>
                <button class="btn btn-primary" onclick="openPurchaseOrderModal('create')">
                    <i data-lucide="plus" class="icon"></i>
                    Create New Request
                </button>
            </div>
        </section>

        <main class="page-content">
            <!-- 🔹 Enhanced Filter Bar -->
            <section class="enhanced-filter-bar" aria-label="Filters">
                <div class="filter-left">
                    <div class="enhanced-search">
                        <input type="search" class="form-input" placeholder="Search requests..." id="requestSearch" aria-label="Search requests">
                        <i data-lucide="search" class="search-icon"></i>
                    </div>

                    <label for="statusFilter" class="visually-hidden">Filter by Status</label>
                    <select class="filter-dropdown" id="statusFilter">
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="submitted">Submitted</option>
                        <option value="pending">Pending</option>
                    </select>

                    <label for="departmentFilter" class="visually-hidden">Filter by Department</label>
                    <select class="filter-dropdown" id="departmentFilter">
                        <option value="">All Departments</option>
                        <option value="coeng">College of Engineering</option>
                        <option value="cbpa">College of Business and Public Administration</option>
                        <option value="cas">College of Arts and Sciences</option>
                        <option value="ccms">College of Computing and Multimedia Studies</option>
                        <option value="op">Office of the President</option>
                        <option value="vpaa">Office of the Vice President for Academic Affairs</option>
                        <option value="vpre">Office of the Vice President for Research and Extension</option>
                        <option value="vpfa">Office of the Vice President for Finance Affairs</option>
                    </select>
                </div>
            </section>

            <!-- 🔹 Requests Table -->
            <section class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Request ID</th>
                            <th scope="col">P.O. Number</th>
                            <th scope="col">Supplier</th>
                            <th scope="col">Request Date</th>
                            <th scope="col">Delivery Date</th>
                            <th scope="col">Total Amount</th>
                            <th scope="col">Status</th>
                            <th scope="col">Requested By</th>
                            <th scope="col">Department</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          AppState.newRequests &&
                          AppState.newRequests.length > 0
                            ? AppState.newRequests
                                .map(
                                  (request) => `
                        <tr>
                            <td>${request.id}</td>
                            <td>
                                ${request.poNumber}
                            </td>
                            <td>${request.supplier}</td>
                            <td>${request.requestDate}</td>
                            <td>${request.deliveryDate}</td>
                            <td>${formatCurrency(request.totalAmount)}</td>
                            <td>
                                <span class="${getBadgeClass(request.status)}">
                                    ${capitalize(request.status)}
                                </span>
                            </td>
                            <td>${request.requestedBy}</td>
                            <td>${request.department}</td>
                            <td>
                                <div class="table-actions">
                  <button class="icon-action-btn" title="View" onclick="openViewForms(this, '${
                    request.id
                  }')">
                    <i data-lucide="eye"></i>
                  </button>
                  <button class="icon-action-btn icon-action-warning" title="Edit" onclick="openPurchaseOrderModal('edit', '${
                    request.id
                  }')">
                    <i data-lucide="edit"></i>
                  </button>
                                    <button class="icon-action-btn icon-action-danger" title="Delete" onclick="deleteRequest('${
                                      request.id
                                    }')">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `
                                )
                                .join('')
                            : `
                        <tr>
                            <td colspan="10" class="px-6 py-12 text-center text-gray-500">
                                <div class="flex flex-col items-center gap-2">
                                    <p>No requests found</p>
                                </div>
                            </td>
                        </tr>
                    `
                        }
                    </tbody>
                </table>

                <!-- 🔹 Pagination -->
                <nav class="enhanced-pagination" aria-label="Pagination">
                    <div class="pagination-left" style="margin-left: 16px">
                        ${
                          AppState.newRequests &&
                          AppState.newRequests.length > 0
                            ? `Showing 1 to ${AppState.newRequests.length} of ${AppState.newRequests.length} entries`
                            : 'Showing 0 entries'
                        }
                    </div>
                    <div class="pagination-right" style="margin-right: 16px">
                        <button class="pagination-btn" disabled>Previous</button>
                        <button class="pagination-btn active">1</button>
                        <button class="pagination-btn">2</button>
                        <button class="pagination-btn">3</button>
                        <button class="pagination-btn">Next</button>
                    </div>
                </nav>
            </section>
        </main>
    `
}

function generatePendingApprovalPage() {
  // Build the pending list from newRequests (prefer newRequests as source of truth)
  const pendingStatuses = [
    'submitted',
    'pending',
    'under-review',
    'awaiting-approval',
  ]
  const pendingList = (AppState.newRequests || []).filter((r) =>
    pendingStatuses.includes(r.status)
  )

  return `
        <section class="page-header">
            <div class="page-header-content">
                <header>
                    <h1 class="page-title">
                        <i data-lucide="clock" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Pending Approval
                    </h1>
                    <p class="page-subtitle">Review and approve purchase requests</p>
                </header>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge yellow">${
                      pendingList.length
                    } Pending Requests</span>
                </div>
            </div>
        </section>

        <main class="page-content">
            <!-- 🔹 Enhanced Filter Bar -->
            <section class="enhanced-filter-bar" aria-label="Filters">
                <div class="filter-left">
                    <!-- Search -->
                    <div class="enhanced-search">
                        <input type="search" class="form-input" placeholder="Search requests..." id="pendingSearch" aria-label="Search pending requests">
                        <i data-lucide="search" class="search-icon"></i>
                    </div>

                    <!-- Status Filter -->
                    <label for="statusFilter" class="visually-hidden">Filter by Status</label>
                    <select class="filter-dropdown" id="statusFilter">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="under-review">Under Review</option>
                        <option value="awaiting-approval">Awaiting Approval</option>
                    </select>

                    <!-- Priority Filter -->
                    <label for="priorityFilter" class="visually-hidden">Filter by Priority</label>
                    <select class="filter-dropdown" id="priorityFilter">
                        <option value="">All Priority</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </section>

            <!-- 🔹 Requests Table -->
            <section class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Request ID</th>
                            <th scope="col">P.O. Number</th>
                            <th scope="col">Supplier</th>
                            <th scope="col">Delivery Date</th>
                            <th scope="col">Total Amount</th>
                            <th scope="col">Priority</th>
                            <th scope="col">Status</th>
                            <th scope="col">Requested By</th>
                            <th scope="col">Department</th>
                            <th scope="col">Submitted Date</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          pendingList.length > 0
                            ? pendingList
                                .map(
                                  (request) => `
                                <tr>
                                    <td>${request.id}</td>
                                    <td>
                                        ${request.poNumber || '-'}
                                    </td>
                                    <td>${request.supplier || '-'}</td>
                                    <td>${request.deliveryDate || '-'}</td>
                                    <td>${formatCurrency(
                                      request.totalAmount || 0
                                    )}</td>
                                    <td>
                                        <span class="${getBadgeClass(
                                          request.priority || 'low',
                                          'priority'
                                        )}">
                                            ${
                                              request.priority
                                                ? capitalize(request.priority)
                                                : 'Low'
                                            }
                                        </span>
                                    </td>
                                    <td>
                                        <span class="${getBadgeClass(
                                          request.status || 'pending'
                                        )}">
                                            ${(request.status || 'pending')
                                              .replace('-', ' ')
                                              .replace(/\b\w/g, (l) =>
                                                l.toUpperCase()
                                              )}
                                        </span>
                                    </td>
                                    <td>${request.requestedBy || '-'}</td>
                                    <td>${request.department || '-'}</td>
                                    <td>${
                                      request.submittedDate ||
                                      request.requestDate ||
                                      '-'
                                    }</td>
                                    <td>
                                        <div class="table-actions">
                      <button class="icon-action-btn" title="View" onclick="openViewForms(this, '${
                        request.id
                      }')">
                        <i data-lucide="eye"></i>
                      </button>
                      <button class="icon-action-btn icon-action-warning" title="Edit" onclick="openPurchaseOrderModal('edit', '${
                        request.id
                      }')">
                        <i data-lucide="edit"></i>
                      </button>
                                            <button class="icon-action-btn icon-action-success" title="Approve" onclick="approveRequest('${
                                              request.id
                                            }')">
                                                <i data-lucide="check-circle"></i>
                                            </button>
                                            <button class="icon-action-btn icon-action-danger" title="Reject" onclick="rejectRequest('${
                                              request.id
                                            }')">
                                                <i data-lucide="x-circle"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `
                                )
                                .join('')
                            : `
                                <tr>
                                    <td colspan="10" class="px-6 py-12 text-center text-gray-500">
                                        <div class="flex flex-col items-center gap-2">
                                            <p>No pending requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            `
                        }
                    </tbody>
                </table>
            </section>
        </main>
    `
}

function generateCompletedRequestPage() {
  // Prepare lists (mirror the approach used in generatePendingApprovalPage)
  const allCompleted = AppState.completedRequests || []
  // Visible in this page: treat only actually fulfilled / approved flows as "completed" view entries
  const visibleStatuses = ['approved', 'delivered', 'completed']
  const visibleCompleted = allCompleted.filter((r) =>
    visibleStatuses.includes(r.status)
  )
  const completedList = visibleCompleted.filter((r) => r.status === 'completed')
  const deliveredList = visibleCompleted.filter((r) => r.status === 'delivered')
  const totalRequests = visibleCompleted.length
  const totalValue = visibleCompleted.reduce(
    (sum, req) => sum + (req.totalAmount || 0),
    0
  )

  return `
        <section class="page-header">
            <div class="page-header-content">
                <header>
                    <h1 class="page-title">
                        <i data-lucide="check-circle" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Completed Request
                    </h1>
                    <p class="page-subtitle">View completed and archived purchase requests</p>
                </header>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <!-- Updated: show total rendered completed-type requests (approved, delivered, completed) -->
                    <span class="badge green">${
                      visibleCompleted.length
                    } Completed Requests</span>
                    <span class="badge blue">${
                      deliveredList.length
                    } Delivered</span>
                </div>
            </div>
        </section>
        
        <main class="page-content">
            <!-- 🔹 Enhanced Filter Bar -->
            <section class="enhanced-filter-bar" aria-label="Filters">
                <div class="filter-left">
                    <!-- Search -->
                    <div class="enhanced-search">
                        <input type="search" class="form-input" placeholder="Search requests..." id="completedSearch" aria-label="Search completed requests">
                        <i data-lucide="search" class="search-icon"></i>
                    </div>

                    <!-- Status Filter -->
                    <label for="statusFilter" class="visually-hidden">Filter by Status</label>
                    <select class="filter-dropdown" id="statusFilter">
                        <option value="">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="delivered">Delivered</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <!-- payment filter removed -->
                </div>
            </section>

            <!-- 🔹 Completed Requests Table -->
            <section class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Request ID</th>
                            <th scope="col">P.O. Number</th>
                            <th scope="col">Supplier</th>
                            <th scope="col">Total Amount</th>
                            <th scope="col">Status</th>
                            <!-- Payment Status column removed -->
                            <th scope="col">Requested By</th>
                            <th scope="col">Approved By</th>
                            <th scope="col">Delivered Date</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                          visibleCompleted.length > 0
                            ? visibleCompleted
                                .map(
                                  (request) => `
                                <tr>
                                    <td>${request.id}</td>
                                    <td>
                                        ${request.poNumber}
                                    </td>
                                    <td>${request.supplier}</td>
                                    <td>${formatCurrency(
                                      request.totalAmount
                                    )}</td>
                                    <td>
                                            <span class="${getBadgeClass(
                                              request.status
                                            )}">
                                            ${capitalize(request.status)}
                                        </span>
                                    </td>
                                    <!-- Payment Status cell removed -->
                                    <td>${request.requestedBy}</td>
                                    <td>${request.approvedBy}</td>
                                    <td>${request.deliveredDate || '-'}</td>
                                    <td>
                                        <div class="table-actions">
                      <button class="icon-action-btn" title="View" onclick="openViewForms(this, '${
                        request.id
                      }')">
                        <i data-lucide="eye"></i>
                      </button>
                                            <button class="icon-action-btn" title="Download">
                                                <i data-lucide="download"></i>
                                            </button>
                                            <button class="icon-action-btn icon-action-warning" title="Archive" onclick="archiveRequest('${
                                              request.id
                                            }')">
                                                <i data-lucide="archive"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `
                                )
                                .join('')
                            : `
                                <tr>
                                    <td colspan="9" class="px-6 py-12 text-center text-gray-500">
                                        <div class="flex flex-col items-center gap-2">
                                            <p>No completed requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            `
                        }
                    </tbody>
                </table>

                <!-- 🔹 Summary Stats (Centered) -->
                <aside class="completed-summary mt-6" style="background-color:#f9fafb;padding:20px 24px;border-radius:12px;display:flex;justify-content:center;align-items:stretch;gap:40px;flex-wrap:wrap;text-align:center;">
                    <div style="flex:0 1 180px;display:flex;flex-direction:column;gap:4px;">
                        <p style="font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:#6b7280;font-weight:600;margin:0;">Total Requests</p>
                        <p style="font-size:26px;font-weight:700;color:#111827;line-height:1;margin:0;">${totalRequests}</p>
                    </div>
                    <div style="flex:0 1 180px;display:flex;flex-direction:column;gap:4px;">
                        <p style="font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:#6b7280;font-weight:600;margin:0;">Total Value</p>
                        <p style="font-size:26px;font-weight:700;color:#111827;line-height:1;margin:0;">${formatCurrency(
                          totalValue
                        )}</p>
                    </div>
                    <div style="flex:0 1 180px;display:flex;flex-direction:column;gap:4px;">
                        <!-- Updated to align with header badge: counts all rendered completed-type requests -->
                        <p style="font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:#6b7280;font-weight:600;margin:0;">Completed Requests</p>
                        <p style="font-size:26px;font-weight:700;color:#16a34a;line-height:1;margin:0;">${
                          visibleCompleted.length
                        }</p>
                    </div>
                </aside>
            </section>
        </main>
    `
}

// -----------------------------
// Reports Pages
// -----------------------------

function generateInventoryReportsPage() {
  // Filters: date range (not used for inventory mock) and department
  const departments = ['All', 'IT', 'Procurement', 'Finance', 'HR', 'Admin']

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="package" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Inventory Reports
                    </h1>
                    <p class="page-subtitle">Generate and export inventory summary with analytics</p>
                </div>
                <div>
                    <button class="btn btn-secondary" id="export-inventory-btn">
                        <i data-lucide="download" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>
                        Export CSV
                    </button>
                </div>
            </div>
        </div>

        <div class="page-content">
            <!-- Filters Card -->
            <div class="card report-filters-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="filter" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        Filters
                    </h3>
                </div>
                <div class="filter-grid">
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="building-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            Department
                        </label>
                        <select id="inventory-department-filter" class="form-select">
                            ${departments
                              .map((d) => `<option value="${d}">${d}</option>`)
                              .join('')}
                        </select>
                    </div>
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            From Date
                        </label>
                        <input type="date" id="inventory-date-from" class="form-input">
                    </div>
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            To Date
                        </label>
                        <input type="date" id="inventory-date-to" class="form-input">
                    </div>
                </div>
            </div>

            <!-- Chart Card -->
            <div class="card chart-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="bar-chart-3" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        Inventory Trends
                    </h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="inventory-chart" width="600" height="200"></canvas>
                </div>
            </div>

            <!-- Low Stock Section -->
            <div class="card low-stock-card">
                <div class="low-stock-header">
                    <div class="low-stock-content">
                        <div class="card-header-inline">
                            <h3 class="card-title-small">
                                <i data-lucide="alert-triangle" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;color:#dc2626;"></i>
                                Low Stock Alerts
                            </h3>
                        </div>
                        <div class="low-stock-controls">
                            <label class="form-label" style="margin:0;white-space:nowrap;">Threshold</label>
                            <input type="number" id="low-stock-threshold" class="form-input threshold-input" value="20" min="1">
                            <button class="btn btn-secondary btn-sm" id="export-lowstock-btn">
                                <i data-lucide="download" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                                Export
                            </button>
                        </div>
                        <div class="table-container low-stock-table-container">
                            <table class="table" id="low-stock-table">
                                <thead>
                                    <tr>
                                        <th>Stock Number</th>
                                        <th>Name</th>
                                        <th>Current Stock</th>
                                        <th>Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- low stock rows injected by renderInventoryReport() -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="low-stock-summary">
                        <div class="summary-card alert-card">
                            <div class="summary-icon">
                                <i data-lucide="package-x" style="width:24px;height:24px;color:#dc2626;"></i>
                            </div>
                            <div class="summary-content">
                                <p class="summary-label">Items Below Threshold</p>
                                <h2 class="summary-value" id="low-stock-count">0</h2>
                                <p class="summary-detail" id="lowest-item">-</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Full Inventory Table -->
            <div class="card table-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="list" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        Complete Inventory
                    </h3>
                </div>
                <div class="table-container">
                    <table class="table" id="inventory-report-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th>Quantity</th>
                                <th>Unit</th>
                                <th>Unit Cost</th>
                                <th>Total Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- rows injected by renderInventoryReport() -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
}

function generateRequisitionReportsPage() {
  const departments = ['All', 'IT', 'Procurement', 'Finance', 'HR', 'Admin']

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="file-text" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Requisition Reports
                    </h1>
                    <p class="page-subtitle">Overview of requisitions and purchase requests</p>
                </div>
                <div>
                    <button class="btn btn-secondary" id="export-requisition-btn">
                        <i data-lucide="download" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>
                        Export CSV
                    </button>
                </div>
            </div>
        </div>

        <div class="page-content">
            <!-- Filters Card -->
            <div class="card report-filters-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="filter" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        Filters
                    </h3>
                </div>
                <div class="filter-grid">
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="building-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            Department
                        </label>
                        <select id="requisition-department-filter" class="form-select">
                            ${departments
                              .map((d) => `<option value="${d}">${d}</option>`)
                              .join('')}
                        </select>
                    </div>
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            From Date
                        </label>
                        <input type="date" id="requisition-date-from" class="form-input">
                    </div>
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            To Date
                        </label>
                        <input type="date" id="requisition-date-to" class="form-input">
                    </div>
                </div>
            </div>

            <!-- Chart Card -->
            <div class="card chart-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="trending-up" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        Requisition Analytics
                    </h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="requisition-chart" width="800" height="240"></canvas>
                </div>
            </div>

            <!-- Requisition Table -->
            <div class="card table-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="clipboard-list" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        All Requisitions
                    </h3>
                </div>
                <div class="table-container">
                    <table class="table" id="requisition-report-table">
                        <thead>
                            <tr>
                                <th>Request ID</th>
                                <th>PO Number</th>
                                <th>Supplier</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- rows injected by renderRequisitionReport() -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
}

function generateStatusReportsPage() {
  // Dynamically get departments and statuses from statusRequests
  const uniqueDepartments = [
    'All',
    ...[
      ...new Set(
        (AppState.statusRequests || []).map((r) => r.department).filter(Boolean)
      ),
    ],
  ]
  const uniqueStatuses = [
    'All',
    ...[
      ...new Set(
        (AppState.statusRequests || []).map((r) => r.status).filter(Boolean)
      ),
    ],
  ]

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="activity" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Status Reports
                    </h1>
                    <p class="page-subtitle">Breakdown of request statuses from Status Management</p>
                </div>
                <div>
                    <button class="btn btn-secondary" id="export-status-btn">
                        <i data-lucide="download" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>
                        Export CSV
                    </button>
                </div>
            </div>
        </div>

        <div class="page-content">
            <!-- Filters Card -->
            <div class="card report-filters-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="filter" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        Filters
                    </h3>
                </div>
                <div class="filter-grid filter-grid-four">
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="building-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            Department
                        </label>
                        <select id="status-department-filter" class="form-select">
                            ${uniqueDepartments
                              .map((d) => `<option value="${d}">${d}</option>`)
                              .join('')}
                        </select>
                    </div>
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="check-circle-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            Status
                        </label>
                        <select id="status-status-filter" class="form-select">
                            ${uniqueStatuses
                              .map(
                                (s) =>
                                  `<option value="${s}">${
                                    s.charAt(0).toUpperCase() + s.slice(1)
                                  }</option>`
                              )
                              .join('')}
                        </select>
                    </div>
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            From Date
                        </label>
                        <input type="date" id="status-date-from" class="form-input">
                    </div>
                    <div class="filter-item">
                        <label class="form-label">
                            <i data-lucide="calendar" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            To Date
                        </label>
                        <input type="date" id="status-date-to" class="form-input">
                    </div>
                </div>
            </div>

            <!-- Chart Card -->
            <div class="card chart-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="pie-chart" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        Status Distribution
                    </h3>
                </div>
                <div class="chart-wrapper">
                    <canvas id="status-chart" width="600" height="200"></canvas>
                </div>
            </div>

            <!-- Status Summary Table -->
            <div class="card table-card">
                <div class="card-header-inline">
                    <h3 class="card-title-small">
                        <i data-lucide="table-2" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                        Status Summary
                    </h3>
                </div>
                <div class="table-container">
                    <table class="table" id="status-report-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Count</th>
                                <th>Department</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- rows injected by renderStatusReport() -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `
}

// CSV export helpers
function downloadCSV(filename, rows) {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'
  const csvContent = rows
    .map((r) => r.map((c) => `"${(c + '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function exportInventoryCSV() {
  // export only currently filtered rows if filters applied
  const rows = [['SKU', 'Name', 'Quantity', 'Unit', 'Unit Cost', 'Total Value']]
  const rowsToExport =
    window.__inventoryFilteredRows && window.__inventoryFilteredRows.length
      ? window.__inventoryFilteredRows
      : MockData.products || []
  rowsToExport.forEach((i) =>
    rows.push([
      i.id || i.stockNumber || '',
      i.name || '',
      typeof i.quantity === 'number' ? i.quantity : i.currentStock || 0,
      i.unit || i.unitMeasure || '',
      typeof i.unitCost === 'number' ? i.unitCost : i.unitPrice || 0,
      typeof i.totalValue === 'number'
        ? i.totalValue
        : (typeof i.quantity === 'number' ? i.quantity : i.currentStock || 0) *
          (i.unitCost || i.unitPrice || 0),
    ])
  )
  downloadCSV('inventory-report.csv', rows)
}

function exportRequisitionCSV() {
  const rows = [
    ['Request ID', 'PO Number', 'Supplier', 'Total Amount', 'Status'],
  ]
  const rowsToExport =
    window.__requisitionFilteredRows && window.__requisitionFilteredRows.length
      ? window.__requisitionFilteredRows
      : [
          ...(AppState.newRequests || []),
          ...(AppState.pendingRequests || []),
          ...(AppState.completedRequests || []),
        ]
  rowsToExport.forEach((r) =>
    rows.push([
      r.id || '',
      r.poNumber || '',
      r.supplier || '',
      r.totalAmount || 0,
      r.status || '',
    ])
  )
  downloadCSV('requisition-report.csv', rows)
}

function exportStatusCSV() {
  const rows = [['Status', 'Count', 'Total Cost']]
  const rowsToExport =
    window.__statusSummary && Object.keys(window.__statusSummary).length
      ? window.__statusSummary
      : (function () {
          const all = [...(AppState.statusRequests || [])]
          return all.reduce((acc, r) => {
            acc[r.status || 'unknown'] = (acc[r.status || 'unknown'] || 0) + 1
            return acc
          }, {})
        })()

  // Calculate total cost per status from statusRequests
  const costByStatus = (AppState.statusRequests || []).reduce((acc, r) => {
    const status = r.status || 'unknown'
    acc[status] = (acc[status] || 0) + (r.cost || 0)
    return acc
  }, {})

  Object.keys(rowsToExport).forEach((k) =>
    rows.push([k, rowsToExport[k], formatCurrency(costByStatus[k] || 0)])
  )
  downloadCSV('status-report.csv', rows)
}

// Render helpers + Chart wiring
function renderInventoryReport() {
  const tbody = document.querySelector('#inventory-report-table tbody')
  if (!tbody) return

  // Filters (department placeholder & future date filters). Products currently lack dept & date metadata.
  const dept =
    document.getElementById('inventory-department-filter')?.value || 'All'
  const from = document.getElementById('inventory-date-from')?.value
  const to = document.getElementById('inventory-date-to')?.value

  // Source of truth: live products mutated by Stock In/Out
  let products = (MockData.products || []).map((p) => ({ ...p }))

  // (Future) Department/date filters could be applied here when fields exist
  if (dept && dept !== 'All') {
    products = products.filter((p) =>
      (p.department || '').toLowerCase().includes(dept.toLowerCase())
    )
  }
  // if products had dateAdded or lastMovementDate we would filter via from/to
  // For now, ignore from/to as no date metadata is defined in product objects.

  // Persist filtered set for CSV export
  window.__inventoryFilteredRows = products

  // Build table rows (include total value if present)
  tbody.innerHTML = products
    .map((p) => {
      const qty =
        typeof p.quantity === 'number' ? p.quantity : p.currentStock || 0
      const unit = p.unit || p.unitMeasure || ''
      const unitCost =
        typeof p.unitCost === 'number' ? p.unitCost : p.unitPrice || 0
      const totalValue =
        typeof p.totalValue === 'number' ? p.totalValue : qty * unitCost
      return `
            <tr>
                <td style="font-weight:500;">${p.id || p.stockNumber || ''}</td>
                <td>${p.name || ''}</td>
                <td>${qty}</td>
                <td>${unit}</td>
                <td>${unitCost ? formatCurrency(unitCost) : '-'}</td>
                <td>${totalValue ? formatCurrency(totalValue) : '-'}</td>
            </tr>
        `
    })
    .join('')

  // Chart (Quantity per product) with sorting, top-N, and threshold coloring
  const thresholdInput = document.getElementById('low-stock-threshold')
  const threshold = thresholdInput
    ? parseInt(thresholdInput.value, 10) || 0
    : AppState.lowStockThreshold || 0

  const pairs = products.map((r) => {
    const qty =
      typeof r.quantity === 'number' ? r.quantity : r.currentStock || 0
    return { label: r.name || r.id || '', value: qty }
  })
  // Sort desc by quantity and cap to top 20 for readability
  const TOP_N = 20
  const sorted = pairs.sort((a, b) => b.value - a.value).slice(0, TOP_N)
  const labels = sorted.map((p) => p.label)
  const data = sorted.map((p) => p.value)
  const lowMask = sorted.map((p) => p.value <= threshold)
  renderInventoryChart(labels, data, {
    threshold,
    lowMask,
    topN: TOP_N,
    totalItems: pairs.length,
  })

  // Low-stock computation (use current threshold input or AppState.lowStockThreshold fallback)
  // Threshold computed above
  const lowStockItems = products.filter((p) => {
    const qty =
      typeof p.quantity === 'number' ? p.quantity : p.currentStock || 0
    return qty <= threshold
  })

  // Populate low-stock table
  const lowTbody = document.querySelector('#low-stock-table tbody')
  if (lowTbody) {
    lowTbody.innerHTML = lowStockItems
      .map((p) => {
        const qty =
          typeof p.quantity === 'number' ? p.quantity : p.currentStock || 0
        const unit = p.unit || p.unitMeasure || ''
        return `
                <tr>
                    <td style="font-weight:500;">${
                      p.id || p.stockNumber || ''
                    }</td>
                    <td>${p.name || ''}</td>
                    <td>${qty}</td>
                    <td>${unit}</td>
                </tr>
            `
      })
      .join('')
  }

  // Update summary widgets
  const lowCountEl = document.getElementById('low-stock-count')
  const lowestItemEl = document.getElementById('lowest-item')
  if (lowCountEl) lowCountEl.textContent = lowStockItems.length
  if (lowestItemEl) {
    if (lowStockItems.length) {
      const sorted = lowStockItems.slice().sort((a, b) => {
        const qa =
          typeof a.quantity === 'number' ? a.quantity : a.currentStock || 0
        const qb =
          typeof b.quantity === 'number' ? b.quantity : b.currentStock || 0
        return qa - qb
      })
      const first = sorted[0]
      const qty =
        typeof first.quantity === 'number'
          ? first.quantity
          : first.currentStock || 0
      const unit = first.unit || first.unitMeasure || ''
      lowestItemEl.textContent = `${first.name || first.id} (${qty} ${unit})`
    } else {
      lowestItemEl.textContent = '-'
    }
  }

  // Store low-stock rows for export
  window.__lowStockRows = lowStockItems
}

function exportLowStockCSV() {
  const rows = [['Stock Number', 'Name', 'Current Stock', 'Unit']]
  const toExport =
    window.__lowStockRows && window.__lowStockRows.length
      ? window.__lowStockRows
      : []
  toExport.forEach((i) =>
    rows.push([i.stockNumber, i.name, i.currentStock, i.unit])
  )
  downloadCSV('low-stock-report.csv', rows)
}

function renderRequisitionReport() {
  const tbody = document.querySelector('#requisition-report-table tbody')
  if (!tbody) return

  const dept =
    document.getElementById('requisition-department-filter')?.value || 'All'
  const from = document.getElementById('requisition-date-from')?.value
  const to = document.getElementById('requisition-date-to')?.value

  let all = [
    ...(AppState.newRequests || []),
    ...(AppState.pendingRequests || []),
    ...(AppState.completedRequests || []),
  ]

  // simple date filtering by requestDate if available
  if (from)
    all = all.filter((r) =>
      r.requestDate ? new Date(r.requestDate) >= new Date(from) : true
    )
  if (to)
    all = all.filter((r) =>
      r.requestDate ? new Date(r.requestDate) <= new Date(to) : true
    )

  // dept filter: assume r.department stores dept code or name
  if (dept && dept !== 'All')
    all = all.filter((r) =>
      (r.department || '').toLowerCase().includes(dept.toLowerCase())
    )

  window.__requisitionFilteredRows = all

  tbody.innerHTML = all
    .map(
      (r) => `
        <tr>
            <td style="font-weight:500;">${r.id || '-'}</td>
            <td>${r.poNumber || '-'}</td>
            <td>${r.supplier || '-'}</td>
            <td>${formatCurrency(r.totalAmount || 0)}</td>
            <td><span class="${getBadgeClass(r.status || 'draft')}">${
        r.status || 'Draft'
      }</span></td>
        </tr>
    `
    )
    .join('')

  // render requisition totals by supplier (bar chart)
  const totalsBySupplier = all.reduce((acc, r) => {
    const s = r.supplier || 'Unknown'
    acc[s] = (acc[s] || 0) + (r.totalAmount || 0)
    return acc
  }, {})

  const reqLabels = Object.keys(totalsBySupplier)
  const reqData = reqLabels.map((l) => totalsBySupplier[l])
  renderRequisitionChart(reqLabels, reqData)
}

let __requisitionChartInstance = null
function renderRequisitionChart(labels, data) {
  const ctx = document.getElementById('requisition-chart')
  if (!ctx) return
  if (typeof Chart === 'undefined') return
  if (__requisitionChartInstance) __requisitionChartInstance.destroy()
  __requisitionChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Amount (₱)',
          data,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 48,
          backgroundColor: (context) => {
            const { chart } = context
            const { ctx: c, chartArea } = chart
            if (!chartArea) return '#6366f1'
            const g = c.createLinearGradient(
              0,
              chartArea.bottom,
              0,
              chartArea.top
            )
            g.addColorStop(0, '#f59e0b') // amber-500
            g.addColorStop(1, '#6366f1') // indigo-500
            return g
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 8 },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', font: { size: 12 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: {
            color: '#6b7280',
            font: { size: 12 },
            callback: (v) => formatCurrency(v),
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#111827', font: { weight: '600' } },
        },
        tooltip: {
          callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw)}` },
        },
        title: {
          display: true,
          text: 'Requisition Totals by Supplier',
          color: '#111827',
          font: { weight: '600', size: 14 },
        },
        valueDataLabels: { display: true, format: 'currency' },
      },
      animation: { duration: 600, easing: 'easeOutQuart' },
    },
    plugins: [ValueDataLabelsPlugin],
  })
}

function renderStatusReport() {
  const tbody = document.querySelector('#status-report-table tbody')
  if (!tbody) return

  const dept =
    document.getElementById('status-department-filter')?.value || 'All'
  const statusFilter =
    document.getElementById('status-status-filter')?.value || 'All'
  const from = document.getElementById('status-date-from')?.value
  const to = document.getElementById('status-date-to')?.value

  // Use statusRequests from Status Management instead of request arrays
  let all = [...(AppState.statusRequests || [])]

  // Apply date filters based on updatedAt field
  if (from)
    all = all.filter((r) =>
      r.updatedAt ? new Date(r.updatedAt) >= new Date(from) : true
    )
  if (to)
    all = all.filter((r) =>
      r.updatedAt ? new Date(r.updatedAt) <= new Date(to) : true
    )

  // Apply department filter
  if (dept && dept !== 'All')
    all = all.filter((r) =>
      (r.department || '').toLowerCase().includes(dept.toLowerCase())
    )

  // Apply status filter
  if (statusFilter && statusFilter !== 'All')
    all = all.filter(
      (r) =>
        (r.status || 'unknown').toLowerCase() === statusFilter.toLowerCase()
    )

  const summary = all.reduce((acc, r) => {
    const s = r.status || 'unknown'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})
  window.__statusSummary = summary

  tbody.innerHTML = Object.keys(summary)
    .map(
      (k) => `
        <tr>
            <td>${k}</td>
            <td>${summary[k]}</td>
        </tr>
    `
    )
    .join('')

  // render status chart
  renderStatusChart(Object.keys(summary), Object.values(summary))

  // Replace tbody HTML with separate rows for each status-department combination
  const rowsHtml = []

  Object.keys(summary).forEach((k) => {
    const matches = all.filter((r) => (r.status || 'unknown') === k)

    // Group by department
    const byDepartment = {}
    matches.forEach((r) => {
      const dept = r.department || 'Unassigned'
      if (!byDepartment[dept]) byDepartment[dept] = []
      byDepartment[dept].push(r)
    })

    // Create a row for each department
    const departments = Object.keys(byDepartment)

    if (departments.length === 0) {
      // No departments, show one row with no department
      rowsHtml.push(`
                <tr>
                    <td style="text-transform: capitalize; font-weight: 500;">${k}</td>
                    <td style="font-weight: 600;">${summary[k]}</td>
                    <td>—</td>
                    <td style="max-width:420px;"><span style="color:#6b7280;">—</span></td>
                </tr>
            `)
    } else {
      departments.forEach((dept, index) => {
        const deptRequests = byDepartment[dept]
        const detailHtml = deptRequests
          .map(
            (r) => `
                    <div style="margin-bottom:6px;">
                        <a href="#" onclick="viewStatusRequestDetails('${
                          r.id
                        }'); return false;" style="color:#dc2626; text-decoration:underline;">${
              r.id
            }</a>
                        ${r.requester ? ` - ${r.requester}` : ''}
                        ${r.item ? ` (${r.item})` : ''}
                        <span style="margin-left:8px; color:#6b7280;">${
                          r.cost ? formatCurrency(r.cost) : ''
                        }</span>
                    </div>
                `
          )
          .join('')

        rowsHtml.push(`
                    <tr>
                        <td style="text-transform: capitalize; font-weight: 500;">${k}</td>
                        <td style="font-weight: 600;">${deptRequests.length}</td>
                        <td>${dept}</td>
                        <td style="max-width:420px;">${detailHtml}</td>
                    </tr>
                `)
      })
    }
  })

  tbody.innerHTML = rowsHtml.join('')
}

function showStatusDetails(status) {
  // Find matching requests from Status Management
  const all = [...(AppState.statusRequests || [])]
  const matches = all.filter((r) => (r.status || 'unknown') === status)

  const modal = document.getElementById('purchase-order-modal')
  const modalContent = modal.querySelector('.modal-content')

  modalContent.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">Requests: ${
              status.charAt(0).toUpperCase() + status.slice(1)
            }</h2>
            <button class="modal-close" onclick="closePurchaseOrderModal()">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>
        <div class="modal-body">
            <table class="table">
                <thead><tr><th>Request ID</th><th>Requester</th><th>Department</th><th>Item</th><th>Priority</th><th>Cost</th><th>Updated</th></tr></thead>
                <tbody>
                    ${
                      matches.length
                        ? matches
                            .map(
                              (r) => `
                        <tr>
                            <td><a href="#" onclick="viewStatusRequestDetails('${
                              r.id
                            }'); return false;" style="color:#dc2626; text-decoration:underline;">${
                                r.id
                              }</a></td>
                            <td>${r.requester || '-'}</td>
                            <td>${r.department || '-'}</td>
                            <td>${r.item || '-'}</td>
                            <td><span class="${getBadgeClass(
                              r.priority || 'low',
                              'priority'
                            )}">${capitalize(r.priority || 'low')}</span></td>
                            <td>${r.cost ? formatCurrency(r.cost) : '-'}</td>
                            <td>${r.updatedAt || '-'}</td>
                        </tr>
                    `
                            )
                            .join('')
                        : `<tr><td colspan="7">No requests with status ${status}</td></tr>`
                    }
                </tbody>
            </table>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" onclick="closePurchaseOrderModal()">Close</button>
        </div>
    `

  modal.classList.add('active')
  lucide.createIcons()
}

window.showStatusDetails = showStatusDetails

// Chart helpers and renderers
function numberWithCommas(x) {
  if (x === null || x === undefined) return ''
  const n =
    typeof x === 'number' ? x : Number(String(x).replace(/[^0-9.-]/g, ''))
  if (isNaN(n)) return String(x)
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Lightweight plugin to draw values above bars
const ValueDataLabelsPlugin = {
  id: 'valueDataLabels',
  afterDatasetsDraw(chart, args, pluginOptions) {
    const display = chart?.options?.plugins?.valueDataLabels?.display
    if (!display) return
    const { ctx } = chart
    const datasetIndex = pluginOptions?.datasetIndex ?? 0
    const meta = chart.getDatasetMeta(datasetIndex)
    if (!meta?.data) return
    ctx.save()
    ctx.fillStyle = pluginOptions?.color || '#111827'
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    meta.data.forEach((el, i) => {
      const raw = chart.data?.datasets?.[datasetIndex]?.data?.[i]
      if (raw === undefined || raw === null) return
      const format = chart.options?.plugins?.valueDataLabels?.format
      const text =
        format === 'currency' ? formatCurrency(raw) : numberWithCommas(raw)
      const x = el.x
      const y = el.y - 6
      ctx.fillText(text, x, y)
    })
    ctx.restore()
  },
}

// Center text plugin for doughnut charts to display the total
const DoughnutCenterTextPlugin = {
  id: 'doughnutCenterText',
  afterDraw(chart, args, opts) {
    if (chart.config.type !== 'doughnut') return
    const dataset = chart.config.data?.datasets?.[0]
    if (!dataset || !Array.isArray(dataset.data)) return
    const total = dataset.data.reduce((a, b) => a + (Number(b) || 0), 0)
    const { ctx, chartArea } = chart
    if (!chartArea) return
    const cx = (chartArea.left + chartArea.right) / 2
    const cy = (chartArea.top + chartArea.bottom) / 2
    ctx.save()
    ctx.textAlign = 'center'
    ctx.fillStyle = opts?.color || '#111827'
    ctx.font = '600 16px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillText(numberWithCommas(total), cx, cy)
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Total', cx, cy + 18)
    ctx.restore()
  },
}

// Chart renderers
let __inventoryChartInstance = null
function renderInventoryChart(labels, data, opts = {}) {
  const ctx = document.getElementById('inventory-chart')
  if (!ctx) return
  if (typeof Chart === 'undefined') return
  if (__inventoryChartInstance) __inventoryChartInstance.destroy()
  const threshold = typeof opts.threshold === 'number' ? opts.threshold : null
  const lowMask = Array.isArray(opts.lowMask)
    ? opts.lowMask
    : labels.map(() => false)
  const ThresholdLinePlugin = {
    id: 'thresholdLine',
    afterDatasetsDraw(chart) {
      if (threshold == null) return
      const { ctx, chartArea, scales } = chart
      if (!chartArea || !scales?.y) return
      const y = scales.y.getPixelForValue(threshold)
      ctx.save()
      ctx.strokeStyle = '#ef4444'
      ctx.setLineDash([4, 4])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(chartArea.left, y)
      ctx.lineTo(chartArea.right, y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#ef4444'
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
      ctx.textAlign = 'right'
      ctx.fillText(
        `Threshold: ${numberWithCommas(threshold)}`,
        chartArea.right - 4,
        y - 6
      )
      ctx.restore()
    },
  }

  __inventoryChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Current Stock',
          data,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 48,
          backgroundColor: (context) => {
            const idx = context?.dataIndex ?? 0
            // Low items get warm gradient, others cool gradient
            const low = !!lowMask[idx]
            const { chart } = context
            const { ctx: c, chartArea } = chart
            if (!chartArea) return low ? '#f97316' : '#3b82f6'
            const g = c.createLinearGradient(
              0,
              chartArea.bottom,
              0,
              chartArea.top
            )
            if (low) {
              g.addColorStop(0, '#f97316') // orange-500
              g.addColorStop(1, '#ef4444') // red-500
            } else {
              g.addColorStop(0, '#22c55e') // green-500
              g.addColorStop(1, '#3b82f6') // blue-500
            }
            return g
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 8 },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', font: { size: 12 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: {
            color: '#6b7280',
            font: { size: 12 },
            callback: (v) => numberWithCommas(v),
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#111827', font: { weight: '600' } },
        },
        tooltip: {
          callbacks: { label: (ctx) => ` ${numberWithCommas(ctx.raw)}` },
        },
        title: {
          display: true,
          text:
            opts?.totalItems && opts?.topN && opts.totalItems > opts.topN
              ? `Inventory Stock (Top ${opts.topN} of ${opts.totalItems})`
              : 'Inventory Stock by Product',
          color: '#111827',
          font: { weight: '600', size: 14 },
        },
        valueDataLabels: { display: true, format: 'number' },
      },
      animation: { duration: 600, easing: 'easeOutQuart' },
    },
    plugins: [ValueDataLabelsPlugin, ThresholdLinePlugin],
  })
}

let __statusChartInstance = null
function renderStatusChart(labels, data) {
  const ctx = document.getElementById('status-chart')
  if (!ctx) return
  if (typeof Chart === 'undefined') return
  if (__statusChartInstance) __statusChartInstance.destroy()

  // Generate colors based on actual status labels
  const backgroundColors = labels.map((label) =>
    getStatusColor(label.toLowerCase())
  )

  __statusChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      layout: { padding: 8 },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#111827', boxWidth: 12, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce(
                (a, b) => a + (Number(b) || 0),
                0
              )
              const val = Number(ctx.raw) || 0
              const pct = total ? ((val / total) * 100).toFixed(1) : '0.0'
              return ` ${ctx.label}: ${numberWithCommas(val)} (${pct}%)`
            },
          },
        },
        title: {
          display: true,
          text: 'Requests by Status',
          color: '#111827',
          font: { weight: '600', size: 14 },
        },
        doughnutCenterText: { color: '#111827' },
      },
      animation: { animateScale: true, animateRotate: true },
    },
    plugins: [DoughnutCenterTextPlugin],
  })
}

// Hook filters and export buttons after page load
function initializeReportPageEvents(pageId) {
  if (pageId === 'inventory-reports') {
    document
      .getElementById('inventory-department-filter')
      ?.addEventListener('change', renderInventoryReport)
    document
      .getElementById('inventory-date-from')
      ?.addEventListener('change', renderInventoryReport)
    document
      .getElementById('inventory-date-to')
      ?.addEventListener('change', renderInventoryReport)
    document
      .getElementById('export-inventory-btn')
      ?.addEventListener('click', exportInventoryCSV)
    document
      .getElementById('low-stock-threshold')
      ?.addEventListener('change', renderInventoryReport)
    document
      .getElementById('low-stock-threshold')
      ?.addEventListener('change', function (e) {
        const v = parseInt(e.target.value, 10)
        if (!isNaN(v)) AppState.lowStockThreshold = v
      })
    document
      .getElementById('export-lowstock-btn')
      ?.addEventListener('click', exportLowStockCSV)
    // initial render
    renderInventoryReport()
  }
  if (pageId === 'requisition-reports') {
    document
      .getElementById('requisition-department-filter')
      ?.addEventListener('change', renderRequisitionReport)
    document
      .getElementById('requisition-date-from')
      ?.addEventListener('change', renderRequisitionReport)
    document
      .getElementById('requisition-date-to')
      ?.addEventListener('change', renderRequisitionReport)
    document
      .getElementById('export-requisition-btn')
      ?.addEventListener('click', exportRequisitionCSV)
    renderRequisitionReport()
  }
  if (pageId === 'status-report') {
    document
      .getElementById('status-department-filter')
      ?.addEventListener('change', renderStatusReport)
    document
      .getElementById('status-status-filter')
      ?.addEventListener('change', renderStatusReport)
    document
      .getElementById('status-date-from')
      ?.addEventListener('change', renderStatusReport)
    document
      .getElementById('status-date-to')
      ?.addEventListener('change', renderStatusReport)
    document
      .getElementById('export-status-btn')
      ?.addEventListener('click', exportStatusCSV)
    renderStatusReport()
  }
}

// Ensure initializePageEvents calls the report page events too
const _origInitializePageEvents = initializePageEvents
initializePageEvents = function (pageId) {
  _origInitializePageEvents(pageId)
  initializeReportPageEvents(pageId)
}

// ----------------------------- //
// Purchase Order Modal Functions //
// ----------------------------- //

function openPurchaseOrderModal(mode = 'create', requestId = null) {
  const modal = document.getElementById('purchase-order-modal')
  const modalContent = modal.querySelector('.modal-content')

  AppState.currentModal = { mode, requestId }
  // Reset wizard step if creating new
  if (mode === 'create') {
    AppState.purchaseOrderWizardStep = 1
    AppState.purchaseOrderDraft = {} // reset draft on fresh create
  }

  // Load existing request if not create mode
  let requestData = null
  if (requestId) {
    requestData =
      AppState.newRequests.find((r) => r.id === requestId) ||
      AppState.pendingRequests.find((r) => r.id === requestId) ||
      AppState.completedRequests.find((r) => r.id === requestId)
  }

  // Use wizard wrapper if create mode, otherwise legacy single view for view mode
  if (mode === 'create') {
    modalContent.innerHTML = generatePurchaseOrderWizardShell(requestData)
    renderPurchaseOrderWizardStep(requestData)
  } else {
    modalContent.innerHTML = generatePurchaseOrderModal(mode, requestData)
  }
  modal.classList.add('active')

  lucide.createIcons()
  if (mode === 'view') {
    initializePurchaseOrderModal(requestData)
  }
}

function closePurchaseOrderModal() {
  const modal = document.getElementById('purchase-order-modal')
  modal.classList.remove('active')
  AppState.currentModal = null
}

// New: render a compact "View Forms" UI into the existing purchase-order-modal
function openRequestViewForms(requestId) {
  const modal = document.getElementById('purchase-order-modal')
  const modalContent = modal.querySelector('.modal-content')

  const request =
    AppState.newRequests.find((r) => r.id === requestId) ||
    AppState.pendingRequests.find((r) => r.id === requestId) ||
    AppState.completedRequests.find((r) => r.id === requestId) ||
    null

  // Build a forms table similar to the screenshot provided by user
  modalContent.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">Request Forms - ${requestId}</h2>
      <button class="modal-close" onclick="closePurchaseOrderModal()">
        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
      </button>
    </div>
    <div class="modal-body">
      <div class="table-responsive">
        <table class="table view-forms-table" style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="width:10%;">STOCK #</th>
              <th style="width:8%;">UNIT</th>
              <th style="width:24%;">DESCRIPTION</th>
              <th style="width:24%;">DETAILED DESCRIPTION</th>
              <th style="width:8%;">QTY</th>
              <th style="width:8%;">UNIT COST</th>
              <th style="width:8%;">AMOUNT</th>
              <th style="width:8%;">FORMS</th>
              <th style="width:6%;">ACTION</th>
            </tr>
          </thead>
          <tbody id="viewforms-rows">
            <!-- If request exists and has items, render them; otherwise show an empty row for display -->
            ${
              request && request.items && request.items.length
                ? request.items
                    .map(
                      (it, idx) => `
            <tr>
              <td><input class="form-input" value="${it.stock || ''}" /></td>
              <td><input class="form-input" value="${it.unit || ''}" /></td>
              <td><input class="form-input" value="${it.name || ''}" /></td>
              <td><input class="form-input" value="${
                it.description || ''
              }" /></td>
              <td><input class="form-input" value="${it.quantity || ''}" /></td>
              <td><input class="form-input" value="${
                it.unitCost || '0.00'
              }" /></td>
              <td><strong>${formatCurrency(
                (it.quantity || 0) * (it.unitCost || 0)
              )}</strong></td>
              <td>
                <label class="form-checkbox"><input type="checkbox" ${
                  it.forms?.includes('ICS') ? 'checked' : ''
                }/> ICS</label>
                <label class="form-checkbox"><input type="checkbox" ${
                  it.forms?.includes('RIS') ? 'checked' : ''
                }/> RIS</label>
                <label class="form-checkbox"><input type="checkbox" ${
                  it.forms?.includes('PAR') ? 'checked' : ''
                }/> PAR</label>
                <label class="form-checkbox"><input type="checkbox" ${
                  it.forms?.includes('IAR') ? 'checked' : ''
                }/> IAR</label>
              </td>
              <td><button class="icon-action-btn icon-action-danger" onclick="(function(){ const tr=this.closest('tr'); tr.remove(); })()"><i data-lucide="trash-2"></i></button></td>
            </tr>
            `
                    )
                    .join('')
                : `
            <tr>
              <td><input class="form-input" placeholder="e.g., 1"/></td>
              <td><input class="form-input" placeholder="Unit"/></td>
              <td><input class="form-input" placeholder="Item name"/></td>
              <td><input class="form-input" placeholder="Detailed description"/></td>
              <td><input class="form-input" placeholder="Qty"/></td>
              <td><input class="form-input" placeholder="0.00"/></td>
              <td><strong>₱0.00</strong></td>
              <td>
                <label class="form-checkbox"><input type="checkbox"/> ICS</label>
                <label class="form-checkbox"><input type="checkbox"/> RIS</label>
                <label class="form-checkbox"><input type="checkbox"/> PAR</label>
                <label class="form-checkbox"><input type="checkbox"/> IAR</label>
              </td>
              <td><button class="icon-action-btn icon-action-danger" onclick="(function(){ const tr=this.closest('tr'); tr.remove(); })()"><i data-lucide="trash-2"></i></button></td>
            </tr>
            `
            }
          </tbody>
        </table>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px;">
        <div style="padding:12px 20px;background:#f1f8ff;border-radius:6px;">Grand Total: <strong id="viewforms-grandtotal">₱0.00</strong></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closePurchaseOrderModal()">Close</button>
    </div>
  `

  // Re-render icons and compute grand total
  lucide.createIcons()
  computeViewformsGrandTotal()
  modal.classList.add('active')
}

function computeViewformsGrandTotal() {
  const tbody = document.getElementById('viewforms-rows')
  if (!tbody) return
  let total = 0
  tbody.querySelectorAll('tr').forEach((tr) => {
    const qty =
      parseFloat(tr.querySelectorAll('input.form-input')[4]?.value || 0) || 0
    const unitCost =
      parseFloat(tr.querySelectorAll('input.form-input')[5]?.value || 0) || 0
    total += qty * unitCost
  })
  const el = document.getElementById('viewforms-grandtotal')
  if (el) el.textContent = formatCurrency(total)
}

window.openRequestViewForms = openRequestViewForms

// New: small chooser popover to select forms (ICS, RIS, PAR, IAR) instead of opening modal
function openViewForms(triggerEl, requestId) {
  // Improved chooser: viewport-aware positioning, focus management, keyboard handling, ARIA
  // Save previously focused element so we can restore focus on close
  const previousActive = document.activeElement

  // Remove any existing chooser first
  const existing = document.getElementById('request-forms-chooser')
  if (existing) existing.remove()

  // Find request data
  const request =
    AppState.newRequests.find((r) => r.id === requestId) ||
    AppState.pendingRequests.find((r) => r.id === requestId) ||
    AppState.completedRequests.find((r) => r.id === requestId) ||
    null

  const container = document.createElement('div')
  container.id = 'request-forms-chooser'
  container.setAttribute('role', 'dialog')
  container.setAttribute('aria-modal', 'false')
  const headingId = `request-forms-chooser-title-${Date.now()}`
  container.setAttribute('aria-labelledby', headingId)
  container.tabIndex = -1

  // Basic styles + animation-ready
  container.style.position = 'absolute'
  container.style.zIndex = 1200
  container.style.minWidth = '240px'
  container.style.maxWidth = '320px'
  container.style.background = 'white'
  container.style.border = '1px solid rgba(0,0,0,0.08)'
  container.style.boxShadow = '0 8px 24px rgba(2,6,23,0.12)'
  container.style.borderRadius = '8px'
  container.style.padding = '10px'
  container.style.opacity = '0'
  container.style.transform = 'translateY(6px)'
  container.style.transition = 'opacity 160ms ease, transform 160ms ease'

  // Ensure a global, reusable style for chooser close buttons exists
  if (!document.getElementById('global-chooser-close-style')) {
    const css = document.createElement('style')
    css.id = 'global-chooser-close-style'
    css.textContent = `
      /* Global chooser close button */
      .chooser-close-btn {
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid rgba(15,23,42,0.06);
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font-weight: 600;
        transition: background 120ms ease, transform 60ms ease;
      }
      .chooser-close-btn:hover {
        background: #f3f4f6;
      }
      .chooser-close-btn:active {
        transform: translateY(1px);
      }

      /* Global chooser link style used by request forms chooser */
      .chooser-link {
        display: block;
        padding: 8px 10px;
        border-radius: 6px;
        color: #0f172a;
        text-decoration: none;
        border: 1px solid rgba(15,23,42,0.06);
        transition: background 120ms ease, transform 60ms ease, box-shadow 120ms ease;
        background: #ffffff;
      }
      .chooser-link:hover {
        background: #f3f4f6;
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(2,6,23,0.06);
      }
      .chooser-link:active {
        transform: translateY(1px);
      }
    `
    document.head.appendChild(css)
  }

  // Build helper to resolve route URLs from window.APP_ROUTES if provided, else use sensible fallbacks
  const baseUrl = (window.APP_ROUTES && window.APP_ROUTES.base) || ''
  function buildHref(routeKey, fallbackPath) {
    const r = window.APP_ROUTES && window.APP_ROUTES[routeKey]
    if (r && typeof r === 'string')
      return r.replace('{id}', requestId).replace(':id', requestId)
    // Fallback: replace {id} in fallbackPath and ensure baseUrl prefix
    return `${baseUrl}${fallbackPath.replace('{id}', requestId)}`
  }

  const poHref = buildHref('purchaseOrderView', '/purchase-order/view/{id}')
  const prHref = buildHref('purchaseRequestView', '/purchase-request/view/{id}')
  const icsHref = buildHref(
    'inventoryCustodianSlipView',
    '/inventory-custodian-slip/view/{id}'
  )

  const iarHref = buildHref(
    'inspectionAcceptanceReportView',
    '/inspection-acceptance-report/view/{id}'
  )

  // New: PAR (Property Acknowledgement Receipt) and RIS (Requisition and Issue Slip) links
  const parHref = buildHref(
    'propertyAcknowledgementReceiptView',
    '/property-acknowledgement-receipt/view/{id}'
  )

  const risHref = buildHref(
    'requisitionIssueSlipView',
    '/requisition-issue-slip/view/{id}'
  )

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;min-width:220px;">
      <div id="${headingId}" style="font-weight:700;font-size:14px;color:#0f172a;">View / Open</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:6px;">
    <a class="chooser-link" href="${poHref}" target="_blank" rel="noopener">Purchase Order (PO)</a>
    <a class="chooser-link" href="${prHref}" target="_blank" rel="noopener">Purchase Request (PR)</a>
  <a class="chooser-link" href="${icsHref}" target="_blank" rel="noopener">Inventory Custodian Slip (ICS)</a>
  <a class="chooser-link" href="${risHref}" target="_blank" rel="noopener">Requisition &amp; Issue Slip (RIS)</a>
  <a class="chooser-link" href="${parHref}" target="_blank" rel="noopener">Property Acknowledgement Receipt (PAR)</a>
  <a class="chooser-link" href="${iarHref}" target="_blank" rel="noopener">Inspection &amp; Acceptance Report (IAR)</a>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
        <button type="button" class="chooser-close-btn" id="chooser-close">Close</button>
      </div>
    </div>
  `

  document.body.appendChild(container)

  // Positioning: compute and place container within viewport (flip/fit)
  const triggerRect = triggerEl.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const viewportTop = window.scrollY
  const viewportBottom = window.scrollY + window.innerHeight
  const spaceBelow = viewportBottom - (triggerRect.bottom + window.scrollY)
  const spaceAbove = triggerRect.top + window.scrollY - viewportTop

  // Decide vertical placement
  let top = triggerRect.bottom + window.scrollY + 8 // default below
  if (
    spaceBelow < containerRect.height + 8 &&
    spaceAbove > containerRect.height + 8
  ) {
    // place above
    top = triggerRect.top + window.scrollY - containerRect.height - 8
  } else if (spaceBelow < containerRect.height + 8) {
    // fit in viewport by clamping
    top = Math.max(viewportTop + 8, viewportBottom - containerRect.height - 8)
  }

  // Horizontal placement: align to left of trigger but keep inside viewport
  let left = triggerRect.left + window.scrollX
  if (left + containerRect.width > window.scrollX + window.innerWidth - 8) {
    left = window.scrollX + window.innerWidth - containerRect.width - 8
  }
  if (left < window.scrollX + 8) left = window.scrollX + 8

  container.style.top = top + 'px'
  container.style.left = left + 'px'

  // After placement, animate in
  requestAnimationFrame(() => {
    container.style.opacity = '1'
    container.style.transform = 'translateY(0)'
  })

  // Focus management: focusable are links and buttons inside the chooser
  const focusableSelector = 'a[href], button'
  const focusable = Array.from(
    container.querySelectorAll(focusableSelector)
  ).filter((el) => !el.disabled)
  const firstFocusable = focusable[0]
  const lastFocusable = focusable[focusable.length - 1]
  if (firstFocusable) firstFocusable.focus()

  // Handlers
  function closeChooser(returnFocus = true) {
    // animate out
    container.style.opacity = '0'
    container.style.transform = 'translateY(6px)'
    setTimeout(() => {
      if (container && container.parentNode)
        container.parentNode.removeChild(container)
    }, 160)
    document.removeEventListener('click', onDocClick)
    container.removeEventListener('keydown', onKeyDown)
    if (
      returnFocus &&
      previousActive &&
      typeof previousActive.focus === 'function'
    )
      previousActive.focus()
  }

  function onDocClick(e) {
    if (!container.contains(e.target) && e.target !== triggerEl) {
      closeChooser(true)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeChooser(true)
      return
    }
    if (e.key === 'Tab') {
      // Focus trap
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const cur = document.activeElement
      const idx = focusable.indexOf(cur)
      if (e.shiftKey) {
        if (idx === 0 || cur === container) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (idx === focusable.length - 1) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }
    // Enter on a focused link/button activates normally; no special handling required
  }

  container.addEventListener('keydown', onKeyDown)
  // Defer adding doc click so the opening click doesn't trigger close
  setTimeout(() => document.addEventListener('click', onDocClick), 0)

  // Close button wiring
  container
    .querySelector('#chooser-close')
    ?.addEventListener('click', () => closeChooser(true))
}

window.openViewForms = openViewForms

// ---------------------- //
// Purchase Order Wizard  //
// ---------------------- //

function generatePurchaseOrderWizardShell(requestData) {
  return `
        <div class="modal-header" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; border-bottom: none; padding: 32px 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                    <i data-lucide="file-plus" style="width: 32px; height: 32px; color: white;"></i>
                </div>
                <div style="flex: 1;">
                    <h2 class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">New Purchase Order</h2>
                    <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">Step-by-step purchase order creation</p>
                    <p style="font-size: 12px; color: rgba(255,255,255,0.8); margin: 4px 0 0 0;">Camarines Norte State College</p>
                </div>
            </div>
            <button class="modal-close" onclick="closePurchaseOrderModal()" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>
        <div class="modal-body" id="po-wizard-body" style="padding: 32px 24px; background: #f9fafb;"></div>
        <div class="modal-footer" id="po-wizard-footer" style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end;"></div>
    `
}

function renderPurchaseOrderWizardStep(requestData) {
  const body = document.getElementById('po-wizard-body')
  const footer = document.getElementById('po-wizard-footer')
  if (!body || !footer) return
  const step = AppState.purchaseOrderWizardStep

  const totalSteps = 4
  const stepLabels = ['Supplier', 'Details', 'Items', 'Review']
  const stepIcons = ['truck', 'file-text', 'package', 'check-circle']

  const progress = (() => {
    const parts = []
    for (let i = 1; i <= totalSteps; i++) {
      const isCompleted = i < step
      const isActive = i === step
      const cls = isCompleted
        ? 'po-step completed'
        : isActive
        ? 'po-step active'
        : 'po-step'
      const stepColor = isCompleted
        ? '#16a34a'
        : isActive
        ? '#2563eb'
        : '#9ca3af'
      parts.push(`
                <div class="po-step-wrap">
                    <div class="${cls}" style="background: ${
        isCompleted ? '#16a34a' : isActive ? '#2563eb' : '#e5e7eb'
      }; color: ${isCompleted || isActive ? 'white' : '#6b7280'}; box-shadow: ${
        isActive ? '0 4px 6px rgba(37, 99, 235, 0.3)' : 'none'
      };">
                        ${
                          isCompleted
                            ? '<i data-lucide="check" style="width: 16px; height: 16px;"></i>'
                            : i
                        }
                    </div>
                    <div class="po-step-label" style="color: ${stepColor}; font-weight: ${
        isActive ? '600' : '500'
      };">${stepLabels[i - 1]}</div>
                </div>
            `)
    }
    const fillPct = ((step - 1) / (totalSteps - 1)) * 100
    return `<div class="po-progress" style="margin-bottom: 32px;"><div class="po-progress-bar-fill" style="width:${fillPct}%; background: linear-gradient(90deg, #16a34a 0%, #2563eb 100%);"></div>${parts.join(
      ''
    )}</div>`
  })()

  function footerButtons(extraNextCondition = true, nextLabel = 'Next') {
    return `
            <button class="btn-secondary" onclick="closePurchaseOrderModal()" style="padding: 10px 24px; font-weight: 500; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                Cancel
            </button>
            ${
              step > 1
                ? `
                <button class="btn-secondary" onclick="prevPurchaseOrderStep()" style="padding: 10px 24px; font-weight: 500; border-radius: 8px; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
                    Back
                </button>
            `
                : ''
            }
            ${
              step < totalSteps
                ? `
                <button class="btn btn-primary" ${
                  !extraNextCondition ? 'disabled' : ''
                } onclick="nextPurchaseOrderStep()" style="padding: 10px 24px; font-weight: 500; border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25); transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                    ${nextLabel}
                    <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
                </button>
            `
                : `
                <button class="btn btn-primary" onclick="finalizePurchaseOrderCreation()" style="padding: 10px 24px; font-weight: 500; border-radius: 8px; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); box-shadow: 0 4px 6px rgba(22, 163, 74, 0.25); transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                    Create Purchase Order
                </button>
            `
            }
        `
  }

  if (step === 1) {
    body.innerHTML = `
            <div class="po-wizard">
                ${progress}
                <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div class="po-step-head" style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="truck" style="width: 20px; height: 20px; color: #2563eb;"></i>
                            Supplier Information
                        </h3>
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Provide accurate supplier identity and tax details. These fields are used for validation and downstream financial references.</p>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Primary Information</h4>
                        <div class="grid-2">
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="building" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Supplier<span style="color:#dc2626"> *</span>
                                </label>
                                <input type="text" class="form-input" id="po-supplier" placeholder="e.g. ABC Office Supplies" value="${
                                  AppState.purchaseOrderDraft.supplier || ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="file-text" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    P.O. Number<span style="color:#dc2626"> *</span>
                                </label>
                                <input type="text" class="form-input" id="po-number" placeholder="Enter P.O. number" value="${
                                  AppState.purchaseOrderDraft.poNumber || ''
                                }" required style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Additional Details</h4>
                        <div class="grid-2">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Supplier Address
                                </label>
                                <textarea class="form-textarea" id="po-supplier-address" placeholder="Street, City, Province" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; min-height: 80px; transition: all 0.2s;">${
                                  AppState.purchaseOrderDraft.supplierAddress ||
                                  ''
                                }</textarea>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="hash" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    TIN Number
                                </label>
                                <input type="text" class="form-input" id="po-supplier-tin" placeholder="000-000-000-000" value="${
                                  AppState.purchaseOrderDraft.supplierTIN || ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    footer.innerHTML = footerButtons(true, 'Next')
  } else if (step === 2) {
    const departments = [
      { value: 'COENG', label: 'College of Engineering' },
      { value: 'CBPA', label: 'College of Business and Public Administration' },
      { value: 'CAS', label: 'College of Arts and Sciences' },
      { value: 'CCMS', label: 'College of Computing and Multimedia Studies' },
      { value: 'OP', label: 'Office of the President' },
      {
        value: 'OVPAA',
        label: 'Office of the Vice President for Academic Affairs',
      },
      {
        value: 'OVPRE',
        label: 'Office of the Vice President for Research and Extension',
      },
      {
        value: 'OVPFA',
        label: 'Office of the Vice President for Finance Affairs',
      },
    ]
    body.innerHTML = `
            <div class="po-wizard">
                ${progress}
                <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div class="po-step-head" style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="file-text" style="width: 20px; height: 20px; color: #2563eb;"></i>
                            Procurement & Delivery Details
                        </h3>
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Specify contextual information that defines how and when the goods will be procured and delivered.</p>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Core Details</h4>
                        <div class="grid-2">
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="briefcase" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Department<span style="color:#dc2626"> *</span>
                                </label>
                                <select class="form-select" id="po-department" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                                    <option value="">Select Department</option>
                                    ${departments
                                      .map(
                                        (d) =>
                                          `<option value="${d.value}" ${
                                            AppState.purchaseOrderDraft
                                              .department === d.value
                                              ? 'selected'
                                              : ''
                                          }>${d.label}</option>`
                                      )
                                      .join('')}
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Date of Purchase
                                </label>
                                <input type="date" class="form-input" id="po-date" value="${
                                  AppState.purchaseOrderDraft.purchaseDate || ''
                                }" min="${
      new Date().toISOString().split('T')[0]
    }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                        </div>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Procurement Context</h4>
                        <div class="grid-2">
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="shopping-cart" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Mode of Procurement
                                </label>
                                <select class="form-select" id="po-mode" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                                    <option value="">Select procurement mode</option>
                                    <option ${
                                      AppState.purchaseOrderDraft
                                        .procurementMode ===
                                      'Small Value Procurement'
                                        ? 'selected'
                                        : ''
                                    }>Small Value Procurement</option>
                                    <option ${
                                      AppState.purchaseOrderDraft
                                        .procurementMode ===
                                      'Medium Value Procurement'
                                        ? 'selected'
                                        : ''
                                    }>Medium Value Procurement</option>
                                    <option ${
                                      AppState.purchaseOrderDraft
                                        .procurementMode ===
                                      'High Value Procurement'
                                        ? 'selected'
                                        : ''
                                    }>High Value Procurement</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="message-square" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Gentlemen Clause
                                </label>
                                <textarea class="form-textarea" id="po-gentlemen" placeholder="Please furnish this office ..." style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; min-height: 80px; transition: all 0.2s;">${
                                  AppState.purchaseOrderDraft.gentlemen || ''
                                }</textarea>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Logistics</h4>
                        <div class="grid-2">
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Place of Delivery
                                </label>
                                <input type="text" class="form-input" id="po-place" placeholder="Campus / Building / Room" value="${
                                  AppState.purchaseOrderDraft.placeOfDelivery ||
                                  ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="calendar-check" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Date of Delivery
                                </label>
                                <select class="form-select" id="po-delivery-date" onchange="toggleDeliveryDateOther(this)" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                                    <option value="">Select delivery timeframe</option>
                                    <option value="15 days" ${
                                      AppState.purchaseOrderDraft
                                        .deliveryDate === '15 days'
                                        ? 'selected'
                                        : ''
                                    }>15 days</option>
                                    <option value="30 days" ${
                                      AppState.purchaseOrderDraft
                                        .deliveryDate === '30 days'
                                        ? 'selected'
                                        : ''
                                    }>30 days</option>
                                    <option value="45 days" ${
                                      AppState.purchaseOrderDraft
                                        .deliveryDate === '45 days'
                                        ? 'selected'
                                        : ''
                                    }>45 days</option>
                                    <option value="60 days" ${
                                      AppState.purchaseOrderDraft
                                        .deliveryDate === '60 days'
                                        ? 'selected'
                                        : ''
                                    }>60 days</option>
                                    <option value="others" ${
                                      ![
                                        '',
                                        '15 days',
                                        '30 days',
                                        '45 days',
                                        '60 days',
                                      ].includes(
                                        AppState.purchaseOrderDraft
                                          .deliveryDate || ''
                                      )
                                        ? 'selected'
                                        : ''
                                    }>Others</option>
                                </select>
                                <input type="text" class="form-input" id="po-delivery-date-other" placeholder="Specify delivery timeframe" value="${
                                  ![
                                    '',
                                    '15 days',
                                    '30 days',
                                    '45 days',
                                    '60 days',
                                  ].includes(
                                    AppState.purchaseOrderDraft.deliveryDate ||
                                      ''
                                  )
                                    ? AppState.purchaseOrderDraft.deliveryDate
                                    : ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s; margin-top: 8px; display: ${
      !['', '15 days', '30 days', '45 days', '60 days'].includes(
        AppState.purchaseOrderDraft.deliveryDate || ''
      )
        ? 'block'
        : 'none'
    };">
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="clock" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Delivery Status
                                </label>
                                <input type="text" class="form-input" id="po-delivery-term" placeholder="e.g. Partial / Complete" value="${
                                  AppState.purchaseOrderDraft.deliveryTerm || ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="credit-card" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Payment Term
                                </label>
                                <input type="text" class="form-input" id="po-payment-term" placeholder="e.g. Net 30" value="${
                                  AppState.purchaseOrderDraft.paymentTerm || ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    footer.innerHTML = footerButtons(true, 'Next')
  } else if (step === 3) {
    body.innerHTML = `
            <div class="po-wizard">
                ${progress}
                <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div class="po-step-head" style="margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="package" style="width: 20px; height: 20px; color: #2563eb;"></i>
                            Order Items
                        </h3>
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">List each item clearly. Descriptions will auto-fill if the stock property number matches existing inventory.</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px 16px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
                        <p style="margin: 0; font-size: 13px; color: #1e40af; font-weight: 500;">
                            <i data-lucide="info" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i>
                            Add the materials or assets to be procured
                        </p>
                        <button class="btn btn-primary" type="button" onclick="addPOItem()" style="padding: 8px 16px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);">
                            <i data-lucide="plus" class="icon" style="width: 16px; height: 16px;"></i>
                            Add Item
                        </button>
                    </div>
                    <div class="table-container" style="max-height: 350px; overflow: auto; border: 2px solid #e5e7eb; border-radius: 8px;">
                        <table class="table" id="po-items-table">
                            <thead style="background: #f9fafb;">
                                <tr>
                                    <th style="padding: 12px;">Stock #</th>
                                    <th style="padding: 12px;">Unit</th>
                                    <th style="padding: 12px;">Description</th>
                                    <th style="padding: 12px;">Detailed Description</th>
                                    <th style="padding: 12px;">Qty</th>
                                    <th style="padding: 12px;">Unit Cost</th>
                                    <th style="padding: 12px;">Amount</th>
                                    <th style="padding: 12px;">Forms</th>
                                    <th style="padding: 12px;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="po-items-tbody"></tbody>
                            <tfoot>
                                <tr style="border-top: 2px solid #e5e7eb; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);">
                                    <td colspan="7" style="text-align: right; font-weight: 600; padding: 16px; color: #1e40af;">Grand Total:</td>
                                    <td style="font-weight: 700; color: #2563eb; padding: 16px; font-size: 16px;" id="grand-total">₱0.00</td>
                                    <td style="padding: 16px;"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        `
    // Initialize after table exists
    initializePurchaseOrderModal(null, { skipRender: true })
    renderPOItems()
    footer.innerHTML = footerButtons(
      AppState.purchaseOrderItems.length > 0,
      'Next'
    )
    lucide.createIcons()
  } else if (step === 4) {
    const totalAmount = AppState.purchaseOrderItems.reduce(
      (s, i) => s + i.amount,
      0
    )
    body.innerHTML = `
            <div class="po-wizard">
                ${progress}
                <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div class="po-step-head" style="margin-bottom: 20px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="check-circle" style="width: 20px; height: 20px; color: #16a34a;"></i>
                            Review & Finalize
                        </h3>
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Confirm all details. Once created, edits will require opening the order in edit mode.</p>
                    </div>
                    
                    <!-- Summary Box -->
                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #93c5fd; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <i data-lucide="clipboard-check" style="width: 20px; height: 20px; color: #1e40af;"></i>
                            <p style="margin: 0; font-weight: 600; color: #1e40af; font-size: 15px;">Order Summary</p>
                        </div>
                        <div style="display: flex; gap: 24px; margin-top: 12px;">
                            <div style="flex: 1;">
                                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Items</p>
                                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #2563eb;">${
                                  AppState.purchaseOrderItems.length
                                }</p>
                            </div>
                            <div style="flex: 2;">
                                <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</p>
                                <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #16a34a;">${formatCurrency(
                                  totalAmount
                                )}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Funding Section -->
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="dollar-sign" style="width: 16px; height: 16px; color: #2563eb;"></i>
                            Funding Information
                        </h4>
                        <div class="grid-3">
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="layers" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Fund Cluster
                                </label>
                                <select class="form-select" id="po-fund-cluster" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                                    <option value="">Select fund cluster</option>
                                    <option value="01 - Regular Agency Fund" ${
                                      AppState.purchaseOrderDraft
                                        .fundCluster ===
                                      '01 - Regular Agency Fund'
                                        ? 'selected'
                                        : ''
                                    }>01 - Regular Agency Fund</option>
                                    <option value="05 - Income Generated Fund" ${
                                      AppState.purchaseOrderDraft
                                        .fundCluster ===
                                      '05 - Income Generated Fund'
                                        ? 'selected'
                                        : ''
                                    }>05 - Income Generated Fund</option>
                                    <option value="06 - Business Related Fund" ${
                                      AppState.purchaseOrderDraft
                                        .fundCluster ===
                                      '06 - Business Related Fund'
                                        ? 'selected'
                                        : ''
                                    }>06 - Business Related Fund</option>
                                    <option value="07 - General Appropriations Act (GAA)" ${
                                      AppState.purchaseOrderDraft
                                        .fundCluster ===
                                      '07 - General Appropriations Act (GAA)'
                                        ? 'selected'
                                        : ''
                                    }>07 - General Appropriations Act (GAA)</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="banknote" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Funds Available (Optional)
                                </label>
                                <input type="text" class="form-input" id="po-funds-available" placeholder="e.g. ₱0.00" value="${
                                  AppState.purchaseOrderDraft.fundsAvailable ||
                                  ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="sticky-note" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Notes (Optional)
                                </label>
                                <input type="text" class="form-input" id="po-notes" placeholder="Short note" value="${
                                  AppState.purchaseOrderDraft.notes || ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                        </div>
                    </div>
                    
                    <!-- ORS/BURS Section -->
                    <div style="margin-bottom: 24px;">
                        <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="receipt" style="width: 16px; height: 16px; color: #2563eb;"></i>
                            ORS / BURS Information
                        </h4>
                        <div class="grid-3">
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="hash" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    ORS/BURS No.
                                </label>
                                <input type="text" class="form-input" id="po-ors-no" placeholder="Enter ORS/BURS number" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Date of ORS/BURS
                                </label>
                                <input type="date" class="form-input" id="po-ors-date" min="${
                                  new Date().toISOString().split('T')[0]
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                    <i data-lucide="banknote" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                    Amount
                                </label>
                                <input type="text" class="form-input" id="po-ors-amount" placeholder="₱0.00" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    footer.innerHTML = footerButtons(true, 'Create')
  }
}

function nextPurchaseOrderStep() {
  // persist current step form values into draft
  persistCurrentWizardStep()
  if (AppState.purchaseOrderWizardStep < 4) {
    AppState.purchaseOrderWizardStep++
    renderPurchaseOrderWizardStep()
    lucide.createIcons()
  }
}

function prevPurchaseOrderStep() {
  persistCurrentWizardStep()
  if (AppState.purchaseOrderWizardStep > 1) {
    AppState.purchaseOrderWizardStep--
    renderPurchaseOrderWizardStep()
    lucide.createIcons()
  }
}

function persistCurrentWizardStep() {
  const step = AppState.purchaseOrderWizardStep
  const modal = document.getElementById('purchase-order-modal')
  if (!modal) return
  if (step === 1) {
    AppState.purchaseOrderDraft.supplier =
      modal.querySelector('#po-supplier')?.value || ''
    AppState.purchaseOrderDraft.supplierAddress =
      modal.querySelector('#po-supplier-address')?.value || ''
    AppState.purchaseOrderDraft.supplierTIN =
      modal.querySelector('#po-supplier-tin')?.value || ''
    AppState.purchaseOrderDraft.poNumber =
      modal.querySelector('#po-number')?.value ||
      AppState.purchaseOrderDraft.poNumber
  } else if (step === 2) {
    AppState.purchaseOrderDraft.department =
      modal.querySelector('#po-department')?.value || ''
    AppState.purchaseOrderDraft.purchaseDate =
      modal.querySelector('#po-date')?.value || ''
    AppState.purchaseOrderDraft.procurementMode =
      modal.querySelector('#po-mode')?.value || ''
    AppState.purchaseOrderDraft.gentlemen =
      modal.querySelector('#po-gentlemen')?.value || ''
    AppState.purchaseOrderDraft.placeOfDelivery =
      modal.querySelector('#po-place')?.value || ''
    // Handle delivery date dropdown with "others" option
    const deliveryDateSelect = modal.querySelector('#po-delivery-date')
    const deliveryDateOther = modal.querySelector('#po-delivery-date-other')
    if (deliveryDateSelect?.value === 'others') {
      AppState.purchaseOrderDraft.deliveryDate = deliveryDateOther?.value || ''
    } else {
      AppState.purchaseOrderDraft.deliveryDate = deliveryDateSelect?.value || ''
    }
    AppState.purchaseOrderDraft.deliveryTerm =
      modal.querySelector('#po-delivery-term')?.value || ''
    AppState.purchaseOrderDraft.paymentTerm =
      modal.querySelector('#po-payment-term')?.value || ''
  } else if (step === 3) {
    // Step 3 (items) - forms are now integrated into each item, no separate checkboxes to save
  } else if (step === 4) {
    AppState.purchaseOrderDraft.orsNo =
      modal.querySelector('#po-ors-no')?.value || ''
    AppState.purchaseOrderDraft.orsDate =
      modal.querySelector('#po-ors-date')?.value || ''
    AppState.purchaseOrderDraft.orsAmount =
      modal.querySelector('#po-ors-amount')?.value || ''
    AppState.purchaseOrderDraft.fundCluster =
      modal.querySelector('#po-fund-cluster')?.value || ''
    AppState.purchaseOrderDraft.fundsAvailable =
      modal.querySelector('#po-funds-available')?.value || ''
    AppState.purchaseOrderDraft.notes =
      modal.querySelector('#po-notes')?.value || ''
  }
}

function finalizePurchaseOrderCreation() {
  // Gather data from wizard fields
  const modal = document.getElementById('purchase-order-modal')
  if (!modal) return
  // ensure latest review inputs saved
  persistCurrentWizardStep()
  const draft = AppState.purchaseOrderDraft || {}
  const supplier = draft.supplier || ''
  const supplierAddress = draft.supplierAddress || ''
  const supplierTIN = draft.supplierTIN || ''
  const poNumber = draft.poNumber || generateNewPONumber()
  const department = draft.department || ''
  const purchaseDate = draft.purchaseDate || ''
  const procurementMode = draft.procurementMode || ''
  const gentlemen = draft.gentlemen || ''
  const placeOfDelivery = draft.placeOfDelivery || ''
  const deliveryDate = draft.deliveryDate || ''
  const deliveryTerm = draft.deliveryTerm || ''
  const paymentTerm = draft.paymentTerm || ''
  const orsNo = draft.orsNo || ''
  const orsDate = draft.orsDate || ''
  const orsAmount = draft.orsAmount || ''
  const fundCluster = draft.fundCluster || ''
  const fundsAvailable = draft.fundsAvailable || ''
  const notes = draft.notes || ''
  const totalAmount = AppState.purchaseOrderItems.reduce(
    (s, i) => s + i.amount,
    0
  )

  const newRequestId = generateNextRequestId()
  const newRequest = {
    id: newRequestId,
    poNumber,
    supplier,
    supplierAddress,
    supplierTIN,
    requestDate: new Date().toISOString().split('T')[0],
    deliveryDate,
    deliveredDate: '', // will be set when actually delivered; keep separate from planned deliveryDate
    purchaseDate,
    procurementMode,
    gentlemen,
    placeOfDelivery,
    deliveryTerm,
    paymentTerm,
    orsNo,
    orsDate,
    orsAmount,
    fundCluster,
    fundsAvailable,
    notes,
    totalAmount,
    status: 'submitted',
    requestedBy: 'Current User',
    department,
    // Aggregate forms from items (check if any item has each form enabled)
    generateICS: AppState.purchaseOrderItems.some((item) => item.generateICS),
    generateRIS: AppState.purchaseOrderItems.some((item) => item.generateRIS),
    generatePAR: AppState.purchaseOrderItems.some((item) => item.generatePAR),
    generateIAR: AppState.purchaseOrderItems.some((item) => item.generateIAR),
    items: [...AppState.purchaseOrderItems],
  }
  AppState.newRequests.push(newRequest)
  try {
    if (typeof saveStatusRequests === 'function') saveStatusRequests()
  } catch (e) {}
  showAlert(`New purchase order ${poNumber} created successfully!`, 'success')
  loadPageContent('new-request')
  closePurchaseOrderModal()
}

// Expose wizard functions
window.nextPurchaseOrderStep = nextPurchaseOrderStep
window.prevPurchaseOrderStep = prevPurchaseOrderStep
window.finalizePurchaseOrderCreation = finalizePurchaseOrderCreation

// Enhanced Purchase Order Modal with modern design
function generatePurchaseOrderModal(mode, requestData = null) {
  const title =
    mode === 'create'
      ? 'New Purchase Order'
      : mode === 'edit'
      ? 'Edit Purchase Order'
      : 'Purchase Order Details'
  const subtitle =
    mode === 'create'
      ? 'Create a new purchase order request'
      : mode === 'edit'
      ? 'Update purchase order information'
      : 'View purchase order details'
  const isReadOnly = mode === 'view'

  // Department List using user's suggested values
  const departments = [
    { value: 'COENG', label: 'College of Engineering' },
    { value: 'CBPA', label: 'College of Business and Public Administration' },
    { value: 'CAS', label: 'College of Arts and Sciences' },
    { value: 'CCMS', label: 'College of Computing and Multimedia Studies' },
    { value: 'OP', label: 'Office of the President' },
    {
      value: 'OVPAA',
      label: 'Office of the Vice President for Academic Affairs',
    },
    {
      value: 'OVPRE',
      label: 'Office of the Vice President for Research and Extension',
    },
    {
      value: 'OVPFA',
      label: 'Office of the Vice President for Finance Affairs',
    },
  ]
  const selectedDepartment = requestData?.department || '' // Default to empty value

  return `
        <div class="modal-header" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; border-bottom: none; padding: 32px 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                ${
                  mode !== 'create' && requestData
                    ? `
                    <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                        <i data-lucide="file-text" style="width: 32px; height: 32px; color: white;"></i>
                    </div>
                `
                    : ''
                }
                <div style="flex: 1;">
                    <h2 class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">${title}</h2>
                    <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">${subtitle}</p>
                    <p style="font-size: 12px; color: rgba(255,255,255,0.8); margin: 4px 0 0 0;">Camarines Norte State College</p>
                </div>
            </div>
            <button class="modal-close" onclick="closePurchaseOrderModal()" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>

        <div class="modal-body" style="padding: 32px 24px; background: #f9fafb;">
            <!-- Supplier Information -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="truck" style="width: 18px; height: 18px; color: #2563eb;"></i>
                    Supplier Information
                </h3>
                
                <div class="grid-2">
                    <div class="space-y-4">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="building" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                Supplier Name
                            </label>
                            <input type="text" class="form-input" id="supplierName"
                                   value="${requestData?.supplier || ''}"
                                   placeholder="Enter supplier name" 
                                   style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                   ${isReadOnly ? 'readonly' : ''}>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                Supplier Address
                            </label>
                            <textarea class="form-textarea" id="supplierAddress"
                                      placeholder="Enter supplier address" 
                                      style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; min-height: 80px; transition: all 0.2s;"
                                      ${isReadOnly ? 'readonly' : ''}>${
    requestData?.supplierAddress || ''
  }</textarea>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="hash" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                TIN Number
                            </label>
                            <input type="text" class="form-input" id="supplierTIN"
                                   value="${requestData?.supplierTIN || ''}"
                                   placeholder="Enter TIN number" 
                                   style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                   ${isReadOnly ? 'readonly' : ''}>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="file-text" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                P.O. Number${
                                  isReadOnly
                                    ? ''
                                    : '<span style="color:#dc2626"> *</span>'
                                }
                            </label>
                            <input type="text" class="form-input" id="poNumber"
                                   value="${requestData?.poNumber || ''}"
                                   placeholder="Enter P.O. number" 
                                   style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                   ${isReadOnly ? 'readonly' : 'required'}>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                Date of Purchase
                            </label>
                            <input type="date" class="form-input" id="purchaseDate"
                                   value="${requestData?.purchaseDate || ''}"
                                   min="${
                                     new Date().toISOString().split('T')[0]
                                   }"
                                   style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                   ${isReadOnly ? 'readonly' : ''}>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="shopping-cart" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                Mode of Procurement
                            </label>
                            <select class="form-select" id="procurementMode" ${
                              isReadOnly ? 'disabled' : ''
                            } style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s; ${
    isReadOnly ? 'background: #f9fafb;' : ''
  }">
                                <option ${
                                  !requestData?.procurementMode
                                    ? 'selected'
                                    : ''
                                }>Select procurement mode</option>
                                <option ${
                                  requestData?.procurementMode ===
                                  'Small Value Procurement'
                                    ? 'selected'
                                    : ''
                                }>Small Value Procurement</option>
                                <option ${
                                  requestData?.procurementMode ===
                                  'Medium Value Procurement'
                                    ? 'selected'
                                    : ''
                                }>Medium Value Procurement</option>
                                <option ${
                                  requestData?.procurementMode ===
                                  'High Value Procurement'
                                    ? 'selected'
                                    : ''
                                }>High Value Procurement</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Department & Gentlemen -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="briefcase" style="width: 18px; height: 18px; color: #2563eb;"></i>
                    Department & Request Details
                </h3>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="building-2" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Department
                    </label>
                    <select class="form-select" name="department" id="departmentSelect" ${
                      isReadOnly ? 'disabled' : ''
                    } style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s; ${
    isReadOnly ? 'background: #f9fafb;' : ''
  }">
                        <option value="">Select Department</option>
                        ${departments
                          .map(
                            (dept) => `
                            <option value="${dept.value}" ${
                              dept.value === selectedDepartment
                                ? 'selected'
                                : ''
                            }>
                                ${dept.label}
                            </option>
                        `
                          )
                          .join('')}
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="message-square" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Gentlemen
                    </label>
                    <textarea class="form-textarea" id="gentlemen"
                              placeholder="Please furnish this Office the following articles subject to the terms and conditions contained herein"
                              style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; min-height: 80px; transition: all 0.2s;"
                              ${isReadOnly ? 'readonly' : ''}>${
    requestData?.gentlemen || ''
  }</textarea>
                </div>
            </div>

            <!-- Delivery Information -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="package" style="width: 18px; height: 18px; color: #2563eb;"></i>
                    Delivery & Payment Terms
                </h3>
                
                <div class="grid-2">
                    <div class="space-y-4">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                Place of Delivery
                            </label>
                            <input type="text" class="form-input" id="placeOfDelivery"
                                   value="${requestData?.placeOfDelivery || ''}"
                                   placeholder="Enter delivery location" 
                                   style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                   ${isReadOnly ? 'readonly' : ''}>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="calendar-check" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                Date of Delivery
                            </label>
                            ${
                              isReadOnly
                                ? `
                                <input type="text" class="form-input" id="deliveryDate"
                                       value="${
                                         requestData?.deliveryDate || ''
                                       }"
                                       style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                       readonly>
                            `
                                : `
                                <select class="form-select" id="deliveryDate" onchange="toggleDeliveryDateOtherModal(this)" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                                    <option value="">Select delivery timeframe</option>
                                    <option value="15 days" ${
                                      requestData?.deliveryDate === '15 days'
                                        ? 'selected'
                                        : ''
                                    }>15 days</option>
                                    <option value="30 days" ${
                                      requestData?.deliveryDate === '30 days'
                                        ? 'selected'
                                        : ''
                                    }>30 days</option>
                                    <option value="45 days" ${
                                      requestData?.deliveryDate === '45 days'
                                        ? 'selected'
                                        : ''
                                    }>45 days</option>
                                    <option value="60 days" ${
                                      requestData?.deliveryDate === '60 days'
                                        ? 'selected'
                                        : ''
                                    }>60 days</option>
                                    <option value="others" ${
                                      ![
                                        '',
                                        '15 days',
                                        '30 days',
                                        '45 days',
                                        '60 days',
                                      ].includes(
                                        requestData?.deliveryDate || ''
                                      ) && requestData?.deliveryDate
                                        ? 'selected'
                                        : ''
                                    }>Others</option>
                                </select>
                                <input type="text" class="form-input" id="deliveryDateOther" placeholder="Specify delivery timeframe" value="${
                                  ![
                                    '',
                                    '15 days',
                                    '30 days',
                                    '45 days',
                                    '60 days',
                                  ].includes(requestData?.deliveryDate || '') &&
                                  requestData?.deliveryDate
                                    ? requestData.deliveryDate
                                    : ''
                                }" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s; margin-top: 8px; display: ${
                                    ![
                                      '',
                                      '15 days',
                                      '30 days',
                                      '45 days',
                                      '60 days',
                                    ].includes(
                                      requestData?.deliveryDate || ''
                                    ) && requestData?.deliveryDate
                                      ? 'block'
                                      : 'none'
                                  };">
                            `
                            }
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="form-group" style="margin-bottom: 20px;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="clock" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                Delivery Term
                            </label>
                            <input type="text" class="form-input" id="deliveryTerm"
                                   value="${requestData?.deliveryTerm || ''}"
                                   placeholder="Enter delivery term" 
                                   style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                   ${isReadOnly ? 'readonly' : ''}>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                                <i data-lucide="credit-card" style="width: 14px; height: 14px; color: #6b7280;"></i>
                                Payment Term
                            </label>
                            <input type="text" class="form-input" id="paymentTerm"
                                   value="${requestData?.paymentTerm || ''}"
                                   placeholder="Enter payment term" 
                                   style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                   ${isReadOnly ? 'readonly' : ''}>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Items Section -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="list" style="width: 18px; height: 18px; color: #2563eb;"></i>
                        Order Items
                    </h3>
                    <div style="display: flex; gap: 8px;">
                        ${
                          !isReadOnly
                            ? `
                            <button class="btn btn-primary" onclick="addPOItem()" style="padding: 8px 16px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25);">
                                <i data-lucide="plus" class="icon" style="width: 16px; height: 16px;"></i>
                                Add Item
                            </button>
                        `
                            : ''
                        }
                    </div>
                </div>
                
                <div class="table-container" style="border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                    <table class="table" id="po-items-table">
                        <thead style="background: #f9fafb;">
                            <tr>
                                <th style="padding: 12px;">Stock Property Number</th>
                                <th style="padding: 12px;">Unit</th>
                                <th style="padding: 12px;">Description</th>
                                <th style="padding: 12px;">Detailed Description</th>
                                <th style="padding: 12px;">Quantity</th>
                                <th style="padding: 12px;">Unit Cost</th>
                                <th style="padding: 12px;">Amount</th>
                                <th style="padding: 12px;">Forms</th>
                                ${
                                  !isReadOnly
                                    ? '<th style="padding: 12px;">Action</th>'
                                    : ''
                                }
                            </tr>
                        </thead>
                        <tbody id="po-items-tbody"></tbody>
                        <tfoot>
                            <tr style="border-top: 2px solid #e5e7eb; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);">
                                <td colspan="${
                                  isReadOnly ? '7' : '8'
                                }" style="text-align: right; font-weight: 600; padding: 16px; color: #1e40af;">Grand Total:</td>
                                <td style="font-weight: 700; color: #2563eb; padding: 16px; font-size: 16px;" id="grand-total">
                                    ${
                                      requestData
                                        ? formatCurrency(
                                            requestData.totalAmount || 0
                                          )
                                        : '₱0.00'
                                    }
                                </td>
                                ${!isReadOnly ? '<td></td>' : ''}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Funding Information -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="dollar-sign" style="width: 18px; height: 18px; color: #2563eb;"></i>
                    Funding Information
                </h3>
                
                <div class="grid-3">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="layers" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Fund Cluster
                        </label>
                        ${
                          isReadOnly
                            ? `
                            <input type="text" class="form-input" id="fundCluster"
                                   value="${requestData?.fundCluster || ''}" 
                                   style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                                   readonly>
                        `
                            : `
                            <select class="form-select" id="fundCluster" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                                <option value="">Select fund cluster</option>
                                <option value="01 - Regular Agency Fund" ${
                                  requestData?.fundCluster ===
                                  '01 - Regular Agency Fund'
                                    ? 'selected'
                                    : ''
                                }>01 - Regular Agency Fund</option>
                                <option value="05 - Income Generated Fund" ${
                                  requestData?.fundCluster ===
                                  '05 - Income Generated Fund'
                                    ? 'selected'
                                    : ''
                                }>05 - Income Generated Fund</option>
                                <option value="06 - Business Related Fund" ${
                                  requestData?.fundCluster ===
                                  '06 - Business Related Fund'
                                    ? 'selected'
                                    : ''
                                }>06 - Business Related Fund</option>
                                <option value="07 - General Appropriations Act (GAA)" ${
                                  requestData?.fundCluster ===
                                  '07 - General Appropriations Act (GAA)'
                                    ? 'selected'
                                    : ''
                                }>07 - General Appropriations Act (GAA)</option>
                            </select>
                        `
                        }
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="banknote" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Funds Available (Optional)
                        </label>
                        <input type="text" class="form-input" id="fundsAvailable"
                               value="${requestData?.fundsAvailable || ''}" 
                               placeholder="e.g. ₱0.00" 
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="sticky-note" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Notes (Optional)
                        </label>
                        <input type="text" class="form-input" id="fundNotes"
                               value="${requestData?.notes || ''}" 
                               placeholder="Short note" 
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>
            </div>

            <!-- ORS/BURS Information -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="receipt" style="width: 18px; height: 18px; color: #2563eb;"></i>
                    ORS/BURS Information
                </h3>
                
                <div class="grid-3">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="hash" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            ORS/BURS No.
                        </label>
                        <input type="text" class="form-input" id="orsNo"
                               value="${requestData?.orsNo || ''}"
                               placeholder="Enter ORS/BURS number" 
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Date of ORS/BURS
                        </label>
                        <input type="date" class="form-input" id="orsDate"
                               value="${requestData?.orsDate || ''}"
                               min="${new Date().toISOString().split('T')[0]}"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="banknote" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Amount
                        </label>
                        <input type="text" class="form-input" id="orsAmount"
                               value="${requestData?.orsAmount || ''}"
                               placeholder="₱0.00" 
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer" style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn-secondary" onclick="closePurchaseOrderModal()" style="padding: 10px 24px; font-weight: 500; border-radius: 8px; transition: all 0.2s;">
                <i data-lucide="${
                  isReadOnly ? 'x' : 'x'
                }" style="width: 16px; height: 16px;"></i>
                ${isReadOnly ? 'Close' : 'Cancel'}
            </button>
            ${
              !isReadOnly
                ? `
                <button class="btn btn-primary" onclick="savePurchaseOrder('${
                  requestData?.id || ''
                }')" style="padding: 10px 24px; font-weight: 500; border-radius: 8px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); box-shadow: 0 4px 6px rgba(37, 99, 235, 0.25); transition: all 0.2s;">
                    <i data-lucide="${
                      mode === 'create' ? 'plus' : 'save'
                    }" style="width: 16px; height: 16px;"></i>
                    ${
                      mode === 'create'
                        ? 'Create Purchase Order'
                        : 'Update Purchase Order'
                    }
                </button>
            `
                : ''
            }
        </div>

    `
}

// Purchase Order Modal item management
function initializePurchaseOrderModal(requestData = null, options = {}) {
  const { skipRender = false } = options
  if (requestData && requestData.items) {
    // load items from request
    AppState.purchaseOrderItems = requestData.items.map((item) => ({ ...item }))
  } else {
    // reset for new order
    AppState.purchaseOrderItems = [
      {
        id: Date.now().toString(),
        stockPropertyNumber: '',
        unit: '',
        description: '',
        detailedDescription: '',
        quantity: 0,
        currentStock: 0,
        unitCost: 0,
        amount: 0,
        generateICS: false,
        generateRIS: false,
        generatePAR: false,
        generateIAR: false,
      },
    ]
  }

  if (!skipRender) {
    renderPOItems()
  }
}

function addPOItem() {
  const newItem = {
    id: Date.now().toString(),
    stockPropertyNumber: '',
    unit: '',
    description: '',
    detailedDescription: '',
    quantity: 0,
    currentStock: 0,
    unitCost: 0,
    amount: 0,
    generateICS: false,
    generateRIS: false,
    generatePAR: false,
    generateIAR: false,
  }
  AppState.purchaseOrderItems.push(newItem)
  showAlert('New item added to purchase order!', 'info')
  renderPOItems()
}

function removePOItem(id) {
  if (AppState.purchaseOrderItems.length > 1) {
    AppState.purchaseOrderItems = AppState.purchaseOrderItems.filter(
      (item) => item.id !== id
    )
    renderPOItems()
  }
}

function updatePOItem(id, field, value) {
  const itemIndex = AppState.purchaseOrderItems.findIndex(
    (item) => item.id === id
  )
  if (itemIndex === -1) return

  const item = AppState.purchaseOrderItems[itemIndex]
  item[field] = value

  if (field === 'stockPropertyNumber') {
    const stockItem = MockData.inventory.find(
      (inv) => inv.stockNumber === value
    )
    if (stockItem) {
      item.description = stockItem.name
      item.unit = stockItem.unit
      item.currentStock = stockItem.currentStock
    }
  }

  if (field === 'quantity' || field === 'unitCost') {
    item.amount = (item.quantity || 0) * (item.unitCost || 0)
  }

  AppState.purchaseOrderItems[itemIndex] = item
  renderPOItems()
}

function updatePOItemForm(itemId, formField, checked) {
  const itemIndex = AppState.purchaseOrderItems.findIndex(
    (i) => i.id === itemId
  )
  if (itemIndex === -1) return

  const item = AppState.purchaseOrderItems[itemIndex]
  item[formField] = checked

  AppState.purchaseOrderItems[itemIndex] = item
  // No need to re-render the entire table for checkbox changes
}

function renderPOItems() {
  const tbody = document.getElementById('po-items-tbody')
  const isReadOnly = AppState.currentModal?.mode === 'view'

  tbody.innerHTML = AppState.purchaseOrderItems
    .map(
      (item) => `
        <tr>
            <td style="padding: 12px;">
                <input type="text" 
                       value="${item.stockPropertyNumber}" 
                       onchange="updatePOItem('${
                         item.id
                       }', 'stockPropertyNumber', this.value)"
                       class="form-input" 
                       style="height: 32px;" 
                       placeholder="e.g., 1"
                       ${isReadOnly ? 'readonly' : ''}>
            </td>
            <td style="padding: 12px;">
                <input type="text" 
                       value="${item.unit}" 
                       onchange="updatePOItem('${item.id}', 'unit', this.value)"
                       class="form-input" 
                       style="height: 32px;" 
                       placeholder="Unit"
                       ${isReadOnly ? 'readonly' : ''}>
            </td>
            <td style="padding: 12px;">
                <input type="text" 
                       value="${item.description}" 
                       onchange="updatePOItem('${
                         item.id
                       }', 'description', this.value)"
                       class="form-input" 
                       style="height: 32px;" 
                       placeholder="Item name"
                       ${isReadOnly ? 'readonly' : ''}>
            </td>
            <td style="padding: 12px;">
                <textarea value="${item.detailedDescription}" 
                          onchange="updatePOItem('${
                            item.id
                          }', 'detailedDescription', this.value)"
                          class="form-textarea" 
                          style="height: 32px; min-height: 32px; resize: none;" 
                          placeholder="Detailed specifications..."
                          ${isReadOnly ? 'readonly' : ''}>${
        item.detailedDescription
      }</textarea>
            </td>
          <td style="padding: 12px;">
          <input type="number" 
              value="${item.quantity || ''}" 
              onchange="updatePOItem('${
                item.id
              }', 'quantity', parseFloat(this.value) || 0)"
              class="form-input" 
              style="height: 32px;" 
              placeholder="Qty"
              ${isReadOnly ? 'readonly' : ''}>
         </td>
            <td style="padding: 12px;">
                <input type="number" 
                       step="0.01"
                       value="${item.unitCost || ''}" 
                       onchange="updatePOItem('${
                         item.id
                       }', 'unitCost', parseFloat(this.value) || 0)"
                       class="form-input" 
                       style="height: 32px;" 
                       placeholder="0.00"
                       ${isReadOnly ? 'readonly' : ''}>
            </td>
            <td style="padding: 12px; font-weight: 500;">${formatCurrency(
              item.amount
            )}</td>
            <td style="padding: 12px;">
                ${
                  !isReadOnly
                    ? `
                    <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
                        <label style="display: inline-flex; align-items: center; gap: 2px; padding: 4px 6px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; cursor: pointer; font-size: 11px; white-space: nowrap;" title="Inventory Custodian Slip">
                            <input type="checkbox" ${
                              item.generateICS ? 'checked' : ''
                            } onchange="updatePOItemForm('${
                        item.id
                      }', 'generateICS', this.checked)" style="width: 14px; height: 14px; cursor: pointer;">
                            <span style="font-weight: 500; color: #0369a1;">ICS</span>
                        </label>
                        <label style="display: inline-flex; align-items: center; gap: 2px; padding: 4px 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; cursor: pointer; font-size: 11px; white-space: nowrap;" title="Requisition and Issue Slip">
                            <input type="checkbox" ${
                              item.generateRIS ? 'checked' : ''
                            } onchange="updatePOItemForm('${
                        item.id
                      }', 'generateRIS', this.checked)" style="width: 14px; height: 14px; cursor: pointer;">
                            <span style="font-weight: 500; color: #15803d;">RIS</span>
                        </label>
                        <label style="display: inline-flex; align-items: center; gap: 2px; padding: 4px 6px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 4px; cursor: pointer; font-size: 11px; white-space: nowrap;" title="Property Acknowledgement Receipt">
                            <input type="checkbox" ${
                              item.generatePAR ? 'checked' : ''
                            } onchange="updatePOItemForm('${
                        item.id
                      }', 'generatePAR', this.checked)" style="width: 14px; height: 14px; cursor: pointer;">
                            <span style="font-weight: 500; color: #a16207;">PAR</span>
                        </label>
                        <label style="display: inline-flex; align-items: center; gap: 2px; padding: 4px 6px; background: #fce7f3; border: 1px solid #fbcfe8; border-radius: 4px; cursor: pointer; font-size: 11px; white-space: nowrap;" title="Inspection and Acceptance Report">
                            <input type="checkbox" ${
                              item.generateIAR ? 'checked' : ''
                            } onchange="updatePOItemForm('${
                        item.id
                      }', 'generateIAR', this.checked)" style="width: 14px; height: 14px; cursor: pointer;">
                            <span style="font-weight: 500; color: #be185d;">IAR</span>
                        </label>
                    </div>
                `
                    : `
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${
                          item.generateICS
                            ? '<span style="padding: 2px 6px; background: #bae6fd; border-radius: 4px; font-size: 11px; font-weight: 500; color: #0369a1;">ICS</span>'
                            : ''
                        }
                        ${
                          item.generateRIS
                            ? '<span style="padding: 2px 6px; background: #bbf7d0; border-radius: 4px; font-size: 11px; font-weight: 500; color: #15803d;">RIS</span>'
                            : ''
                        }
                        ${
                          item.generatePAR
                            ? '<span style="padding: 2px 6px; background: #fde68a; border-radius: 4px; font-size: 11px; font-weight: 500; color: #a16207;">PAR</span>'
                            : ''
                        }
                        ${
                          item.generateIAR
                            ? '<span style="padding: 2px 6px; background: #fbcfe8; border-radius: 4px; font-size: 11px; font-weight: 500; color: #be185d;">IAR</span>'
                            : ''
                        }
                    </div>
                `
                }
            </td>
            ${
              !isReadOnly
                ? `
                <td style="padding: 12px;">
                    <button onclick="removePOItem('${item.id}')" 
                            class="btn-outline-red" 
                            style="width: 32px; height: 32px; padding: 0;"
                            ${
                              AppState.purchaseOrderItems.length === 1
                                ? 'disabled'
                                : ''
                            }>
                        <i data-lucide="trash-2" class="icon"></i>
                    </button>
                </td>
            `
                : ''
            }
        </tr>
    `
    )
    .join('')

  // Update grand total
  const grandTotal = AppState.purchaseOrderItems.reduce(
    (total, item) => total + item.amount,
    0
  )
  document.getElementById('grand-total').textContent =
    formatCurrency(grandTotal)

  // Reinitialize icons
  lucide.createIcons()
}

function updateStockSummary() {
  const summary = document.getElementById('stock-summary')
  const newItems = AppState.purchaseOrderItems.filter(
    (item) => item.currentStock === 0 && item.stockPropertyNumber
  ).length
  const totalQuantity = AppState.purchaseOrderItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  summary.innerHTML = `
        <div>
            <p style="font-size: 14px; color: #1e40af;">
                <span style="font-weight: 500;">New Items (No Current Stock):</span> ${newItems}
            </p>
        </div>
        <div>
            <p style="font-size: 14px; color: #1e40af;">
                <span style="font-weight: 500;">Total Items:</span> ${AppState.purchaseOrderItems.length}
            </p>
            <p style="font-size: 14px; color: #1e40af;">
                <span style="font-weight: 500;">Total Quantity Requested:</span> ${totalQuantity}
            </p>
        </div>
    `
}

async function deleteRequest(requestId) {
  const ok = await showConfirm(
    'Are you sure you want to delete this request?',
    'Delete Request'
  )
  if (!ok) return

  // Remove from newRequests
  AppState.newRequests = AppState.newRequests.filter((r) => r.id !== requestId)

  // If you want to handle other tables later:
  AppState.pendingRequests = AppState.pendingRequests.filter(
    (r) => r.id !== requestId
  )
  AppState.completedRequests = AppState.completedRequests.filter(
    (r) => r.id !== requestId
  )

  // Refresh table
  loadPageContent('new-request')
}

function generateNextRequestId() {
  const prefix = 'REQ-'
  // 1. Map all existing IDs
  const highestNum = AppState.newRequests
    .map((r) => r.id)
    // 2. Filter for valid REQ-### format and parse the number
    .filter((id) => id.startsWith(prefix) && id.length > prefix.length)
    .map((id) => parseInt(id.substring(prefix.length)))
    .filter((num) => !isNaN(num))
    // 3. Find the maximum number, defaulting to 0 if none exist
    .reduce((max, num) => Math.max(max, num), 0)

  const nextNum = highestNum + 1
  // 4. Pad with leading zeros to ensure a length of 3 (e.g., 1 -> '001')
  return `${prefix}${String(nextNum).padStart(3, '0')}`
}

/**
 * Generates a new P.O. Number in the format YYYY-MM-XXX.
 * The XXX part is a sequential count for the current month and year.
 * @returns {string} The new P.O. Number.
 */
function generateNewPONumber() {
  const now = new Date()
  const year = now.getFullYear()
  // Months are 0-indexed, so add 1 and pad (e.g., 9 -> '10')
  const month = String(now.getMonth() + 1).padStart(2, '0')

  const datePrefix = `${year}-${month}`

  // Count how many requests already exist for the current year/month
  const count = AppState.newRequests.filter(
    (r) => r.poNumber && r.poNumber.startsWith(datePrefix)
  ).length

  const nextCount = count + 1
  const paddedCount = String(nextCount).padStart(3, '0')

  return `${datePrefix}-${paddedCount}`
}

/**
 * Saves or updates a Purchase Order, implementing new structured ID and P.O. numbering.
 * @param {string | null} existingId - The ID of the request being updated, or null for a new request.
 */

function savePurchaseOrder(existingId = null) {
  const modal = document.getElementById('purchase-order-modal')

  // Retrieve input values using new IDs from enhanced modal
  const supplier = document.getElementById('supplierName')?.value || ''
  const supplierAddress =
    document.getElementById('supplierAddress')?.value || ''
  const supplierTIN = document.getElementById('supplierTIN')?.value || ''
  const poNumber = document.getElementById('poNumber')?.value || ''
  const purchaseDate = document.getElementById('purchaseDate')?.value || ''
  const procurementMode =
    document.getElementById('procurementMode')?.value || ''
  const department = document.getElementById('departmentSelect')?.value || ''
  const gentlemen = document.getElementById('gentlemen')?.value || ''
  const placeOfDelivery =
    document.getElementById('placeOfDelivery')?.value || ''
  // Handle delivery date dropdown with "others" option
  const deliveryDateSelect = document.getElementById('deliveryDate')
  const deliveryDateOther = document.getElementById('deliveryDateOther')
  let deliveryDate = ''
  if (deliveryDateSelect?.value === 'others') {
    deliveryDate = deliveryDateOther?.value || ''
  } else {
    deliveryDate = deliveryDateSelect?.value || ''
  }
  const deliveryTerm = document.getElementById('deliveryTerm')?.value || ''
  const paymentTerm = document.getElementById('paymentTerm')?.value || ''
  const fundCluster = document.getElementById('fundCluster')?.value || ''
  const fundsAvailable = document.getElementById('fundsAvailable')?.value || ''
  const fundNotes = document.getElementById('fundNotes')?.value || ''
  const orsNo = document.getElementById('orsNo')?.value || ''
  const orsDate = document.getElementById('orsDate')?.value || ''
  const orsAmount = document.getElementById('orsAmount')?.value || ''
  const generateICS = document.getElementById('generateICS')?.checked || false
  const generateRIS = document.getElementById('generateRIS')?.checked || false
  const generatePAR = document.getElementById('generatePAR')?.checked || false
  const generateIAR = document.getElementById('generateIAR')?.checked || false

  const totalAmount = AppState.purchaseOrderItems.reduce(
    (sum, item) => sum + item.amount,
    0
  )

  let finalPoNumber = poNumber
  if (!existingId && !poNumber) {
    finalPoNumber = generateNewPONumber()
    const poInput = document.getElementById('poNumber')
    if (poInput) poInput.value = finalPoNumber
  }

  if (existingId) {
    // Update existing request
    console.log(`[UPDATE] Updating Request ID: ${existingId}`)
    const idx = AppState.newRequests.findIndex((r) => r.id === existingId)
    if (idx !== -1) {
      AppState.newRequests[idx] = {
        ...AppState.newRequests[idx],
        supplier,
        supplierAddress,
        supplierTIN,
        poNumber: finalPoNumber,
        purchaseDate,
        procurementMode,
        department,
        gentlemen,
        placeOfDelivery,
        deliveryDate,
        deliveryTerm,
        paymentTerm,
        fundCluster,
        fundsAvailable,
        notes: fundNotes,
        orsNo,
        orsDate,
        orsAmount,
        generateICS,
        generateRIS,
        generatePAR,
        generateIAR,
        totalAmount,
        items: [...AppState.purchaseOrderItems],
      }
    }
  } else {
    // Create new request
    const newRequestId = generateNextRequestId()
    console.log(`[CREATE] Creating new Request ID: ${newRequestId}`)

    const newRequest = {
      id: newRequestId,
      poNumber: finalPoNumber,
      supplier,
      supplierAddress,
      supplierTIN,
      purchaseDate,
      procurementMode,
      requestDate: new Date().toISOString().split('T')[0],
      department,
      gentlemen,
      placeOfDelivery,
      deliveryDate,
      deliveryTerm,
      paymentTerm,
      fundCluster,
      fundsAvailable,
      notes: fundNotes,
      orsNo,
      orsDate,
      orsAmount,
      generateICS,
      generateRIS,
      generatePAR,
      generateIAR,
      totalAmount,
      status: 'submitted',
      requestedBy: 'Current User',
      items: [...AppState.purchaseOrderItems],
    }
    AppState.newRequests.push(newRequest)
    try {
      if (typeof saveStatusRequests === 'function') saveStatusRequests()
    } catch (e) {}
  }

  // Show success alert
  if (existingId) {
    showAlert('Purchase order updated successfully!', 'success')
  } else {
    showAlert(
      `New purchase order ${finalPoNumber} created successfully!`,
      'success'
    )
  }

  // Refresh UI and close modal
  loadPageContent('new-request')
  closePurchaseOrderModal()
  console.log('--- Current New Requests State ---', AppState.newRequests)
}

// Product Tab Functions
function switchProductTab(tabName) {
  AppState.currentProductTab = tabName
  // Reset search and filters when switching tabs
  AppState.productSearchTerm = ''
  AppState.productSortBy = 'Sort By'
  AppState.productFilterBy = 'Filter By'
  loadPageContent('products')
}

// Page-specific event initialization
function initializePageEvents(pageId) {
  // Add page-specific event listeners here
  switch (pageId) {
    case 'products':
      initializeProductsPageEvents()
      break
    case 'new-request':
    case 'pending-approval':
    case 'completed-request':
      // Initialize PO modal triggers
      break
    default:
      break
  }
}

function initializeProductsPageEvents() {
  // Initialize search functionality
  const searchInput = document.getElementById('product-search')
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      AppState.productSearchTerm = e.target.value
      updateProductsTable()
    })
  }

  // Initialize sort and filter dropdowns
  const sortBy = document.getElementById('sort-by')
  const filterBy = document.getElementById('filter-by')

  if (sortBy) {
    sortBy.addEventListener('change', function (e) {
      AppState.productSortBy = e.target.value
      updateProductsTable()
    })
  }

  if (filterBy) {
    filterBy.addEventListener('change', function (e) {
      AppState.productFilterBy = e.target.value
      updateProductsTable()
    })
  }

  // ...existing code...
}

function updateProductsTable() {
  const currentTab = AppState.currentProductTab || 'expendable'
  let filteredProducts = MockData.products.filter(
    (product) => product.type === currentTab.toLowerCase()
  )

  // Apply search filter
  if (AppState.productSearchTerm) {
    const searchTerm = AppState.productSearchTerm.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.id.toLowerCase().includes(searchTerm)
    )
  }

  // Apply filter
  if (AppState.productFilterBy && AppState.productFilterBy !== 'Filter By') {
    switch (AppState.productFilterBy) {
      case 'High Value (>₱5,000)':
        filteredProducts = filteredProducts.filter(
          (product) => product.totalValue > 5000
        )
        break
      case 'Medium Value (₱1,000-₱5,000)':
        filteredProducts = filteredProducts.filter(
          (product) => product.totalValue >= 1000 && product.totalValue <= 5000
        )
        break
      case 'Low Value (<₱1,000)':
        filteredProducts = filteredProducts.filter(
          (product) => product.totalValue < 1000
        )
        break
      case 'Low Quantity (<20)':
        filteredProducts = filteredProducts.filter(
          (product) => product.quantity < 20
        )
        break
      case 'Recent (Last 30 days)':
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        filteredProducts = filteredProducts.filter(
          (product) => new Date(product.date) >= thirtyDaysAgo
        )
        break
    }
  }

  // Apply sorting
  if (AppState.productSortBy && AppState.productSortBy !== 'Sort By') {
    switch (AppState.productSortBy) {
      case 'Product Name (A-Z)':
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'Product Name (Z-A)':
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'Date (Newest)':
        filteredProducts.sort((a, b) => new Date(b.date) - new Date(a.date))
        break
      case 'Date (Oldest)':
        filteredProducts.sort((a, b) => new Date(a.date) - new Date(b.date))
        break
      case 'Total Value (High to Low)':
        filteredProducts.sort((a, b) => b.totalValue - a.totalValue)
        break
      case 'Total Value (Low to High)':
        filteredProducts.sort((a, b) => a.totalValue - b.totalValue)
        break
    }
  }

  // Update table body
  const tbody = document.querySelector('.table tbody')
  if (tbody) {
    tbody.innerHTML = filteredProducts
      .map((product, index) => {
        const rowBg =
          index % 2 === 0
            ? 'background-color: white;'
            : 'background-color: #f9fafb;'
        return `
            <tr style="${rowBg}">
                <td style="font-weight: 500;">${product.id}</td>
                <td style="font-weight: 500;">${product.name}</td>
                <td style="color: #6b7280; max-width: 300px;">${
                  product.description
                }</td>
                <td>${product.quantity}</td>
                <td>${formatCurrency(product.unitCost)}</td>
                <td style="font-weight: 500;">${formatCurrency(
                  product.totalValue
                )}</td>
                <td>${product.date}</td>
                <td>
                    <div class="table-actions">
                        <button class="icon-action-btn icon-action-danger" title="Delete">
                            <i data-lucide="trash-2"></i>
                        </button>
                        <button class="icon-action-btn icon-action-warning" title="Edit">
                            <i data-lucide="edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `
      })
      .join('')

    // Update pagination count
    const paginationLeft = document.querySelector('.pagination-left')
    if (paginationLeft) {
      paginationLeft.textContent = `Showing 1 to ${filteredProducts.length}`
    }

    // Reinitialize icons
    lucide.createIcons()
  }
}

// Action functions
function approveRequest(requestId) {
  console.log('Approving request:', requestId)

  // Find in newRequests first
  const idx = AppState.newRequests.findIndex((r) => r.id === requestId)
  let request = null
  if (idx !== -1) {
    request = AppState.newRequests[idx]
    // mark approved
    request.status = 'approved'
    request.approvedBy = 'Approver User'
    request.approvedDate = new Date().toISOString().split('T')[0]

    // Move to completedRequests
    AppState.completedRequests.push(request)
    AppState.newRequests.splice(idx, 1)
  } else {
    // try pendingRequests fallback
    const pidx = AppState.pendingRequests.findIndex((r) => r.id === requestId)
    if (pidx !== -1) {
      request = AppState.pendingRequests[pidx]
      request.status = 'approved'
      request.approvedBy = 'Approver User'
      request.approvedDate = new Date().toISOString().split('T')[0]
      AppState.completedRequests.push(request)
      AppState.pendingRequests.splice(pidx, 1)
    }
  }

  if (request) {
    showAlert(`Request ${requestId} approved successfully!`, 'success')
    // Create persistent notification for approval
    try {
      if (typeof createNotification === 'function') {
        createNotification({
          title: `Request ${requestId} approved`,
          message: `Request ${requestId} was approved by ${
            request.approvedBy || 'Approver'
          }`,
          type: 'success',
          icon: 'check-circle',
        })
      } else {
        addNotification(
          `Request ${requestId} approved`,
          `Request ${requestId} was approved by ${
            request.approvedBy || 'Approver'
          }`,
          'success',
          'check-circle'
        )
      }
    } catch (e) {}
    try {
      if (typeof saveStatusRequests === 'function') saveStatusRequests()
    } catch (e) {}
  } else {
    showAlert(`Request ${requestId} not found.`, 'error')
  }

  // Refresh Pending Approval view
  loadPageContent('pending-approval')
}

async function rejectRequest(requestId) {
  console.log('Rejecting request:', requestId)
  const ok = await showConfirm(
    `Are you sure you want to reject request ${requestId}?`,
    'Reject Request'
  )
  if (!ok) return

  // Try to find and mark rejected
  const idx = AppState.newRequests.findIndex((r) => r.id === requestId)
  let request = null
  if (idx !== -1) {
    request = AppState.newRequests[idx]
    request.status = 'rejected'
    request.rejectedBy = 'Approver User'
    request.rejectedDate = new Date().toISOString().split('T')[0]
    AppState.rejectedRequests = AppState.rejectedRequests || []
    AppState.rejectedRequests.push(request)
    AppState.newRequests.splice(idx, 1)
  } else {
    const pidx = AppState.pendingRequests.findIndex((r) => r.id === requestId)
    if (pidx !== -1) {
      request = AppState.pendingRequests[pidx]
      request.status = 'rejected'
      request.rejectedBy = 'Approver User'
      request.rejectedDate = new Date().toISOString().split('T')[0]
      AppState.rejectedRequests = AppState.rejectedRequests || []
      AppState.rejectedRequests.push(request)
      AppState.pendingRequests.splice(pidx, 1)
    }
  }

  if (request) {
    showAlert(`Request ${requestId} rejected.`, 'warning')
    try {
      if (typeof saveStatusRequests === 'function') saveStatusRequests()
    } catch (e) {}
  } else {
    showAlert(`Request ${requestId} not found.`, 'error')
  }

  loadPageContent('pending-approval')
}

async function archiveRequest(requestId) {
  console.log('Archiving request:', requestId)
  const ok = await showConfirm(
    `Are you sure you want to archive request ${requestId}?`,
    'Archive Request'
  )
  if (!ok) return

  showAlert(`Request ${requestId} archived.`, 'success')
  loadPageContent(AppState.currentPage)
}

function openModal(type) {
  console.log('Opening modal for:', type)
  showAlert(`${type} modal not yet implemented`, 'info')
}

// Modal close on outside click
document.addEventListener('click', function (e) {
  const modal = document.getElementById('purchase-order-modal')
  if (e.target === modal) {
    closePurchaseOrderModal()
  }
})

// Make functions globally available
window.navigateToPage = navigateToPage
window.switchProductTab = switchProductTab
window.updateProductsTable = updateProductsTable
window.openPurchaseOrderModal = openPurchaseOrderModal
window.closePurchaseOrderModal = closePurchaseOrderModal
window.addPOItem = addPOItem
window.removePOItem = removePOItem
window.updatePOItem = updatePOItem
window.updatePOItemForm = updatePOItemForm
window.savePurchaseOrder = savePurchaseOrder
window.approveRequest = approveRequest
window.rejectRequest = rejectRequest
window.archiveRequest = archiveRequest
window.openModal = openModal

// -----------------------------
// User profile menu helpers
// -----------------------------
function toggleUserMenu(event) {
  const menu = document.getElementById('user-menu')
  if (!menu) return
  const isVisible = menu.style.display === 'block'
  menu.style.display = isVisible ? 'none' : 'block'

  // Reinitialize Lucide icons when menu is opened
  if (!isVisible) {
    setTimeout(() => {
      if (window.lucide) {
        lucide.createIcons()
      }
    }, 50)
  }
}

function closeUserMenu() {
  const menu = document.getElementById('user-menu')
  if (menu) menu.style.display = 'none'
}

// Helper: resolve the correct path to AccessSystem (login) page from any current nested location
function resolveLoginPath() {
  try {
    const routes = window.APP_ROUTES || {}
    if (typeof routes.login === 'string' && routes.login.trim().length > 0) {
      return routes.login
    }

    const base =
      typeof routes.base === 'string' && routes.base.trim().length > 0
        ? routes.base.replace(/\/$/, '')
        : window.location.origin || ''

    const loginPath = '/login'
    return base ? `${base}${loginPath}` : loginPath
  } catch (e) {
    return '/login' // last resort
  }
}

async function logout() {
  if (window.__isLoggingOut) return
  window.__isLoggingOut = true

  closeUserMenu()
  showLoadingModal('Signing you out securely...')

  try {
    const response = await fetch(window.APP_ROUTES?.logout || '/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      body: JSON.stringify({}),
    })

    const data = await response
      .json()
      .catch(() => ({ message: 'You have been signed out successfully.' }))

    if (!response.ok) {
      throw new Error(data?.message || 'Logout failed.')
    }

    if (AppState.currentUser && AppState.currentUser.email) {
      try {
        logUserLogout(AppState.currentUser.email, AppState.currentUser.name)
      } catch (logError) {
        console.warn('Logout log error', logError)
      }
    }

    AppState.currentUser = {
      id: null,
      name: 'Guest',
      email: '',
      role: '',
      department: '',
      status: 'Inactive',
      created: '',
    }

    try {
      if (lsAvailable()) {
        localStorage.removeItem('userSession')
        localStorage.removeItem('authToken')
      }
      try {
        sessionStorage.clear()
      } catch (e) {}
    } catch (storageError) {
      console.warn('Unable to clear local session storage:', storageError)
    }

    const redirectTarget = data?.redirect || resolveLoginPath()

    setTimeout(() => {
      hideLoadingModal()
      showSuccessModal({
        title: 'Logged Out',
        message:
          data?.message ||
          'You have been signed out successfully. Redirecting to Access System...',
        icon: 'log-out',
        redirect: redirectTarget,
        delay: 900,
      })
    }, 600)
  } catch (error) {
    console.error('Logout error', error)
    hideLoadingModal()
    showAlert(error.message || 'An error occurred while logging out', 'error')
    window.__isLoggingOut = false
  }
}

// Close user menu on outside click
document.addEventListener('click', function (e) {
  const menu = document.getElementById('user-menu')
  const block = document.getElementById('header-user-block')
  if (!menu || !block) return
  const menuDisplay = window.getComputedStyle(menu).display
  if (menuDisplay === 'none') return

  if (!menu.contains(e.target) && !block.contains(e.target)) {
    menu.style.display = 'none'
  }
})

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
  initializeSidebarState()
  initializeNavigation()

  // Load user requests from localStorage
  loadUserRequests()

  // Initialize icons
  lucide.createIcons()
})

// -----------------------------
// Loading & Success Modals
// -----------------------------
function ensureModalRoot() {
  let root = document.getElementById('global-modal-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'global-modal-root'
    document.body.appendChild(root)
  }
  return root
}

function showLoadingModal(text = 'Processing...') {
  const root = ensureModalRoot()
  let modal = document.getElementById('loading-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'loading-modal'
    modal.innerHTML = `
            <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,0.45);backdrop-filter:blur(2px);z-index:2000;">
                <div style="background:#ffffff;padding:32px 40px;border-radius:16px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.25);display:flex;flex-direction:column;align-items:center;gap:20px;min-width:300px;">
                    <div class="spinner" style="width:56px;height:56px;border:6px solid #e5e7eb;border-top-color:#2563eb;border-radius:50%;animation:spmo-spin 0.9s linear infinite;"></div>
                    <div style="text-align:center;">
                        <h3 id="loading-modal-text" style="margin:0;font-size:16px;font-weight:600;color:#1f2937;">${text}</h3>
                        <p style="margin:6px 0 0 0;font-size:13px;color:#6b7280;">Please wait…</p>
                    </div>
                </div>
            </div>`
    root.appendChild(modal)
    // spinner keyframes (inject once)
    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style')
      style.id = 'spinner-style'
      style.textContent = '@keyframes spmo-spin{to{transform:rotate(360deg)}}'
      document.head.appendChild(style)
    }
  } else {
    const textEl = modal.querySelector('#loading-modal-text')
    if (textEl) textEl.textContent = text
    modal.style.display = 'block'
  }
}

function hideLoadingModal() {
  const modal = document.getElementById('loading-modal')
  if (modal) modal.style.display = 'none'
}

function showSuccessModal({
  title = 'Success',
  message = 'Operation completed successfully.',
  icon = 'check-circle',
  redirect = null,
  delay = 1500,
} = {}) {
  const root = ensureModalRoot()
  let modal = document.getElementById('success-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'success-modal'
    modal.innerHTML = `
            <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,0.4);backdrop-filter:blur(2px);z-index:2100;">
                <div style="background:#ffffff;padding:32px 40px;border-radius:16px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.25);display:flex;flex-direction:column;align-items:center;gap:18px;min-width:320px;">
                    <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#dcfce7,#bbf7d0);display:flex;align-items:center;justify-content:center;">
                        <i data-lucide="${icon}" style="width:32px;height:32px;color:#16a34a;"></i>
                    </div>
                    <h3 id="success-modal-title" style="margin:0;font-size:20px;color:#111827;font-weight:700;">${title}</h3>
                    <p id="success-modal-message" style="margin:0;font-size:14px;color:#6b7280;text-align:center;line-height:1.5;">${message}</p>
                </div>
            </div>`
    root.appendChild(modal)
  } else {
    modal.querySelector('#success-modal-title').textContent = title
    modal.querySelector('#success-modal-message').textContent = message
    modal.querySelector('i[data-lucide]')?.setAttribute('data-lucide', icon)
    modal.style.display = 'block'
  }
  // Recreate icons inside modal
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 10)

  if (redirect) {
    setTimeout(() => {
      window.location.href = redirect
    }, delay)
  } else {
    // Auto hide if no redirect
    setTimeout(() => {
      const m = document.getElementById('success-modal')
      if (m) m.style.display = 'none'
    }, delay)
  }
}

window.logout = logout

// ------------------------ //
// Roles & Management Page  //
// ------------------------//

function generateRolesManagementPage() {
  // Sample data for initial load only
  const initialMembers = [
    {
      id: 'SA001',
      group: 'Group Juan',
      name: 'Cherry Ann Quila',
      role: 'Leader',
      email: 'cherry@cnsc.edu.ph',
      department: 'IT',
      status: 'Active',
      created: '2025-01-15',
    },
    {
      id: 'SA002',
      group: 'Group Juan',
      name: 'Vince Balce',
      role: 'Member',
      email: 'vince@cnsc.edu.ph',
      department: 'Finance',
      status: 'Inactive',
      created: '2025-02-01',
    },
    {
      id: 'SA003',
      group: 'Group Juan',
      name: 'Marinel Ledesma',
      role: 'Member',
      email: 'marinel@cnsc.edu.ph',
      department: 'HR',
      status: 'Active',
      created: '2025-03-10',
    },
  ]

  // FIX: Only initialize MockData.users if it doesn't already exist.
  if (!window.MockData) window.MockData = {}
  if (!window.MockData.users) {
    window.MockData.users = initialMembers
  }

  const membersToRender = window.MockData.users

  // Calculate statistics
  const totalMembers = membersToRender.length
  const activeMembers = membersToRender.filter(
    (m) => m.status === 'Active'
  ).length

  const html = `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="shield" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Roles & Management
                    </h1>
                    <p class="page-subtitle">Manage team members, roles, and organizational structure</p>
                </div>
                <div>
                    <button class="btn btn-primary" onclick="openUserModal('create')" style="display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border: none; border-radius: 10px; color: white; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); transition: all 0.2s;">
                        <i data-lucide="user-plus" style="width:18px;height:18px;"></i>
                        Add Member
                    </button>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px;">
            <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Total Members</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${totalMembers}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="users" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>

            <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Active Members</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${activeMembers}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="user-check" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Members Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                <h2 style="margin: 0; font-size: 18px; color: #111827; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="shield-check" style="width:20px;height:20px;color:#667eea;"></i>
                    Team Members & Roles
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Manage member accounts, roles, and permissions</p>
            </div>
            <div style="overflow-x: auto;">
                <table class="table" style="margin: 0;">
                    <thead>
                        <tr>
                            <th style="padding-left: 24px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="hash" style="width:14px;height:14px;"></i>
                                    Member ID
                                </div>
                            </th>
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="user" style="width:14px;height:14px;"></i>
                                    Name
                                </div>
                            </th>
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="mail" style="width:14px;height:14px;"></i>
                                    Email
                                </div>
                            </th>
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="shield" style="width:14px;height:14px;"></i>
                                    Role
                                </div>
                            </th>
              <!-- Department column removed -->
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="circle-dot" style="width:14px;height:14px;"></i>
                                    Status
                                </div>
                            </th>
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="calendar" style="width:14px;height:14px;"></i>
                                    Created
                                </div>
                            </th>
                            <th style="padding-right: 24px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="settings" style="width:14px;height:14px;"></i>
                                    Actions
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${membersToRender
                          .map(
                            (member, index) => `
                            <tr style="transition: all 0.2s;">
                                <td style="padding-left: 24px;">
                                    <div style="font-family: 'Courier New', monospace; font-size: 13px; color: #6b7280; font-weight: 600;">
                                        ${member.id}
                                    </div>
                                </td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                                            ${member.name
                                              .split(' ')
                                              .map((n) => n[0])
                                              .join('')
                                              .substring(0, 2)}
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; color: #111827;">${
                                              member.name
                                            }</div>
                                            <div style="font-size: 11px; color: #9ca3af;">${
                                              member.group
                                            }</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="color: #4b5563; font-size: 14px;">${
                                  member.email
                                }</td>
                                <td>
                                    <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: ${
                                      member.role === 'Leader'
                                        ? '#fef3c7'
                                        : '#e0f2fe'
                                    }; color: ${
                              member.role === 'Leader' ? '#92400e' : '#0c4a6e'
                            }; border-radius: 20px; font-size: 13px; font-weight: 600;">
                                        <i data-lucide="${
                                          member.role === 'Leader'
                                            ? 'crown'
                                            : 'user'
                                        }" style="width:12px;height:12px;"></i>
                                        ${member.role}
                                    </span>
                                </td>
                                <!-- Department cell removed -->
                                <td>
                                    <span class="badge ${
                                      member.status === 'Active'
                                        ? 'green'
                                        : 'gray'
                                    }" style="display: inline-flex; align-items: center; gap: 6px;">
                                        <span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span>
                                        ${member.status}
                                    </span>
                                </td>
                                <td style="color: #6b7280; font-size: 14px;">${
                                  member.created
                                }</td>
                                <td style="padding-right: 24px;">
                                    <div class="table-actions">
                                        <button class="icon-action-btn icon-action-warning" title="Edit" onclick="openUserModal('edit', '${
                                          member.id
                                        }')">
                                            <i data-lucide="edit"></i>
                                        </button>
                                        <button class="icon-action-btn icon-action-danger" title="Delete" onclick="deleteMember('${
                                          member.id
                                        }')">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `

  // Ensure icons render
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 0)

  return html
}

function saveUser(userId) {
  // 1. Get elements by their IDs
  const nameInput = document.getElementById('userName')
  const emailInput = document.getElementById('userEmail')
  const roleInput = document.getElementById('userRole')
  const statusInput = document.getElementById('userStatus')
  const createdInput = document.getElementById('userCreated')

  // 2. Gather form data
  const userData = {
    name: nameInput ? nameInput.value : '',
    email: emailInput ? emailInput.value : '',
    role: roleInput ? roleInput.value : '',
    status: statusInput ? statusInput.value : 'Active',
    created: createdInput
      ? createdInput.value || new Date().toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  }

  if (!userId) {
    // --- CREATE NEW USER ---
    if (!window.MockData) window.MockData = {}
    if (!window.MockData.users) window.MockData.users = []

    // Robust ID generation
    const maxIdNum = window.MockData.users
      .map((u) => parseInt(String(u.id).replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n))
      .reduce((max, current) => Math.max(max, current), 0)

    const newIdNumber = maxIdNum + 1

    const newUser = {
      id: `SA${String(newIdNumber).padStart(3, '0')}`,
      group: 'New Group',
      ...userData,
    }

    window.MockData.users.push(newUser)
    showAlert(`New user ${userData.name} added successfully!`, 'success')
  } else if (userId === 'current') {
    // Update AppState.currentUser
    AppState.currentUser = {
      ...AppState.currentUser,
      ...userData,
    }

    // Also update MockData user if exists
    if (window.MockData && Array.isArray(window.MockData.users)) {
      const idx = window.MockData.users.findIndex(
        (u) => u.id === AppState.currentUser.id
      )
      if (idx !== -1) {
        window.MockData.users[idx] = {
          ...window.MockData.users[idx],
          ...AppState.currentUser,
        }
      }
    }

    // Update avatar only (header no longer shows name/role)
    const avatarEl = document.getElementById('header-user-avatar')
    if (avatarEl)
      avatarEl.textContent = AppState.currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    showAlert('Profile updated successfully!', 'success')
  } else {
    // --- UPDATE EXISTING USER (EDIT) ---
    const existing = window.MockData.users.find((u) => u.id === userId)
    if (existing) {
      Object.assign(existing, userData)
      showAlert(`User ${userData.name} updated successfully!`, 'success')
    }
  }

  closeUserModal()
  refreshRolesTable() // Refresh the table to reflect changes
}

/**
 * REVISED: Delete member using the new table refresh function.
 */
async function deleteMember(memberId) {
  const ok = await showConfirm(
    'Are you sure you want to delete this member?',
    'Delete Member'
  )
  if (!ok) return

  // Find the user name before deleting
  const user = window.MockData.users.find((u) => u.id === memberId)
  const userName = user ? user.name : 'User'

  // Delete the user
  window.MockData.users = window.MockData.users.filter((u) => u.id !== memberId)

  // Show success toast
  showAlert(`${userName} has been successfully deleted`, 'success')

  // Refresh the table to reflect deletion
  refreshRolesTable()
}

function refreshRolesTable() {
  // Assuming your main content container has the ID 'main-content'
  const mainContentArea = document.getElementById('main-content')

  if (mainContentArea) {
    // Regenerate the entire page HTML using the updated MockData.users
    const newPageHTML = generateRolesManagementPage()

    mainContentArea.innerHTML = newPageHTML

    // Ensure icons are re-rendered
    setTimeout(() => {
      if (window.lucide) lucide.createIcons()
    }, 0)
  }
}

function openUserModal(mode = 'view', userId = null) {
  const modal = document.getElementById('user-modal')
  const modalContent = modal.querySelector('.modal-content')

  let userData = null
  if (userId === 'current') {
    userData = AppState.currentUser
  } else if (userId && window.MockData && window.MockData.users) {
    // Find user data for 'edit' or 'view' mode
    userData = window.MockData.users.find((u) => u.id === userId)
  }

  modalContent.innerHTML = generateUserModal(mode, userData)
  modal.classList.add('active')

  if (window.lucide) lucide.createIcons()
}

function closeUserModal() {
  const modal = document.getElementById('user-modal')
  modal.classList.remove('active')
}

// Enhanced User Modal with better design
function generateUserModal(mode = 'view', userData = null) {
  const title =
    mode === 'create'
      ? 'Add New User'
      : mode === 'edit'
      ? 'Edit User Profile'
      : 'User Profile'

  const subtitle =
    mode === 'create'
      ? 'Create a new user account'
      : mode === 'edit'
      ? 'Update user information'
      : 'View user details'

  const isReadOnly = mode === 'view'

  // Generate initials for avatar
  const initials = userData?.name
    ? userData.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'NU'

  return `
        <div class="modal-header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; border-bottom: none; padding: 32px 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                ${
                  mode !== 'create'
                    ? `
                    <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600; backdrop-filter: blur(10px);">
                        ${initials}
                    </div>
                `
                    : ''
                }
                <div style="flex: 1;">
                    <h2 class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">${title}</h2>
                    <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">${subtitle}</p>
                </div>
            </div>
            <button class="modal-close" onclick="closeUserModal()" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>

        <div class="modal-body" style="padding: 32px 24px; background: #f9fafb;">
            <!-- Personal Information Section -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="user" style="width: 18px; height: 18px; color: #dc2626;"></i>
                    Personal Information
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="user-circle" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Full Name
                        </label>
                        <input type="text" class="form-input" id="userName"
                               value="${userData?.name || ''}"
                               placeholder="Enter full name"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="mail" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Email Address
                        </label>
                        <input type="email" class="form-input" id="userEmail"
                               value="${userData?.email || ''}"
                               placeholder="user@cnsc.edu.ph"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>
            </div>

            <!-- Role & Department Section -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="briefcase" style="width: 18px; height: 18px; color: #dc2626;"></i>
                    Role
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="shield" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Role
                        </label>
                        ${
                          isReadOnly
                            ? `
                            <input type="text" class="form-input" value="${
                              userData?.role || ''
                            }" readonly style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; background: #f9fafb;">
                        `
                            : `
                            <select class="form-select" id="userRole" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                                <option value="">Select role</option>
                                <option ${
                                  userData?.role === 'Admin' ? 'selected' : ''
                                }>Admin</option>
                                <option ${
                                  userData?.role === 'Manager' ? 'selected' : ''
                                }>Manager</option>
                                <option ${
                                  userData?.role === 'User' ? 'selected' : ''
                                }>User</option>
                                <option ${
                                  userData?.role === 'Student Assistant'
                                    ? 'selected'
                                    : ''
                                }>Student Assistant</option>
                                <option ${
                                  userData?.role === 'Viewer' ? 'selected' : ''
                                }>Viewer</option>
                            </select>
                        `
                        }
                    </div>

                    <!-- Department field removed per request -->
                </div>
            </div>

            <!-- Account Status Section -->
            <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="settings" style="width: 18px; height: 18px; color: #dc2626;"></i>
                    Account Status
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="activity" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Status
                        </label>
                        ${
                          isReadOnly
                            ? `
                            <span class="badge ${
                              userData?.status === 'Active' ? 'green' : 'red'
                            }" style="display: inline-flex; padding: 8px 16px; font-size: 14px;">
                                <i data-lucide="${
                                  userData?.status === 'Active'
                                    ? 'check-circle'
                                    : 'x-circle'
                                }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                                ${userData?.status || 'Inactive'}
                            </span>
                        `
                            : `
                            <select class="form-select" id="userStatus" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;">
                                <option value="Active" ${
                                  userData?.status === 'Active'
                                    ? 'selected'
                                    : ''
                                }>Active</option>
                                <option value="Inactive" ${
                                  userData?.status === 'Inactive'
                                    ? 'selected'
                                    : ''
                                }>Inactive</option>
                            </select>
                        `
                        }
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            ${mode === 'create' ? 'Join Date' : 'Created Date'}
                        </label>
                        <input type="date" class="form-input" id="userCreated"
                               value="${
                                 userData?.created ||
                                 new Date().toISOString().split('T')[0]
                               }"
                               min="${new Date().toISOString().split('T')[0]}"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s; ${
                                 isReadOnly ? 'background: #f9fafb;' : ''
                               }"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer" style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn-secondary" onclick="closeUserModal()" style="padding: 10px 24px; font-weight: 500; border: 2px solid #d1d5db; transition: all 0.2s;">
                <i data-lucide="${
                  isReadOnly ? 'x' : 'arrow-left'
                }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                ${isReadOnly ? 'Close' : 'Cancel'}
            </button>
            ${
              !isReadOnly
                ? `
                <button class="btn btn-primary" onclick="saveUser('${
                  userData?.id || ''
                }')" style="padding: 10px 24px; font-weight: 500; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 6px rgba(220, 38, 38, 0.25); transition: all 0.2s;">
                    <i data-lucide="${
                      mode === 'create' ? 'user-plus' : 'save'
                    }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                    ${mode === 'create' ? 'Add User' : 'Save Changes'}
                </button>
            `
                : ''
            }
        </div>
    `
}

// ------------------------- //
//   Users Management Page  //
// ------------------------- //

function generateUsersManagementPage() {
  // Initialize MockData if not exists
  if (!window.MockData) window.MockData = {}
  if (!window.MockData.users) {
    // Initialize with default users if empty
    window.MockData.users = [
      {
        id: 'SA001',
        group: 'Group Juan',
        name: 'Cherry Ann Quila',
        role: 'Leader',
        email: 'cherry@cnsc.edu.ph',
        department: 'IT',
        status: 'Active',
        created: '2025-01-15',
      },
      {
        id: 'SA002',
        group: 'Group Juan',
        name: 'Vince Balce',
        role: 'Member',
        email: 'vince@cnsc.edu.ph',
        department: 'Finance',
        status: 'Inactive',
        created: '2025-02-01',
      },
      {
        id: 'SA003',
        group: 'Group Juan',
        name: 'Marinel Ledesma',
        role: 'Member',
        email: 'marinel@cnsc.edu.ph',
        department: 'HR',
        status: 'Active',
        created: '2025-03-10',
      },
    ]
  }

  // Use shared data from MockData
  const users = window.MockData.users

  // Calculate statistics
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === 'Active').length
  const inactiveUsers = users.filter((u) => u.status === 'Inactive').length

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="users" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        User Management
                    </h1>
                    <p class="page-subtitle">Monitor and manage system users and permissions</p>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px;">
            <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Total Users</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${totalUsers}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="users" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>

            <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Active Users</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${activeUsers}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="user-check" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>

            <div class="card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Inactive Users</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${inactiveUsers}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="user-x" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Users Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                <h2 style="margin: 0; font-size: 18px; color: #111827; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="users-2" style="width:20px;height:20px;color:#667eea;"></i>
                    System Users
                </h2>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Manage user accounts and permissions</p>
            </div>
            <div style="overflow-x: auto;">
                <table class="table" style="margin: 0;">
                    <thead>
                        <tr>
                            <th style="padding-left: 24px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="user" style="width:14px;height:14px;"></i>
                                    Name
                                </div>
                            </th>
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="mail" style="width:14px;height:14px;"></i>
                                    Email
                                </div>
                            </th>
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="shield" style="width:14px;height:14px;"></i>
                                    Role
                                </div>
                            </th>
                            <th>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="circle-dot" style="width:14px;height:14px;"></i>
                                    Status
                                </div>
                            </th>
                            <th style="padding-right: 24px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="calendar" style="width:14px;height:14px;"></i>
                                    Created
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users
                          .map(
                            (user, index) => `
                            <tr style="transition: all 0.2s;">
                                <td style="padding-left: 24px;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">
                                            ${user.name
                                              .split(' ')
                                              .map((n) => n[0])
                                              .join('')
                                              .substring(0, 2)}
                                        </div>
                                        <div>
                                            <div style="font-weight: 600; color: #111827;">${
                                              user.name
                                            }</div>
                                            <div style="font-size: 12px; color: #6b7280;">${
                                              user.id
                                            }</div>
                                        </div>
                                    </div>
                                </td>
                                <td style="color: #4b5563; font-size: 14px;">${
                                  user.email
                                }</td>
                                <td>
                                    <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: ${
                                      user.role === 'Leader'
                                        ? '#ede9fe'
                                        : '#e0f2fe'
                                    }; color: ${
                              user.role === 'Leader' ? '#7c3aed' : '#0284c7'
                            }; border-radius: 20px; font-size: 13px; font-weight: 500;">
                                        <i data-lucide="${
                                          user.role === 'Leader'
                                            ? 'crown'
                                            : 'user'
                                        }" style="width:12px;height:12px;"></i>
                                        ${user.role}
                                    </span>
                                </td>
                                <!-- Department cell removed -->
                                <td>
                                    <span class="badge ${
                                      user.status.toLowerCase() === 'active'
                                        ? 'green'
                                        : 'gray'
                                    }" style="display: inline-flex; align-items: center; gap: 6px;">
                                        <span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span>
                                        ${user.status}
                                    </span>
                                </td>
                                <td style="padding-right: 24px; color: #6b7280; font-size: 14px;">${
                                  user.created
                                }</td>
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `
}

// -------------------------------- //
//   Login Activity Logs Page      //
// -------------------------------- //

function generateLoginActivityPage() {
  // Initialize userLogs if not exists
  if (!window.MockData) window.MockData = {}
  if (!window.MockData.userLogs) {
    window.MockData.userLogs = []
  }

  const userLogs = window.MockData.userLogs || []

  // ---- Pagination calculations ----
  const pageSize = AppState.loginActivityPageSize || 10
  const totalLogs = userLogs.length
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize))
  let currentPage = AppState.loginActivityPage || 1
  if (currentPage > totalPages) currentPage = totalPages // clamp if logs reduced
  if (currentPage < 1) currentPage = 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedLogs = userLogs.slice(startIndex, startIndex + pageSize)
  const showingFrom = totalLogs === 0 ? 0 : startIndex + 1
  const showingTo = startIndex + paginatedLogs.length

  // Calculate statistics
  // (totalLogs already computed above)
  const successfulLogins = userLogs.filter(
    (log) => log.status.toLowerCase() === 'success'
  ).length
  const failedLogins = userLogs.filter(
    (log) => log.status.toLowerCase() === 'failed'
  ).length
  const uniqueUsers = [...new Set(userLogs.map((log) => log.email))].length

  // Get today's date
  const today = new Date().toISOString().split('T')[0]
  const todayLogins = userLogs.filter((log) =>
    log.timestamp.startsWith(today)
  ).length

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="activity" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Login Activity Logs
                    </h1>
                    <p class="page-subtitle">Monitor user authentication and access history in real-time</p>
                </div>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px;">
            <div class="card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Total Login Records</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${totalLogs}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="database" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>

            <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Successful Logins</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${successfulLogins}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="check-circle" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>

            <div class="card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Failed Attempts</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${failedLogins}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="x-circle" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>

            <div class="card" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Unique Users</p>
                        <h3 style="margin: 0; font-size: 32px; font-weight: 700;">${uniqueUsers}</h3>
                    </div>
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="users" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Login Activity Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h2 style="margin: 0; font-size: 18px; color: #111827; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="history" style="width:20px;height:20px;color:#3b82f6;"></i>
                            Authentication History
                        </h2>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Comprehensive log of all user login activities</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                            <i data-lucide="calendar" style="width:16px;height:16px;color:#6b7280;"></i>
                            <span style="font-size: 13px; color: #6b7280;">Today:</span>
                            <strong style="font-size: 15px; color: #111827;">${todayLogins}</strong>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                            <i data-lucide="layers" style="width:16px;height:16px;color:#6b7280;"></i>
                            <span style="font-size: 13px; color: #6b7280;">Total:</span>
                            <strong style="font-size: 15px; color: #111827;">${totalLogs}</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            ${
              userLogs.length === 0
                ? `
                <div style="text-align: center; padding: 80px 20px; background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);">
                    <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 8px 16px rgba(59, 130, 246, 0.1);">
                        <i data-lucide="shield-alert" style="width:48px;height:48px;color:#3b82f6;opacity:0.6;"></i>
                    </div>
                    <h3 style="margin: 0 0 12px 0; font-size: 20px; color: #111827; font-weight: 600;">No Login Activity Recorded</h3>
                    <p style="margin: 0; font-size: 15px; color: #6b7280; max-width: 400px; margin: 0 auto;">
                        User authentication records will appear here once users sign in to the system
                    </p>
                    <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; max-width: 500px; margin: 24px auto 0;">
                        <div style="display: flex; align-items: start; gap: 12px; text-align: left;">
                            <i data-lucide="info" style="width:20px;height:20px;color:#f59e0b;flex-shrink:0;margin-top:2px;"></i>
                            <div>
                                <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 500;">Login activity is automatically tracked when users authenticate through the Access System.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `
                : `
                <div style="overflow-x:auto;">
                    <div style="max-height:420px; overflow-y:auto; overscroll-behavior:contain;">
                    <table class="table sticky-header" style="margin:0;">
                        <thead>
                            <tr>
                                <th style="padding-left: 24px; min-width: 180px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="clock" style="width:14px;height:14px;"></i>
                                        Timestamp
                                    </div>
                                </th>
                                <th style="min-width: 180px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="user" style="width:14px;height:14px;"></i>
                                        User
                                    </div>
                                </th>
                                <th style="min-width: 220px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="mail" style="width:14px;height:14px;"></i>
                                        Email Address
                                    </div>
                                </th>
                                <th style="min-width: 120px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="zap" style="width:14px;height:14px;"></i>
                                        Action
                                    </div>
                                </th>
                                <th style="min-width: 160px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="monitor" style="width:14px;height:14px;"></i>
                                        Device Type
                                    </div>
                                </th>
                                <th style="min-width: 140px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="globe" style="width:14px;height:14px;"></i>
                                        IP Address
                                    </div>
                                </th>
                                <th style="padding-right: 24px; min-width: 120px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="shield-check" style="width:14px;height:14px;"></i>
                                        Status
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paginatedLogs
                              .map((log, index) => {
                                const isSuccess =
                                  log.status.toLowerCase() === 'success'
                                const deviceIcon = log.device.includes(
                                  'Windows'
                                )
                                  ? 'monitor'
                                  : log.device.includes('Mac')
                                  ? 'laptop'
                                  : log.device.includes('Android') ||
                                    log.device.includes('iOS')
                                  ? 'smartphone'
                                  : 'monitor'

                                return `
                                <tr style="transition: all 0.2s; ${
                                  index === 0
                                    ? 'background: linear-gradient(to right, rgba(59, 130, 246, 0.03), transparent);'
                                    : ''
                                }">
                                    <td style="padding-left: 24px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                                <i data-lucide="clock" style="width:16px;height:16px;color:#1e40af;"></i>
                                            </div>
                                            <div>
                                                <div style="font-family: 'Courier New', monospace; font-size: 13px; color: #111827; font-weight: 600;">
                                                    ${
                                                      log.timestamp.split(
                                                        ' '
                                                      )[1]
                                                    }
                                                </div>
                                                <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #6b7280;">
                                                    ${
                                                      log.timestamp.split(
                                                        ' '
                                                      )[0]
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; flex-shrink: 0;">
                                                ${log.name
                                                  .split(' ')
                                                  .map((n) => n[0])
                                                  .join('')
                                                  .substring(0, 2)}
                                            </div>
                                            <div style="font-weight: 600; color: #111827;">${
                                              log.name
                                            }</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 6px;">
                                            <i data-lucide="at-sign" style="width:14px;height:14px;color:#9ca3af;"></i>
                                            <span style="color: #4b5563; font-size: 13px;">${
                                              log.email
                                            }</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); color: #1e40af; border-radius: 8px; font-size: 13px; font-weight: 600; box-shadow: 0 1px 2px rgba(59, 130, 246, 0.1);">
                                            <i data-lucide="log-in" style="width:14px;height:14px;"></i>
                                            ${log.action}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div style="width: 32px; height: 32px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                                <i data-lucide="${deviceIcon}" style="width:16px;height:16px;color:#4b5563;"></i>
                                            </div>
                                            <span style="font-size: 13px; color: #4b5563; font-weight: 500;">${
                                              log.device
                                            }</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 6px;">
                                            <i data-lucide="wifi" style="width:12px;height:12px;color:#9ca3af;"></i>
                                            <span style="font-family: 'Courier New', monospace; font-size: 12px; color: #6b7280;">${
                                              log.ipAddress
                                            }</span>
                                        </div>
                                    </td>
                                    <td style="padding-right: 24px;">
                                        <span class="badge ${
                                          isSuccess ? 'green' : 'red'
                                        }" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; padding: 6px 14px; box-shadow: 0 1px 3px ${
                                  isSuccess
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'rgba(239, 68, 68, 0.2)'
                                };">
                                            <i data-lucide="${
                                              isSuccess
                                                ? 'check-circle'
                                                : 'x-circle'
                                            }" style="width:14px;height:14px;"></i>
                                            ${log.status}
                                        </span>
                                    </td>
                                </tr>
                            `
                              })
                              .join('')}
                        </tbody>
                    </table>
                    </div>
                </div>
                
                <!-- Table Footer Pagination (Product-style) -->
                <nav class="enhanced-pagination" aria-label="Pagination" style="padding: 12px 0; border-top:1px solid #e5e7eb; background:#f9fafb;">
                    <div class="pagination-left" style="margin-left:16px; font-size:13px; color:#6b7280;">
                        Showing ${showingFrom} to ${showingTo} of ${totalLogs} entries
                    </div>
                    <div class="pagination-right" style="margin-right:16px; display:flex; gap:4px;">
                        <button class="pagination-btn" ${
                          currentPage === 1 ? 'disabled' : ''
                        } onclick="setLoginActivityPage(${
                    currentPage - 1
                  })">Previous</button>
                        ${(() => {
                          const buttons = []
                          const maxButtons = 5
                          let start = Math.max(
                            1,
                            currentPage - Math.floor(maxButtons / 2)
                          )
                          let end = start + maxButtons - 1
                          if (end > totalPages) {
                            end = totalPages
                            start = Math.max(1, end - maxButtons + 1)
                          }
                          for (let p = start; p <= end; p++) {
                            buttons.push(
                              `<button class=\"pagination-btn ${
                                p === currentPage ? 'active' : ''
                              }\" onclick=\\"setLoginActivityPage(${p})\\">${p}</button>`
                            )
                          }
                          return buttons.join('')
                        })()}
                        <button class="pagination-btn" ${
                          currentPage === totalPages ? 'disabled' : ''
                        } onclick="setLoginActivityPage(${
                    currentPage + 1
                  })">Next</button>
                    </div>
                </nav>
            `
            }
        </div>
    `
}

// ---- Pagination handlers for Login Activity (exposed globally) ----
function setLoginActivityPage(page) {
  const totalLogs =
    window.MockData && window.MockData.userLogs
      ? window.MockData.userLogs.length
      : 0
  const totalPages = Math.max(
    1,
    Math.ceil(totalLogs / (AppState.loginActivityPageSize || 10))
  )
  const clamped = Math.min(Math.max(1, page), totalPages)
  AppState.loginActivityPage = clamped
  loadPageContent('login-activity')
}
window.setLoginActivityPage = setLoginActivityPage

// ----------------------------- //
// About Us Page               //
// ----------------------------- //
function generateAboutPage() {
  const currentYear = new Date().getFullYear()

  // Get stored About Us content or use defaults
  const aboutContent = AppState.aboutUsContent || {
    heroTitle: 'SPMO System',
    heroSubtitle:
      'Revolutionizing Inventory & Procurement Management for Camarines Norte State College',
    mission:
      'To provide a comprehensive, user-friendly platform that streamlines inventory management, automates procurement processes, and ensures transparency in resource allocation across all departments of CNSC.',
    vision:
      'To be the leading digital solution for educational institutions, setting the standard for efficient resource management, data-driven decision making, and operational excellence.',
    institution:
      'Camarines Norte State College - Supply and Property Management Office',
    email: 'cnsc.spmo@.edu.ph',
    phone: '(054) 440-1134',
    heroImage: '',
    institutionLogo: '',
    gallery: [],
  }

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="info" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        About Us
                    </h1>
                    <p class="page-subtitle">Learn more about the SPMO System and the team behind it</p>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                    <button class="btn btn-primary" onclick="editAboutUs()" style="display:flex;align-items:center;gap:8px;">
                        <i data-lucide="edit-3" style="width:16px;height:16px;"></i>
                        Edit About Us
                    </button>
                    <div style="text-align:right;color:#6b7280;font-size:14px;">Updated: ${currentYear}</div>
                </div>
            </div>
        </div>

    <div class="page-content" style="padding:24px 16px;">
      <div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:24px;">
      <!-- Hero Section (carousel/gallery removed) -->
      <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 36px 16px; text-align: center; border: none;">
        <div style="max-width: 820px; margin: 0 auto;">
                    ${
                      aboutContent.institutionLogo
                        ? `<img src="${aboutContent.institutionLogo}" alt="Institution Logo" style="width: 100px; height: 100px; object-fit: contain; margin: 0 auto 20px; display: block; background: white; border-radius: 12px; padding: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">`
                        : ''
                    }
          <h2 id="hero-title" style="margin: 0 0 12px 0; font-size: 28px; font-weight: 700; color: white;">${
            aboutContent.heroTitle
          }</h2>
          <p id="hero-subtitle" style="font-size: 17px; line-height: 1.8; margin: 0; opacity: 0.95;">${
            aboutContent.heroSubtitle
          }</p>
        </div>
      </div>

      <!-- Mission & Vision Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        <div class="card" style="border-left: 4px solid #667eea; padding:18px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: #ede9fe; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="target" style="width: 24px; height: 24px; color: #667eea;"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 20px; color: #111827;">Our Mission</h3>
                    </div>
                    <p id="mission-text" style="color: #4b5563; line-height: 1.7; margin: 0;">
                        ${aboutContent.mission}
                    </p>
                </div>
        <div class="card" style="border-left: 4px solid #10b981; padding:18px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 48px; height: 48px; background: #d1fae5; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="eye" style="width: 24px; height: 24px; color: #10b981;"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 20px; color: #111827;">Our Vision</h3>
                    </div>
                    <p id="vision-text" style="color: #4b5563; line-height: 1.7; margin: 0;">
                        ${aboutContent.vision}
                    </p>
                </div>
            </div>
      <!-- Key Features -->
      <div class="card" style="padding:18px;">
        <h3 style="margin: 0 0 20px 0; font-size: 22px; color: #111827; text-align: center;">What We Offer</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="width: 64px; height: 64px; background: #fef3c7; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                            <i data-lucide="package" style="width: 32px; height: 32px; color: #f59e0b;"></i>
                        </div>
                        <h4 style="margin: 0 0 8px 0; color: #111827;">Inventory Management</h4>
                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Real-time tracking of stock levels, automated alerts, and comprehensive inventory reports
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px;">
                        <div style="width: 64px; height: 64px; background: #dbeafe; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                            <i data-lucide="shopping-cart" style="width: 32px; height: 32px; color: #3b82f6;"></i>
                        </div>
                        <h4 style="margin: 0 0 8px 0; color: #111827;">Procurement Automation</h4>
                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Streamlined purchase order creation, approval workflows, and vendor management
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px;">
                        <div style="width: 64px; height: 64px; background: #fce7f3; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                            <i data-lucide="bar-chart-3" style="width: 32px; height: 32px; color: #ec4899;"></i>
                        </div>
                        <h4 style="margin: 0 0 8px 0; color: #111827;">Analytics & Reporting</h4>
                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Powerful dashboards and customizable reports for data-driven decisions
                        </p>
                    </div>

                    <div style="text-align: center; padding: 20px;">
                        <div style="width: 64px; height: 64px; background: #d1fae5; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                            <i data-lucide="users" style="width: 32px; height: 32px; color: #10b981;"></i>
                        </div>
                        <h4 style="margin: 0 0 8px 0; color: #111827;">Multi-User Access</h4>
                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Role-based permissions ensuring secure and organized collaboration
                        </p>
                    </div>
                </div>
            </div>

      <!-- Team Section -->
      <div class="card" style="padding:18px;">
        <h3 style="margin: 0 0 8px 0; font-size: 22px; color: #111827; text-align: center;">Meet the Coordinators</h3>
        <p style="text-align: center; color: #6b7280; margin: 0 0 24px 0;">The dedicated coordinators behind SPMO System</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
                    <div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; transition: all 0.3s;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px; font-weight: 700; color: white;">
                            CQ
                        </div>
                        <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 18px;">Cherry Ann Quila</h4>
                        <p style="margin: 0 0 12px 0; color: #667eea; font-weight: 600; font-size: 14px;">QA & Papers</p>
                        <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                            Leading QA initiatives to maintain excellence and alignment in all project and paper outputs.
                        </p>
                    </div>

                    <div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; transition: all 0.3s;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px; font-weight: 700; color: white;">
                            VB
                        </div>
                        <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 18px;">Vince Balce</h4>
                        <p style="margin: 0 0 12px 0; color: #3b82f6; font-weight: 600; font-size: 14px;">Project Lead/Lead Developer</p>
                        <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                            Leading the Strategic direction and ensuring project success & Architecting and developing robust system features
                        </p>
                    </div>

                    <div style="text-align: center; padding: 24px; background: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; transition: all 0.3s;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px; font-weight: 700; color: white;">
                            ML
                        </div>
                        <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 18px;">Marinel Ledesma</h4>
                        <p style="margin: 0 0 12px 0; color: #ec4899; font-weight: 600; font-size: 14px;">Co Developer & Documentation</p>
                        <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                            Ensuring quality standards and comprehensive support for development and prepared clear project documentation.
                        </p>
                    </div>
                </div>
            </div>

      <!-- Headed by Section -->
      <div class="card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; padding:18px;">
        <div style="text-align: center; max-width: 700px; margin: 0 auto;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
                        <div style="width: 48px; height: 48px; background: #0284c7; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="shield-check" style="width: 24px; height: 24px; color: white;"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 24px; color: #111827;">Headed by</h3>
                    </div>
                    
                    <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: white; border: 4px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                                SO
                            </div>
                            <div style="text-align: left;">
                                <h4 style="margin: 0 0 4px 0; color: #111827; font-size: 22px; font-weight: 700;">Supply Officer III</h4>
                                <p style="margin: 0; color: #0284c7; font-weight: 600; font-size: 16px;">Property and Supply Management Office</p>
                                <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px; font-style: italic;">
                                    Overseeing the strategic management and coordination of SPMO operations
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

      <!-- Contact Section -->
      <div class="card" style="background: #f9fafb; border: 2px solid #e5e7eb; padding:18px;">
        <div style="text-align: center; max-width: 600px; margin: 0 auto;">
                    <div style="width: 64px; height: 64px; background: #667eea; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i data-lucide="mail" style="width: 32px; height: 32px; color: white;"></i>
                    </div>
                    <h3 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">Contact Information</h3>
                    <p style="margin: 0 0 24px 0; color: #6b7280; line-height: 1.6;">
                        Get in touch with us for questions or support
                    </p>
                    
                    <div style="display: grid; gap: 16px; text-align: left;">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border-radius: 8px;">
                            <div style="width: 40px; height: 40px; background: #ede9fe; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i data-lucide="building-2" style="width: 20px; height: 20px; color: #667eea;"></i>
                            </div>
                            <div>
                                <p style="margin: 0; font-weight: 600; color: #111827; font-size: 14px;">Institution</p>
                                <p id="institution-text" style="margin: 0; color: #6b7280; font-size: 14px;">${
                                  aboutContent.institution
                                }</p>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border-radius: 8px;">
                            <div style="width: 40px; height: 40px; background: #dbeafe; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i data-lucide="mail" style="width: 20px; height: 20px; color: #3b82f6;"></i>
                            </div>
                            <div>
                                <p style="margin: 0; font-weight: 600; color: #111827; font-size: 14px;">Institutional Email</p>
                                <p id="email-text" style="margin: 0; color: #6b7280; font-size: 14px;">${
                                  aboutContent.email
                                }</p>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border-radius: 8px;">
                            <div style="width: 40px; height: 40px; background: #d1fae5; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i data-lucide="phone" style="width: 20px; height: 20px; color: #10b981;"></i>
                            </div>
                            <div>
                                <p style="margin: 0; font-weight: 600; color: #111827; font-size: 14px;">Contact Number</p>
                                <p id="phone-text" style="margin: 0; color: #6b7280; font-size: 14px;">${
                                  aboutContent.phone
                                }</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

      <!-- Footer Note -->
      <div style="padding: 18px; text-align: center; background: linear-gradient(to right, #f9fafb, #f3f4f6, #f9fafb); border-radius: 12px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    © ${currentYear} SPMO System - Camarines Norte State College. All rights reserved.
                </p>
            </div>
      </div>
    </div>
    `
}

// ----------------------------- //
// Support Page (Submit Ticket Only)//
// ----------------------------- //
function generateSupportPage() {
  // Load existing support tickets from localStorage
  let tickets = []
  try {
    const raw = localStorage.getItem('spmo_supportTickets')
    if (raw) tickets = JSON.parse(raw) || []
  } catch (e) {
    tickets = []
  }

  const ticketRows =
    tickets
      .map(
        (t) => `
        <tr>
            <td style="font-weight:600;color:#111827;">${escapeHtml(
              t.name
            )}</td>
            <td>${escapeHtml(t.email)}</td>
            <td>${escapeHtml(t.message).slice(0, 60)}${
          t.message.length > 60 ? '…' : ''
        }</td>
            <td><span class="badge ${
              t.status === 'Open' ? 'yellow' : 'green'
            }" style="font-size:11px;">${t.status}</span></td>
            <td style="font-size:12px;color:#6b7280;">${t.created}</td>
        </tr>`
      )
      .join('') ||
    '<tr><td colspan="5" style="text-align:center;padding:20px;color:#6b7280;">No support tickets yet</td></tr>'

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="life-buoy" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Support Tickets
                    </h1>
                    <p class="page-subtitle">Review submitted support tickets</p>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <button class="btn-secondary" onclick="refreshSupportTickets()" aria-label="Refresh tickets" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;font-size:13px;font-weight:600;line-height:1;border-radius:8px;">
                        <i data-lucide="refresh-cw" style="width:16px;height:16px;margin:-1px 0 0 0;"></i>
                        <span style="pointer-events:none;">Refresh</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="page-content" id="support-page">
            <div class="card" style="margin-top:0;">
                <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;">
                    <h3 class="card-title" style="margin:0;display:flex;align-items:center;gap:8px;">
                        <i data-lucide="list" style="width:18px;height:18px;color:#111827;"></i>
                        Submitted Tickets
                    </h3>
                    <div style="font-size:12px;color:#6b7280;">${tickets.length} total</div>
                </div>
                <div style="overflow-x:auto;">
                    <table class="table" style="min-width:760px;">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody id="support-ticket-body">${ticketRows}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `
}

// Note: escapeHtml is already defined earlier in this file. Do not redeclare it here
// to avoid duplicate identifier errors during bundling. Use the existing escapeHtml.

// Refresh tickets list (re-render only tickets table body without full page reload)
function refreshSupportTickets() {
  if (AppState.currentPage !== 'support') return
  let tickets = []
  try {
    const raw = localStorage.getItem('spmo_supportTickets')
    if (raw) tickets = JSON.parse(raw) || []
  } catch (e) {
    tickets = []
  }
  const body = document.getElementById('support-ticket-body')
  if (!body) return
  body.innerHTML =
    tickets
      .map(
        (t) =>
          `<tr><td style=\"font-weight:600;color:#111827;\">${escapeHtml(
            t.name
          )}</td><td>${escapeHtml(t.email)}</td><td>${escapeHtml(
            t.message
          ).slice(0, 60)}${
            t.message.length > 60 ? '…' : ''
          }</td><td><span class=\"badge ${
            t.status === 'Open' ? 'yellow' : 'green'
          }\" style=\"font-size:11px;\">${
            t.status
          }</span></td><td style=\"font-size:12px;color:#6b7280;\">${
            t.created
          }</td></tr>`
      )
      .join('') ||
    '<tr><td colspan="5" style="text-align:center;padding:20px;color:#6b7280;">No support tickets yet</td></tr>'
}
window.refreshSupportTickets = refreshSupportTickets

// Extend initializePageEvents to wire support page events
const _origInitPageEvents_forSupport = initializePageEvents
initializePageEvents = function (pageId) {
  _origInitPageEvents_forSupport(pageId)
  if (pageId === 'support') {
    // Simply refresh tickets; submission form removed.
    refreshSupportTickets()
  }
}

// Edit About Us Modal
function editAboutUs() {
  const currentContent = AppState.aboutUsContent || {
    heroTitle: 'SPMO System',
    heroSubtitle:
      'Revolutionizing Inventory & Procurement Management for Camarines Norte State College',
    mission:
      'To provide a comprehensive, user-friendly platform that streamlines inventory management, automates procurement processes, and ensures transparency in resource allocation across all departments of CNSC.',
    vision:
      'To be the leading digital solution for educational institutions, setting the standard for efficient resource management, data-driven decision making, and operational excellence.',
    institution:
      'Camarines Norte State College - Supply and Property Management Office',
    email: 'cnsc.spmo@.edu.ph',
    phone: '(054) 440-1134',
    heroImage: '',
    institutionLogo: '',
  }

  let modal = document.getElementById('edit-about-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'edit-about-modal'
    modal.className = 'modal-overlay'
    document.body.appendChild(modal)
  }

  modal.className = 'modal-overlay active'
  modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow: hidden; padding: 0; display: flex; flex-direction: column;">
            <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; flex-shrink: 0;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="edit-3" style="width: 24px; height: 24px;"></i>
                    Edit About Us Content
                </h2>
                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Update the information displayed on the About Us page</p>
            </div>
            
            <div style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;">
                <!-- Hero Section -->
                <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 600;">Hero Section</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #374151;">Title</label>
                            <input type="text" id="edit-hero-title" value="${currentContent.heroTitle.replace(
                              /"/g,
                              '&quot;'
                            )}" 
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #374151;">Subtitle</label>
                            <textarea id="edit-hero-subtitle" rows="2" 
                                      style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical;">${currentContent.heroSubtitle
                                        .replace(/</g, '&lt;')
                                        .replace(/>/g, '&gt;')}</textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Mission & Vision -->
                <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 600;">Mission & Vision</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #374151;">Our Mission</label>
                            <textarea id="edit-mission" rows="3" 
                                      style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical;">${currentContent.mission
                                        .replace(/</g, '&lt;')
                                        .replace(/>/g, '&gt;')}</textarea>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #374151;">Our Vision</label>
                            <textarea id="edit-vision" rows="3" 
                                      style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical;">${currentContent.vision
                                        .replace(/</g, '&lt;')
                                        .replace(/>/g, '&gt;')}</textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Contact Information -->
                <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 600;">Contact Information</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #374151;">Institution</label>
                            <input type="text" id="edit-institution" value="${currentContent.institution.replace(
                              /"/g,
                              '&quot;'
                            )}" 
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #374151;">Institutional Email</label>
                            <input type="email" id="edit-email" value="${currentContent.email.replace(
                              /"/g,
                              '&quot;'
                            )}" 
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; color: #374151;">Contact Number</label>
                            <input type="tel" id="edit-phone" value="${currentContent.phone.replace(
                              /"/g,
                              '&quot;'
                            )}" 
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer" style="padding: 20px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-shrink: 0; display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="closeEditAboutModal()" class="btn btn-secondary">
                    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                    Cancel
                </button>
                <button onclick="saveAboutUs()" class="btn btn-primary" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <i data-lucide="save" style="width: 16px; height: 16px;"></i>
                    Save Changes
                </button>
            </div>
        </div>
    `

  try {
    lucide.createIcons()
  } catch (e) {}
}

function closeEditAboutModal() {
  const modal = document.getElementById('edit-about-modal')
  if (modal) {
    modal.className = 'modal-overlay'
    setTimeout(() => modal.remove(), 300)
  }
}

function saveAboutUs() {
  // Get values from form
  const heroTitle = document.getElementById('edit-hero-title').value.trim()
  const heroSubtitle = document
    .getElementById('edit-hero-subtitle')
    .value.trim()
  const mission = document.getElementById('edit-mission').value.trim()
  const vision = document.getElementById('edit-vision').value.trim()
  const institution = document.getElementById('edit-institution').value.trim()
  const email = document.getElementById('edit-email').value.trim()
  const phone = document.getElementById('edit-phone').value.trim()

  // Validation
  if (
    !heroTitle ||
    !heroSubtitle ||
    !mission ||
    !vision ||
    !institution ||
    !email ||
    !phone
  ) {
    showAlert('Please fill in all fields', 'error')
    return
  }

  // Image uploads are disabled in this editor. Preserve existing images (if any).
  AppState.aboutUsContent = {
    heroTitle,
    heroSubtitle,
    mission,
    vision,
    institution,
    email,
    phone,
    institutionLogo: AppState.aboutUsContent?.institutionLogo || '',
    heroImage: AppState.aboutUsContent?.heroImage || '',
  }

  // Close modal and refresh
  closeEditAboutModal()
  loadPageContent('about')
  showAlert('About Us content updated successfully!', 'success')
}

function removeAboutImage(type) {
  if (type === 'logo') {
    if (AppState.aboutUsContent) {
      AppState.aboutUsContent.institutionLogo = ''
    }
  } else if (type === 'hero') {
    if (AppState.aboutUsContent) {
      AppState.aboutUsContent.heroImage = ''
    }
  }

  // Re-open modal to refresh display
  editAboutUs()
  showAlert('Image removed successfully!', 'success')
}

// -----------------------------//
// Activity & Notifications Page //
// -----------------------------//

function generateActivityPage() {
  // Get all notifications with additional system activities
  const allNotifications = AppState.notifications || []

  // Add system activities (sample data - can be expanded)
  const systemActivities = [
    {
      id: 'sys-1',
      type: 'system',
      icon: 'package',
      color: '#3b82f6',
      title: 'New Product Added',
      message: 'Office Supplies category updated',
      time: '2 hours ago',
      read: true,
    },
    {
      id: 'sys-2',
      type: 'system',
      icon: 'users',
      color: '#10b981',
      title: 'User Account Created',
      message: 'New user added to the system',
      time: '5 hours ago',
      read: true,
    },
    {
      id: 'sys-3',
      type: 'system',
      icon: 'trending-up',
      color: '#f59e0b',
      title: 'Stock Alert',
      message: 'Low stock items detected',
      time: '1 day ago',
      read: true,
    },
  ]

  const combinedActivities = [...allNotifications, ...systemActivities].sort(
    (a, b) => {
      // Sort by time (newest first) - simplified sorting
      return 0 // For demo, maintain current order
    }
  )

  const unreadCount = combinedActivities.filter((n) => !n.read).length

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div style="display:flex;align-items:center;gap:16px;">
                    <button class="btn btn-secondary" onclick="navigateToPage('dashboard')" style="display:flex;align-items:center;gap:8px;padding:10px 16px;">
                        <i data-lucide="arrow-left" style="width:18px;height:18px;"></i>
                        Back
                    </button>
                    <div>
                        <h1 class="page-title">
                            <i data-lucide="bell" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                            Activity & Notifications
                        </h1>
                        <p class="page-subtitle">View all system notifications and activity logs</p>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                    ${
                      unreadCount > 0
                        ? `
                        <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:8px;">
                            <div style="width:8px;height:8px;background:#f59e0b;border-radius:50%;"></div>
                            <span style="font-size:14px;font-weight:600;color:#b45309;">${unreadCount} unread</span>
                        </div>
                    `
                        : ''
                    }
                    <button class="btn btn-secondary" onclick="markAllNotificationsRead()" style="display:flex;align-items:center;gap:8px;">
                        <i data-lucide="check-check" style="width:16px;height:16px;"></i>
                        Mark all as read
                    </button>
                    <button class="btn btn-secondary" onclick="clearAllNotifications()" style="display:flex;align-items:center;gap:8px;">
                        <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                        Clear all
                    </button>
                </div>
            </div>
        </div>

        <div class="page-content">
            ${
              combinedActivities.length === 0
                ? `
                <div class="card" style="text-align:center;padding:64px 32px;">
                    <div style="width:80px;height:80px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
                        <i data-lucide="bell-off" style="width:40px;height:40px;color:#9ca3af;"></i>
                    </div>
                    <h3 style="margin:0 0 8px 0;color:#111827;font-size:20px;">No notifications yet</h3>
                    <p style="margin:0;color:#6b7280;font-size:14px;">When you receive notifications, they'll appear here</p>
                </div>
            `
                : `
                <div class="card" style="padding:0;overflow:hidden;">
                    <div style="background:#f9fafb;border-bottom:1px solid #e5e7eb;padding:16px 24px;">
                        <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">All Activity</h3>
                    </div>
                    <div style="display:flex;flex-direction:column;">
                        ${combinedActivities
                          .map((activity, index) => {
                            const iconName = activity.icon || 'bell'
                            const iconColor = activity.color || '#667eea'
                            const bgColor = activity.read
                              ? '#ffffff'
                              : '#f0f9ff'
                            const borderLeft = activity.read
                              ? 'transparent'
                              : '#3b82f6'

                            return `
                                <div style="display:flex;align-items:start;gap:16px;padding:20px 24px;background:${bgColor};border-left:3px solid ${borderLeft};border-bottom:1px solid #e5e7eb;transition:all 0.2s;cursor:pointer;" 
                                     onmouseover="this.style.background='#f9fafb'" 
                                     onmouseout="this.style.background='${bgColor}'">
                                    <div style="width:48px;height:48px;background:${iconColor}15;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                        <i data-lucide="${iconName}" style="width:24px;height:24px;color:${iconColor};"></i>
                                    </div>
                                    <div style="flex:1;min-width:0;">
                                        <div style="display:flex;align-items:start;justify-content:space-between;gap:12px;margin-bottom:4px;">
                                            <h4 style="margin:0;font-size:15px;font-weight:600;color:#111827;">${
                                              activity.title
                                            }</h4>
                                            <span style="font-size:13px;color:#6b7280;white-space:nowrap;">${
                                              activity.time
                                            }</span>
                                        </div>
                                        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">${
                                          activity.message
                                        }</p>
                                        ${
                                          !activity.read
                                            ? `
                                            <button onclick="markNotificationAsRead('${activity.id}')" 
                                                    style="margin-top:12px;padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s;"
                                                    onmouseover="this.style.background='#2563eb'"
                                                    onmouseout="this.style.background='#3b82f6'">
                                                Mark as read
                                            </button>
                                        `
                                            : ''
                                        }
                                    </div>
                                </div>
                            `
                          })
                          .join('')}
                    </div>
                </div>
            `
            }
        </div>
    `
}

function markNotificationAsRead(notificationId) {
  if (AppState.notifications) {
    const notification = AppState.notifications.find(
      (n) => n.id === notificationId
    )
    if (notification) {
      notification.read = true
      loadPageContent('activity') // Refresh the page
      updateNotificationBadge()
    }
  }
}
// ===== System-wide Notifications (persistence helpers) =====
const NOTIFICATIONS_KEY = 'AppNotifications'

function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed)) {
      AppState.notifications = parsed.map((n) => ({
        id: n.id,
        title: n.title || n.type || 'Notification',
        message: n.message || '',
        time:
          n.time ||
          (n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'),
        timestamp: n.timestamp || n.createdAt || new Date().toISOString(),
        read: !!n.read,
        type: n.type || 'info',
        icon: n.icon || 'bell',
        meta: n.meta || {},
      }))
    }
  } catch (e) {
    AppState.notifications = AppState.notifications || []
  }
  updateNotificationBadge()
  return AppState.notifications
}

function saveNotifications() {
  try {
    const toStore = (AppState.notifications || []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      icon: n.icon,
      read: !!n.read,
      timestamp: n.timestamp || new Date().toISOString(),
      createdAt: n.createdAt || n.timestamp || new Date().toISOString(),
      meta: n.meta || {},
    }))
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(toStore))
  } catch (e) {
    console.error('Failed to persist notifications', e)
  }
  updateNotificationBadge()
}

function generateNotificationId() {
  return `n_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

function createNotification({
  title = '',
  message = '',
  type = 'info',
  icon = 'bell',
  meta = {},
  silent = false,
} = {}) {
  loadNotifications()
  const n = {
    id: generateNotificationId(),
    title: title || (type ? String(type) : 'Notification'),
    message: message || '',
    type,
    icon,
    read: false,
    time: 'Just now',
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    meta,
  }
  AppState.notifications = AppState.notifications || []
  AppState.notifications.unshift(n)
  if (AppState.notifications.length > 500)
    AppState.notifications = AppState.notifications.slice(0, 500)
  saveNotifications()
  try {
    renderNotifications()
  } catch (e) {}

  if (!silent && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(n.title, { body: n.message || '', tag: n.id })
      } catch (e) {}
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          try {
            new Notification(n.title, { body: n.message || '', tag: n.id })
          } catch (e) {}
        }
      })
    }
  }

  return n
}

function updateNotificationBadge() {
  const unread = (AppState.notifications || []).filter((n) => !n.read).length
  const badge =
    document.getElementById('notifications-badge') ||
    document.querySelector('#notifications-badge')
  if (badge) {
    badge.textContent = unread > 9 ? '9+' : unread > 0 ? String(unread) : ''
    badge.style.display = unread > 0 ? 'flex' : 'none'
  }
}

// -----------------------------//
// Add Product Modal and Functions //
// -----------------------------//

function openProductModal(mode = 'create', productId = null) {
  const modal = document.getElementById('product-modal')
  const modalContent = modal.querySelector('.modal-content')

  AppState.currentModal = { mode, productId }

  // Load product data if editing or viewing
  let productData = null
  if (productId) {
    productData = MockData.products.find((p) => p.id === productId)
  }

  modalContent.innerHTML = generateProductModal(mode, productData)
  modal.classList.add('active')

  lucide.createIcons()
}

function closeProductModal() {
  const modal = document.getElementById('product-modal')
  modal.classList.remove('active')
  AppState.currentModal = null
}

function saveProduct(productId) {
  const modal = document.getElementById('product-modal')
  const name = modal.querySelector('#productName').value.trim()
  const category = modal.querySelector('#productCategory').value
  const description = modal.querySelector('#productDescription').value.trim()
  const unitCost =
    parseFloat(modal.querySelector('#productUnitCost').value) || 0
  const quantity = parseInt(modal.querySelector('#productQuantity').value) || 0
  const unit = modal.querySelector('#productUnit')
    ? modal.querySelector('#productUnit').value.trim()
    : ''
  const date =
    modal.querySelector('#productDate').value ||
    new Date().toISOString().slice(0, 10)

  if (!name) {
    showAlert('Product name is required', 'error')
    return
  }

  const totalValue = unitCost * quantity

  if (!productId) {
    // generate id based on category prefix
    const prefix =
      category === 'expendable'
        ? 'E'
        : category === 'semi-expendable'
        ? 'SE'
        : 'N'
    const nextIndex = MockData.products.length + 1
    const padded = String(nextIndex).padStart(3, '0')
    const newId = `${prefix}${padded}`

    const newProduct = {
      id: newId,
      name,
      description,
      quantity,
      unitCost,
      totalValue,
      date,
      type: category,
      unit,
    }
    MockData.products.push(newProduct)
    persistProducts()
    showAlert(`Product "${name}" (${newId}) added successfully!`, 'success')
  } else {
    const existing = MockData.products.find((p) => p.id === productId)
    if (existing) {
      existing.name = name
      existing.description = description
      existing.unitCost = unitCost
      existing.quantity = quantity
      existing.totalValue = totalValue
      existing.date = date
      existing.type = category
      existing.unit = unit
      persistProducts()
      showAlert(`Product "${name}" updated successfully!`, 'success')
    }
  }

  closeProductModal()
  loadPageContent('products') // refresh list
}

async function deleteProduct(productId) {
  const ok = await showConfirm('Delete this product?', 'Delete Product')
  if (!ok) return

  // Find the product name before deleting
  const product = MockData.products.find((p) => p.id === productId)
  const productName = product ? product.name : 'Product'

  // Delete the product
  MockData.products = MockData.products.filter((p) => p.id !== productId)
  persistProducts()

  // Show success toast
  showAlert(`${productName} has been successfully deleted`, 'success')

  // Reload the page
  loadPageContent('products')
}

// Enhanced Product Modal with modern design
function generateProductModal(mode = 'create', productData = null) {
  const title =
    mode === 'create'
      ? 'Add New Product'
      : mode === 'edit'
      ? 'Edit Product'
      : 'Product Details'
  const subtitle =
    mode === 'create'
      ? 'Add a new product to inventory'
      : mode === 'edit'
      ? 'Update product information'
      : 'View product details'
  const isReadOnly = mode === 'view'

  // Product icon based on type
  const getProductIcon = (type) => {
    if (type === 'expendable') return 'package'
    if (type === 'semi-expendable') return 'box'
    if (type === 'non-expendable') return 'archive'
    return 'package-plus'
  }

  const productIcon = getProductIcon(productData?.type)

  return `
        <div class="modal-header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; border-bottom: none; padding: 32px 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                ${
                  mode !== 'create' && productData
                    ? `
                    <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                        <i data-lucide="${productIcon}" style="width: 32px; height: 32px; color: white;"></i>
                    </div>
                `
                    : ''
                }
                <div style="flex: 1;">
                    <h2 class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">${title}</h2>
                    <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">${subtitle}</p>
                </div>
            </div>
            <button class="modal-close" onclick="closeProductModal()" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>

        <div class="modal-body" style="padding: 32px 24px; background: #f9fafb;">
            <!-- Basic Product Information -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="info" style="width: 18px; height: 18px; color: #dc2626;"></i>
                    Basic Information
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="package" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Product Name
                        </label>
                        <input type="text" class="form-input" id="productName"
                               value="${productData?.name || ''}"
                               placeholder="e.g., Bond Paper A4"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="layers" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Category
                        </label>
                        <select class="form-select" id="productCategory" ${
                          isReadOnly ? 'disabled' : ''
                        } style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s; ${
    isReadOnly ? 'background: #f9fafb;' : ''
  }">
                            <option value="">Select category</option>
                            <option value="expendable" ${
                              productData?.type === 'expendable'
                                ? 'selected'
                                : ''
                            }>Expendable</option>
                            <option value="semi-expendable" ${
                              productData?.type === 'semi-expendable'
                                ? 'selected'
                                : ''
                            }>Semi-Expendable</option>
                            <option value="non-expendable" ${
                              productData?.type === 'non-expendable'
                                ? 'selected'
                                : ''
                            }>Non-Expendable</option>
                        </select>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="file-text" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Description
                    </label>
                    <textarea class="form-textarea" id="productDescription"
                              placeholder="Provide detailed product description..."
                              style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; min-height: 100px; transition: all 0.2s; ${
                                isReadOnly ? 'background: #f9fafb;' : ''
                              }"
                              ${isReadOnly ? 'readonly' : ''}>${
    productData?.description || ''
  }</textarea>
                </div>
            </div>

            <!-- Pricing & Inventory -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="dollar-sign" style="width: 18px; height: 18px; color: #dc2626;"></i>
                    Pricing & Inventory
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="tag" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Unit Cost
                        </label>
                        <input type="number" class="form-input" id="productUnitCost"
                               step="0.01" min="0"
                               value="${productData?.unitCost || ''}"
                               placeholder="0.00"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="hash" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Quantity
                        </label>
                        <input type="number" class="form-input" id="productQuantity"
                               min="1"
                               value="${productData?.quantity || ''}"
                               placeholder="1"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="ruler" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Unit
                        </label>
                        <input type="text" class="form-input" id="productUnit"
                               value="${productData?.unit || ''}"
                               placeholder="e.g., pcs, box, pack"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <!-- spacer / could add future field -->
                    </div>
                </div>
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Date Added
                        </label>
                        <input type="date" class="form-input" id="productDate"
                               value="${
                                 productData?.date ||
                                 new Date().toISOString().split('T')[0]
                               }"
                               min="${new Date().toISOString().split('T')[0]}"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s; ${
                                 isReadOnly ? 'background: #f9fafb;' : ''
                               }"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>

                    <div class="form-group" style="margin-bottom: 0;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="calculator" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Total Value
                        </label>
                        <input type="text" class="form-input" id="productTotalValue"
                               value="${
                                 productData
                                   ? formatCurrency(productData.totalValue || 0)
                                   : '₱0.00'
                               }"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; background: #f9fafb; font-weight: 600; color: #059669;"
                               readonly>
                    </div>
                </div>
            </div>

            <!-- Product Info Box -->
            ${
              productData?.id
                ? `
                <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #2563eb;">
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <i data-lucide="info" style="width: 20px; height: 20px; color: #1e40af; flex-shrink: 0; margin-top: 2px;"></i>
                        <div>
                            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1e3a8a;">Product ID: ${
                              productData.id
                            }</h4>
                            <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                                This product is categorized as <strong>${
                                  productData.type
                                    ? productData.type.charAt(0).toUpperCase() +
                                      productData.type.slice(1)
                                    : 'N/A'
                                }</strong> and is currently ${
                    productData.quantity > 0 ? 'in stock' : 'out of stock'
                  }.
                            </p>
                        </div>
                    </div>
                </div>
            `
                : ''
            }
        </div>

        <div class="modal-footer" style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeProductModal()" style="padding: 10px 24px; font-weight: 500; border: 2px solid #d1d5db; transition: all 0.2s;">
                <i data-lucide="${
                  isReadOnly ? 'x' : 'arrow-left'
                }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                ${isReadOnly ? 'Close' : 'Cancel'}
            </button>
            ${
              !isReadOnly
                ? `
                <button class="btn btn-primary" onclick="saveProduct('${
                  productData?.id || ''
                }')" style="padding: 10px 24px; font-weight: 500; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 6px rgba(220, 38, 38, 0.25); transition: all 0.2s;">
                    <i data-lucide="${
                      mode === 'create' ? 'plus-circle' : 'save'
                    }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                    ${mode === 'create' ? 'Add Product' : 'Save Changes'}
                </button>
            `
                : ''
            }
        </div>
    `
}

// -----------------------------//
// Category Modal and Functions //
// -----------------------------//

function openCategoryModal(mode = 'create', categoryId = null) {
  const modal = document.getElementById('category-modal')
  const modalContent = modal.querySelector('.modal-content')

  let categoryData = null
  if (categoryId) {
    categoryData = MockData.categories.find((c) => c.id === categoryId)
  }

  modalContent.innerHTML = generateCategoryModal(mode, categoryData)
  modal.classList.add('active')

  lucide.createIcons()
}

function closeCategoryModal() {
  const modal = document.getElementById('category-modal')
  modal.classList.remove('active')
}

// Open the Category Modal
// Enhanced Category Modal with modern design
function generateCategoryModal(mode = 'create', categoryData = null) {
  const title =
    mode === 'create'
      ? 'Add New Category'
      : mode === 'edit'
      ? 'Edit Category'
      : 'Category Details'
  const subtitle =
    mode === 'create'
      ? 'Create a new inventory category'
      : mode === 'edit'
      ? 'Update category information'
      : 'View category details'
  const isReadOnly = mode === 'view'

  // Category icon based on category name
  const getCategoryIcon = (name) => {
    if (!name) return 'folder-plus'
    const lowerName = name.toLowerCase()
    if (lowerName.includes('expendable')) return 'package'
    if (lowerName.includes('semi')) return 'box'
    if (lowerName.includes('non')) return 'archive'
    return 'folder'
  }

  const categoryIcon = getCategoryIcon(categoryData?.name)

  return `
        <div class="modal-header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; border-bottom: none; padding: 32px 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                ${
                  mode !== 'create'
                    ? `
                    <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                        <i data-lucide="${categoryIcon}" style="width: 32px; height: 32px; color: white;"></i>
                    </div>
                `
                    : ''
                }
                <div style="flex: 1;">
                    <h2 class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">${title}</h2>
                    <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">${subtitle}</p>
                </div>
            </div>
            <button class="modal-close" onclick="closeCategoryModal()" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>

        <div class="modal-body" style="padding: 32px 24px; background: #f9fafb;">
            <!-- Category Information Section -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="tag" style="width: 18px; height: 18px; color: #dc2626;"></i>
                    Category Information
                </h3>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="bookmark" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Category Name
                    </label>
                    <input type="text" class="form-input" id="categoryName"
                           value="${categoryData?.name || ''}"
                           placeholder="e.g., Expendable, Semi-Expendable, Non-Expendable"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                           ${isReadOnly ? 'readonly' : ''}>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="file-text" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Description
                    </label>
                    <textarea class="form-textarea" id="categoryDescription"
                              placeholder="Describe the purpose and criteria for this category..."
                              style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; min-height: 120px; transition: all 0.2s; ${
                                isReadOnly ? 'background: #f9fafb;' : ''
                              }"
                              ${isReadOnly ? 'readonly' : ''}>${
    categoryData?.description || ''
  }</textarea>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="info" style="width: 12px; height: 12px;"></i>
                        Provide clear guidelines for items that belong to this category
                    </p>
                </div>
            </div>

            <!-- Category Guidelines (shown in view/edit mode) -->
            ${
              categoryData?.id
                ? `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <i data-lucide="lightbulb" style="width: 20px; height: 20px; color: #d97706; flex-shrink: 0; margin-top: 2px;"></i>
                        <div>
                            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">Category ID: ${categoryData.id}</h4>
                            <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.5;">
                                This category helps organize inventory items based on their type, value, and lifecycle management requirements.
                            </p>
                        </div>
                    </div>
                </div>
            `
                : ''
            }
        </div>

        <div class="modal-footer" style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeCategoryModal()" style="padding: 10px 24px; font-weight: 500; border: 2px solid #d1d5db; transition: all 0.2s;">
                <i data-lucide="${
                  isReadOnly ? 'x' : 'arrow-left'
                }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                ${isReadOnly ? 'Close' : 'Cancel'}
            </button>
            ${
              !isReadOnly
                ? `
                <button class="btn btn-primary" onclick="saveCategory('${
                  categoryData?.id || ''
                }')" style="padding: 10px 24px; font-weight: 500; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 6px rgba(220, 38, 38, 0.25); transition: all 0.2s;">
                    <i data-lucide="${
                      mode === 'create' ? 'plus-circle' : 'save'
                    }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                    ${mode === 'create' ? 'Add Category' : 'Save Changes'}
                </button>
            `
                : ''
            }
        </div>
    `
}

function saveCategory(categoryId) {
  // Grab input values using the IDs
  const modal = document.getElementById('category-modal')
  const nameInput = modal.querySelector('#categoryName')
  const descriptionInput = modal.querySelector('#categoryDescription')

  const name = nameInput ? nameInput.value : ''
  const description = descriptionInput ? descriptionInput.value : ''

  // Basic validation
  if (!name || name.trim().length < 2) {
    showAlert(
      'Please enter a valid category name (at least 2 characters).',
      'error'
    )
    return
  }

  if (!categoryId) {
    // Create new: generate padded ID like C001
    const nextIndex = MockData.categories.length + 1
    const padded = String(nextIndex).padStart(3, '0')
    const newCategory = {
      id: `C${padded}`,
      name: name.trim(),
      description: description.trim(),
    }
    MockData.categories.push(newCategory)
    showAlert(`Category "${name.trim()}" added successfully!`, 'success')
  } else {
    // Update existing
    const existing = MockData.categories.find((c) => c.id === categoryId)
    if (existing) {
      existing.name = name.trim()
      existing.description = description.trim()
      showAlert(`Category "${name.trim()}" updated successfully!`, 'success')
    }
  }

  closeCategoryModal()
  loadPageContent('categories') // refresh table/page
}

async function deleteCategory(categoryId) {
  const ok = await showConfirm(
    'Delete this category? This action cannot be undone.',
    'Delete Category'
  )
  if (!ok) return

  // Find the category name before deleting
  const category = MockData.categories.find((c) => c.id === categoryId)
  const categoryName = category ? category.name : 'Category'

  // Delete the category
  MockData.categories = MockData.categories.filter((c) => c.id !== categoryId)

  // Show success toast
  showAlert(`${categoryName} has been successfully deleted`, 'success')

  // Reload the page
  loadPageContent('categories')
}

// -----------------------------//
// Stock In Modal and Functions //
// -----------------------------//

function openStockInModal(mode = 'create', stockId = null) {
  const modal = document.getElementById('stockin-modal')
  const modalContent = modal.querySelector('.modal-content')

  let stockData = null
  if (stockId && mode === 'edit') {
    stockData = stockInData.find((r) => r.id === stockId)
  }

  modalContent.innerHTML = generateStockInModal(mode, stockData)
  modal.classList.add('active')
  lucide.createIcons()

  const isReadOnly = mode === 'view'
  if (!isReadOnly) {
    const qtyInput = document.getElementById('qty-input')
    const ucInput = document.getElementById('uc-input')
    const totalInput = document.getElementById('total-input')
    const skuInput = document.getElementById('sku-input')
    const productInput = document.getElementById('product-input')
    const currentStockBadgeId = 'current-stock-badge'

    // Insert a live current stock badge below product name if not exists
    if (!document.getElementById(currentStockBadgeId)) {
      const badge = document.createElement('div')
      badge.id = currentStockBadgeId
      badge.style.cssText =
        'margin-top:6px;font-size:12px;color:#6b7280;font-weight:500;display:flex;align-items:center;gap:6px;'
      productInput.parentElement.appendChild(badge)
    }
    const stockBadge = document.getElementById(currentStockBadgeId)

    function updateTotal() {
      const q = parseFloat(qtyInput.value) || 0
      const u = parseFloat(ucInput.value) || 0
      totalInput.value = formatCurrency(q * u)
    }

    qtyInput.addEventListener('input', updateTotal)
    ucInput.addEventListener('input', updateTotal)
    updateTotal()

    function autoFillFromSku() {
      const raw = skuInput.value.trim()
      if (!raw) {
        productInput.removeAttribute('readonly')
        stockBadge.textContent = ''
        return
      }
      const prod = (MockData.products || []).find(
        (p) => p.id.toLowerCase() === raw.toLowerCase()
      )
      if (prod) {
        productInput.value = prod.name
        // If existing product and unit cost empty or zero, default to product's unitCost (if present)
        if (!ucInput.value || parseFloat(ucInput.value) === 0) {
          if (typeof prod.unitCost === 'number')
            ucInput.value = prod.unitCost.toFixed(2)
        }
        productInput.setAttribute('readonly', 'readonly')
        stockBadge.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;background:#f3f4f6;padding:4px 8px;border-radius:12px;">Current Stock: <strong>${prod.quantity}</strong></span>`
        updateTotal()
      } else {
        productInput.removeAttribute('readonly')
        stockBadge.textContent = 'SKU not found in products list'
      }
    }
    skuInput.addEventListener('blur', autoFillFromSku)
    skuInput.addEventListener('input', function () {
      // Only trigger when user typed a plausible code pattern (letters+digits length>=2)
      if (skuInput.value.trim().length >= 2) autoFillFromSku()
    })
    autoFillFromSku()
  }
}

function closeStockInModal() {
  const modal = document.getElementById('stockin-modal')
  modal.classList.remove('active')
}

// Enhanced Stock In Modal with modern design
function generateStockInModal(mode = 'create', stockData = null) {
  const title =
    mode === 'create'
      ? 'Stock In Entry'
      : mode === 'edit'
      ? 'Edit Stock In'
      : 'Stock In Details'
  const subtitle =
    mode === 'create'
      ? 'Record incoming inventory'
      : mode === 'edit'
      ? 'Update stock in transaction'
      : 'View stock in details'
  const isReadOnly = mode === 'view'
  const dateValue =
    stockData?.date ||
    (mode === 'create' ? new Date().toISOString().split('T')[0] : '')
  const unitCostValue = (stockData?.unitCost || 0).toFixed(2)
  const totalValue = stockData
    ? formatCurrency(stockData.totalCost || 0)
    : formatCurrency(0)

  return `
        <div class="modal-header" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; border-bottom: none; padding: 32px 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                    <i data-lucide="arrow-down-circle" style="width: 32px; height: 32px; color: white;"></i>
                </div>
                <div style="flex: 1;">
                    <h2 class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">${title}</h2>
                    <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">${subtitle}</p>
                </div>
            </div>
            <button class="modal-close" onclick="closeStockInModal()" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>

        <div class="modal-body" style="padding: 32px 24px; background: #f9fafb;">
            <!-- Transaction Information -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="clipboard-list" style="width: 18px; height: 18px; color: #16a34a;"></i>
                    Transaction Details
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Date
                        </label>
                        <input type="date" class="form-input" id="date-input"
                               value="${dateValue}"
                               min="${new Date().toISOString().split('T')[0]}"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="barcode" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            SKU
                        </label>
                        <input type="text" class="form-input" id="sku-input"
                               value="${stockData?.sku || ''}"
                               placeholder="e.g., E001, SE01, N001"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="package" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Product Name
                    </label>
                    <input type="text" class="form-input" id="product-input"
                           value="${stockData?.productName || ''}"
                           placeholder="Enter product name"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                           ${isReadOnly ? 'readonly' : ''}>
                </div>
            </div>

            <!-- Quantity & Pricing -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="calculator" style="width: 18px; height: 18px; color: #16a34a;"></i>
                    Quantity & Pricing
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="hash" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Quantity
                        </label>
                        <input type="number" class="form-input" id="qty-input"
                               min="1"
                               value="${stockData?.quantity || ''}"
                               placeholder="1"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="tag" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Unit Cost
                        </label>
                        <input type="number" class="form-input" id="uc-input"
                               step="0.01" min="0"
                               value="${unitCostValue}"
                               placeholder="0.00"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="dollar-sign" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Total Cost
                    </label>
                    <input type="text" class="form-input" id="total-input"
                           value="${totalValue}"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; background: #f0fdf4; font-weight: 600; color: #16a34a;"
                           readonly>
                </div>
            </div>

            <!-- Supplier & Receiver -->
            <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="users" style="width: 18px; height: 18px; color: #16a34a;"></i>
                    Supplier & Receiver
                </h3>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="truck" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Supplier
                    </label>
                    <input type="text" class="form-input" id="supplier-input"
                           value="${stockData?.supplier || ''}"
                           placeholder="Enter supplier name"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                           ${isReadOnly ? 'readonly' : ''}>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="user-check" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Received By
                    </label>
                    <input type="text" class="form-input" id="receivedby-input"
                           value="${stockData?.receivedBy || ''}"
                           placeholder="Enter receiver name"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                           ${isReadOnly ? 'readonly' : ''}>
                </div>
            </div>
        </div>

        <div class="modal-footer" style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeStockInModal()" style="padding: 10px 24px; font-weight: 500; border: 2px solid #d1d5db; transition: all 0.2s;">
                <i data-lucide="${
                  isReadOnly ? 'x' : 'arrow-left'
                }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                ${isReadOnly ? 'Close' : 'Cancel'}
            </button>
            ${
              !isReadOnly
                ? `
                <button class="btn btn-primary" onclick="saveStockIn('${
                  stockData?.id || ''
                }')" style="padding: 10px 24px; font-weight: 500; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); box-shadow: 0 4px 6px rgba(22, 163, 74, 0.25); transition: all 0.2s;">
                    <i data-lucide="${
                      mode === 'create' ? 'plus-circle' : 'save'
                    }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                    ${mode === 'create' ? 'Add Stock In' : 'Save Changes'}
                </button>
            `
                : ''
            }
        </div>
    `
}

function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function saveStockIn(stockId) {
  const date = document.getElementById('date-input').value
  const sku = document.getElementById('sku-input').value
  const productName = document.getElementById('product-input').value
  const quantity = parseInt(document.getElementById('qty-input').value) || 0
  const unitCost = parseFloat(document.getElementById('uc-input').value) || 0
  const totalCost = quantity * unitCost
  const supplier = document.getElementById('supplier-input').value
  const receivedBy = document.getElementById('receivedby-input').value

  const newRecord = {
    id: stockId || generateUniqueId(),
    date,
    productName,
    sku,
    quantity,
    unitCost,
    totalCost,
    supplier,
    receivedBy,
  }

  if (stockId) {
    const index = stockInData.findIndex((r) => r.id === stockId)
    if (index !== -1) {
      const oldRecord = { ...stockInData[index] }
      newRecord.transactionId = stockInData[index].transactionId
      stockInData[index] = newRecord
      adjustInventoryOnStockIn(newRecord, oldRecord)
      showAlert(
        `Stock In record ${newRecord.transactionId} updated & inventory adjusted`,
        'success'
      )
    }
  } else {
    newRecord.transactionId = generateTransactionId()
    stockInData.push(newRecord)
    adjustInventoryOnStockIn(newRecord, null)
    showAlert(
      `New Stock In record ${newRecord.transactionId} added & inventory updated`,
      'success'
    )
  }

  persistStockIn()

  console.log('Saving stock-in record:', newRecord)

  closeStockInModal()
  loadPageContent('stock-in') // refresh stock-in page
  refreshProductsViewIfOpen()
}

async function deleteStockIn(id) {
  const ok = await showConfirm(
    'Are you sure you want to delete this stock in record?',
    'Delete Stock In'
  )
  if (!ok) return

  // Find the record before deleting
  const record = stockInData.find((r) => r.id === id)
  const recordInfo = record
    ? `${record.productName} (${record.transactionId})`
    : 'Stock In record'

  // Delete the record & restore inventory (reverse addition)
  if (record) restoreInventoryFromDeletedStockIn(record)
  stockInData = stockInData.filter((r) => r.id !== id)
  persistStockIn()

  showAlert(`${recordInfo} deleted & inventory adjusted`, 'success')

  // Reload the page
  loadPageContent('stock-in')
  refreshProductsViewIfOpen()
}

function renderStockInRows() {
  if (!stockInData || stockInData.length === 0)
    return '<tr><td colspan="10" style="text-align:center; padding:32px 12px; color:#6b7280; font-size:14px; font-style:italic;">No records found</td></tr>'
  return stockInData.map((r, i) => renderStockInRow(r, i)).join('')
}

function renderStockInRow(r, index) {
  return `
        <tr data-id="${r.id}" style="${
    index % 2 === 0 ? 'background-color: white;' : 'background-color: #f9fafb;'
  }">
            <td style="font-weight: 500;">${r.transactionId}</td>
            <td>${r.date}</td>
            <td style="font-weight: 500;">${r.productName}</td>
            <td style="color: #6b7280;">${r.sku}</td>
            <td>${r.quantity}</td>
            <td>${formatCurrency(Number(r.unitCost) || 0)}</td>
            <td style="font-weight: 500;">${formatCurrency(
              Number(r.totalCost) || 0
            )}</td>
            <td style="color: #6b7280;">${r.supplier}</td>
            <td style="color: #6b7280;">${r.receivedBy}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-action-btn icon-action-danger" title="Delete" onclick="deleteStockIn('${
                      r.id
                    }')">
                        <i data-lucide="trash-2"></i>
                    </button>
                    <button class="icon-action-btn icon-action-warning" title="Edit" onclick="openStockInModal('edit','${
                      r.id
                    }')">
                        <i data-lucide="edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
}

function generateTransactionId() {
  const year = new Date().getFullYear()
  const existingNums = stockInData
    .filter((r) => r.transactionId.startsWith(`SI-${year}-`))
    .map((r) => parseInt(r.transactionId.split('-')[2]) || 0)
  const nextNum = Math.max(...existingNums, 0) + 1
  return `SI-${year}-${nextNum.toString().padStart(3, '0')}`
}

// -----------------------------//
// Stock Out Modal and Functions //
// -----------------------------//

function openStockOutModal(mode = 'create', stockId = null) {
  const modal = document.getElementById('stockout-modal')
  const modalContent = modal.querySelector('.modal-content')

  let stockData = null
  if (stockId) {
    // support passing either an id or the full record
    stockData =
      stockOutData.find((r) => r.id === stockId) ||
      (typeof stockId === 'object' ? stockId : null)
  }

  modalContent.innerHTML = generateStockOutModal(mode, stockData)
  modal.classList.add('active')
  lucide.createIcons()

  const isReadOnly = mode === 'view'
  if (!isReadOnly) {
    const qty = modal.querySelector('#so-qty')
    const uc = modal.querySelector('#so-uc')
    const total = modal.querySelector('#so-total')
    const skuInput = modal.querySelector('#so-sku')
    const productInput = modal.querySelector('#so-product')

    // Add a current stock badge under product input
    const badgeId = 'so-current-stock-badge'
    if (productInput && !document.getElementById(badgeId)) {
      const badge = document.createElement('div')
      badge.id = badgeId
      badge.style.cssText =
        'margin-top:6px;font-size:12px;color:#6b7280;font-weight:500;display:flex;align-items:center;gap:6px;'
      productInput.parentElement.appendChild(badge)
    }
    const stockBadge = document.getElementById(badgeId)

    function updateTotal() {
      const q = parseFloat(qty.value) || 0
      const u = parseFloat(uc.value) || 0
      total.value = formatCurrency(q * u)
    }

    if (qty && uc && total) {
      qty.addEventListener('input', updateTotal)
      uc.addEventListener('input', updateTotal)
      updateTotal()
    }

    function autoFillFromSku() {
      if (!skuInput) return
      const raw = skuInput.value.trim()
      if (!raw) {
        productInput && productInput.removeAttribute('readonly')
        if (stockBadge) stockBadge.textContent = ''
        return
      }
      const prod = (MockData.products || []).find(
        (p) => p.id.toLowerCase() === raw.toLowerCase()
      )
      if (prod) {
        if (productInput) {
          productInput.value = prod.name
          productInput.setAttribute('readonly', 'readonly')
        }
        if (uc && (!uc.value || parseFloat(uc.value) === 0)) {
          if (typeof prod.unitCost === 'number')
            uc.value = prod.unitCost.toFixed(2)
        }
        if (stockBadge) {
          stockBadge.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;background:#eef2ff;padding:4px 8px;border-radius:12px;">Available: <strong>${prod.quantity}</strong></span>`
        }
        // Prevent entering quantity greater than available
        if (qty) {
          qty.setAttribute('max', prod.quantity)
          if (parseInt(qty.value) > prod.quantity) qty.value = prod.quantity
        }
        updateTotal()
      } else {
        if (productInput) productInput.removeAttribute('readonly')
        if (stockBadge)
          stockBadge.textContent = 'SKU not found in products list'
        if (qty) qty.removeAttribute('max')
      }
    }
    if (skuInput) {
      skuInput.addEventListener('blur', autoFillFromSku)
      skuInput.addEventListener('input', () => {
        if (skuInput.value.trim().length >= 2) autoFillFromSku()
      })
      autoFillFromSku()
    }
  }
}

function closeStockOutModal() {
  const modal = document.getElementById('stockout-modal')
  modal.classList.remove('active')
}

// Enhanced Stock Out Modal with modern design
function generateStockOutModal(mode = 'create', stockData = null) {
  const title =
    mode === 'create'
      ? 'Stock Out Entry'
      : mode === 'edit'
      ? 'Edit Stock Out'
      : 'Stock Out Details'
  const subtitle =
    mode === 'create'
      ? 'Record outgoing inventory'
      : mode === 'edit'
      ? 'Update stock out transaction'
      : 'View stock out details'
  const isReadOnly = mode === 'view'

  return `
        <div class="modal-header" style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; border-bottom: none; padding: 32px 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                    <i data-lucide="arrow-up-circle" style="width: 32px; height: 32px; color: white;"></i>
                </div>
                <div style="flex: 1;">
                    <h2 class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">${title}</h2>
                    <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">${subtitle}</p>
                </div>
            </div>
            <button class="modal-close" onclick="closeStockOutModal()" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>

        <div class="modal-body" style="padding: 32px 24px; background: #f9fafb;">
            <!-- Transaction Information -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="clipboard-list" style="width: 18px; height: 18px; color: #ea580c;"></i>
                    Transaction Details
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Date
                        </label>
                        <input id="so-date" type="date" class="form-input"
                               value="${
                                 stockData?.date ||
                                 new Date().toISOString().split('T')[0]
                               }"
                               min="${new Date().toISOString().split('T')[0]}"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="barcode" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            SKU
                        </label>
                        <input id="so-sku" type="text" class="form-input"
                               value="${stockData?.sku || ''}"
                               placeholder="e.g., E001, SE01, N001"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="package" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Product Name
                    </label>
                    <input id="so-product" type="text" class="form-input"
                           value="${stockData?.productName || ''}"
                           placeholder="Enter product name"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                           ${isReadOnly ? 'readonly' : ''}>
                </div>
            </div>

            <!-- Quantity & Pricing -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="calculator" style="width: 18px; height: 18px; color: #ea580c;"></i>
                    Quantity & Pricing
                </h3>
                
                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="hash" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Quantity
                        </label>
                        <input id="so-qty" type="number" class="form-input"
                               min="1"
                               value="${stockData?.quantity || ''}"
                               placeholder="1"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="tag" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Unit Cost
                        </label>
                        <input id="so-uc" type="number" class="form-input"
                               step="0.01" min="0"
                               value="${stockData?.unitCost || ''}"
                               placeholder="0.00"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="dollar-sign" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Total Cost
                    </label>
                    <input id="so-total" type="text" class="form-input"
                           value="${
                             stockData
                               ? formatCurrency(stockData.totalCost || 0)
                               : '₱0.00'
                           }"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; background: #fff7ed; font-weight: 600; color: #ea580c;"
                           readonly>
                </div>
            </div>

            <!-- Department & Personnel -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="building" style="width: 18px; height: 18px; color: #ea580c;"></i>
                    Department & Personnel
                </h3>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="building-2" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Department
                    </label>
                    <input id="so-dept" type="text" class="form-input"
                           value="${stockData?.department || ''}"
                           placeholder="Enter department name"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                           ${isReadOnly ? 'readonly' : ''}>
                </div>

                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="user" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Issued To
                        </label>
                        <input id="so-issued-to" type="text" class="form-input"
                               value="${stockData?.issuedTo || ''}"
                               placeholder="Employee / Person"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="user-check" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Issued By
                        </label>
                        <input id="so-issued-by" type="text" class="form-input"
                               value="${stockData?.issuedBy || ''}"
                               placeholder="Staff / Officer"
                               style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                               ${isReadOnly ? 'readonly' : ''}>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="activity" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Status
                    </label>
                    <select id="so-status" class="form-select" ${
                      isReadOnly ? 'disabled' : ''
                    } style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s; ${
    isReadOnly ? 'background: #f9fafb;' : ''
  }">
                        <option value="">Select status</option>
                        <option value="Completed" ${
                          stockData?.status === 'Completed' ? 'selected' : ''
                        }>Completed</option>
                        <option value="Pending" ${
                          stockData?.status === 'Pending' ? 'selected' : ''
                        }>Pending</option>
                        <option value="Cancelled" ${
                          stockData?.status === 'Cancelled' ? 'selected' : ''
                        }>Cancelled</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="modal-footer" style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeStockOutModal()" style="padding: 10px 24px; font-weight: 500; border: 2px solid #d1d5db; transition: all 0.2s;">
                <i data-lucide="${
                  isReadOnly ? 'x' : 'arrow-left'
                }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                ${isReadOnly ? 'Close' : 'Cancel'}
            </button>
            ${
              !isReadOnly
                ? `
                <button class="btn btn-primary" onclick="saveStockOut('${
                  stockData?.id || ''
                }')" style="padding: 10px 24px; font-weight: 500; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); box-shadow: 0 4px 6px rgba(234, 88, 12, 0.25); transition: all 0.2s;">
                    <i data-lucide="${
                      mode === 'create' ? 'plus-circle' : 'save'
                    }" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                    ${mode === 'create' ? 'Add Stock Out' : 'Save Changes'}
                </button>
            `
                : ''
            }
        </div>
    `
}

function saveStockOut(stockId) {
  // Read inputs by ID
  const date = document.getElementById('so-date')
    ? document.getElementById('so-date').value
    : document.querySelector('#stockout-modal input[type="date"]')?.value || ''
  const sku = document.getElementById('so-sku')
    ? document.getElementById('so-sku').value
    : document.querySelector('#stockout-modal input[placeholder="E002"]')
        ?.value || ''
  const productName = document.getElementById('so-product')
    ? document.getElementById('so-product').value
    : document.querySelector(
        '#stockout-modal input[placeholder="Enter product name"]'
      )?.value || ''
  const quantity = parseInt(document.getElementById('so-qty').value) || 0
  const unitCost = parseFloat(document.getElementById('so-uc').value) || 0
  const totalCost = quantity * unitCost
  const department = document.getElementById('so-dept').value || ''
  const issuedTo = document.getElementById('so-issued-to').value || ''
  const issuedBy = document.getElementById('so-issued-by').value || ''
  const status = document.getElementById('so-status').value || ''

  const record = {
    id: stockId || generateUniqueId(),
    issueId: stockId
      ? stockOutData.find((s) => s.id === stockId)?.issueId ||
        generateStockOutIssueId()
      : generateStockOutIssueId(),
    date,
    productName,
    sku,
    quantity,
    unitCost,
    totalCost,
    department,
    issuedTo,
    issuedBy,
    status,
  }

  // Inventory validation & adjustment
  const product = findProductBySku(record.sku)
  if (!product) {
    showAlert('Product not found in inventory list for this SKU.', 'error')
    return
  }
  if (stockId) {
    const idx = stockOutData.findIndex((s) => s.id === stockId)
    if (idx !== -1) {
      const oldRecord = { ...stockOutData[idx] }
      const prevIssued = Number(oldRecord.quantity) || 0
      const newIssued = Number(record.quantity) || 0
      const delta = newIssued - prevIssued // additional quantity to subtract
      if (delta > 0 && product.quantity < delta) {
        showAlert('Insufficient stock for the additional quantity.', 'error')
        // Notify new stock in
        try {
          const title = `Stock In: ${newRecord.transactionId}`
          const msg = `Received ${newRecord.quantity} ${newRecord.productName}`
          if (typeof createNotification === 'function') {
            createNotification({
              title,
              message: msg,
              type: 'success',
              icon: 'package-check',
            })
          } else {
            addNotification(title, msg, 'success', 'package-check')
          }
        } catch (e) {}
        return
      }
      stockOutData[idx] = record
      adjustInventoryOnStockOut(record, oldRecord)
      showAlert(
        `Stock Out record ${record.issueId} updated & inventory adjusted`,
        'success'
      )
    } else {
      if (product.quantity < record.quantity) {
        showAlert('Insufficient stock for this issuance.', 'error')
        return
      }
      stockOutData.push(record)
      adjustInventoryOnStockOut(record, null)
      showAlert(
        `New Stock Out record ${record.issueId} added & inventory updated`,
        'success'
      )
    }
  } else {
    if (product.quantity < record.quantity) {
      showAlert('Insufficient stock for this issuance.', 'error')
      return
    }
    stockOutData.push(record)
    adjustInventoryOnStockOut(record, null)
    showAlert(
      `New Stock Out record ${record.issueId} added & inventory updated`,
      'success'
    )
  }

  persistStockOut()

  // Update DOM if Stock Out table is present to avoid full page reload
  const tbody = document.getElementById('stock-out-table-body')
  if (tbody) {
    const existingRow = tbody.querySelector(`tr[data-id="${record.id}"]`)
    if (existingRow) {
      // replace existing row
      existingRow.outerHTML = renderStockOutRow(record)
    } else {
      // append new row
      tbody.insertAdjacentHTML('beforeend', renderStockOutRow(record))
    }
    // re-render icons in new content
    if (window.lucide) lucide.createIcons()
  } else {
    // If tbody not present (different view), reload the Stock Out page to reflect changes
    loadPageContent('stock-out')
  }
  closeStockOutModal()
  refreshProductsViewIfOpen()
}

// In-memory stock-out records (initialize from MockData if available)
if (!Array.isArray(stockOutData) || stockOutData.length === 0) {
  stockOutData =
    window.MockData && Array.isArray(window.MockData.stockOut)
      ? window.MockData.stockOut.slice()
      : []
}

function renderStockOutRows() {
  if (!stockOutData || stockOutData.length === 0)
    return '<tr><td colspan="12" style="text-align:center; padding:32px 12px; color:#6b7280; font-size:14px; font-style:italic;">No records found</td></tr>'
  return stockOutData.map((s) => renderStockOutRow(s)).join('')
}

function renderStockOutRow(s) {
  return `
        <tr data-id="${s.id}">
            <td class="font-semibold">${s.issueId}</td>
            <td>${s.date}</td>
            <td>${s.productName}</td>
            <td class="text-sm text-gray-600">${s.sku}</td>
            <td>${s.quantity}</td>
            <td>${formatCurrency(Number(s.unitCost) || 0)}</td>
            <td class="font-semibold">${formatCurrency(
              Number(s.totalCost) || 0
            )}</td>
            <td><span class="badge">${s.department}</span></td>
            <td>${s.issuedTo}</td>
            <td>${s.issuedBy}</td>
            <td><span class="badge ${
              s.status === 'Completed'
                ? 'green'
                : s.status === 'Pending'
                ? 'yellow'
                : s.status === 'Cancelled'
                ? 'red'
                : ''
            }">${s.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="icon-action-btn" title="View" onclick="viewStockOutDetails('${
                      s.id
                    }')">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="icon-action-btn icon-action-warning" title="Edit" onclick="editStockOut('${
                      s.id
                    }')">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="icon-action-btn icon-action-danger" title="Delete" onclick="deleteStockOut('${
                      s.id
                    }')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
}

async function deleteStockOut(id) {
  const ok = await showConfirm(
    'Delete this stock-out record?',
    'Delete Stock Out'
  )
  if (!ok) return

  // Find the record before deleting
  const record = stockOutData.find((s) => s.id === id)
  const recordInfo = record
    ? `${record.productName} (${record.transactionId})`
    : 'Stock Out record'

  // Delete the record
  stockOutData = stockOutData.filter((s) => s.id !== id)
  persistStockOut()

  // Show success toast
  showAlert(`${recordInfo} has been successfully deleted`, 'success')

  // Reload the page
  loadPageContent('stock-out')
}

function viewStockOutDetails(id) {
  const rec = stockOutData.find((s) => s.id === id)
  if (!rec) {
    showAlert('Record not found', 'error')
    return
  }
  openStockOutModal('view', rec)
}

function editStockOut(id) {
  const rec = stockOutData.find((s) => s.id === id)
  if (!rec) {
    showAlert('Record not found', 'error')
    return
  }
  openStockOutModal('edit', rec)
}

function generateStockOutIssueId() {
  const year = new Date().getFullYear()
  const existing = stockOutData
    .filter((r) => r.issueId && r.issueId.startsWith(`SO-${year}-`))
    .map((r) => parseInt(r.issueId.split('-')[2]) || 0)
  const next = Math.max(...existing, 0) + 1
  return `SO-${year}-${String(next).padStart(3, '0')}`
}

// ===== STATUS MANAGEMENT =====
function initStatusManagement(filter = 'all') {
  const mainContent = document.getElementById('main-content')
  if (!mainContent) return
  AppState.currentStatusFilter = filter

  // Load latest user requests from localStorage
  loadUserRequests()

  // ✅ Render UI
  mainContent.innerHTML = `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="list-checks" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Status Management
                    </h1>
                    <p class="page-subtitle">Track and manage request statuses across all departments</p>
                </div>
                <div class="header-actions">
                    <button class="btn btn-secondary" id="export-status-btn">
                        <i data-lucide="download" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>
                        Export CSV
                    </button>
                </div>
            </div>
        </div>

        <div class="page-content">
            <div class="status-container">
                <!-- Cards -->
                <div class="status-cards">
                    <div class="status-card incoming" data-status="incoming">
                        <h3>Incoming</h3>
                        <div class="count" data-count="incoming">0</div>
                        <p>New requests received</p>
                    </div>
                    <div class="status-card received" data-status="received">
                        <h3>Received</h3>
                        <div class="count" data-count="received">0</div>
                        <p>Awaiting processing</p>
                    </div>
                    <div class="status-card finished" data-status="finished">
                        <h3>Finished</h3>
                        <div class="count" data-count="finished">0</div>
                        <p>Successfully completed</p>
                    </div>
                    <div class="status-card cancelled" data-status="cancelled">
                        <h3>Cancelled</h3>
                        <div class="count" data-count="cancelled">0</div>
                        <p>Request withdrawn</p>
                    </div>
                    <div class="status-card rejected" data-status="rejected">
                        <h3>Rejected</h3>
                        <div class="count" data-count="rejected">0</div>
                        <p>Request denied</p>
                    </div>
                    <div class="status-card returned" data-status="returned">
                        <h3>Returned</h3>
                        <div class="count" data-count="returned">0</div>
                        <p>Items sent back</p>
                    </div>
                </div>

                <!-- Filters -->
            <div class="filters">
                <input type="text" id="searchInput" placeholder="Search by Requester, ID, or Item">
                <input type="text" id="deptInput" placeholder="Filter by Department">
                <select id="deptSelect">
                    <option>All Department</option>
                    <option>IT Department</option>
                    <option>HR Department</option>
                    <option>Finance Department</option>
                    <option>Marketing Department</option>
                    <option>Operations</option>
                </select>
                <select id="prioritySelect">
                    <option>Filter by Priority</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                </select>
      </div>

            <!-- Table -->
            <table class="request-table">
                <thead>
                    <tr>
                        <th>Request ID</th>
                        <th>Requester</th>
                        <th>Department</th>
                        <th>Item</th>
                        <th>Priority</th>
                        <th>Date Updated</th>
                        <th>Action</th>
                        <th>Cost</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody id="status-table-body">
                    ${renderStatusRows(filter)}
                </tbody>
            </table>
            </div>
        </div>
    `

  // ===== Attach Filter Events =====
  document.getElementById('searchInput').addEventListener('input', applyFilters)
  document.getElementById('deptInput').addEventListener('input', applyFilters)
  document.getElementById('deptSelect').addEventListener('change', applyFilters)
  document
    .getElementById('prioritySelect')
    .addEventListener('change', applyFilters)
  // Export handler (same behavior as Reports export)
  document
    .getElementById('export-status-btn')
    ?.addEventListener('click', exportStatusCSV)

  refreshStatusCards()
}

function refreshStatusCards() {
  const counts = (AppState.statusRequests || []).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})
  ;[
    'incoming',
    'received',
    'finished',
    'cancelled',
    'rejected',
    'returned',
  ].forEach((s) => {
    const el = document.querySelector(`.status-card .count[data-count="${s}"]`)
    if (el) el.textContent = counts[s] || 0
  })
}

// ===== Dummy Rows =====
function renderStatusRows(status) {
  const list = (AppState.statusRequests || []).filter((r) =>
    status === 'all' ? true : r.status === status
  )
  if (!list.length)
    return `<tr><td colspan="9" style="text-align:center;padding:16px;color:#6b7280;">No records</td></tr>`
  const html = list
    .map((r) => {
      const priorityColor =
        r.priority === 'high'
          ? 'red'
          : r.priority === 'medium'
          ? 'orange'
          : 'green'
      const showActions = r.status === 'incoming' || r.status === 'received'
      const actionsHtml = showActions
        ? `
            <div class="table-actions" style="flex-wrap:wrap;">
                <button class="icon-action-btn" title="View Details" onclick="viewStatusRequest('${
                  r.id
                }')">
                    <i data-lucide="eye"></i>
                </button>
                ${
                  r.status === 'incoming'
                    ? `
                    <button class="icon-action-btn icon-action-primary" title="Mark as Received" onclick="updateStatusRow('${r.id}','received')">
                        <i data-lucide="inbox"></i>
                    </button>
                `
                    : ''
                }
                <button class="icon-action-btn icon-action-danger" title="Reject" onclick="updateStatusRow('${
                  r.id
                }','rejected')">
                    <i data-lucide="x-circle"></i>
                </button>
                <button class="icon-action-btn icon-action-warning" title="Cancel" onclick="updateStatusRow('${
                  r.id
                }','cancelled')">
                    <i data-lucide="ban"></i>
                </button>
                <button class="icon-action-btn icon-action-info" title="Return" onclick="showReturnModal('${
                  r.id
                }')">
                    <i data-lucide="undo-2"></i>
                </button>
                ${
                  r.status !== 'incoming'
                    ? `
                    <button class="icon-action-btn icon-action-success" title="Complete" onclick="updateStatusRow('${r.id}','finished')">
                        <i data-lucide="check-circle"></i>
                    </button>
                `
                    : ''
                }
            </div>`
        : `<span class="${getBadgeClass(
            r.status
          )}"><i data-lucide="badge-check" style="width:14px;height:14px;"></i>${
            r.status.charAt(0).toUpperCase() + r.status.slice(1)
          }</span>`

      // Generate remarks HTML
      let remarksHtml = '-'
      if (r.returnRemarks && r.returnRemarks.length > 0) {
        const remarksList = r.returnRemarks
          .map((remark) => `<li style="margin: 2px 0;">${remark}</li>`)
          .join('')
        remarksHtml = `
                <div style="max-width: 250px;">
                    <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #374151; line-height: 1.5;">
                        ${remarksList}
                    </ul>
                </div>`
      }

      return `
            <tr data-request-id="${r.id}">
                <td>
                    ${r.id}
                    ${
                      r.source === 'user-form'
                        ? '<span class="badge blue" style="font-size:10px;margin-left:4px;" title="Submitted via User Request Form"><i data-lucide="user" style="width:10px;height:10px;"></i>User</span>'
                        : ''
                    }
                </td>
                <td>${r.requester}</td>
                <td>${r.department}</td>
                <td>${r.item}</td>
                <td><span style="color:${priorityColor};font-weight:bold;">${
        r.priority.charAt(0).toUpperCase() + r.priority.slice(1)
      }</span></td>
                <td>${r.updatedAt}</td>
                <td>${actionsHtml}</td>
                <td>${formatCurrency(r.cost || 0)}</td>
                <td>${remarksHtml}</td>
        </tr>`
    })
    .join('')
  // Defer icon init until injected into DOM (caller will set innerHTML, then we init here with a microtask)
  queueMicrotask(() => {
    try {
      lucide.createIcons()
    } catch (e) {}
  })
  return html
}

// ===== Apply Filters =====
function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase()
  const deptText = document.getElementById('deptInput').value.toLowerCase()
  const deptSelect = document.getElementById('deptSelect').value.toLowerCase()
  const priority = document.getElementById('prioritySelect').value.toLowerCase()

  const rows = document.querySelectorAll('#status-table-body tr')
  rows.forEach((row) => {
    const text = row.innerText.toLowerCase()
    const department = row.cells[2].innerText.toLowerCase()
    const rowPriority = row.cells[4].innerText.toLowerCase()

    let match = true
    if (search && !text.includes(search)) match = false
    if (deptText && !department.includes(deptText)) match = false
    if (deptSelect !== 'all department' && !department.includes(deptSelect))
      match = false
    if (priority !== 'filter by priority' && !rowPriority.includes(priority))
      match = false

    row.style.display = match ? '' : 'none'
  })
}

// ===== Return Modal with Remarks =====
function showReturnModal(requestId) {
  const rec = (AppState.statusRequests || []).find((r) => r.id === requestId)
  if (!rec) {
    showAlert('Request not found', 'error')
    return
  }

  let modal = document.getElementById('return-remarks-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'return-remarks-modal'
    document.body.appendChild(modal)
  }

  modal.className = 'modal-overlay active'
  modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; padding: 0; border-radius: 12px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 24px; color: white;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="undo-2" style="width: 24px; height: 24px;"></i>
                    Return Request
                </h2>
                <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Request ID: ${requestId}</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 24px;">
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">
                    Please select the reason(s) for returning this request:
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <label style="display: flex; align-items: start; gap: 12px; padding: 12px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                           onmouseover="this.style.background='#fef3c7'; this.style.borderColor='#f59e0b';"
                           onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb';">
                        <input type="checkbox" class="return-reason" value="Incomplete Documentation" 
                               style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: #f97316;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: #111827;">Incomplete Documentation</div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Missing required forms or attachments</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: start; gap: 12px; padding: 12px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                           onmouseover="this.style.background='#fef3c7'; this.style.borderColor='#f59e0b';"
                           onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb';">
                        <input type="checkbox" class="return-reason" value="Incorrect Information" 
                               style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: #f97316;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: #111827;">Incorrect Information</div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Details need to be corrected</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: start; gap: 12px; padding: 12px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                           onmouseover="this.style.background='#fef3c7'; this.style.borderColor='#f59e0b';"
                           onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb';">
                        <input type="checkbox" class="return-reason" value="Budget Not Available" 
                               style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: #f97316;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: #111827;">Budget Not Available</div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Insufficient funds for this request</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: start; gap: 12px; padding: 12px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                           onmouseover="this.style.background='#fef3c7'; this.style.borderColor='#f59e0b';"
                           onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb';">
                        <input type="checkbox" class="return-reason" value="Need Additional Approval" 
                               style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: #f97316;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: #111827;">Need Additional Approval</div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Requires higher authority approval</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: start; gap: 12px; padding: 12px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                           onmouseover="this.style.background='#fef3c7'; this.style.borderColor='#f59e0b';"
                           onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb';">
                        <input type="checkbox" class="return-reason" value="Item Not Available" 
                               style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: #f97316;">
                        <div>
                            <div style="font-size: 14px; font-weight: 500; color: #111827;">Item Not Available</div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Requested items are out of stock</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: start; gap: 12px; padding: 12px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                           onmouseover="this.style.background='#fef3c7'; this.style.borderColor='#f59e0b';"
                           onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb';">
                        <input type="checkbox" id="other-reasons-checkbox" class="return-reason" value="Other Reasons" 
                               onchange="toggleOtherReasonsInput()"
                               style="width: 18px; height: 18px; margin-top: 2px; cursor: pointer; accent-color: #f97316;">
                        <div style="flex: 1;">
                            <div style="font-size: 14px; font-weight: 500; color: #111827;">Other Reasons</div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Other reasons for returning</div>
                        </div>
                    </label>
                </div>
                
                <!-- Text input for "Other Reasons" - Initially hidden -->
                <div id="other-reasons-input-container" style="display: none; margin-top: 12px;">
                    <textarea id="other-reasons-text" 
                              placeholder="Please specify the reason..." 
                              rows="3"
                              style="width: 100%; padding: 12px; border: 2px solid #f97316; border-radius: 8px; font-size: 14px; font-family: inherit; resize: vertical; outline: none; transition: all 0.2s;"
                              onfocus="this.style.borderColor='#ea580c'; this.style.boxShadow='0 0 0 3px rgba(249, 115, 22, 0.1)';"
                              onblur="this.style.borderColor='#f97316'; this.style.boxShadow='none';"></textarea>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="padding: 16px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="closeReturnModal()" 
                        style="padding: 10px 20px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s;"
                        onmouseover="this.style.background='#f3f4f6';"
                        onmouseout="this.style.background='white';">
                    Cancel
                </button>
                <button onclick="confirmReturn('${requestId}')" 
                        style="padding: 10px 20px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; border: none; border-radius: 8px; font-weight: 500; cursor: pointer; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.25); transition: all 0.2s;"
                        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 6px rgba(249, 115, 22, 0.3)';"
                        onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 4px rgba(249, 115, 22, 0.25)';">
                    <i data-lucide="check" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i>
                    Confirm Return
                </button>
            </div>
        </div>
    `

  // Initialize icons
  try {
    lucide.createIcons()
  } catch (e) {}
  // Ensure the checkbox uses a proper listener (avoid depending on inline/global handlers)
  // Use a microtask so the injected HTML is parsed and elements are available
  queueMicrotask(() => {
    const otherCheckbox =
      document.getElementById('other-reasons-checkbox') ||
      document.querySelector('#return-remarks-modal #other-reasons-checkbox')
    if (otherCheckbox) {
      // Make sure we don't attach duplicate listeners
      otherCheckbox.removeEventListener('change', toggleOtherReasonsInput)
      otherCheckbox.addEventListener('change', toggleOtherReasonsInput)
    }
  })
}

function toggleOtherReasonsInput() {
  const checkbox = document.getElementById('other-reasons-checkbox')
  const inputContainer = document.getElementById(
    'other-reasons-input-container'
  )
  const textInput = document.getElementById('other-reasons-text')

  if (checkbox && inputContainer) {
    if (checkbox.checked) {
      inputContainer.style.display = 'block'
      // Focus on the textarea
      setTimeout(() => textInput?.focus(), 100)
    } else {
      inputContainer.style.display = 'none'
      // Clear the text when unchecked
      if (textInput) textInput.value = ''
    }
  }
}

// Ensure inline onchange handlers can call this even if the script is loaded as a module
window.toggleOtherReasonsInput = toggleOtherReasonsInput

function closeReturnModal() {
  const modal = document.getElementById('return-remarks-modal')
  if (modal) {
    modal.className = 'modal-overlay'
    setTimeout(() => modal.remove(), 300)
  }
}

function confirmReturn(requestId) {
  // Get selected reasons
  const checkboxes = document.querySelectorAll('.return-reason:checked')
  const reasons = Array.from(checkboxes).map((cb) => cb.value)

  if (reasons.length === 0) {
    showAlert('Please select at least one reason for returning', 'error')
    return
  }

  // Check if "Other Reasons" is selected and get the specific text
  const otherCheckbox = document.getElementById('other-reasons-checkbox')
  const otherText = document.getElementById('other-reasons-text')

  if (otherCheckbox && otherCheckbox.checked) {
    const specificReason = otherText?.value.trim()
    if (!specificReason) {
      showAlert('Please specify the reason for "Other Reasons"', 'error')
      return
    }
    // Replace "Other Reasons" with the specific text
    const index = reasons.indexOf('Other Reasons')
    if (index !== -1) {
      reasons[index] = `Other: ${specificReason}`
    }
  }

  // Update the request with return status and remarks
  const rec = (AppState.statusRequests || []).find((r) => r.id === requestId)
  if (rec) {
    rec.status = 'returned'
    rec.returnRemarks = reasons
    rec.updatedAt = new Date().toISOString().split('T')[0]
  }

  // Close modal
  closeReturnModal()

  // Re-render table
  const body = document.getElementById('status-table-body')
  if (body)
    body.innerHTML = renderStatusRows(AppState.currentStatusFilter || 'all')
  try {
    lucide.createIcons()
  } catch (e) {}

  // Update counts
  refreshStatusCards()

  // Show success message
  const remarksText = reasons.join(', ')
  showAlert(`Request ${requestId} returned. Reasons: ${remarksText}`, 'success')
  try {
    if (typeof saveStatusRequests === 'function') saveStatusRequests()
  } catch (e) {}
}

// ===== Update Row Status (for Received actions) =====
function updateStatusRow(requestId, newStatus) {
  try {
    const rec = (AppState.statusRequests || []).find((r) => r.id === requestId)
    if (!rec) {
      showAlert('Row not found', 'error')
      return
    }
    rec.status = newStatus
    rec.updatedAt = new Date().toISOString().split('T')[0]
    // Re-render current filter view
    const body = document.getElementById('status-table-body')
    if (body)
      body.innerHTML = renderStatusRows(AppState.currentStatusFilter || 'all')
    // icons already re-init inside renderStatusRows; safeguard:
    try {
      lucide.createIcons()
    } catch (e) {}
    // Update counts on cards
    refreshStatusCards()
    const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
    showAlert(`Request ${requestId} marked as ${statusLabel}`, 'success')
    // Notify status change
    try {
      const title = `Request ${requestId} ${statusLabel}`
      const message = `Status changed to ${statusLabel} for request ${requestId}`
      if (typeof createNotification === 'function') {
        createNotification({ title, message, type: 'info', icon: 'clock' })
      } else {
        addNotification(title, message, 'info', 'clock')
      }
    } catch (e) {}
    try {
      if (typeof saveStatusRequests === 'function') saveStatusRequests()
    } catch (err) {}
  } catch (e) {
    console.error(e)
  }
}

// Lightweight viewer for status management entries
function viewStatusRequest(id) {
  const rec = (AppState.statusRequests || []).find((r) => r.id === id)
  if (!rec) {
    showAlert('Request not found', 'error')
    return
  }
  let overlay = document.getElementById('status-view-modal')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'status-view-modal'
    overlay.className = 'modal-overlay active'
    overlay.innerHTML = `
            <div class="modal-content compact" role="dialog" aria-modal="true" aria-labelledby="status-view-title">
                <div class="modal-header" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; border-bottom: none; padding: 32px 24px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                            <i data-lucide="eye" style="width: 32px; height: 32px; color: white;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h2 id="status-view-title" class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">Request ${rec.id}</h2>
                            <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">Quick status overview</p>
                        </div>
                    </div>
                    <button class="modal-close" id="status-view-close" aria-label="Close" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 32px 24px; background: #f9fafb;">
                    <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="info" style="width: 18px; height: 18px; color: #2563eb;"></i>
                            Request Details
                        </h3>
                        <dl class="detail-grid" id="status-view-body" style="display: grid; grid-template-columns: 140px 1fr; gap: 16px 24px; margin: 0;"></dl>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn btn-secondary" id="status-view-dismiss" style="padding: 10px 24px; font-weight: 500; border-radius: 8px; transition: all 0.2s;">
                        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                        Close
                    </button>
                </div>
            </div>`
    document.body.appendChild(overlay)
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeStatusView()
    })
    // Esc key handler
    document.addEventListener('keydown', escHandler)
  } else {
    overlay.classList.add('active')
  }
  const grid = overlay.querySelector('#status-view-body')
  if (grid) {
    grid.innerHTML = `
            <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="package" style="width: 14px; height: 14px; color: #6b7280;"></i>
                Item
            </dt>
            <dd style="margin: 0; color: #111827;">${rec.item}</dd>
            
            <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="user" style="width: 14px; height: 14px; color: #6b7280;"></i>
                Requester
            </dt>
            <dd style="margin: 0; color: #111827;">${rec.requester}</dd>
            
            ${
              rec.email
                ? `
                <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="mail" style="width: 14px; height: 14px; color: #6b7280;"></i>
                    Email
                </dt>
                <dd style="margin: 0; color: #111827;">${rec.email}</dd>
            `
                : ''
            }
            
            <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="briefcase" style="width: 14px; height: 14px; color: #6b7280;"></i>
                Department
            </dt>
            <dd style="margin: 0; color: #111827;">${rec.department}</dd>
            
            ${
              rec.unit
                ? `
                <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="building" style="width: 14px; height: 14px; color: #6b7280;"></i>
                    Unit
                </dt>
                <dd style="margin: 0; color: #111827;">${rec.unit}</dd>
            `
                : ''
            }
            
            <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="flag" style="width: 14px; height: 14px; color: #6b7280;"></i>
                Priority
            </dt>
            <dd style="margin: 0;"><span class="badge ${getBadgeClass(
              rec.priority,
              'priority'
            )
              .split(' ')
              .slice(
                -1
              )} inline" style="padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">${
      rec.priority
    }</span></dd>
            
            <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="activity" style="width: 14px; height: 14px; color: #6b7280;"></i>
                Status
            </dt>
            <dd style="margin: 0;"><span class="${getBadgeClass(
              rec.status
            )} inline" style="padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">${
      rec.status
    }</span></dd>
            
            ${
              rec.neededDate
                ? `
                <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="clock" style="width: 14px; height: 14px; color: #6b7280;"></i>
                    Needed By
                </dt>
                <dd style="margin: 0; color: #111827;">${rec.neededDate}</dd>
            `
                : ''
            }
            
            <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="calendar" style="width: 14px; height: 14px; color: #6b7280;"></i>
                Updated
            </dt>
            <dd style="margin: 0; color: #111827;">${rec.updatedAt}</dd>
            
            <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="dollar-sign" style="width: 14px; height: 14px; color: #6b7280;"></i>
                Est. Cost
            </dt>
            <dd style="margin: 0; color: #16a34a; font-weight: 600; font-size: 15px;">${formatCurrency(
              rec.cost || 0
            )}</dd>
            
            ${
              rec.source === 'user-form'
                ? `
                <dt style="font-weight: 600; color: #374151; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="info" style="width: 14px; height: 14px; color: #6b7280;"></i>
                    Source
                </dt>
                <dd style="margin: 0;"><span class="badge blue inline" style="padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">User Request Form</span></dd>
            `
                : ''
            }
        `
  }
  // Icon refresh
  try {
    lucide.createIcons()
  } catch (e) {}
  overlay.querySelector('#status-view-close').onclick = closeStatusView
  overlay.querySelector('#status-view-dismiss').onclick = closeStatusView
  function escHandler(ev) {
    if (ev.key === 'Escape') {
      closeStatusView()
    }
  }
  function closeStatusView() {
    overlay.classList.remove('active')
    setTimeout(() => {
      if (overlay) overlay.remove()
    }, 150)
    document.removeEventListener('keydown', escHandler)
  }
}
window.viewStatusRequest = viewStatusRequest

// View status request details (for status reports)
function viewStatusRequestDetails(requestId) {
  const rec = (AppState.statusRequests || []).find((r) => r.id === requestId)
  if (!rec) {
    showAlert('Request not found', 'error')
    return
  }

  const modal = document.getElementById('purchase-order-modal')
  const modalContent = modal.querySelector('.modal-content')

  modalContent.innerHTML = `
        <div class="modal-header">
            <h2 class="modal-title">Request Details: ${rec.id}</h2>
            <button class="modal-close" onclick="closePurchaseOrderModal()">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="grid-2" style="gap: 20px;">
                <div class="form-group">
                    <label class="form-label">Request ID</label>
                    <input type="text" class="form-input" value="${
                      rec.id
                    }" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <span class="${getBadgeClass(
                      rec.status
                    )}" style="display: inline-block; margin-top: 8px;">${capitalize(
    rec.status
  )}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Requester</label>
                    <input type="text" class="form-input" value="${
                      rec.requester || ''
                    }" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Department</label>
                    <input type="text" class="form-input" value="${
                      rec.department || ''
                    }" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Item</label>
                    <input type="text" class="form-input" value="${
                      rec.item || ''
                    }" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <span class="${getBadgeClass(
                      rec.priority || 'low',
                      'priority'
                    )}" style="display: inline-block; margin-top: 8px;">${capitalize(
    rec.priority || 'low'
  )}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Cost</label>
                    <input type="text" class="form-input" value="${
                      rec.cost ? formatCurrency(rec.cost) : 'N/A'
                    }" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Updated At</label>
                    <input type="text" class="form-input" value="${
                      rec.updatedAt || 'N/A'
                    }" readonly>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closePurchaseOrderModal()">Close</button>
        </div>
    `

  modal.classList.add('active')
  setTimeout(() => lucide.createIcons(), 100)
}

// Make functions globally accessible
window.viewStatusRequestDetails = viewStatusRequestDetails

// Toggle function for Date of Delivery "Others" option in wizard
function toggleDeliveryDateOther(selectElement) {
  const otherInput = document.getElementById('po-delivery-date-other')
  if (otherInput) {
    if (selectElement.value === 'others') {
      otherInput.style.display = 'block'
      otherInput.focus()
    } else {
      otherInput.style.display = 'none'
      otherInput.value = ''
    }
  }
}
window.toggleDeliveryDateOther = toggleDeliveryDateOther

// Toggle function for Date of Delivery "Others" option in regular modal
function toggleDeliveryDateOtherModal(selectElement) {
  const otherInput = document.getElementById('deliveryDateOther')
  if (otherInput) {
    if (selectElement.value === 'others') {
      otherInput.style.display = 'block'
      otherInput.focus()
    } else {
      otherInput.style.display = 'none'
      otherInput.value = ''
    }
  }
}
window.toggleDeliveryDateOtherModal = toggleDeliveryDateOtherModal

// Sidebar and status behavior is handled centrally by the navigation initialization
// (initializeNavigation, toggleNavGroup, navigateToPage and loadPageContent).
// The earlier status-only DOMContentLoaded handler was removed to avoid duplicate listeners.

// Expose frequently used actions for inline handlers and legacy markup
const exposedFunctions = {
  toggleSidebar,
  toggleNotifications,
  closeNotifications,
  viewAllNotifications,
  markAllNotificationsRead,
  clearAllNotifications,
  toggleNotificationRead,
  markNotificationAsRead,
  // New notification APIs (ensure backward compatibility if redefined)
  createNotification,
  loadNotifications,
  saveNotifications,
  updateNotificationBadge,
  loadStatusRequests,
  saveStatusRequests,
  toggleUserMenu,
  closeUserMenu,
  navigateToPage,
  switchProductTab,
  updateProductsTable,
  openPurchaseOrderModal,
  closePurchaseOrderModal,
  addPOItem,
  removePOItem,
  updatePOItem,
  updatePOItemForm,
  savePurchaseOrder,
  approveRequest,
  rejectRequest,
  archiveRequest,
  openModal,
  openUserModal,
  closeUserModal,
  saveUser,
  deleteMember,
  logout,
  openCategoryModal,
  closeCategoryModal,
  saveCategory,
  deleteCategory,
  openProductModal,
  closeProductModal,
  saveProduct,
  deleteProduct,
  openStockInModal,
  closeStockInModal,
  saveStockIn,
  deleteStockIn,
  openStockOutModal,
  closeStockOutModal,
  saveStockOut,
  viewStockOutDetails,
  editStockOut,
  deleteStockOut,
  updateStatusRow,
  showReturnModal,
  closeReturnModal,
  confirmReturn,
  viewStatusRequest,
  viewStatusRequestDetails,
  toggleDeliveryDateOther,
  toggleDeliveryDateOtherModal,
  deleteRequest,
  prevPurchaseOrderStep,
  nextPurchaseOrderStep,
  finalizePurchaseOrderCreation,
  setLoginActivityPage,
  editAboutUs,
  refreshSupportTickets,
  removeAboutImage,
  closeEditAboutModal,
  saveAboutUs,
}

Object.assign(window, exposedFunctions)
// Ensure status persistence helpers are available globally
window.loadStatusRequests = loadStatusRequests
window.saveStatusRequests = saveStatusRequests
