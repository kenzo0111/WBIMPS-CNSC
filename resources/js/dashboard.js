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
    if (s && typeof s === 'string' && blacklist.includes(s.toLowerCase()))
      return null

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
  // Save products to database via API
  // This function is called when inventory changes, but since we use API for CRUD,
  // individual product saves are handled in the modal functions
  // Here we can optionally sync all products if needed
}

async function saveProductToAPI(product) {
  // Minimal safe implementation: attempt to POST/PUT to /api/products if available,
  // otherwise return the product object. This avoids build/runtime errors
  // while preserving a reasonable behavior for callers.
  try {
    if (!product) return null
    try {
      const isUpdate = product.databaseId && product.databaseId !== ''
      const method = isUpdate ? 'PUT' : 'POST'
      const url = isUpdate
        ? `/api/products/${product.databaseId}`
        : '/api/products'

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          sku: product.id || product.sku,
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          quantity: product.quantity,
          unit: product.unit,
          unit_cost: product.unitCost || product.unit_cost,
          date: product.date,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.data || data || product
      }
    } catch (err) {
      // If API isn't reachable, fall back to returning product object
      console.warn('saveProductToAPI: API request failed, falling back', err)
    }
    return product
  } catch (error) {
    console.error('Error in saveProductToAPI:', error)
    throw error
  }
}

async function deleteProductFromAPI(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
    })

    if (response.ok) {
      // Remove from local data
      MockData.products = MockData.products.filter((p) => p.id !== productId)
      return true
    } else {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete product')
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}
function persistStockIn() {
  // no-op (persistence disabled)
}
function persistStockOut() {
  // no-op (persistence disabled)
}

async function saveStockInToAPI(stockInRecord) {
  try {
    const method = stockInRecord.id ? 'PUT' : 'POST'
    const url = stockInRecord.id
      ? `/api/stock-in/${stockInRecord.id}`
      : '/api/stock-in'

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        transaction_id: stockInRecord.transactionId || stockInRecord.id,
        sku: stockInRecord.sku,
        product_name: stockInRecord.productName,
        quantity: stockInRecord.quantity,
        unit_cost: stockInRecord.unitCost,
        supplier: stockInRecord.supplier,
        date_received: stockInRecord.dateReceived,
        received_by:
          stockInRecord.receivedBy || stockInRecord.received_by || null,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      // Update local data
      const serverRecord = data.data || {}
      // Normalize server record to UI fields (same normalization as loadStockInFromAPI)
      const uc = Number(serverRecord.unit_cost ?? serverRecord.unitCost ?? 0)
      const normalized = Object.assign({}, serverRecord)
      normalized.transactionId =
        serverRecord.transaction_id || serverRecord.transactionId || ''
      normalized.productName =
        serverRecord.product_name || serverRecord.productName || ''
      normalized.date =
        serverRecord.date_received ||
        serverRecord.date ||
        serverRecord.created_at ||
        ''
      normalized.unit_cost = uc
      normalized.unitCost = uc
      normalized.quantity = Number(serverRecord.quantity || 0)
      normalized.totalCost = Number(
        (serverRecord.total_cost ??
          serverRecord.totalCost ??
          normalized.quantity * uc) ||
          0
      )
      normalized.sku = serverRecord.sku || serverRecord.sku
      normalized.supplier = serverRecord.supplier || ''
      normalized.receivedBy =
        serverRecord.received_by || serverRecord.receivedBy || ''

      if (method === 'POST') {
        stockInData.push(normalized)
      } else {
        const index = stockInData.findIndex((s) => s.id === stockInRecord.id)
        if (index !== -1) {
          stockInData[index] = normalized
        }
      }
      return normalized
    } else {
      const error = await response.json()
      throw new Error(error.message || 'Failed to save stock in')
    }
  } catch (error) {
    console.error('Error saving stock in:', error)
    throw error
  }
}

async function saveStockOutToAPI(stockOutRecord) {
  try {
    const method = stockOutRecord.id ? 'PUT' : 'POST'
    const url = stockOutRecord.id
      ? `/api/stock-out/${stockOutRecord.id}`
      : '/api/stock-out'

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        // Primary identifier for stock-out is issue_id (issued id). Keep transaction_id as optional fallback.
        issue_id:
          stockOutRecord.issueId ||
          stockOutRecord.transactionId ||
          stockOutRecord.id,
        transaction_id: stockOutRecord.transactionId || null,
        sku: stockOutRecord.sku,
        product_name: stockOutRecord.productName,
        quantity: stockOutRecord.quantity,
        unit_cost: stockOutRecord.unitCost || stockOutRecord.unit_cost || 0,
        total_cost: stockOutRecord.totalCost || stockOutRecord.total_cost || 0,
        department: stockOutRecord.department || null,
        // recipient removed; use issued_to consistently
        issued_to: stockOutRecord.issuedTo || stockOutRecord.issued_to || null,
        issued_by: stockOutRecord.issuedBy || stockOutRecord.issued_by || null,
        status: stockOutRecord.status || null,
        purpose: stockOutRecord.purpose,
        date_issued: stockOutRecord.dateIssued,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const serverRecord = data.data || {}
      // Normalize to UI fields
      const normalized = Object.assign({}, serverRecord)
      normalized.issueId = serverRecord.issue_id || serverRecord.issueId || ''
      normalized.transactionId =
        serverRecord.transaction_id || serverRecord.transactionId || ''
      normalized.productName =
        serverRecord.product_name || serverRecord.productName || ''
      normalized.date = formatDate(
        serverRecord.date_issued ||
          serverRecord.date ||
          serverRecord.created_at ||
          ''
      )
      normalized.dateIssued = normalized.date
      normalized.quantity = Number(serverRecord.quantity || 0)
      const uc = Number(serverRecord.unit_cost ?? serverRecord.unitCost ?? 0)
      normalized.unitCost = uc
      normalized.totalCost = Number(
        (serverRecord.total_cost ??
          serverRecord.totalCost ??
          normalized.quantity * uc) ||
          0
      )
      normalized.sku = serverRecord.sku || ''
      normalized.department = serverRecord.department || ''
      // server may provide issued_to or recipient for the target user
      normalized.issuedTo =
        serverRecord.issued_to || serverRecord.issuedTo || ''
      normalized.issuedBy =
        serverRecord.issued_by || serverRecord.issuedBy || ''
      normalized.status = serverRecord.status || ''

      if (method === 'POST') {
        stockOutData.push(normalized)
      } else {
        // Use loose equality to match numeric/string id differences
        const index = stockOutData.findIndex((s) => s.id == stockOutRecord.id)
        if (index !== -1) {
          stockOutData[index] = normalized
        }
      }
      return normalized
    } else {
      // Attempt to extract a helpful message from server JSON (supports {message} or {error} or validation errors)
      let errorBody = {}
      try {
        errorBody = await response.json()
      } catch (e) {
        // ignore
      }
      const msg =
        errorBody?.message ||
        errorBody?.error ||
        (errorBody && errorBody.errors
          ? Object.values(errorBody.errors).flat().join('; ')
          : null) ||
        'Failed to save stock out'
      const err = new Error(msg)
      // attach HTTP status so callers can react (e.g., show custom toast on 422)
      err.status = response.status
      throw err
    }
  } catch (error) {
    console.error('Error saving stock out:', error)
    throw error
  }
}

async function deleteStockInFromAPI(recordId) {
  try {
    const response = await fetch(`/api/stock-in/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
    })

    if (response.ok) {
      // Remove from local data
      stockInData = stockInData.filter((s) => s.id !== recordId)
      return true
    } else {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete stock in')
    }
  } catch (error) {
    console.error('Error deleting stock in:', error)
    throw error
  }
}

async function deleteStockOutFromAPI(recordId) {
  try {
    const response = await fetch(`/api/stock-out/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
    })

    if (response.ok) {
      // Remove from local data
      stockOutData = stockOutData.filter((s) => s.id !== recordId)
      return true
    } else {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete stock out')
    }
  } catch (error) {
    console.error('Error deleting stock out:', error)
    throw error
  }
}

// API-based data loading functions
async function loadProductsFromAPI() {
  try {
    const response = await fetch('/api/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
    })
    if (response.ok) {
      const data = await response.json()
      MockData.products = data.data || []
      // Store database ID separately and use SKU as id for frontend logic
      MockData.products.forEach((product) => {
        // Preserve DB id and use SKU as frontend id
        product.databaseId = product.id
        product.id = product.sku

        // Normalize cost fields: API uses snake_case 'unit_cost', UI sometimes expects 'unitCost'
        const unitCost = Number(product.unit_cost ?? product.unitCost ?? 0)
        product.unit_cost = unitCost
        product.unitCost = unitCost

        // Normalize total value from server or compute it
        const totalValue = Number(
          product.total_value ??
            product.totalValue ??
            (product.quantity || 0) * unitCost
        )
        product.total_value = totalValue
        product.totalValue = totalValue

        // Ensure unit and date are available (API should provide these, but alias defensively)
        product.unit = product.unit ?? product.unit_name ?? ''
        product.date =
          product.date ?? product.date_received ?? product.created_at ?? ''
      })
      return MockData.products
    }
  } catch (error) {
    console.error('Error loading products from API:', error)
  }
  return []
}

async function loadStockInFromAPI() {
  try {
    const response = await fetch('/api/stock-in', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
    })
    if (response.ok) {
      const data = await response.json()
      // Normalize each record to UI-friendly camelCase fields and safe aliases
      stockInData = (data.data || []).map((r) => {
        const record = Object.assign({}, r)
        // server uses snake_case: transaction_id, product_name, date_received, unit_cost
        record.id = record.id || record.id
        record.transactionId =
          record.transaction_id || record.transactionId || ''
        record.productName = record.product_name || record.productName || ''
        record.date = formatDate(
          record.date_received || record.date || record.created_at || ''
        )
        // unit cost aliasing
        const uc = Number(record.unit_cost ?? record.unitCost ?? 0)
        record.unit_cost = uc
        record.unitCost = uc
        // quantity / total cost
        record.quantity = Number(record.quantity || 0)
        record.totalCost = Number(
          (record.total_cost ?? record.totalCost ?? record.quantity * uc) || 0
        )
        // SKU and supplier
        record.sku = record.sku || record.sku
        record.supplier = record.supplier || ''
        // ReceivedBy is not currently in DB; accept server alias 'received_by' if present
        record.receivedBy = record.received_by || record.receivedBy || ''
        return record
      })
      return stockInData
    }
  } catch (error) {
    console.error('Error loading stock in from API:', error)
  }
  return []
}

async function loadStockOutFromAPI() {
  try {
    const response = await fetch('/api/stock-out', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
    })
    if (response.ok) {
      const data = await response.json()
      stockOutData = (data.data || []).map((r) => {
        const rec = Object.assign({}, r)
        rec.id = rec.id || rec.id
        rec.issueId = rec.issue_id || rec.issueId || ''
        rec.transactionId = rec.transaction_id || rec.transactionId || ''
        rec.productName = rec.product_name || rec.productName || ''
        rec.date = formatDate(
          rec.date_issued || rec.date || rec.created_at || ''
        )
        rec.dateIssued = rec.date
        rec.quantity = Number(rec.quantity || 0)
        const uc = Number(rec.unit_cost ?? rec.unitCost ?? 0)
        rec.unit_cost = uc
        rec.unitCost = uc
        rec.totalCost = Number(
          (rec.total_cost ?? rec.totalCost ?? rec.quantity * uc) || 0
        )
        rec.sku = rec.sku || ''
        rec.department = rec.department || ''
        rec.issuedTo = rec.issued_to || rec.issuedTo || ''
        rec.issuedBy = rec.issued_by || rec.issuedBy || ''
        rec.status = rec.status || ''
        return rec
      })
      return stockOutData
    }
  } catch (error) {
    console.error('Error loading stock out from API:', error)
  }
  return []
}

async function loadPersistedInventoryData() {
  // Load data from API instead of localStorage
  await Promise.all([
    loadProductsFromAPI(),
    loadCategoriesFromAPI(),
    loadStockInFromAPI(),
    loadStockOutFromAPI(),
  ])
  return
}

// Initialize with no persisted data
loadPersistedInventoryData()

// Load categories from API and populate MockData.categories
async function loadCategoriesFromAPI() {
  try {
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      credentials: 'same-origin',
    })
    if (response.ok) {
      const data = await response.json()
      MockData.categories = data.data || []
      return MockData.categories
    }
  } catch (e) {
    console.error('Failed loading categories from API', e)
  }
  // fallback to in-memory categories
  MockData.categories = MockData.categories || []
  return MockData.categories
}

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
  const uc = Number(product.unit_cost) || 0
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
    if (newRecord.unit_cost && newRecord.unit_cost !== product.unit_cost) {
      product.unit_cost = newRecord.unit_cost
    }
    recalcProductValue(product)
    maybeNotifyLowStock(product)
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
    // create server-side activity (best-effort)
    try {
      postActivity(
        `Stock Out: ${
          newRecord.productName || newRecord.product_name || newRecord.sku || ''
        }`,
        {
          issueId:
            newRecord.issueId ||
            newRecord.transactionId ||
            newRecord.id ||
            null,
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
  try {
    postActivity(
      `Stock Out deleted: ${
        record.productName || record.product_name || record.sku || ''
      }`,
      {
        issueId: record.issueId || record.transactionId || record.id || null,
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

// Format date-like values into YYYY-MM-DD. Accepts ISO strings and Date objects.
function formatDate(d) {
  if (!d && d !== 0) return ''
  if (typeof d === 'string') {
    // If already an ISO or YYYY-MM-DD string, take first 10 chars
    if (d.length >= 10 && (d.includes('T') || d[4] === '-'))
      return d.slice(0, 10)
    // Fallback: try to parse
    const parsed = new Date(d)
    if (!isNaN(parsed)) {
      const y = parsed.getFullYear()
      const m = String(parsed.getMonth() + 1).padStart(2, '0')
      const day = String(parsed.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    return ''
  }
  if (d instanceof Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return ''
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

    // Try to persist to server (best-effort). Post and ignore failures.
    try {
      postUserLog({
        email: logEntry.email,
        name: logEntry.name,
        action: logEntry.action,
        timestamp: new Date().toISOString(),
        ip_address: logEntry.ipAddress || null,
        device: logEntry.device,
        status: logEntry.status,
      }).catch((err) => console.warn('postUserLog failed', err))
    } catch (e) {
      console.warn('Failed to enqueue postUserLog', e)
    }

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

    // Try to persist to server (best-effort)
    try {
      postUserLog({
        email: logEntry.email,
        name: logEntry.name,
        action: logEntry.action,
        timestamp: new Date().toISOString(),
        ip_address: logEntry.ipAddress || null,
        device: logEntry.device,
        status: logEntry.status,
      }).catch((err) => console.warn('postUserLog failed', err))
    } catch (e) {
      console.warn('Failed to enqueue postUserLog', e)
    }

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

// POST a user log to backend API (best-effort, does not throw on failure)
async function postUserLog(payload = {}) {
  try {
    const url =
      (window.APP_ROUTES && window.APP_ROUTES.userLogs) || '/api/user-logs'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} - ${txt}`)
    }

    const json = await res.json()
    // Normalize returned log into MockData for immediate UI reflection
    if (json && json.data) {
      window.MockData = window.MockData || {}
      window.MockData.userLogs = window.MockData.userLogs || []
      // prepend server-created log
      window.MockData.userLogs.unshift(json.data)
      // keep a reasonable cap
      if (window.MockData.userLogs.length > 200)
        window.MockData.userLogs = window.MockData.userLogs.slice(0, 200)
    }

    return json
  } catch (e) {
    // swallow errors to avoid interfering with login flow
    console.warn('postUserLog error', e)
    return null
  }
}

// GET user logs from backend and populate in-memory logs (returns array)
async function loadUserLogsFromAPI(limit = 100) {
  try {
    const url =
      (window.APP_ROUTES && window.APP_ROUTES.userLogs) || '/api/user-logs'
    const res = await fetch(`${url}?limit=${limit}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    })
    if (!res.ok) throw new Error(`Failed to load user logs: ${res.status}`)
    const json = await res.json()
    let data = []
    if (Array.isArray(json)) data = json
    else if (Array.isArray(json.data)) data = json.data
    else if (Array.isArray(json.results)) data = json.results

    window.MockData = window.MockData || {}
    // normalize timestamps to `timestamp` field for UI convenience
    window.MockData.userLogs = data.map((d) => ({
      id: d.id || d.log_id || d._id || null,
      email: d.email || '',
      name: d.name || '',
      action: d.action || '',
      timestamp: d.timestamp || d.created_at || d.createdAt || null,
      ipAddress: d.ip_address || d.ipAddress || null,
      device: d.device || null,
      status: d.status || null,
      raw: d,
    }))

    return window.MockData.userLogs
  } catch (e) {
    console.warn('loadUserLogsFromAPI failed', e)
    return window.MockData.userLogs || []
  }
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
        loginTime: new Date().toISOString(),
      }

      AppState.currentUser = {
        id: session.id,
        name: session.name,
        email: session.email,
        role: session.role,
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

// Global variable to track current notification filter
let currentNotificationFilter = 'all'

function renderNotifications(filter = 'all') {
  // Update current filter
  currentNotificationFilter = filter

  const listEl = document.getElementById('notifications-list')
  const badge = document.getElementById('notifications-badge')
  if (!listEl || !badge) return

  // Update filter button states
  updateFilterButtons(filter)

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

  // Apply filter
  let filteredNotifications = sortedNotifications
  if (filter === 'unread') {
    filteredNotifications = sortedNotifications.filter((n) => !n.read)
  } else if (filter !== 'all') {
    // Filter by type: success, warning, error, info
    filteredNotifications = sortedNotifications.filter((n) => n.type === filter)
  }

  if (filteredNotifications.length === 0) {
    listEl.innerHTML = `
            <div style="padding: 48px 20px; text-align: center; color: #9ca3af;">
                <div style="width: 64px; height: 64px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                    <i data-lucide="bell-off" style="width: 32px; height: 32px; opacity: 0.5;"></i>
                </div>
                <p style="margin: 0; font-size: 14px; font-weight: 500;">No notifications found</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">Try adjusting your filter</p>
            </div>
        `
    lucide.createIcons()
    return
  }

  // Group notifications by type if filter is 'all'
  let groupedNotifications = {}
  if (filter === 'all') {
    groupedNotifications = {
      error: filteredNotifications.filter((n) => n.type === 'error'),
      warning: filteredNotifications.filter((n) => n.type === 'warning'),
      success: filteredNotifications.filter((n) => n.type === 'success'),
      info: filteredNotifications.filter((n) => n.type === 'info'),
    }
  } else {
    // For specific filters, put all in one group
    groupedNotifications = {
      [filter]: filteredNotifications,
    }
  }

  const typeLabels = {
    error: 'Alerts',
    warning: 'Warnings',
    success: 'Success',
    info: 'Updates',
  }

  const typeIcons = {
    error: 'alert-triangle',
    warning: 'alert-circle',
    success: 'check-circle',
    info: 'info',
  }

  // Render each group
  Object.entries(groupedNotifications).forEach(([type, notifications]) => {
    if (notifications.length === 0) return

    const typeConfig = {
      success: {
        bg: '#ecfdf5',
        iconColor: '#10b981',
        borderColor: '#6ee7b7',
        headerBg: '#f0fdf4',
      },
      warning: {
        bg: '#fef3c7',
        iconColor: '#f59e0b',
        borderColor: '#fcd34d',
        headerBg: '#fffbeb',
      },
      error: {
        bg: '#fee2e2',
        iconColor: '#ef4444',
        borderColor: '#fca5a5',
        headerBg: '#fef2f2',
      },
      info: {
        bg: '#dbeafe',
        iconColor: '#3b82f6',
        borderColor: '#93c5fd',
        headerBg: '#eff6ff',
      },
    }

    const config = typeConfig[type] || typeConfig.info

    // Add section header
    const sectionHeader = document.createElement('div')
    sectionHeader.style.cssText = `
            padding: 8px 16px;
            background: ${config.headerBg};
            border-bottom: 1px solid ${config.borderColor}20;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        `
    sectionHeader.innerHTML = `
            <i data-lucide="${typeIcons[type]}" style="width: 16px; height: 16px; color: ${config.iconColor};"></i>
            <span style="font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">${typeLabels[type]}</span>
            <span style="font-size: 11px; color: #6b7280; margin-left: auto;">${notifications.length}</span>
        `
    listEl.appendChild(sectionHeader)

    // Render notifications in this group
    notifications.forEach((n) => {
      const isUnread = !n.read

      const item = document.createElement('div')
      item.className = 'notification-item-enhanced'
      item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                margin: 0 4px 12px 4px;
                background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
                border: 1px solid ${
                  isUnread ? config.borderColor + '40' : '#e5e7eb'
                };
                border-radius: 12px;
                box-shadow: ${
                  isUnread
                    ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
                    : 'none'
                };
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                position: relative;
                overflow: hidden;
            `

      // Add subtle gradient overlay for unread items
      if (isUnread) {
        item.style.background = `linear-gradient(135deg, ${config.bg} 0%, ${config.bg} 85%, rgba(255,255,255,0.9) 100%)`
      }

      item.innerHTML = `
                <!-- Subtle gradient overlay -->
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: linear-gradient(135deg, ${
                    config.bg
                  }20 0%, transparent 70%);
                  opacity: 0;
                  transition: opacity 0.3s ease;
                  pointer-events: none;
                "></div>

                <!-- Icon Container -->
                <div class="notification-icon-enhanced" style="
                  width: 48px;
                  height: 48px;
                  background: linear-gradient(135deg, ${config.bg} 0%, ${
        config.bg
      } 100%);
                  border: 2px solid ${config.borderColor}30;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  transition: all 0.3s ease;
                  position: relative;
                  z-index: 1;
                ">
                  <i data-lucide="${n.icon || 'bell'}" style="
                    width: 24px;
                    height: 24px;
                    color: ${config.iconColor};
                    transition: all 0.3s ease;
                  "></i>
                </div>

                <!-- Content -->
                <div class="notification-content-enhanced" style="
                  flex: 1;
                  min-width: 0;
                  position: relative;
                  z-index: 1;
                ">
                  <div style="
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 6px;
                  ">
                    <div style="
                      font-size: 14px;
                      font-weight: 600;
                      color: #111827;
                      line-height: 1.4;
                      flex: 1;
                      word-wrap: break-word;
                      display: -webkit-box;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                    ">${escapeHtml(n.title)}</div>
                    ${
                      isUnread
                        ? '<div style="width: 10px; height: 10px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; flex-shrink: 0; margin-top: 2px; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);"></div>'
                        : ''
                    }
                  </div>
                  ${
                    n.message
                      ? `<div style="
                          font-size: 13px;
                          color: #6b7280;
                          line-height: 1.5;
                          margin-bottom: 8px;
                          word-wrap: break-word;
                          display: -webkit-box;
                          -webkit-line-clamp: 2;
                          -webkit-box-orient: vertical;
                          overflow: hidden;
                        ">${escapeHtml(n.message)}</div>`
                      : ''
                  }
                  <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                  ">
                    <div style="
                      font-size: 12px;
                      color: #6b7280;
                      font-weight: 500;
                      display: flex;
                      align-items: center;
                      gap: 6px;
                    ">
                      <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                      ${escapeHtml(n.time)}
                    </div>
                    <button class="notification-action-btn" onclick="event.stopPropagation(); toggleNotificationRead('${
                      n.id
                    }');" style="
                      font-size: 12px;
                      color: ${config.iconColor};
                      border: none;
                      background: none;
                      cursor: pointer;
                      padding: 6px 12px;
                      border-radius: 8px;
                      font-weight: 500;
                      transition: all 0.2s;
                      background: ${config.bg};
                      border: 1px solid ${config.borderColor};
                      display: flex;
                      align-items: center;
                      gap: 4px;
                    ">
                      ${
                        isUnread
                          ? '<i data-lucide="check" style="width: 14px; height: 14px;"></i>Mark read'
                          : '<i data-lucide="rotate-ccw" style="width: 14px; height: 14px;"></i>Mark unread'
                      }
                    </button>
                  </div>
                </div>

                <!-- Action indicator -->
                <div style="
                  width: 8px;
                  height: 8px;
                  background: linear-gradient(135deg, ${config.iconColor} 0%, ${
        config.iconColor
      } 100%);
                  border-radius: 50%;
                  flex-shrink: 0;
                  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
                  position: relative;
                  z-index: 1;
                "></div>
            `

      // Enhanced hover effects
      item.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-2px) scale(1.01)'
        this.style.boxShadow = isUnread
          ? '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)'
          : '0 8px 25px rgba(0, 0, 0, 0.08)'
        this.style.borderColor = isUnread ? config.borderColor : '#d1d5db'

        // Show gradient overlay
        const overlay = this.querySelector('div[style*="position: absolute"]')
        if (overlay) overlay.style.opacity = '1'
      })

      item.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) scale(1)'
        this.style.boxShadow = isUnread
          ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
          : 'none'
        this.style.borderColor = isUnread
          ? config.borderColor + '40'
          : '#e5e7eb'

        // Hide gradient overlay
        const overlay = this.querySelector('div[style*="position: absolute"]')
        if (overlay) overlay.style.opacity = '0'
      })

      item.addEventListener('click', function (e) {
        if (!e.target.closest('.notification-action-btn')) {
          toggleNotificationRead(n.id)
        }
      })

      listEl.appendChild(item)
    })
  })

  // Reinitialize Lucide icons
  lucide.createIcons()
}

function updateFilterButtons(activeFilter) {
  // Remove active class from all filter buttons
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.remove('active')
    btn.style.background = 'white'
    btn.style.color = '#374151'
    btn.style.borderColor = '#e5e7eb'
  })

  // Add active class to the selected filter button
  const activeBtn = document.querySelector(
    `.filter-btn[data-filter="${activeFilter}"]`
  )
  if (activeBtn) {
    activeBtn.classList.add('active')
    activeBtn.style.background = '#3b82f6'
    activeBtn.style.color = 'white'
    activeBtn.style.borderColor = '#3b82f6'
  }
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
    renderNotifications(currentNotificationFilter)
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
  renderNotifications(currentNotificationFilter)
  try {
    if (typeof saveNotifications === 'function') saveNotifications()
  } catch (e) {}
}

function markAllNotificationsRead() {
  ;(AppState.notifications || []).forEach((n) => (n.read = true))
  renderNotifications(currentNotificationFilter)
  try {
    if (typeof saveNotifications === 'function') saveNotifications()
  } catch (e) {}
}

function deleteNotification(id) {
  AppState.notifications = (AppState.notifications || []).filter(
    (n) => n.id !== id
  )
  renderNotifications(currentNotificationFilter)
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
    renderNotifications(currentNotificationFilter)
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
    renderNotifications(currentNotificationFilter)
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
  renderNotifications(currentNotificationFilter)

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
        renderNotifications(currentNotificationFilter)
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
    case 'suppliers':
      mainContent.innerHTML = generateSuppliersPage()
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
    case 'settings':
      // App Settings page (moved from modal to full-page)
      mainContent.innerHTML = generateSettingsPage()
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

// Helper to render a single metric card with the new overview structure
function renderMetricCard(
  title,
  value,
  trend,
  iconName,
  iconClass,
  isCurrency = false
) {
  const dir = trend && trend.direction ? trend.direction : 'neutral'
  const pct =
    trend && typeof trend.percentage !== 'undefined' ? trend.percentage : 0
  const sign = pct > 0 ? '+' : pct < 0 ? '' : ''
  const pctClass = pct > 0 ? 'positive' : pct < 0 ? 'negative' : 'neutral'
  return `
        <div class="metric-card">
          <div class="card-head">
            <div class="label">${title}</div>
            <div class="icon-badge ${iconClass}">
              <i data-lucide="${iconName}" class="icon"></i>
            </div>
          </div>
          <div class="stat">
            <div class="number">${value}</div>
            <div class="meta">
              <div class="percent ${pctClass}">${sign}${Math.abs(pct)}%</div>
              <div class="hint">${
                dir === 'up' ? 'Up' : dir === 'down' ? 'Down' : 'No change'
              }</div>
            </div>
          </div>
        </div>
      `
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

  // Calculate trend indicators (mock data for demonstration - in real app, compare with previous period)
  const getTrendData = (currentValue, previousValue) => {
    if (!previousValue || previousValue === 0)
      return { change: 0, percentage: 0, direction: 'neutral' }
    const change = currentValue - previousValue
    const percentage = Math.round((change / previousValue) * 100)
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    return { change, percentage, direction }
  }

  // Mock previous values (in real app, these would come from historical data)
  const previousTotalProducts = Math.max(
    0,
    totalProducts - Math.floor(Math.random() * 10)
  )
  const previousLowStockItems = Math.max(
    0,
    lowStockItems - Math.floor(Math.random() * 3)
  )
  const previousIncomingRequests = Math.max(
    0,
    incomingRequests - Math.floor(Math.random() * 5)
  )
  const previousReceivedToday = Math.max(
    0,
    receivedToday - Math.floor(Math.random() * 2)
  )
  const previousTotalUsers = Math.max(
    0,
    totalUsers - Math.floor(Math.random() * 2)
  )
  const previousInventoryValue = Math.max(
    0,
    totalInventoryValue - Math.random() * 10000
  )

  const productsTrend = getTrendData(totalProducts, previousTotalProducts)
  const lowStockTrend = getTrendData(lowStockItems, previousLowStockItems)
  const incomingTrend = getTrendData(incomingRequests, previousIncomingRequests)
  const receivedTrend = getTrendData(receivedToday, previousReceivedToday)
  const usersTrend = getTrendData(totalUsers, previousTotalUsers)
  const inventoryTrend = getTrendData(
    totalInventoryValue,
    previousInventoryValue
  )

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
          <button
            id="notifications-btn"
            type="button"
            class="btn-secondary notifications-btn"
            onclick="toggleNotifications(event)"
            aria-haspopup="true"
            aria-expanded="false"
            aria-label="Notifications"
            title="Notifications"
            style="margin-left:4px;width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;position:relative;background:transparent;border:none;box-shadow:none;border-radius:0;transition: background-color 0.12s ease, box-shadow 0.12s ease, transform 0.06s ease;"
            onmouseover="this.style.background='rgba(0,0,0,0.06)'; this.style.borderRadius='50%';"
            onmouseout="this.style.background='transparent'; this.style.borderRadius='0'; this.style.boxShadow='none';"
            onfocus="this.style.background='rgba(99,102,241,0.12)'; this.style.boxShadow='0 0 0 4px rgba(99,102,241,0.16)'; this.style.borderRadius='50%';"
            onblur="this.style.background='transparent'; this.style.borderRadius='0'; this.style.boxShadow='none';"
            onmousedown="this.style.background='rgba(0,0,0,0.12)'; this.style.transform='scale(0.98)';"
            onmouseup="this.style.background='rgba(0,0,0,0.06)'; this.style.transform='scale(1)';">
            <i data-lucide="bell" class="icon" style="width:18px;height:18px;color:inherit;"></i>
            <span id="notifications-badge" aria-hidden="true"></span>
          </button>

          <!-- Notifications popup (absolute inside header-actions) -->
          <div id="notifications-menu" style="position:absolute;top:calc(100% + 8px);right:56px;width:380px;display:none;background:#fff;border:1px solid #e5e7eb;border-radius:20px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05);z-index:1000;overflow:hidden;backdrop-filter:blur(20px);">
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%); position: relative;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);">
                                    <i data-lucide="bell" style="width: 22px; height: 22px; color: white;"></i>
                                </div>
                                <div>
                                    <strong style="font-size: 18px; color: #111827; font-weight: 700; display: block; margin-bottom: 2px;">Notifications</strong>
                                    <div style="font-size: 13px; color: #6b7280; font-weight: 500;">Stay updated with your activity</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <button class="notification-header-btn" onclick="markAllNotificationsRead();" title="Mark all as read" style="width: 36px; height: 36px; border-radius: 12px; border: none; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); color: #6b7280; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);"
                                  onmouseover="this.style.background='linear-gradient(135deg, #10b981 0%, #059669 100%)'; this.style.color='white'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)';"
                                  onmouseout="this.style.background='linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'; this.style.color='#6b7280'; this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.1)';">
                                    <i data-lucide="check-check" style="width: 18px; height: 18px;"></i>
                                </button>
                                <button class="notification-header-btn" onclick="clearAllNotifications();" title="Clear all" style="width: 36px; height: 36px; border-radius: 12px; border: none; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #dc2626; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);"
                                  onmouseover="this.style.background='linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'; this.style.color='white'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(220, 38, 38, 0.4)';"
                                  onmouseout="this.style.background='linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'; this.style.color='#dc2626'; this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(220, 38, 38, 0.2)';">
                                    <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                                </button>
                            </div>
                        </div>
                        <!-- Filter Buttons -->
                        <div style="padding: 16px 24px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);">
                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <span style="font-size: 13px; font-weight: 600; color: #6b7280; margin-right: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Filter:</span>
                                <button class="filter-btn active" onclick="renderNotifications('all')" data-filter="all" style="padding: 8px 16px; border-radius: 10px; border: 2px solid #3b82f6; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3); display: flex; align-items: center; gap: 6px;"
                                  onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)';"
                                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.3)';">
                                    <i data-lucide="list" style="width: 14px; height: 14px;"></i>All
                                </button>
                                <button class="filter-btn" onclick="renderNotifications('unread')" data-filter="unread" style="padding: 8px 16px; border-radius: 10px; border: 2px solid #e5e7eb; background: white; color: #374151; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 6px;"
                                  onmouseover="this.style.borderColor='#10b981'; this.style.background='linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'; this.style.color='#059669'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 8px rgba(16, 185, 129, 0.2)';"
                                  onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white'; this.style.color='#374151'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                    <i data-lucide="eye-off" style="width: 14px; height: 14px;"></i>Unread
                                </button>
                                <button class="filter-btn" onclick="renderNotifications('success')" data-filter="success" style="padding: 8px 16px; border-radius: 10px; border: 2px solid #e5e7eb; background: white; color: #374151; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 6px;"
                                  onmouseover="this.style.borderColor='#10b981'; this.style.background='linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'; this.style.color='#059669'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 8px rgba(16, 185, 129, 0.2)';"
                                  onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white'; this.style.color='#374151'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                    <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i>Success
                                </button>
                                <button class="filter-btn" onclick="renderNotifications('warning')" data-filter="warning" style="padding: 8px 16px; border-radius: 10px; border: 2px solid #e5e7eb; background: white; color: #374151; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 6px;"
                                  onmouseover="this.style.borderColor='#f59e0b'; this.style.background='linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'; this.style.color='#d97706'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 8px rgba(245, 158, 11, 0.2)';"
                                  onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white'; this.style.color='#374151'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                    <i data-lucide="alert-triangle" style="width: 14px; height: 14px;"></i>Warning
                                </button>
                                <button class="filter-btn" onclick="renderNotifications('error')" data-filter="error" style="padding: 8px 16px; border-radius: 10px; border: 2px solid #e5e7eb; background: white; color: #374151; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 6px;"
                                  onmouseover="this.style.borderColor='#ef4444'; this.style.background='linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'; this.style.color='#dc2626'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 8px rgba(239, 68, 68, 0.2)';"
                                  onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white'; this.style.color='#374151'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                    <i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i>Error
                                </button>
                                <button class="filter-btn" onclick="renderNotifications('info')" data-filter="info" style="padding: 8px 16px; border-radius: 10px; border: 2px solid #e5e7eb; background: white; color: #374151; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 6px;"
                                  onmouseover="this.style.borderColor='#3b82f6'; this.style.background='linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'; this.style.color='#1d4ed8'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.2)';"
                                  onmouseout="this.style.borderColor='#e5e7eb'; this.style.background='white'; this.style.color='#374151'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                                    <i data-lucide="info" style="width: 14px; height: 14px;"></i>Info
                                </button>
                            </div>
                        </div>
                        <div id="notifications-list" style="max-height: 420px; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: #cbd5e1 #f8fafc;">
                            <!-- notifications injected here -->
                        </div>
                        <div style="padding: 16px 24px; border-top: 1px solid #f1f5f9; background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%); display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                            <a href="#" onclick="viewAllNotifications(); return false;" style="color: #3b82f6; font-size: 14px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 8px 12px; border-radius: 8px;"
                               onmouseover="this.style.color='#1d4ed8'; this.style.background='linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'; this.style.gap='10px'; this.style.transform='translateX(2px)';"
                               onmouseout="this.style.color='#3b82f6'; this.style.background='transparent'; this.style.gap='8px'; this.style.transform='translateX(0)';">
                                <i data-lucide="list" style="width: 16px; height: 16px;"></i>
                                View all notifications
                            </a>
                            <button class="btn-secondary" style="padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; border: 2px solid #d1d5db; background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%); color: #374151; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);" onclick="closeNotifications()"
                               onmouseover="this.style.background='linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'; this.style.borderColor='#9ca3af'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.15)';"
                               onmouseout="this.style.background='linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'; this.style.borderColor='#d1d5db'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.1)';">
                                <i data-lucide="x" style="width: 16px; height: 16px; margin-right: 6px;"></i>
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
                        <div id="user-menu" style="position:absolute;top:calc(100% + 8px);right:0;width:320px;display:none;background:#fff;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);z-index:1000;overflow:hidden;">
                            <!-- User Info Section -->
                            <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
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
                                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #ede9fe; color: #6b21a8; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid #ddd6fe;">
                                        <i data-lucide="shield" style="width: 10px; height: 10px;"></i>
                                        ${AppState.currentUser.role}
                                    </span>
                                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid #bfdbfe;">
                                        <i data-lucide="check-circle" style="width: 10px; height: 10px;"></i>
                                        ${AppState.currentUser.status}
                                    </span>
                                </div>
                            </div>
                            <!-- Menu Actions -->
                            <div style="padding: 8px;">
                                <button class="user-menu-item" style="display:block;width:100%;text-align:left;padding:12px 16px;border:none;background:none;cursor:pointer;border-radius:8px;display:flex;align-items:center;gap:10px;color:#374151;font-size:14px;font-weight:500;margin-bottom:2px;transition:all 0.2s;" onmouseover="this.style.background='#f3f4f6'; this.style.transform='translateX(2px)';" onmouseout="this.style.background='none'; this.style.transform='translateX(0)';" onclick="openUserModal('edit','current'); closeUserMenu();">
                                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="user" style="width: 16px; height: 16px; color: white;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600;">Profile</div>
                                        <div style="font-size: 12px; color: #6b7280;">Manage your account</div>
                                    </div>
                                    <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: #9ca3af;"></i>
                                </button>
                                <button class="user-menu-item" style="display:block;width:100%;text-align:left;padding:12px 16px;border:none;background:none;cursor:pointer;border-radius:8px;display:flex;align-items:center;gap:10px;color:#374151;font-size:14px;font-weight:500;margin-bottom:2px;transition:all 0.2s;" onmouseover="this.style.background='#f3f4f6'; this.style.transform='translateX(2px)';" onmouseout="this.style.background='none'; this.style.transform='translateX(0)';" onclick="navigateToPage('activity'); closeUserMenu();">
                                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="activity" style="width: 16px; height: 16px; color: white;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600;">Activity Log</div>
                                        <div style="font-size: 12px; color: #6b7280;">View your recent activity</div>
                                    </div>
                                    <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: #9ca3af;"></i>
                                </button>
                                <button class="user-menu-item" style="display:block;width:100%;text-align:left;padding:12px 16px;border:none;background:none;cursor:pointer;border-radius:8px;display:flex;align-items:center;gap:10px;color:#374151;font-size:14px;font-weight:500;margin-bottom:2px;transition:all 0.2s;" onmouseover="this.style.background='#f3f4f6'; this.style.transform='translateX(2px)';" onmouseout="this.style.background='none'; this.style.transform='translateX(0)';" onclick="navigateToPage('settings'); closeUserMenu();">
                                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="settings" style="width: 16px; height: 16px; color: white;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600;">Settings</div>
                                        <div style="font-size: 12px; color: #6b7280;">App preferences</div>
                                    </div>
                                    <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: #9ca3af;"></i>
                                </button>
                                <div style="height: 1px; background: #e5e7eb; margin: 8px 0;"></div>
                                <button class="user-menu-item" style="display:block;width:100%;text-align:left;padding:12px 16px;border:none;background:none;cursor:pointer;border-radius:8px;display:flex;align-items:center;gap:10px;color:#dc2626;font-size:14px;font-weight:500;transition:all 0.2s;" onmouseover="this.style.background='#fef2f2'; this.style.transform='translateX(2px)';" onmouseout="this.style.background='none'; this.style.transform='translateX(0)';" onclick="logout()">
                                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="log-out" style="width: 16px; height: 16px; color: white;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600;">Logout</div>
                                        <div style="font-size: 12px; color: #dc2626;">Sign out of your account</div>
                                    </div>
                                    <i data-lucide="chevron-right" style="width: 14px; height: 14px; color: #dc2626;"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="page-content">
            <!-- Hero Section -->
            <div class="hero-section" style="background: linear-gradient(135deg, #800000 0%, #C62828 50%, #FF9800 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px; color: white; box-shadow: 0 8px 24px rgba(198, 40, 40, 0.25); position: relative; overflow: hidden;">
                <div style="background: url('data:image/svg+xml,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3e%3ccircle cx=%2220%22 cy=%2220%22 r=%222%22 fill=%22rgba(255,255,255,0.1)%22/%3e%3ccircle cx=%2280%22 cy=%2280%22 r=%222%22 fill=%22rgba(255,255,255,0.1)%22/%3e%3ccircle cx=%2260%22 cy=%2230%22 r=%221%22 fill=%22rgba(255,255,255,0.1)%22/%3e%3ccircle cx=%2230%22 cy=%2270%22 r=%221.5%22 fill=%22rgba(255,255,255,0.1)%22/%3e%3c/svg%3e') no-repeat center; background-size: cover; position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1;"></div>
                <div style="position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1;">
                        <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                            <i data-lucide="sun" style="width: 32px; height: 32px; opacity: 0.9;"></i>
                            Good ${(() => {
                              const hour = new Date().getHours()
                              if (hour < 12) return 'morning'
                              if (hour < 17) return 'afternoon'
                              return 'evening'
                            })()}, ${AppState.currentUser.name.split(' ')[0]}!
                        </h2>
                        <p style="margin: 0; font-size: 16px; opacity: 0.9;">Welcome to your Supply System dashboard. Here's what's happening today.</p>
                    </div>
                    <div style="text-align: right; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);">
                        <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">${new Date().toLocaleDateString(
                          'en-US',
                          {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}</div>
                        <div style="font-size: 14px; opacity: 0.8;">${new Date().toLocaleTimeString(
                          'en-US',
                          { hour: '2-digit', minute: '2-digit', hour12: true }
                        )}</div>
                    </div>
                </div>
            </div>
            
            <!-- Metrics Cards -->
            <div class="metrics-grid">
                ${renderMetricCard(
                  'Items',
                  totalProducts,
                  productsTrend,
                  'package',
                  'blue'
                )}

                ${renderMetricCard(
                  'Low Stock',
                  lowStockItems,
                  lowStockTrend,
                  'alert-triangle',
                  'orange'
                )}

                ${renderMetricCard(
                  'Incoming',
                  incomingRequests,
                  incomingTrend,
                  'clock',
                  'yellow'
                )}

                ${renderMetricCard(
                  'Received Today',
                  receivedToday,
                  receivedTrend,
                  'check-circle',
                  'green'
                )}

                ${renderMetricCard(
                  'Users',
                  totalUsers,
                  usersTrend,
                  'users',
                  'purple'
                )}

                ${renderMetricCard(
                  'Inventory Value',
                  formatCurrency(totalInventoryValue),
                  inventoryTrend,
                  'bar-chart-3',
                  'indigo',
                  true
                )}
            </div>
            
            <!-- Quick Actions & Recent Activity -->
            <div class="dashboard-grid">
                <!-- Quick Actions first -->
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
                
                <!-- Recent Activity second -->
                <div class="card">
                    <div class="card-header card-header-inline" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
                        <h3 class="card-title">Recent Activity</h3>
                        <a href="#" class="link" onclick="navigateToPage('activity')">View all activity →</a>
                    </div>
                    <div class="activity-list" id="recent-activity-list">
                      <!-- Recent activities will be injected here by dashboard script -->
                      <div class="activity-loading" style="padding:16px;color:#6b7280;font-size:14px;">Loading recent activity…</div>
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
    container.innerHTML = `
      <div style="padding: 32px 20px; text-align: center; color: #6b7280; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 2px dashed #e2e8f0;">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <i data-lucide="activity" style="width: 32px; height: 32px; opacity: 0.6;"></i>
        </div>
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #374151;">No recent activity</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Activity will appear here as you use the system</p>
      </div>
    `
    if (window.lucide) setTimeout(() => lucide.createIcons(), 10)
    return
  }

  container.innerHTML = activities
    .map((a, index) => {
      // Enhanced icon selection with more variety
      let icon = 'activity'
      let color = '#6b7280'
      let bgColor = '#f3f4f6'
      let borderColor = '#e5e7eb'
      const text = (a.action || '').toLowerCase()

      if (
        text.includes('approve') ||
        text.includes('approved') ||
        text.includes('completed')
      ) {
        icon = 'check-circle'
        color = '#10b981'
        bgColor = '#ecfdf5'
        borderColor = '#d1fae5'
      } else if (
        text.includes('stock') ||
        text.includes('received') ||
        text.includes('inventory')
      ) {
        icon = 'package'
        color = '#3b82f6'
        bgColor = '#eff6ff'
        borderColor = '#dbeafe'
      } else if (
        text.includes('low stock') ||
        text.includes('alert') ||
        text.includes('warning')
      ) {
        icon = 'alert-triangle'
        color = '#f59e0b'
        bgColor = '#fffbeb'
        borderColor = '#fef3c7'
      } else if (
        text.includes('user') ||
        text.includes('added') ||
        text.includes('created')
      ) {
        icon = 'user-plus'
        color = '#8b5cf6'
        bgColor = '#f3e8ff'
        borderColor = '#e9d5ff'
      } else if (
        text.includes('request') ||
        text.includes('submitted') ||
        text.includes('pending')
      ) {
        icon = 'file-text'
        color = '#ef4444'
        bgColor = '#fef2f2'
        borderColor = '#fee2e2'
      } else if (
        text.includes('update') ||
        text.includes('edit') ||
        text.includes('modified')
      ) {
        icon = 'edit'
        color = '#06b6d4'
        bgColor = '#ecfeff'
        borderColor = '#cffafe'
      } else if (
        text.includes('delete') ||
        text.includes('remove') ||
        text.includes('cancelled')
      ) {
        icon = 'trash-2'
        color = '#dc2626'
        bgColor = '#fef2f2'
        borderColor = '#fee2e2'
      }

      return `
        <div class="activity-item-enhanced" style="
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
          border: 1px solid ${borderColor};
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        "
        onmouseover="
          this.style.transform = 'translateY(-2px) scale(1.01)';
          this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)';
          this.style.borderColor = '${color}40';
        "
        onmouseout="
          this.style.transform = 'translateY(0) scale(1)';
          this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
          this.style.borderColor = '${borderColor}';
        ">
          <!-- Subtle gradient overlay -->
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, ${bgColor}20 0%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
          "></div>

          <!-- Icon Container -->
          <div class="activity-icon-enhanced" style="
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor} 100%);
            border: 2px solid ${color}30;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
          ">
            <i data-lucide="${icon}" style="
              width: 24px;
              height: 24px;
              color: ${color};
              transition: all 0.3s ease;
            "></i>
          </div>

          <!-- Content -->
          <div class="activity-content-enhanced" style="
            flex: 1;
            min-width: 0;
            position: relative;
            z-index: 1;
          ">
            <p style="
              margin: 0 0 6px 0;
              font-size: 14px;
              font-weight: 500;
              color: #111827;
              line-height: 1.5;
              word-wrap: break-word;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            ">${escapeHtml(a.action || '')}</p>
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span class="activity-time" style="
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                ${timeAgo(a.created_at)}
              </span>
              <span style="
                width: 4px;
                height: 4px;
                background: #d1d5db;
                border-radius: 50%;
                flex-shrink: 0;
              "></span>
              <span style="
                font-size: 11px;
                color: ${color};
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                background: ${bgColor};
                padding: 2px 8px;
                border-radius: 8px;
                border: 1px solid ${color}20;
              ">${icon.replace('-', ' ')}</span>
            </div>
          </div>

          <!-- Action indicator -->
          <div style="
            width: 8px;
            height: 8px;
            background: linear-gradient(135deg, ${color} 0%, ${color} 100%);
            border-radius: 50%;
            flex-shrink: 0;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
            position: relative;
            z-index: 1;
          "></div>
        </div>
      `
    })
    .join('')

  // Add hover effect for the gradient overlay
  setTimeout(() => {
    const items = container.querySelectorAll('.activity-item-enhanced')
    items.forEach((item) => {
      const overlay = item.querySelector('div[style*="position: absolute"]')
      item.addEventListener('mouseenter', () => {
        if (overlay) overlay.style.opacity = '1'
      })
      item.addEventListener('mouseleave', () => {
        if (overlay) overlay.style.opacity = '0'
      })
    })
  }, 100)

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

// Ensure certain pages load remote data before rendering
const _origLoadPageContent = loadPageContent
loadPageContent = function (pageId) {
  // For pages that must show server data, load remote data first
  if (pageId === 'stock-in') {
    ;(async () => {
      await loadStockInFromAPI()
      _origLoadPageContent(pageId)
      if (window.lucide) setTimeout(() => lucide.createIcons(), 10)
    })()
    return
  }

  if (pageId === 'stock-out') {
    ;(async () => {
      await loadStockOutFromAPI()
      _origLoadPageContent(pageId)
      if (window.lucide) setTimeout(() => lucide.createIcons(), 10)
    })()
    return
  }

  // Default: call original loader
  _origLoadPageContent(pageId)
  if (pageId === 'dashboard') {
    // small delay to allow DOM insertion
    setTimeout(async () => {
      const acts = await fetchActivities(5)
      renderActivityList(acts)
    }, 120)
  }
  // Load server-side user logs before showing login activity page so UI is backed by DB
  if (pageId === 'login-activity') {
    ;(async () => {
      await loadUserLogsFromAPI(200).catch(() => {})
      // proceed to render page via original loader
      _origLoadPageContent(pageId)
      if (window.lucide) setTimeout(() => lucide.createIcons(), 10)
    })()
    return
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
              <th style="padding: 16px 24px;">Category Code</th>
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
                                  category.code
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
  // Filter products according to current tab. Prefer explicit `product.type` when present;
  // otherwise derive type from SKU prefix as a safe fallback (SE -> semi-expendable, N -> non-expendable, else expendable).
  const allProducts = MockData.products || []
  const deriveType = (product) => {
    if (!product) return 'expendable'
    if (product.type) return product.type
    const sku = (product.id || '').toString().toUpperCase()
    if (sku.startsWith('SE')) return 'semi-expendable'
    if (sku.startsWith('N')) return 'non-expendable'
    return 'expendable'
  }

  const filteredProducts = allProducts.filter(
    (p) => deriveType(p) === currentTab
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
                                  product.unit_cost || 0
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

// -----------------------------
// Suppliers Management Page
// -----------------------------

function generateSuppliersPage() {
  // Ensure AppState.suppliers exists; attempt to load from API if empty
  if (!AppState.suppliers) AppState.suppliers = []
  // kick off async load if not already loaded
  if (!AppState._suppliersLoaded) {
    AppState._suppliersLoaded = true
    loadSuppliersFromAPI()
  }

  return `
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1 class="page-title">
                        <i data-lucide="users" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
                        Supplier Management
                    </h1>
                    <p class="page-subtitle">Add, edit and manage suppliers</p>
                </div>
        <button class="btn btn-primary" id="add-supplier-btn" data-action="add-supplier">
          <i data-lucide="plus" class="icon"></i>
          Add Supplier
        </button>
            </div>
        </div>

        <div class="page-content">
            <div class="table-container">
                <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>TIN</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Action</th>
            </tr>
          </thead>
                    <tbody id="suppliers-table-body">
                        ${renderSuppliersRows()}
                    </tbody>
                </table>
            </div>
        </div>
        `
}

function renderSuppliersRows() {
  const suppliers = AppState.suppliers || []
  if (suppliers.length === 0) {
    return `<tr><td colspan="6" style="text-align:center;padding:24px;color:#6b7280;">No suppliers found</td></tr>`
  }
  return suppliers
    .map(
      (s, i) => `
        <tr>
            <td style="font-weight:500;">${escapeHtml(s.name || '')}</td>
            <td style="color:#6b7280;">${escapeHtml(s.address || '')}</td>
            <td>${escapeHtml(s.tin || '')}</td>
            <td>${escapeHtml(s.contact || '')}</td>
            <td>${escapeHtml(s.email || '')}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-action-btn icon-action-danger" title="Delete" data-action="delete-supplier" data-id="${
                      s.id || ''
                    }">
                        <i data-lucide="trash-2"></i>
                    </button>
                    <button class="icon-action-btn icon-action-warning" title="Edit" data-action="edit-supplier" data-id="${
                      s.id || ''
                    }">
                        <i data-lucide="edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join('')
}

// Suppliers page event wiring
function initSuppliersPageEvents() {
  // Add button
  const addBtn = document.getElementById('add-supplier-btn')
  if (addBtn) {
    addBtn.removeEventListener('click', _handleAddSupplier)
    addBtn.addEventListener('click', _handleAddSupplier)
  }

  // Delegate table actions
  const tbody = document.getElementById('suppliers-table-body')
  if (tbody) {
    tbody.removeEventListener('click', _handleSuppliersTableClick)
    tbody.addEventListener('click', _handleSuppliersTableClick)
  }
}

function _handleAddSupplier(e) {
  e.preventDefault()
  openSupplierModal('create', null)
}

function _handleSuppliersTableClick(e) {
  const btn = e.target.closest('[data-action]')
  if (!btn) return
  const action = btn.getAttribute('data-action')
  const id = btn.getAttribute('data-id')
  if (action === 'edit-supplier') openSupplierModal('edit', id)
  if (action === 'delete-supplier') deleteSupplier(id)
}

function openSupplierModal(mode = 'create', index = null) {
  const overlay = document.getElementById('supplier-modal-overlay')
  if (!overlay) return

  let supplier = {}
  if (mode === 'edit' && index) {
    supplier =
      (AppState.suppliers || []).find((s) => String(s.id) === String(index)) ||
      {}
  }

  const modalContent = overlay.querySelector('.modal-content')
  // Render using the product modal style
  modalContent.innerHTML = generateSupplierModal(mode, supplier, index)
  overlay.classList.add('active')
  if (window.lucide) setTimeout(() => lucide.createIcons(), 10)

  // Attach listeners for modal interactions (overlay click, ESC, save, cancel)
  // Store handlers on the overlay so we can remove them when closing
  const overlayClickHandler = function (ev) {
    if (ev.target === overlay) closeSupplierModal()
  }
  const escHandler = function (ev) {
    if (ev.key === 'Escape') closeSupplierModal()
  }

  overlay.addEventListener('click', overlayClickHandler)
  document.addEventListener('keydown', escHandler)
  overlay._supplierModalHandlers = { overlayClickHandler, escHandler }

  // Hook up save/cancel/close buttons by data-action attributes
  const closeBtn = modalContent.querySelector('.modal-close')
  if (closeBtn) closeBtn.addEventListener('click', closeSupplierModal)

  const cancelBtn = modalContent.querySelector(
    '[data-action="supplier-cancel"]'
  )
  if (cancelBtn) cancelBtn.addEventListener('click', closeSupplierModal)

  const saveBtn = modalContent.querySelector('[data-action="supplier-save"]')
  if (saveBtn) {
    saveBtn.addEventListener('click', function (ev) {
      ev.preventDefault()
      const m = saveBtn.getAttribute('data-mode') || mode
      const idx = saveBtn.getAttribute('data-index') || index
      saveSupplier(m, idx === '' ? null : idx)
    })
  }

  // Focus first input for quick entry
  const firstInput = modalContent.querySelector('#supplier-name-input')
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 50)
  }

  // Initialize interactive map for supplier modal (lazy-load Leaflet)
  try {
    setTimeout(() => {
      initSupplierMap(supplier)
    }, 120)
  } catch (e) {
    console.warn('initSupplierMap failed', e)
  }

  // --- Geocoding: when user types supplier name, try to geocode and autofill address ---
  try {
    const nameInput = modalContent.querySelector('#supplier-name-input')
    const addressInput = modalContent.querySelector('#supplier-address-input')
    const latInput = modalContent.querySelector('#supplier-lat-input')
    const lngInput = modalContent.querySelector('#supplier-lng-input')

    function debounce(fn, wait) {
      let t = null
      return function (...args) {
        clearTimeout(t)
        t = setTimeout(() => fn.apply(this, args), wait)
      }
    }

    async function geocodeQuery(q) {
      // Use server-side proxy to Nominatim to avoid CORS and set User-Agent
      if (!q || String(q).trim().length === 0) return null
      const url = `/api/geocode?q=${encodeURIComponent(
        q
      )}&limit=1&countrycodes=ph`
      try {
        const res = await fetch(url, {
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) return null
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) return null
        return data[0]
      } catch (e) {
        return null
      }
    }

    const onNameInput = debounce(async function (ev) {
      const v = ev.target.value || ''
      if (v.trim().length < 3) return
      // perform geocode
      const result = await geocodeQuery(v + '')
      if (!result) return
      // populate address and coords
      if (addressInput) addressInput.value = result.display_name || ''
      if (latInput) latInput.value = parseFloat(result.lat).toFixed(6)
      if (lngInput) lngInput.value = parseFloat(result.lon).toFixed(6)

      // Move map marker if available; init map if needed
      const container = document.getElementById('supplier-map')
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)
      if (container) {
        const map = container._leafletMap
        const marker = container._marker
        if (map) {
          try {
            setMarkerPosition(map, marker, [lat, lng])
          } catch (e) {
            console.warn('Failed to set marker from geocode', e)
          }
        } else {
          // ensure map initializes then set marker shortly after
          try {
            initSupplierMap({ latitude: lat, longitude: lng })
            setTimeout(() => {
              const cm = container._leafletMap
              const mk = container._marker
              if (cm) setMarkerPosition(cm, mk, [lat, lng])
            }, 400)
          } catch (e) {
            console.warn('Failed to init map for geocode result', e)
          }
        }
      }
    }, 700)

    if (nameInput) {
      // remove previous if present
      try {
        nameInput.removeEventListener('input', nameInput._supplierNameHandler)
      } catch (e) {}
      nameInput.addEventListener('input', onNameInput)
      // store handler reference so it can be removed on close
      nameInput._supplierNameHandler = onNameInput
      // keep handler reference on overlay for cleanup
      overlay._supplierModalHandlers = overlay._supplierModalHandlers || {}
      overlay._supplierModalHandlers.supplierNameHandler = {
        el: nameInput,
        fn: onNameInput,
      }
    }
  } catch (e) {
    console.warn('Geocoding hookup failed', e)
  }
}

// Dynamically load Leaflet CSS/JS only once
let __leafletLoaded = false
function loadLeafletAssets() {
  return new Promise((resolve, reject) => {
    if (typeof L !== 'undefined' && __leafletLoaded) return resolve()
    // Load CSS
    if (!document.querySelector('link[data-leaflet]')) {
      const l = document.createElement('link')
      l.setAttribute('rel', 'stylesheet')
      l.setAttribute('href', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')
      l.setAttribute('crossorigin', '')
      l.setAttribute('data-leaflet', 'true')
      document.head.appendChild(l)
    }

    if (typeof L !== 'undefined') {
      __leafletLoaded = true
      return resolve()
    }

    // Load script
    if (!document.querySelector('script[data-leaflet]')) {
      const s = document.createElement('script')
      s.setAttribute('src', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
      s.setAttribute('data-leaflet', 'true')
      s.onload = () => {
        __leafletLoaded = true
        resolve()
      }
      s.onerror = (err) => reject(err)
      document.body.appendChild(s)
    } else {
      // script already present but L may not be ready yet
      const existing = document.querySelector('script[data-leaflet]')
      existing.addEventListener('load', () => {
        __leafletLoaded = true
        resolve()
      })
      existing.addEventListener('error', (e) => reject(e))
    }
  })
}

// Initialize the supplier modal map and wire controls
function initSupplierMap(supplier = {}) {
  const container = document.getElementById('supplier-map')
  if (!container) return
  // Initialize Leaflet map (Leaflet-only implementation)
  loadLeafletAssets()
    .then(() => {
      try {
        // Avoid double init
        if (container._leafletMap) {
          // If coordinates available, update marker
          const lat = parseFloat(
            document.getElementById('supplier-lat-input')?.value || ''
          )
          const lng = parseFloat(
            document.getElementById('supplier-lng-input')?.value || ''
          )
          if (!isNaN(lat) && !isNaN(lng)) {
            setMarkerPosition(container._leafletMap, container._marker, [
              lat,
              lng,
            ])
          }
          return
        }

        // Default center: if supplier has coords use them, otherwise a sensible default
        const lat0 = parseFloat(
          supplier.latitude || supplier.lat || supplier.latitute || ''
        )
        const lng0 = parseFloat(
          supplier.longitude || supplier.lng || supplier.lon || ''
        )
        const hasCoords = !isNaN(lat0) && !isNaN(lng0)
        const center = hasCoords ? [lat0, lng0] : [14.5995, 120.9842] // Manila fallback

        // Create map
        const map = L.map(container, { scrollWheelZoom: false }).setView(
          center,
          hasCoords ? 13 : 6
        )

        // Add OSM tile layer (public)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map)

        // Create marker if coords present or null placeholder
        let marker = null
        if (hasCoords) {
          marker = L.marker(center, { draggable: true }).addTo(map)
        }

        // Click on map to place/move marker
        map.on('click', function (e) {
          const latlng = e.latlng
          if (!marker) {
            marker = L.marker(latlng, { draggable: true }).addTo(map)
          } else {
            marker.setLatLng(latlng)
          }
          // write to inputs
          const latInput = document.getElementById('supplier-lat-input')
          const lngInput = document.getElementById('supplier-lng-input')
          if (latInput) latInput.value = latlng.lat.toFixed(6)
          if (lngInput) lngInput.value = latlng.lng.toFixed(6)
        })

        // If marker draggable, update inputs on dragend
        const updateInputsFromMarker = () => {
          if (!marker) return
          const p = marker.getLatLng()
          const latInput = document.getElementById('supplier-lat-input')
          const lngInput = document.getElementById('supplier-lng-input')
          if (latInput) latInput.value = p.lat.toFixed(6)
          if (lngInput) lngInput.value = p.lng.toFixed(6)
        }

        // When a new marker is created, wire dragend
        if (marker) marker.on('dragend', updateInputsFromMarker)

        // Wire "Use my location" button
        const geoBtn = document.getElementById('supplier-use-my-location')
        if (geoBtn) {
          geoBtn.addEventListener('click', function () {
            if (!navigator.geolocation) {
              showAlert('Geolocation is not supported by your browser', 'error')
              return
            }
            geoBtn.setAttribute('data-loading', 'true')
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                geoBtn.removeAttribute('data-loading')
                const lat = pos.coords.latitude
                const lng = pos.coords.longitude
                if (!marker) {
                  marker = L.marker([lat, lng], { draggable: true }).addTo(map)
                  marker.on('dragend', updateInputsFromMarker)
                } else {
                  marker.setLatLng([lat, lng])
                }
                map.setView([lat, lng], 13)
                updateInputsFromMarker()
              },
              (err) => {
                geoBtn.removeAttribute('data-loading')
                showAlert('Unable to retrieve your location', 'error')
              },
              { enableHighAccuracy: true, timeout: 10000 }
            )
          })
        }

        // When user edits lat/lng inputs manually, try parse and move marker
        const latInput = document.getElementById('supplier-lat-input')
        const lngInput = document.getElementById('supplier-lng-input')
        function onLatLngInputChange() {
          const lat = parseFloat(latInput?.value || '')
          const lng = parseFloat(lngInput?.value || '')
          if (!isNaN(lat) && !isNaN(lng)) {
            if (!marker) {
              marker = L.marker([lat, lng], { draggable: true }).addTo(map)
              marker.on('dragend', updateInputsFromMarker)
            } else {
              marker.setLatLng([lat, lng])
            }
            map.setView([lat, lng], 13)
          }
        }
        if (latInput) latInput.addEventListener('change', onLatLngInputChange)
        if (lngInput) lngInput.addEventListener('change', onLatLngInputChange)

        // Store references to avoid multiple inits
        container._leafletMap = map
        container._marker = marker
      } catch (e) {
        console.error('Leaflet init failed', e)
      }
    })
    .catch((err) => {
      console.warn('Failed to load Leaflet assets', err)
    })
}
// End of initSupplierMap

function setMarkerPosition(map, marker, latlng) {
  try {
    if (!map) return
    // Leaflet-only: set or move marker then center map and update inputs
    if (typeof L !== 'undefined' && map && typeof map.setView === 'function') {
      if (!marker) {
        marker = L.marker(latlng, { draggable: true }).addTo(map)
      } else {
        marker.setLatLng(latlng)
      }
      map.setView(latlng, 13)
      const container =
        map._container || document.getElementById('supplier-map')
      if (container) container._marker = marker
      const latInput = document.getElementById('supplier-lat-input')
      const lngInput = document.getElementById('supplier-lng-input')
      if (latInput) latInput.value = parseFloat(latlng[0]).toFixed(6)
      if (lngInput) lngInput.value = parseFloat(latlng[1]).toFixed(6)
      return
    }
  } catch (e) {
    console.warn('setMarkerPosition error', e)
  }
}

function generateSupplierModal(mode = 'create', supplier = {}, index = null) {
  const title =
    mode === 'create'
      ? 'Add Supplier'
      : mode === 'edit'
      ? 'Edit Supplier'
      : 'Supplier Details'
  const subtitle =
    mode === 'create'
      ? 'Add a new supplier'
      : mode === 'edit'
      ? 'Update supplier information'
      : 'View supplier details'
  const isReadOnly = mode === 'view'
  // Use the same structure as product modal for visual parity
  return `
    <style>
    /* Hide empty icon placeholders until lucide replaces them with SVGs */
    .modal-header .icon-container i:empty { display: none; }
    </style>
    <div class="modal-header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; border-bottom: none; padding: 32px 24px;">
            <div style="display: flex; align-items: center; gap: 16px;">
        <div class="icon-container" style="width:64px;height:64px;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);">
          <i data-lucide="truck" style="width:32px;height:32px;color:white;"></i>
        </div>
                <div style="flex: 1;">
                    <h2 class="modal-title" style="color: white; font-size: 24px; margin-bottom: 4px;">${title}</h2>
                    <p class="modal-subtitle" style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">${subtitle}</p>
                </div>
            </div>
            <button class="modal-close" style="color: white; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>

        <div class="modal-body" style="padding: 32px 24px; background: #f9fafb;">
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="info" style="width: 18px; height: 18px; color: #dc2626;"></i>
                    Basic Information
                </h3>

                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="user" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Supplier Name
                        </label>
                        <input type="text" id="supplier-name-input" class="form-input" value="${escapeHtml(
                          supplier.name || ''
                        )}" placeholder="e.g., ABC Office Supplies" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px;" ${
    isReadOnly ? 'readonly' : ''
  }>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="map-pin" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Address
                        </label>
                        <input type="text" id="supplier-address-input" class="form-input" value="${escapeHtml(
                          supplier.address || ''
                        )}" placeholder="Street, City, Postal Code" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px;" ${
    isReadOnly ? 'readonly' : ''
  }>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="credit-card" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            TIN
                        </label>
                        <input type="text" id="supplier-tin-input" class="form-input" value="${escapeHtml(
                          supplier.tin || ''
                        )}" placeholder="Taxpayer Identification Number" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px;" ${
    isReadOnly ? 'readonly' : ''
  }>
                    </div>

                    <div class="form-group" style="margin-bottom: 20px;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                            <i data-lucide="phone" style="width: 14px; height: 14px; color: #6b7280;"></i>
                            Contact
                        </label>
                        <input type="text" id="supplier-contact-input" class="form-input" value="${escapeHtml(
                          supplier.contact || ''
                        )}" placeholder="Phone / Mobile" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px;" ${
    isReadOnly ? 'readonly' : ''
  }>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-weight: 500; color: #374151;">
                        <i data-lucide="mail" style="width: 14px; height: 14px; color: #6b7280;"></i>
                        Email
                    </label>
                    <input type="email" id="supplier-email-input" class="form-input" value="${escapeHtml(
                      supplier.email || ''
                    )}" placeholder="contact@example.com" style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px;" ${
    isReadOnly ? 'readonly' : ''
  }>
                </div>
            </div>
            
            <!-- Geo / Map Section -->
            <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="map" style="width: 18px; height: 18px; color: #0ea5e9;"></i>
                    Location / Map
                </h3>
                <p style="margin: 6px 0 14px 0; color: #6b7280; font-size: 13px;">Drop a marker on the map or use your current location. Coordinates will be saved with the supplier.</p>

                <div id="supplier-map" style="width:100%;height:280px;border-radius:8px;overflow:hidden;background:#eef2ff;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Map loading...</div>

                <div style="display:flex;gap:8px;margin-top:12px;align-items:center;">
                    <button class="btn btn-secondary" type="button" id="supplier-use-my-location">Use my location</button>
                    <div style="flex:1;display:flex;gap:8px;align-items:center;">
                        <input type="text" id="supplier-lat-input" class="form-input" placeholder="Latitude" value="${escapeHtml(
                          supplier.latitude || supplier.lat || ''
                        )}" style="width:48%;">
                        <input type="text" id="supplier-lng-input" class="form-input" placeholder="Longitude" value="${escapeHtml(
                          supplier.longitude ||
                            supplier.lng ||
                            supplier.lon ||
                            ''
                        )}" style="width:48%;">
                    </div>
                </div>
            </div>
            ${
              supplier?.id
                ? `
                <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 20px; border-left: 4px solid #2563eb;">
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <i data-lucide="info" style="width: 20px; height: 20px; color: #1e40af; flex-shrink: 0; margin-top: 2px;"></i>
                        <div>
                            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1e3a8a;">Supplier ID: ${
                              supplier.id
                            }</h4>
                            <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">This supplier record was created on ${
                              supplier.created_at || supplier.created || 'N/A'
                            }.</p>
                        </div>
                    </div>
                </div>
            `
                : ''
            }
        </div>

        <div class="modal-footer" style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" data-action="supplier-cancel" style="padding: 10px 24px; font-weight: 500; border: 2px solid #d1d5db; transition: all 0.2s;">
                <i data-lucide="arrow-left" style="width: 16px; height: 16px; margin-right: 6px;"></i>
                Cancel
            </button>
            ${
              !isReadOnly
                ? `
                <button class="btn btn-primary" data-action="supplier-save" data-mode="${mode}" data-index="${
                    index === null ? '' : index
                  }" style="padding: 10px 24px; font-weight: 500; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); box-shadow: 0 4px 6px rgba(220, 38, 38, 0.25); transition: all 0.2s; display:inline-flex; align-items:center; gap:8px;">
                    <i data-lucide="${
                      mode === 'create' ? 'plus-circle' : 'save'
                    }" style="width:16px;height:16px;margin-right:6px;"></i>
                    ${mode === 'create' ? 'Add Supplier' : 'Save Changes'}
                </button>
            `
                : ''
            }
        </div>
    `
}

function closeSupplierModal() {
  const overlay = document.getElementById('supplier-modal-overlay')
  if (!overlay) return
  // Remove attached handlers if any
  try {
    const handlers = overlay._supplierModalHandlers
    if (handlers) {
      if (handlers.overlayClickHandler)
        overlay.removeEventListener('click', handlers.overlayClickHandler)
      if (handlers.escHandler)
        document.removeEventListener('keydown', handlers.escHandler)
      // remove supplierNameHandler if present
      if (
        handlers.supplierNameHandler &&
        handlers.supplierNameHandler.el &&
        handlers.supplierNameHandler.fn
      ) {
        try {
          handlers.supplierNameHandler.el.removeEventListener(
            'input',
            handlers.supplierNameHandler.fn
          )
        } catch (e) {}
      }
      delete overlay._supplierModalHandlers
    }
  } catch (e) {}

  overlay.classList.remove('active')
  // Clear content and let garbage collection remove attached listeners on elements
  const content = overlay.querySelector('.modal-content')
  if (content) content.innerHTML = ''
}

function saveSupplier(mode = 'create', index = null) {
  const name = document.getElementById('supplier-name-input')?.value || ''
  const address = document.getElementById('supplier-address-input')?.value || ''
  const tin = document.getElementById('supplier-tin-input')?.value || ''
  const contact = document.getElementById('supplier-contact-input')?.value || ''
  const email = document.getElementById('supplier-email-input')?.value || ''

  if (!name.trim()) {
    alert('Supplier name is required')
    return
  }

  if (!AppState.suppliers) AppState.suppliers = []
  const payload = {
    name: name.trim(),
    address: address.trim(),
    tin: tin.trim(),
    contact: contact.trim(),
    email: email.trim(),
    // include optional geo coordinates when provided
    latitude:
      (document.getElementById('supplier-lat-input')?.value || '').trim() ||
      null,
    longitude:
      (document.getElementById('supplier-lng-input')?.value || '').trim() ||
      null,
  }

  ;(async () => {
    // Disable save button and show spinner
    try {
      const modal = document.getElementById('supplier-modal-overlay')
      const saveBtn = modal?.querySelector('[data-action="supplier-save"]')
      if (saveBtn) {
        saveBtn.setAttribute('data-loading', 'true')
        const spinner = saveBtn.querySelector('.spinner')
        const text = saveBtn.querySelector('.save-text')
        if (spinner) spinner.style.display = 'inline-block'
        if (text) text.style.opacity = '0.6'
      }
    } catch (e) {}

    try {
      if (mode === 'create' || !index) {
        const res = await fetch('/api/suppliers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw res
        const createdBody = await res.json()
        // server may return created supplier object directly or inside data
        const created = createdBody.data || createdBody || {}
        // ensure coords from payload are preserved if server doesn't echo them
        created.latitude = created.latitude || payload.latitude || null
        created.longitude = created.longitude || payload.longitude || null
        AppState.suppliers = [created, ...(AppState.suppliers || [])]
        showAlert('Supplier added successfully', 'success')
      } else {
        const res = await fetch(`/api/suppliers/${index}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw res
        const updatedBody = await res.json()
        const updated = updatedBody.data || updatedBody || {}
        updated.latitude = updated.latitude || payload.latitude || null
        updated.longitude = updated.longitude || payload.longitude || null
        AppState.suppliers = (AppState.suppliers || []).map((s) =>
          String(s.id) === String(updated.id) ? updated : s
        )
        showAlert('Supplier updated successfully', 'success')
      }

      if (window.MockData) window.MockData.suppliers = AppState.suppliers

      const body = document.getElementById('suppliers-table-body')
      if (body) body.innerHTML = renderSuppliersRows()
      // restore save button state (in case modal stays open) and close modal
      try {
        const modal = document.getElementById('supplier-modal-overlay')
        const saveBtn = modal?.querySelector('[data-action="supplier-save"]')
        if (saveBtn) {
          saveBtn.setAttribute('data-loading', 'false')
          const spinner = saveBtn.querySelector('.spinner')
          const text = saveBtn.querySelector('.save-text')
          if (spinner) spinner.style.display = 'none'
          if (text) text.style.opacity = '1'
        }
      } catch (e) {}

      closeSupplierModal()
    } catch (err) {
      // restore save button on error
      try {
        const modal = document.getElementById('supplier-modal-overlay')
        const saveBtn = modal?.querySelector('[data-action="supplier-save"]')
        if (saveBtn) {
          saveBtn.setAttribute('data-loading', 'false')
          const spinner = saveBtn.querySelector('.spinner')
          const text = saveBtn.querySelector('.save-text')
          if (spinner) spinner.style.display = 'none'
          if (text) text.style.opacity = '1'
        }
      } catch (e) {}
      // Try to extract server message when possible
      try {
        if (err && typeof err.json === 'function') {
          const errJson = await err.json()
          const msg =
            errJson?.message ||
            (errJson?.errors ? JSON.stringify(errJson.errors) : null)
          showAlert(
            'Failed to save supplier: ' + (msg || 'Server error'),
            'error'
          )
        } else {
          showAlert('Failed to save supplier', 'error')
        }
      } catch (e) {
        showAlert('Failed to save supplier', 'error')
      }
    }
  })()
}

async function deleteSupplier(id) {
  if (!id) return

  // Use the app's confirm modal for consistent UI
  try {
    const ok = await showConfirm('Delete this supplier?', 'Confirm Deletion')
    if (!ok) return
  } catch (e) {
    // Fallback to native confirm if showConfirm fails
    try {
      if (!confirm('Delete this supplier?')) return
    } catch (err) {
      return
    }
  }

  try {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
    })
    if (!res.ok) throw res
    AppState.suppliers = (AppState.suppliers || []).filter(
      (s) => String(s.id) !== String(id)
    )
    if (window.MockData) window.MockData.suppliers = AppState.suppliers
    const body = document.getElementById('suppliers-table-body')
    if (body) body.innerHTML = renderSuppliersRows()
    showAlert('Supplier deleted successfully', 'success')
  } catch (e) {
    // Try to extract server message when possible
    try {
      if (e && typeof e.json === 'function') {
        const errJson = await e.json()
        const msg =
          errJson?.message ||
          (errJson?.errors ? JSON.stringify(errJson.errors) : null)
        showAlert(
          'Failed to delete supplier: ' + (msg || 'Server error'),
          'error'
        )
      } else {
        showAlert('Failed to delete supplier', 'error')
      }
    } catch (ex) {
      showAlert('Failed to delete supplier', 'error')
    }
  }
}

async function loadSuppliersFromAPI() {
  try {
    const res = await fetch('/api/suppliers', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
    })
    if (!res.ok) throw res
    const payload = await res.json()
    // If paginated, take data
    const items = Array.isArray(payload)
      ? payload
      : payload.data || payload.items || []
    AppState.suppliers = items
    if (window.MockData) window.MockData.suppliers = AppState.suppliers
    const body = document.getElementById('suppliers-table-body')
    if (body) body.innerHTML = renderSuppliersRows()
  } catch (e) {
    // fallback to MockData if API unavailable
    if (window.MockData && Array.isArray(window.MockData.suppliers)) {
      AppState.suppliers = window.MockData.suppliers.slice()
      const body = document.getElementById('suppliers-table-body')
      if (body) body.innerHTML = renderSuppliersRows()
    }
  }
}

// Supplier helpers are intentionally NOT exposed globally anymore.
// The UI uses delegated event handlers and data-action attributes. If you
// must expose any function globally for legacy templates, re-add explicitly.

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
  // Filters: date range (not used for inventory mock) and categories
  const categories = [
    'All',
    ...(MockData.categories || []).map((c) => c.name || c.code || c.id),
  ]

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
                            <i data-lucide="folder" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            Categories
                        </label>
                        <select id="inventory-category-filter" class="form-select">
                            ${categories
                              .map((c) => `<option value="${c}">${c}</option>`)
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
  const uniqueSuppliers = [
    'All',
    ...[
      ...new Set(
        [
          ...(AppState.newRequests || []),
          ...(AppState.pendingRequests || []),
          ...(AppState.completedRequests || []),
        ]
          .map((r) => r.supplier)
          .filter(Boolean)
      ),
    ],
  ]

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
                            <i data-lucide="truck" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            Supplier
                        </label>
                        <select id="requisition-supplier-filter" class="form-select">
                            ${uniqueSuppliers
                              .map((s) => `<option value="${s}">${s}</option>`)
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
                                    s && typeof s === 'string'
                                      ? s.charAt(0).toUpperCase() + s.slice(1)
                                      : s || ''
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
            <div class="card chart-card status-chart-card">
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
                <th>Request ID</th>
                <th>Item</th>
                <th>Priority</th>
                <th>Requester</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Department</th>
                <th>Updated</th>
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
      typeof i.unit_cost === 'number' ? i.unit_cost : i.unitPrice || 0,
      typeof i.totalValue === 'number'
        ? i.totalValue
        : (typeof i.quantity === 'number' ? i.quantity : i.currentStock || 0) *
          (i.unit_cost || i.unitPrice || 0),
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

  // Filters (category placeholder & future date filters). Products currently lack category & date metadata.
  const category =
    document.getElementById('inventory-category-filter')?.value || 'All'
  const from = document.getElementById('inventory-date-from')?.value
  const to = document.getElementById('inventory-date-to')?.value

  // Source of truth: live products mutated by Stock In/Out
  let products = (MockData.products || []).map((p) => ({ ...p }))

  // (Future) Category/date filters could be applied here when fields exist
  if (category && category !== 'All') {
    products = products.filter((p) =>
      (p.category || '').toLowerCase().includes(category.toLowerCase())
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
        typeof p.unit_cost === 'number' ? p.unit_cost : p.unitPrice || 0
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

  const supplier =
    document.getElementById('requisition-supplier-filter')?.value || 'All'
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

  // supplier filter
  if (supplier && supplier !== 'All')
    all = all.filter((r) =>
      (r.supplier || '').toLowerCase().includes(supplier.toLowerCase())
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

  // Create dynamic gradients based on data values
  const gradients = labels.map((label, index) => {
    const value = data[index] || 0
    const maxValue = Math.max(...data)
    const intensity = maxValue > 0 ? value / maxValue : 0

    return (context) => {
      const { chart } = context
      const { ctx: c, chartArea } = chart
      if (!chartArea) return '#6366f1'
      const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)

      // Dynamic color based on value intensity
      if (intensity > 0.8) {
        g.addColorStop(0, '#dc2626') // red-600
        g.addColorStop(0.5, '#ef4444') // red-500
        g.addColorStop(1, '#f87171') // red-400
      } else if (intensity > 0.6) {
        g.addColorStop(0, '#ea580c') // orange-600
        g.addColorStop(0.5, '#f97316') // orange-500
        g.addColorStop(1, '#fb923c') // orange-400
      } else if (intensity > 0.4) {
        g.addColorStop(0, '#ca8a04') // yellow-600
        g.addColorStop(0.5, '#eab308') // yellow-500
        g.addColorStop(1, '#facc15') // yellow-400
      } else if (intensity > 0.2) {
        g.addColorStop(0, '#16a34a') // green-600
        g.addColorStop(0.5, '#22c55e') // green-500
        g.addColorStop(1, '#4ade80') // green-400
      } else {
        g.addColorStop(0, '#0891b2') // cyan-600
        g.addColorStop(0.5, '#06b6d4') // cyan-500
        g.addColorStop(1, '#22d3ee') // cyan-400
      }
      return g
    }
  })

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
            const idx = context.dataIndex
            return gradients[idx] ? gradients[idx](context) : '#6366f1'
          },
          borderColor: (context) => {
            const idx = context.dataIndex
            const value = data[idx] || 0
            const maxValue = Math.max(...data)
            const intensity = maxValue > 0 ? value / maxValue : 0

            if (intensity > 0.8) return '#dc2626'
            if (intensity > 0.6) return '#ea580c'
            if (intensity > 0.4) return '#ca8a04'
            if (intensity > 0.2) return '#16a34a'
            return '#0891b2'
          },
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverBorderColor: (context) => {
            const idx = context.dataIndex
            const value = data[idx] || 0
            const maxValue = Math.max(...data)
            const intensity = maxValue > 0 ? value / maxValue : 0

            if (intensity > 0.8) return '#b91c1c'
            if (intensity > 0.6) return '#c2410c'
            if (intensity > 0.4) return '#a16207'
            if (intensity > 0.2) return '#15803d'
            return '#0e7490'
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 20, bottom: 20, left: 10, right: 10 } },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7280',
            font: { size: 11, weight: '500' },
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)', lineWidth: 1 },
          ticks: {
            color: '#6b7280',
            font: { size: 11, weight: '500' },
            callback: (v) => formatCurrency(v),
            padding: 8,
          },
          border: { display: false },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#111827',
            font: { weight: '600', size: 12 },
            usePointStyle: true,
            pointStyle: 'rectRounded',
          },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (context) => {
              const idx = context[0].dataIndex
              const value = data[idx] || 0
              const maxValue = Math.max(...data)
              const intensity = maxValue > 0 ? value / maxValue : 0
              let status = 'Low'
              if (intensity > 0.8) status = 'Very High'
              else if (intensity > 0.6) status = 'High'
              else if (intensity > 0.4) status = 'Medium-High'
              else if (intensity > 0.2) status = 'Medium'
              return `${context[0].label} (${status} Value)`
            },
            label: (context) => {
              const value = context.raw
              const maxValue = Math.max(...data)
              const percentage =
                maxValue > 0 ? ((value / maxValue) * 100).toFixed(1) : '0.0'
              return [
                `Amount: ${formatCurrency(value)}`,
                `Percentage: ${percentage}% of max`,
                `Rank: ${data.filter((v) => v > value).length + 1} of ${
                  data.length
                } suppliers`,
              ]
            },
          },
        },
        title: {
          display: true,
          text: 'Requisition Totals by Supplier',
          color: '#111827',
          font: { weight: '700', size: 16 },
          padding: { top: 10, bottom: 20 },
        },
        valueDataLabels: {
          display: true,
          format: 'currency',
          color: '#ffffff',
          font: { weight: 'bold', size: 11 },
          anchor: 'center',
          align: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: 4,
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
        delay: (context) => context.dataIndex * 50, // Staggered animation
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor =
          activeElements.length > 0 ? 'pointer' : 'default'
        if (activeElements.length > 0) {
          const dataIndex = activeElements[0].index
          const bar = activeElements[0].element
          // Add subtle glow effect on hover
          if (bar && bar.options) {
            bar.options.borderWidth = 4
            bar.options.shadowBlur = 15
            bar.options.shadowColor = (() => {
              const value = data[dataIndex] || 0
              const maxValue = Math.max(...data)
              const intensity = maxValue > 0 ? value / maxValue : 0

              if (intensity > 0.8) return '#dc2626'
              if (intensity > 0.6) return '#ea580c'
              if (intensity > 0.4) return '#ca8a04'
              if (intensity > 0.2) return '#16a34a'
              return '#0891b2'
            })()
          }
        }
      },
      onLeave: (event, activeElements) => {
        // Reset glow effect when leaving
        if (activeElements.length === 0) {
          event.native.target.style.cursor = 'default'
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index
          const supplierName = labels[dataIndex]
          const totalAmount = data[dataIndex]

          // Create a detailed supplier info popup
          showSupplierDetailPopup(
            supplierName,
            totalAmount,
            dataIndex + 1,
            data.length
          )
        }
      },
    },
    plugins: [ValueDataLabelsPlugin],
  })
}

// Function to show detailed supplier information popup
function showSupplierDetailPopup(
  supplierName,
  totalAmount,
  rank,
  totalSuppliers
) {
  // Remove existing popup if any
  const existing = document.getElementById('supplier-detail-popup')
  if (existing) existing.remove()

  const popup = document.createElement('div')
  popup.id = 'supplier-detail-popup'
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 1000;
    max-width: 450px;
    width: 90%;
    padding: 24px;
    border: 1px solid #e5e7eb;
  `

  // Determine color based on rank
  const rankPercentage = (rank / totalSuppliers) * 100
  let statusColor, statusBg, statusText, iconName
  if (rankPercentage <= 25) {
    statusColor = '#dc2626'
    statusBg = '#fef2f2'
    statusText = 'Top Performer'
    iconName = 'trophy'
  } else if (rankPercentage <= 50) {
    statusColor = '#ea580c'
    statusBg = '#fff7ed'
    statusText = 'High Performer'
    iconName = 'star'
  } else if (rankPercentage <= 75) {
    statusColor = '#ca8a04'
    statusBg = '#fffbeb'
    statusText = 'Medium Performer'
    iconName = 'trending-up'
  } else {
    statusColor = '#16a34a'
    statusBg = '#f0fdf4'
    statusText = 'Growing Supplier'
    iconName = 'trending-up'
  }

  popup.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
      <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">Supplier Details</h3>
      <button onclick="this.closest('#supplier-detail-popup').remove()" style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px;">
        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
      </button>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">${supplierName}</div>
      <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 6px; background: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 500;">
        <i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i>
        ${statusText}
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Amount</div>
        <div style="font-size: 24px; font-weight: 700; color: #111827;">${formatCurrency(
          totalAmount
        )}</div>
        <div style="font-size: 12px; color: #6b7280;">₱ Philippine Peso</div>
      </div>
      <div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Ranking</div>
        <div style="font-size: 24px; font-weight: 700; color: #111827;">#${rank}</div>
        <div style="font-size: 12px; color: #6b7280;">of ${totalSuppliers} suppliers</div>
      </div>
    </div>

    <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Performance Summary</div>
      <div style="font-size: 14px; color: #111827;">
        This supplier ranks ${rank} out of ${totalSuppliers} suppliers by total requisition amount.
        ${
          rank === 1
            ? 'They are the top supplier by volume.'
            : `They are performing ${
                rankPercentage <= 50 ? 'above' : 'below'
              } average compared to other suppliers.`
        }
      </div>
    </div>
  `

  document.body.appendChild(popup)
  lucide.createIcons()

  // Add click outside to close
  setTimeout(() => {
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target)) {
        popup.remove()
        document.removeEventListener('click', closePopup)
      }
    })
  }, 0)
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

  // render status chart (summary still used for chart)
  renderStatusChart(Object.keys(summary), Object.values(summary))

  // Render each matching request as its own row so table has separate columns
  const rowsHtml = all
    .map(
      (r) => `
        <tr>
            <td><a href="#" onclick="viewStatusRequestDetails('${
              r.id
            }'); return false;" style="color:#dc2626; text-decoration:underline;">${
        r.id || ''
      }</a></td>
            <td>${r.item || '-'}</td>
            <td><span class="${getBadgeClass(
              r.priority || 'low',
              'priority'
            )}" style="padding:2px 8px; border-radius:6px; font-size:12px;">${capitalize(
        r.priority || 'low'
      )}</span></td>
            <td>${r.requester || '-'}</td>
            <td>${r.cost ? formatCurrency(r.cost) : '-'}</td>
            <td style="text-transform: capitalize; font-weight: 500;">${
              r.status || '-'
            }</td>
            <td>${r.department || '-'}</td>
            <td>${r.updatedAt || '-'}</td>
        </tr>
    `
    )
    .join('')

  tbody.innerHTML =
    rowsHtml || '<tr><td colspan="8">No requests found</td></tr>'
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

// Enhanced Value Data Labels Plugin with better styling
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
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font =
      pluginOptions?.font ||
      'bold 11px system-ui, -apple-system, Segoe UI, Roboto, Arial'

    meta.data.forEach((el, i) => {
      const raw = chart.data?.datasets?.[datasetIndex]?.data?.[i]
      if (raw === undefined || raw === null) return
      const format = chart.options?.plugins?.valueDataLabels?.format
      const text =
        format === 'currency' ? formatCurrency(raw) : numberWithCommas(raw)

      // Position at center of bar
      const x = el.x
      const y = el.y + el.height / 2

      // Draw background for better readability
      const padding = 4
      const textWidth = ctx.measureText(text).width
      const bgColor = pluginOptions?.backgroundColor || 'rgba(0, 0, 0, 0.15)'
      const borderRadius = pluginOptions?.borderRadius || 3

      // Draw rounded background
      ctx.fillStyle = bgColor
      ctx.beginPath()
      ctx.roundRect(
        x - textWidth / 2 - padding,
        y - 8,
        textWidth + padding * 2,
        16,
        borderRadius
      )
      ctx.fill()

      // Draw text
      ctx.fillStyle = pluginOptions?.color || '#ffffff'
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
// Function to show detailed product information popup
function showProductDetailPopup(
  productName,
  stockLevel,
  isLowStock,
  threshold
) {
  // Remove existing popup if any
  const existing = document.getElementById('product-detail-popup')
  if (existing) existing.remove()

  const popup = document.createElement('div')
  popup.id = 'product-detail-popup'
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 1000;
    max-width: 400px;
    width: 90%;
    padding: 24px;
    border: 1px solid #e5e7eb;
  `

  const statusColor = isLowStock ? '#dc2626' : '#059669'
  const statusBg = isLowStock ? '#fef2f2' : '#f0fdf4'
  const statusText = isLowStock ? 'Low Stock Alert' : 'Adequate Stock'

  popup.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
      <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">Product Details</h3>
      <button onclick="this.closest('#product-detail-popup').remove()" style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px;">
        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
      </button>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">${productName}</div>
      <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 6px; background: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 500;">
        <i data-lucide="${
          isLowStock ? 'alert-triangle' : 'check-circle'
        }" style="width: 14px; height: 14px;"></i>
        ${statusText}
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Current Stock</div>
        <div style="font-size: 24px; font-weight: 700; color: #111827;">${numberWithCommas(
          stockLevel
        )}</div>
        <div style="font-size: 12px; color: #6b7280;">units</div>
      </div>
      <div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Threshold</div>
        <div style="font-size: 24px; font-weight: 700; color: #111827;">${numberWithCommas(
          threshold
        )}</div>
        <div style="font-size: 12px; color: #6b7280;">units</div>
      </div>
    </div>

    <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Stock Status</div>
      <div style="font-size: 14px; color: #111827;">
        ${
          stockLevel <= threshold
            ? `⚠️ Stock level is below the minimum threshold of ${numberWithCommas(
                threshold
              )} units. Consider restocking soon.`
            : `✅ Stock level is adequate with ${numberWithCommas(
                stockLevel - threshold
              )} units above the minimum threshold.`
        }
      </div>
    </div>
  `

  document.body.appendChild(popup)
  lucide.createIcons()

  // Add click outside to close
  setTimeout(() => {
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target)) {
        popup.remove()
        document.removeEventListener('click', closePopup)
      }
    })
  }, 0)
}

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

  // Enhanced Threshold Line Plugin with better styling
  const ThresholdLinePlugin = {
    id: 'thresholdLine',
    afterDatasetsDraw(chart) {
      if (threshold == null) return
      const { ctx, chartArea, scales } = chart
      if (!chartArea || !scales?.y) return
      const y = scales.y.getPixelForValue(threshold)
      ctx.save()

      // Draw threshold line with gradient effect
      const gradient = ctx.createLinearGradient(
        chartArea.left,
        y,
        chartArea.right,
        y
      )
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0)')
      gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.8)')
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)')

      ctx.strokeStyle = gradient
      ctx.setLineDash([8, 4])
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(chartArea.left, y)
      ctx.lineTo(chartArea.right, y)
      ctx.stroke()

      // Add threshold label with background
      ctx.setLineDash([])
      ctx.fillStyle = '#dc2626'
      ctx.font = 'bold 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
      const label = `Low Stock Threshold: ${numberWithCommas(threshold)}`
      const labelWidth = ctx.measureText(label).width
      const labelX = chartArea.right - labelWidth - 8
      const labelY = y - 8

      // Draw label background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.fillRect(labelX - 4, labelY - 14, labelWidth + 8, 18)
      ctx.strokeStyle = '#dc2626'
      ctx.lineWidth = 1
      ctx.strokeRect(labelX - 4, labelY - 14, labelWidth + 8, 18)

      // Draw label text
      ctx.fillStyle = '#dc2626'
      ctx.fillText(label, labelX, labelY)

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
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 50,
          backgroundColor: (context) => {
            const idx = context?.dataIndex ?? 0
            const low = !!lowMask[idx]
            const { chart } = context
            const { ctx: c, chartArea } = chart
            if (!chartArea) return low ? '#f87171' : '#10b981'

            const g = c.createLinearGradient(
              0,
              chartArea.bottom,
              0,
              chartArea.top
            )
            if (low) {
              // Enhanced low stock gradient (red to orange)
              g.addColorStop(0, '#f87171') // red-400
              g.addColorStop(0.5, '#fb923c') // orange-400
              g.addColorStop(1, '#dc2626') // red-600
            } else {
              // Enhanced normal stock gradient (green to teal)
              g.addColorStop(0, '#10b981') // emerald-500
              g.addColorStop(0.5, '#14b8a6') // teal-500
              g.addColorStop(1, '#059669') // emerald-600
            }
            return g
          },
          borderColor: (context) => {
            const idx = context?.dataIndex ?? 0
            return !!lowMask[idx] ? '#dc2626' : '#059669'
          },
          borderWidth: 1,
          hoverBorderWidth: 2,
          hoverBorderColor: (context) => {
            const idx = context?.dataIndex ?? 0
            return !!lowMask[idx] ? '#b91c1c' : '#047857'
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 20, bottom: 20, left: 10, right: 10 } },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7280',
            font: { size: 11, weight: '500' },
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.04)', lineWidth: 1 },
          ticks: {
            color: '#6b7280',
            font: { size: 11, weight: '500' },
            callback: (v) => numberWithCommas(v),
            padding: 8,
          },
          border: { display: false },
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#111827',
            font: { weight: '600', size: 12 },
            usePointStyle: true,
            pointStyle: 'rectRounded',
          },
          position: 'top',
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (context) => {
              const idx = context[0].dataIndex
              const low = !!lowMask[idx]
              return `${context[0].label} ${low ? '(Low Stock)' : ''}`
            },
            label: (context) => {
              const value = context.raw
              const threshold = opts.threshold || 0
              const status =
                value <= threshold ? '⚠️ Low Stock' : '✅ Adequate Stock'
              return [
                `Stock: ${numberWithCommas(value)} units`,
                `Status: ${status}`,
                `Threshold: ${numberWithCommas(threshold)} units`,
              ]
            },
          },
        },
        title: {
          display: true,
          text:
            opts?.totalItems && opts?.topN && opts.totalItems > opts.topN
              ? `Top ${opts.topN} Products by Stock (${opts.totalItems} total products)`
              : 'Product Stock Levels',
          color: '#111827',
          font: { weight: '700', size: 16 },
          padding: { top: 10, bottom: 20 },
        },
        valueDataLabels: {
          display: true,
          format: 'number',
          color: '#ffffff',
          font: { weight: 'bold', size: 11 },
          anchor: 'center',
          align: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: 4,
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
        delay: (context) => context.dataIndex * 50, // Staggered animation
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor =
          activeElements.length > 0 ? 'pointer' : 'default'
        if (activeElements.length > 0) {
          const dataIndex = activeElements[0].index
          const bar = activeElements[0].element
          // Add subtle glow effect on hover
          if (bar && bar.options) {
            bar.options.borderWidth = 3
            bar.options.shadowBlur = 10
            bar.options.shadowColor = !!lowMask[dataIndex]
              ? '#dc2626'
              : '#059669'
          }
        }
      },
      onLeave: (event, activeElements) => {
        // Reset glow effect when leaving
        if (activeElements.length === 0) {
          event.native.target.style.cursor = 'default'
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index
          const productName = labels[dataIndex]
          const stockLevel = data[dataIndex]
          const isLowStock = !!lowMask[dataIndex]
          const threshold = opts.threshold || 0

          // Create a detailed info popup
          showProductDetailPopup(productName, stockLevel, isLowStock, threshold)
        }
      },
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

  // Generate enhanced colors and gradients based on status labels
  const statusConfigs = labels.map((label) => {
    const status = label.toLowerCase()
    const baseColor = getStatusColor(status)

    // Create gradient for each status
    const gradient = (context) => {
      const { chart } = context
      const { ctx: c, chartArea } = chart
      if (!chartArea) return baseColor

      const g = c.createLinearGradient(
        chartArea.left,
        chartArea.top,
        chartArea.right,
        chartArea.bottom
      )

      // Different gradient patterns for different statuses
      if (
        status.includes('active') ||
        status.includes('completed') ||
        status.includes('approved')
      ) {
        g.addColorStop(0, baseColor)
        g.addColorStop(0.5, lightenColor(baseColor, 20))
        g.addColorStop(1, baseColor)
      } else if (
        status.includes('pending') ||
        status.includes('under-review')
      ) {
        g.addColorStop(0, baseColor)
        g.addColorStop(0.5, baseColor)
        g.addColorStop(1, lightenColor(baseColor, 30))
      } else if (status.includes('cancelled') || status.includes('returned')) {
        g.addColorStop(0, darkenColor(baseColor, 20))
        g.addColorStop(0.5, baseColor)
        g.addColorStop(1, lightenColor(baseColor, 10))
      } else {
        g.addColorStop(0, baseColor)
        g.addColorStop(1, lightenColor(baseColor, 15))
      }

      return g
    }

    return {
      baseColor,
      gradient,
      borderColor: darkenColor(baseColor, 30),
      hoverColor: lightenColor(baseColor, 10),
    }
  })

  // Enhanced Doughnut Center Text Plugin with better styling
  const EnhancedDoughnutCenterTextPlugin = {
    id: 'enhancedDoughnutCenterText',
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

      // Draw outer circle background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.beginPath()
      ctx.arc(cx, cy, 45, 0, 2 * Math.PI)
      ctx.fill()

      // Draw inner circle border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, 40, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw total number
      ctx.textAlign = 'center'
      ctx.fillStyle = opts?.color || '#111827'
      ctx.font = 'bold 24px system-ui, -apple-system, Segoe UI, Roboto, Arial'
      ctx.fillText(numberWithCommas(total), cx, cy - 5)

      // Draw "Total" label
      ctx.font = '600 12px system-ui, -apple-system, Segoe UI, Roboto, Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('Total Requests', cx, cy + 15)

      ctx.restore()
    },
  }

  __statusChartInstance = new Chart(ctx.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: (context) => {
            const idx = context.dataIndex
            return statusConfigs[idx]?.gradient(context) || '#6366f1'
          },
          borderColor: statusConfigs.map((config) => config.borderColor),
          borderWidth: 3,
          borderRadius: 8,
          hoverBorderWidth: 4,
          hoverBorderColor: statusConfigs.map((config) => config.hoverColor),
          hoverOffset: 8,
          shadowOffsetX: 0,
          shadowOffsetY: 4,
          shadowBlur: 12,
          shadowColor: 'rgba(0, 0, 0, 0.15)',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      layout: { padding: { top: 20, bottom: 20, left: 20, right: 20 } },
      plugins: {
        legend: {
          position: 'bottom',
          align: 'center',
          labels: {
            color: '#111827',
            font: { weight: '600', size: 13 },
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 20,
            generateLabels: (chart) => {
              const data = chart.data
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i]
                  const total = data.datasets[0].data.reduce((a, b) => a + b, 0)
                  const percentage = total
                    ? ((value / total) * 100).toFixed(1)
                    : '0.0'

                  return {
                    text: `${label}: ${numberWithCommas(
                      value
                    )} (${percentage}%)`,
                    fillStyle: statusConfigs[i]?.baseColor || '#6366f1',
                    strokeStyle: statusConfigs[i]?.borderColor || '#6366f1',
                    lineWidth: 2,
                    hidden: false,
                    index: i,
                  }
                })
              }
              return []
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          cornerRadius: 12,
          displayColors: true,
          padding: 16,
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          callbacks: {
            title: (context) => {
              return context[0].label
            },
            label: (context) => {
              const total = context.dataset.data.reduce(
                (a, b) => a + (Number(b) || 0),
                0
              )
              const val = Number(context.raw) || 0
              const pct = total ? ((val / total) * 100).toFixed(1) : '0.0'
              const status = context.label.toLowerCase()

              let statusEmoji = '📋'
              if (status.includes('completed') || status.includes('approved'))
                statusEmoji = '✅'
              else if (
                status.includes('pending') ||
                status.includes('under-review')
              )
                statusEmoji = '⏳'
              else if (status.includes('cancelled')) statusEmoji = '❌'
              else if (status.includes('active')) statusEmoji = '🔄'

              return [
                `${statusEmoji} Count: ${numberWithCommas(val)}`,
                `📊 Percentage: ${pct}%`,
                `🎯 Status: ${context.label}`,
              ]
            },
          },
        },
        title: {
          display: true,
          text: 'Request Status Distribution',
          color: '#111827',
          font: { weight: '700', size: 18 },
          padding: { top: 10, bottom: 30 },
        },
        enhancedDoughnutCenterText: { color: '#111827' },
      },
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1200,
        easing: 'easeOutQuart',
        delay: (context) => context.dataIndex * 100, // Staggered animation
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor =
          activeElements.length > 0 ? 'pointer' : 'default'

        if (activeElements.length > 0) {
          const dataIndex = activeElements[0].index
          const segment = activeElements[0].element

          // Add glow effect on hover
          if (segment && segment.options) {
            segment.options.borderWidth = 5
            segment.options.shadowBlur = 20
            segment.options.shadowColor =
              statusConfigs[dataIndex]?.hoverColor || '#6366f1'
          }

          // Show detailed popup
          showStatusDetailPopup(
            labels[dataIndex],
            data[dataIndex],
            dataIndex,
            data
          )
        }
      },
      onLeave: (event, activeElements) => {
        // Reset glow effect when leaving
        if (activeElements.length === 0) {
          event.native.target.style.cursor = 'default'
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dataIndex = elements[0].index
          const status = labels[dataIndex]
          const count = data[dataIndex]

          // Trigger status details modal
          showStatusDetails(status)
        }
      },
    },
    plugins: [EnhancedDoughnutCenterTextPlugin],
  })
}

// Helper functions for color manipulation
function lightenColor(color, percent) {
  // Convert hex to RGB
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  )
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) - amt
  const G = ((num >> 8) & 0x00ff) - amt
  const B = (num & 0x0000ff) - amt
  return (
    '#' +
    (
      0x1000000 +
      (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)
    )
      .toString(16)
      .slice(1)
  )
}

// Function to show detailed status information popup
function showStatusDetailPopup(status, count, index, allData) {
  // Remove existing popup if any
  const existing = document.getElementById('status-detail-popup')
  if (existing) existing.remove()

  const total = allData.reduce((a, b) => a + b, 0)
  const percentage = total ? ((count / total) * 100).toFixed(1) : '0.0'
  const statusColor = getStatusColor(status.toLowerCase())

  const popup = document.createElement('div')
  popup.id = 'status-detail-popup'
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 1000;
    max-width: 380px;
    width: 90%;
    padding: 24px;
    border: 1px solid #e5e7eb;
  `

  let statusEmoji = '📋'
  let statusDescription = 'Standard status'
  if (
    status.toLowerCase().includes('completed') ||
    status.toLowerCase().includes('approved')
  ) {
    statusEmoji = '✅'
    statusDescription = 'Successfully processed requests'
  } else if (
    status.toLowerCase().includes('pending') ||
    status.toLowerCase().includes('under-review')
  ) {
    statusEmoji = '⏳'
    statusDescription = 'Awaiting further action'
  } else if (status.toLowerCase().includes('cancelled')) {
    statusEmoji = '❌'
    statusDescription = 'Requests that were cancelled'
  } else if (status.toLowerCase().includes('active')) {
    statusEmoji = '🔄'
    statusDescription = 'Currently active requests'
  }

  popup.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
      <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">Status Details</h3>
      <button onclick="this.closest('#status-detail-popup').remove()" style="background: none; border: none; color: #6b7280; cursor: pointer; padding: 4px;">
        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
      </button>
    </div>

    <div style="margin-bottom: 16px;">
      <div style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px;">${status}</div>
      <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 6px; background: ${lightenColor(
        statusColor,
        40
      )}; color: ${statusColor}; font-size: 12px; font-weight: 500;">
        <span style="font-size: 14px;">${statusEmoji}</span>
        ${statusDescription}
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Count</div>
        <div style="font-size: 28px; font-weight: 700; color: #111827;">${numberWithCommas(
          count
        )}</div>
        <div style="font-size: 12px; color: #6b7280;">requests</div>
      </div>
      <div>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Percentage</div>
        <div style="font-size: 28px; font-weight: 700; color: ${statusColor};">${percentage}%</div>
        <div style="font-size: 12px; color: #6b7280;">of all requests</div>
      </div>
    </div>

    <div style="background: #f9fafb; padding: 16px; border-radius: 12px; border: 1px solid #e5e7eb;">
      <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Quick Stats</div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 14px; color: #111827;">Rank among statuses:</span>
        <span style="font-size: 14px; font-weight: 600; color: ${statusColor};">#${
    index + 1
  } of ${allData.length}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <span style="font-size: 14px; color: #111827;">Click to view details</span>
        <span style="font-size: 14px; font-weight: 600; color: #6b7280;">→</span>
      </div>
    </div>
  `

  document.body.appendChild(popup)
  lucide.createIcons()

  // Add click outside to close
  setTimeout(() => {
    document.addEventListener('click', function closePopup(e) {
      if (!popup.contains(e.target)) {
        popup.remove()
        document.removeEventListener('click', closePopup)
      }
    })
  }, 0)
}

// Hook filters and export buttons after page load
function initializeReportPageEvents(pageId) {
  if (pageId === 'inventory-reports') {
    document
      .getElementById('inventory-category-filter')
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
      .getElementById('requisition-supplier-filter')
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
                it.unit_cost || '0.00'
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
    .filter(
      (id) =>
        id &&
        typeof id === 'string' &&
        id.startsWith(prefix) &&
        id.length > prefix.length
    )
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
    (r) =>
      r.poNumber &&
      typeof r.poNumber === 'string' &&
      r.poNumber.startsWith(datePrefix)
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
    case 'suppliers':
      initSuppliersPageEvents()
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

// Settings Modal Function
function openSettingsModal() {
  const modal = document.createElement('div')
  modal.id = 'settings-modal'
  modal.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(17,24,39,0.6);backdrop-filter:blur(4px);z-index:2000;">
      <div style="background:#ffffff;border-radius:20px;max-width:500px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:32px 32px 24px;border-radius:20px 20px 0 0;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
            <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;">
              <i data-lucide="settings" style="width:28px;height:28px;"></i>
            </div>
            <div>
              <h2 style="margin:0;font-size:24px;font-weight:700;">App Settings</h2>
              <p style="margin:4px 0 0 0;opacity:0.9;font-size:14px;">Customize your dashboard experience</p>
            </div>
          </div>
        </div>

        <div style="padding:32px;">
          <div style="display:flex;flex-direction:column;gap:24px;">
            <!-- Theme Settings -->
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <div style="width:40px;height:40px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <i data-lucide="palette" style="width:20px;height:20px;color:white;"></i>
                </div>
                <div>
                  <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">Theme & Appearance</h3>
                  <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Customize the look and feel</p>
                </div>
              </div>
              <div style="display:flex;gap:12px;">
                <button class="theme-btn active" data-theme="light" style="padding:10px 16px;border:2px solid #3b82f6;background:#3b82f6;color:white;border-radius:8px;font-size:14px;font-weight:500;">Light Mode</button>
                <button class="theme-btn" data-theme="dark" style="padding:10px 16px;border:2px solid #e5e7eb;background:white;color:#374151;border-radius:8px;font-size:14px;font-weight:500;">Dark Mode</button>
                <button class="theme-btn" data-theme="auto" style="padding:10px 16px;border:2px solid #e5e7eb;background:white;color:#374151;border-radius:8px;font-size:14px;font-weight:500;">Auto</button>
              </div>
            </div>

            <!-- Notification Settings -->
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <div style="width:40px;height:40px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <i data-lucide="bell" style="width:20px;height:20px;color:white;"></i>
                </div>
                <div>
                  <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">Notifications</h3>
                  <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Manage notification preferences</p>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:12px;">
                <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                  <input type="checkbox" checked style="width:18px;height:18px;accent-color:#3b82f6;">
                  <span style="font-size:14px;color:#374151;">Email notifications for important updates</span>
                </label>
                <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                  <input type="checkbox" checked style="width:18px;height:18px;accent-color:#3b82f6;">
                  <span style="font-size:14px;color:#374151;">Browser notifications for new activities</span>
                </label>
                <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                  <input type="checkbox" style="width:18px;height:18px;accent-color:#3b82f6;">
                  <span style="font-size:14px;color:#374151;">Sound alerts for urgent notifications</span>
                </label>
              </div>
            </div>

            <!-- Dashboard Settings -->
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <div style="width:40px;height:40px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <i data-lucide="layout-dashboard" style="width:20px;height:20px;color:white;"></i>
                </div>
                <div>
                  <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">Dashboard Preferences</h3>
                  <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Customize your dashboard layout</p>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:12px;">
                <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                  <input type="checkbox" checked style="width:18px;height:18px;accent-color:#3b82f6;">
                  <span style="font-size:14px;color:#374151;">Show quick stats on dashboard</span>
                </label>
                <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                  <input type="checkbox" checked style="width:18px;height:18px;accent-color:#3b82f6;">
                  <span style="font-size:14px;color:#374151;">Display recent activity feed</span>
                </label>
                <label style="display:flex;align-items:center;gap:12px;cursor:pointer;">
                  <input type="checkbox" style="width:18px;height:18px;accent-color:#3b82f6;">
                  <span style="font-size:14px;color:#374151;">Auto-refresh dashboard data</span>
                </label>
              </div>
            </div>

            <!-- Data & Privacy -->
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <div style="width:40px;height:40px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <i data-lucide="shield" style="width:20px;height:20px;color:white;"></i>
                </div>
                <div>
                  <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">Data & Privacy</h3>
                  <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Manage your data and privacy settings</p>
                </div>
              </div>
              <div style="display:flex;gap:12px;">
                <button class="btn-secondary" style="padding:10px 16px;border:1px solid #d1d5db;background:white;color:#374151;border-radius:8px;font-size:14px;">Export Data</button>
                <button class="btn-secondary" style="padding:10px 16px;border:1px solid #d1d5db;background:white;color:#374151;border-radius:8px;font-size:14px;">Clear Cache</button>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:12px;margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
            <button class="btn-secondary" onclick="closeSettingsModal()" style="flex:1;padding:14px;border:2px solid #d1d5db;background:white;color:#374151;border-radius:10px;font-size:15px;font-weight:500;">Cancel</button>
            <button class="btn-primary" onclick="saveSettings()" style="flex:1;padding:14px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border:none;color:white;border-radius:10px;font-size:15px;font-weight:500;">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Add event listeners for theme buttons
  modal.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      modal
        .querySelectorAll('.theme-btn')
        .forEach((b) => b.classList.remove('active'))
      this.classList.add('active')
      // Remove active styling from others
      modal.querySelectorAll('.theme-btn').forEach((b) => {
        if (b !== this) {
          b.style.borderColor = '#e5e7eb'
          b.style.background = 'white'
          b.style.color = '#374151'
        }
      })
      // Add active styling to clicked button
      this.style.borderColor = '#3b82f6'
      this.style.background = '#3b82f6'
      this.style.color = 'white'
    })
  })

  // Close modal when clicking outside
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeSettingsModal()
    }
  })

  // Close on escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeSettingsModal()
      document.removeEventListener('keydown', escHandler)
    }
  })

  // Initialize Lucide icons
  setTimeout(() => {
    if (window.lucide) lucide.createIcons()
  }, 10)
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal')
  if (modal) {
    modal.remove()
  }
}

function saveSettings() {
  // Here you would typically save the settings to localStorage or send to server
  showAlert('Settings saved successfully!', 'success')
  closeSettingsModal()
}

// Generate full-page Settings view (same sections as the modal, but full-page)
function generateSettingsPage() {
  return `
    <div class="page-header">
      <div class="page-header-content">
        <div>
          <h1 class="page-title">
            <i data-lucide="settings" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
            Settings
          </h1>
          <p class="page-subtitle">Customize your application preferences</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn-secondary" onclick="navigateToPage('dashboard')" aria-label="Back to dashboard" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;font-size:13px;font-weight:600;line-height:1;border-radius:8px;">
            <i data-lucide="arrow-left" style="width:16px;height:16px;margin:-1px 0 0 0;"></i>
            <span style="pointer-events:none;">Back</span>
          </button>
        </div>
      </div>
    </div>

    <div class="page-content">
      <div style="max-width:980px;margin:0 auto;">
        <div style="display:flex;flex-direction:column;gap:20px;">
          <!-- Theme & Appearance -->
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;">
                <i data-lucide="palette" style="width:20px;height:20px;color:white;"></i>
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">Theme & Appearance</h3>
                <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Customize the look and feel</p>
              </div>
            </div>
            <div style="display:flex;gap:12px;">
              <button class="theme-btn active" data-theme="light" onclick="document.querySelectorAll('.theme-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="padding:10px 16px;border:2px solid #3b82f6;background:#3b82f6;color:white;border-radius:8px;font-size:14px;font-weight:500;">Light Mode</button>
              <button class="theme-btn" data-theme="dark" onclick="document.querySelectorAll('.theme-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="padding:10px 16px;border:2px solid #e5e7eb;background:white;color:#374151;border-radius:8px;font-size:14px;font-weight:500;">Dark Mode</button>
              <button class="theme-btn" data-theme="auto" onclick="document.querySelectorAll('.theme-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active');" style="padding:10px 16px;border:2px solid #e5e7eb;background:white;color:#374151;border-radius:8px;font-size:14px;font-weight:500;">Auto</button>
            </div>
          </div>

          <!-- Notifications -->
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;">
                <i data-lucide="bell" style="width:20px;height:20px;color:white;"></i>
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">Notifications</h3>
                <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Manage notification preferences</p>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <label style="display:flex;align-items:center;gap:12px;cursor:pointer;"><input type="checkbox" checked style="width:18px;height:18px;accent-color:#3b82f6;"><span style="font-size:14px;color:#374151;">Email notifications for important updates</span></label>
              <label style="display:flex;align-items:center;gap:12px;cursor:pointer;"><input type="checkbox" checked style="width:18px;height:18px;accent-color:#3b82f6;"><span style="font-size:14px;color:#374151;">Browser notifications for new activities</span></label>
              <label style="display:flex;align-items:center;gap:12px;cursor:pointer;"><input type="checkbox" style="width:18px;height:18px;accent-color:#3b82f6;"><span style="font-size:14px;color:#374151;">Sound alerts for urgent notifications</span></label>
            </div>
          </div>

          <!-- Dashboard Preferences -->
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;">
                <i data-lucide="layout-dashboard" style="width:20px;height:20px;color:white;"></i>
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">Dashboard Preferences</h3>
                <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Customize your dashboard layout</p>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <label style="display:flex;align-items:center;gap:12px;cursor:pointer;"><input type="checkbox" checked style="width:18px;height:18px;accent-color:#3b82f6;"><span style="font-size:14px;color:#374151;">Show quick stats on dashboard</span></label>
              <label style="display:flex;align-items:center;gap:12px;cursor:pointer;"><input type="checkbox" checked style="width:18px;height:18px;accent-color:#3b82f6;"><span style="font-size:14px;color:#374151;">Display recent activity feed</span></label>
              <label style="display:flex;align-items:center;gap:12px;cursor:pointer;"><input type="checkbox" style="width:18px;height:18px;accent-color:#3b82f6;"><span style="font-size:14px;color:#374151;">Auto-refresh dashboard data</span></label>
            </div>
          </div>

          <!-- Data & Privacy -->
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:44px;height:44px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;">
                <i data-lucide="shield" style="width:20px;height:20px;color:white;"></i>
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:600;color:#111827;">Data & Privacy</h3>
                <p style="margin:4px 0 0 0;font-size:13px;color:#6b7280;">Manage your data and privacy settings</p>
              </div>
            </div>
            <div style="display:flex;gap:12px;">
              <button class="btn-secondary" style="padding:10px 16px;border:1px solid #d1d5db;background:white;color:#374151;border-radius:8px;font-size:14px;">Export Data</button>
              <button class="btn-secondary" style="padding:10px 16px;border:1px solid #d1d5db;background:white;color:#374151;border-radius:8px;font-size:14px;">Clear Cache</button>
            </div>
          </div>

          <div style="display:flex;gap:12px;margin-top:20px;justify-content:flex-end;">
            <button class="btn-secondary" onclick="navigateToPage('dashboard')" style="padding:12px 20px;border:2px solid #d1d5db;background:white;color:#374151;border-radius:10px;font-size:15px;font-weight:500;">Cancel</button>
            <button class="btn-primary" onclick="saveSettings();" style="padding:12px 20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border:none;color:white;border-radius:10px;font-size:15px;font-weight:500;">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `
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
  // Initialize MockData if not exists (for backward compatibility)
  if (!window.MockData) window.MockData = {}
  if (!window.MockData.users) window.MockData.users = []

  // Fetch users from API synchronously
  try {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/api/users', false) // synchronous
    xhr.send()
    if (xhr.status === 200) {
      const apiUsers = JSON.parse(xhr.responseText)
      window.MockData.users = apiUsers.map((user) => ({
        id: user.id || '',
        group: 'Group Juan', // Default group
        name: user.name || 'Unknown',
        role: user.role || 'User',
        email: user.email || '',
        status:
          user.status === 'pending_activation'
            ? 'Pending'
            : user.status === 'active'
            ? 'Active'
            : 'Inactive',
        created: user.created_at
          ? new Date(user.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      }))
    }
  } catch (e) {
    console.error('Error fetching users:', e)
    // Use existing MockData
  }

  // Calculate statistics
  const totalMembers = window.MockData.users.length
  const activeMembers = window.MockData.users.filter(
    (m) => m.status === 'Active'
  ).length

  return renderRolesManagementPage(
    totalMembers,
    activeMembers,
    window.MockData.users
  )
}

function renderRolesManagementPage(
  totalMembers,
  activeMembers,
  membersToRender
) {
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
                            <tr data-user-id="${
                              member.id
                            }" style="transition: all 0.2s;">
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
    role: roleInput ? roleInput.value : 'User',
    status: statusInput ? statusInput.value : 'Active',
    created: createdInput
      ? createdInput.value || new Date().toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  }

  if (!userId) {
    // --- CREATE NEW USER ---
    // Make API call to create user and send email
    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        role: userData.role,
      }),
    })
      .then(async (response) => {
        // Try to parse JSON only when the response is JSON; otherwise capture text
        const contentType = (
          response.headers.get('content-type') || ''
        ).toLowerCase()
        let payload = null
        if (contentType.includes('application/json')) {
          try {
            payload = await response.json()
          } catch (e) {
            payload = null
          }
        } else {
          // Non-JSON (likely an HTML error page). Read text and create a friendly message.
          const text = await response.text().catch(() => '')
          const stripped = text
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          payload = {
            htmlError: stripped || 'Server returned an HTML error page',
          }
        }

        if (!response.ok) {
          // If Laravel validation failed, it typically returns 422 with { message, errors: { field: [msg] } }
          if (response.status === 422 && payload && payload.errors) {
            const messages = []
            Object.keys(payload.errors).forEach((field) => {
              const arr = payload.errors[field]
              if (Array.isArray(arr)) {
                arr.forEach((m) => messages.push(`${field}: ${m}`))
              } else if (arr) {
                messages.push(`${field}: ${arr}`)
              }
            })
            const msg =
              messages.join('\n') || payload.message || 'Validation failed'
            const err = new Error(msg)
            err.status = response.status
            err.payload = payload
            throw err
          }

          const msg =
            (payload && (payload.message || payload.htmlError)) ||
            `Failed to create user (HTTP ${response.status})`
          const err = new Error(msg)
          err.status = response.status
          err.payload = payload
          throw err
        }

        return payload
      })
      .then((data) => {
        showAlert(
          `User ${userData.name} created successfully! An account setup email has been sent to ${userData.email}.`,
          'success'
        )
        closeUserModal()
        refreshRolesTable() // Refresh the table to reflect changes
      })
      .catch((error) => {
        // Surface clearer error messages (server HTML, validation message, network errors)
        console.error('Error creating user:', error)
        const msg =
          (error && error.message) || 'Failed to create user. Please try again.'
        showAlert(msg, 'error')
      })
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
    // For now, keep the MockData update for existing users
    // TODO: Implement API call for updating users when needed
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
  // Attempt server-side delete first so the database stays in sync
  try {
    const resp = await fetch(`/api/users/${memberId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!resp.ok) {
      // Try to read server message
      let msg = 'Failed to delete user on server.'
      try {
        const body = await resp.json()
        if (body && body.message) msg = body.message
      } catch (e) {
        /* ignore json parse error */
      }
      showAlert(msg, 'danger')
      return
    }
  } catch (err) {
    showAlert('Network error while deleting user.', 'danger')
    return
  }

  // If server delete succeeded, update client-side state & UI
  const user = window.MockData.users.find((u) => u.id === memberId)
  const userName = user ? user.name : 'User'

  // Remove from mock data
  window.MockData.users = window.MockData.users.filter((u) => u.id !== memberId)

  // Remove DOM row (use data-user-id which is robust against markup changes)
  const row = document.querySelector(`tr[data-user-id="${memberId}"]`)
  if (row && row.parentNode) {
    row.parentNode.removeChild(row)
  } else {
    // fallback: re-render the table from MockData
    refreshRolesTable()
  }

  // Show success toast
  showAlert(`${userName} has been successfully deleted`, 'success')
}

// Expose deleteMember for inline onclick handlers
window.deleteMember = deleteMember

function refreshRolesTable() {
  // Assuming your main content container has the ID 'main-content'
  const mainContentArea = document.getElementById('main-content')

  if (mainContentArea) {
    // Regenerate the entire page HTML using the updated client-side MockData.users
    // Avoid calling generateRolesManagementPage() here because it performs a
    // synchronous fetch to /api/users and would overwrite the client-side
    // MockData.users (undoing client deletions). Instead, render from the
    // current MockData snapshot.
    const users =
      window.MockData && Array.isArray(window.MockData.users)
        ? window.MockData.users
        : []

    const totalMembers = users.length
    const activeMembers = users.filter((m) => m.status === 'Active').length

    const newPageHTML = renderRolesManagementPage(
      totalMembers,
      activeMembers,
      users
    )

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
    <style>
      /* Hide empty icon placeholders until lucide replaces them with SVGs */
      .modal-header .icon-container i:empty { display: none; }

      /* Enhanced modal styles */
      .user-modal-header {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        border-bottom: none;
        padding: 40px 32px;
        position: relative;
        overflow: hidden;
      }

      .user-modal-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.03)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.03)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.02)"/><circle cx="10" cy="50" r="0.5" fill="rgba(255,255,255,0.02)"/><circle cx="90" cy="30" r="0.5" fill="rgba(255,255,255,0.02)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        pointer-events: none;
      }

      .user-avatar-container {
        width: 80px;
        height: 80px;
        background: rgba(255,255,255,0.15);
        border: 4px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      .user-avatar-container:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 40px rgba(0,0,0,0.15);
      }

      .user-avatar-initials {
        color: white;
        font-weight: 800;
        font-size: 24px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        letter-spacing: 1px;
      }

      .user-modal-title {
        color: white;
        font-size: 28px;
        margin-bottom: 8px;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        letter-spacing: -0.5px;
      }

      .user-modal-subtitle {
        color: rgba(255,255,255,0.95);
        font-size: 16px;
        margin: 0;
        font-weight: 400;
        opacity: 0.9;
      }

      .modal-close-enhanced {
        color: white;
        background: rgba(255,255,255,0.1);
        border: 2px solid rgba(255,255,255,0.2);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        position: relative;
        z-index: 1;
      }

      .modal-close-enhanced:hover {
        background: rgba(255,255,255,0.2);
        border-color: rgba(255,255,255,0.4);
        transform: rotate(90deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      /* Form enhancements */
      .form-input:focus, .form-select:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        transform: translateY(-1px);
      }

      .form-input:hover, .form-select:hover {
        border-color: #9ca3af;
        background: white;
      }

      .form-section-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .form-section-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.08);
      }

      .section-icon {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .form-section-card:hover .section-icon {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      }

      .readonly-field {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .readonly-field:hover {
        background: #f8fafc;
        border-color: #d1d5db;
      }

      .status-badge-large {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .status-badge-large:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      /* Smooth animations for form elements */
      .form-input, .form-select {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Enhanced select dropdown styling */
      .form-select {
        appearance: none;
        background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,9 12,15 18,9"></polyline></svg>');
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
        padding-right: 40px;
      }

      /* Loading animation for inputs */
      @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }

      .input-loading {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200px 100%;
        animation: shimmer 1.5s infinite;
      }
    </style>
  <div class="modal-header user-modal-header" style="position: relative;">
      <div style="display: flex; align-items: center; gap: 24px; position: relative; z-index: 1;">
        <div class="user-avatar-container">
          <span class="user-avatar-initials">${initials}</span>
        </div>
        <div style="flex: 1;">
          <h2 class="modal-title user-modal-title">${title}</h2>
          <p class="modal-subtitle user-modal-subtitle">${subtitle}</p>
        </div>
      </div>
            <button class="modal-close modal-close-enhanced" onclick="closeUserModal()" style="position: absolute; top: 24px; right: 24px;">
                <i data-lucide="x" style="width: 24px; height: 24px;"></i>
            </button>
        </div>

        <div class="modal-body" style="padding: 32px 32px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
            <!-- Personal Information Section -->
            <div class="form-section-card" style="background: white; border-radius: 16px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.03), 0 10px 25px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); position: relative; overflow: hidden;">
                <div class="section-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
                    <div class="section-icon" style="width: 48px; height: 48px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);">
                        <i data-lucide="user" style="width: 24px; height: 24px; color: white;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">Personal Information</h3>
                        <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 400;">Basic user details and contact information</p>
                    </div>
                </div>

                <div class="grid-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
                    <div class="form-group" style="position: relative;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-weight: 600; color: #374151; font-size: 14px;">
                            <i data-lucide="user-circle" style="width: 16px; height: 16px; color: #6b7280;"></i>
                            Full Name
                        </label>
                        <div class="input-wrapper" style="position: relative;">
                            <input type="text" class="form-input" id="userName"
                                   value="${userData?.name || ''}"
                                   placeholder="Enter full name"
                                   style="width: 100%; border: 2px solid #e5e7eb; padding: 14px 16px; font-size: 15px; border-radius: 10px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #fafbfc; font-weight: 400;"
                                   ${isReadOnly ? 'readonly' : ''}>
                            <div class="input-focus-ring" style="position: absolute; inset: 0; border-radius: 10px; border: 2px solid transparent; transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none;"></div>
                        </div>
                    </div>

                    <div class="form-group" style="position: relative;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-weight: 600; color: #374151; font-size: 14px;">
                            <i data-lucide="mail" style="width: 16px; height: 16px; color: #6b7280;"></i>
                            Email Address
                        </label>
                        <div class="input-wrapper" style="position: relative;">
                            <input type="email" class="form-input" id="userEmail"
                                   value="${userData?.email || ''}"
                                   placeholder="user@cnsc.edu.ph"
                                   style="width: 100%; border: 2px solid #e5e7eb; padding: 14px 16px; font-size: 15px; border-radius: 10px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #fafbfc; font-weight: 400;"
                                   ${isReadOnly ? 'readonly' : ''}>
                            <div class="input-focus-ring" style="position: absolute; inset: 0; border-radius: 10px; border: 2px solid transparent; transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Role & Department Section -->
            <div class="form-section-card" style="background: white; border-radius: 16px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.03), 0 10px 25px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); position: relative; overflow: hidden;">
                <div class="section-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
                    <div class="section-icon" style="width: 48px; height: 48px; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);">
                        <i data-lucide="briefcase" style="width: 24px; height: 24px; color: white;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">Role & Permissions</h3>
                        <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 400;">User role and system access level</p>
                    </div>
                </div>

                <div class="grid-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
                    <div class="form-group" style="position: relative;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-weight: 600; color: #374151; font-size: 14px;">
                            <i data-lucide="shield" style="width: 16px; height: 16px; color: #6b7280;"></i>
                            User Role
                        </label>
                        <div class="input-wrapper" style="position: relative;">
                            ${
                              isReadOnly
                                ? `
                                <div class="readonly-field" style="width: 100%; border: 2px solid #e5e7eb; padding: 14px 16px; font-size: 15px; border-radius: 10px; background: #fafbfc; color: #374151; font-weight: 500; display: flex; align-items: center; gap: 10px;">
                                    <i data-lucide="shield-check" style="width: 18px; height: 18px; color: #7c3aed;"></i>
                                    ${userData?.role || ''}
                                </div>
                            `
                                : `
                                <select class="form-select" id="userRole" style="width: 100%; border: 2px solid #e5e7eb; padding: 14px 16px; font-size: 15px; border-radius: 10px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #fafbfc; font-weight: 400; cursor: pointer;">
                                    <option value="">Select role</option>
                                    <option ${
                                      userData?.role === 'Admin'
                                        ? 'selected'
                                        : ''
                                    }>Admin</option>
                                    <option ${
                                      userData?.role === 'Manager'
                                        ? 'selected'
                                        : ''
                                    }>Manager</option>
                                    <option ${
                                      userData?.role === 'User'
                                        ? 'selected'
                                        : ''
                                    }>User</option>
                                    <option ${
                                      userData?.role === 'Student Assistant'
                                        ? 'selected'
                                        : ''
                                    }>Student Assistant</option>
                                    <option ${
                                      userData?.role === 'Viewer'
                                        ? 'selected'
                                        : ''
                                    }>Viewer</option>
                                </select>
                            `
                            }
                            <div class="input-focus-ring" style="position: absolute; inset: 0; border-radius: 10px; border: 2px solid transparent; transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Account Status Section -->
            <div class="form-section-card" style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.03), 0 10px 25px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); position: relative; overflow: hidden;">
                <div class="section-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
                    <div class="section-icon" style="width: 48px; height: 48px; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);">
                        <i data-lucide="settings" style="width: 24px; height: 24px; color: white;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">Account Profile</h3>
                        <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 400;">Account status and registration details</p>
                    </div>
                </div>

                <div class="grid-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
                    <div class="form-group" style="position: relative;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-weight: 600; color: #374151; font-size: 14px;">
                            <i data-lucide="activity" style="width: 16px; height: 16px; color: #6b7280;"></i>
                            Account Status
                        </label>
                        <div class="input-wrapper" style="position: relative;">
                            ${
                              isReadOnly
                                ? `
                                <div class="status-badge-large" style="width: 100%; border: 2px solid ${
                                  userData?.status === 'Active'
                                    ? '#10b981'
                                    : '#ef4444'
                                }; padding: 14px 16px; font-size: 15px; border-radius: 10px; background: ${
                                    userData?.status === 'Active'
                                      ? '#f0fdf4'
                                      : '#fef2f2'
                                  }; color: ${
                                    userData?.status === 'Active'
                                      ? '#047857'
                                      : '#dc2626'
                                  }; font-weight: 600; display: flex; align-items: center; gap: 12px;">
                                    <i data-lucide="${
                                      userData?.status === 'Active'
                                        ? 'check-circle'
                                        : 'x-circle'
                                    }" style="width: 20px; height: 20px;"></i>
                                    ${userData?.status || 'Inactive'}
                                </div>
                            `
                                : `
                                <select class="form-select" id="userStatus" style="width: 100%; border: 2px solid #e5e7eb; padding: 14px 16px; font-size: 15px; border-radius: 10px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #fafbfc; font-weight: 400; cursor: pointer;">
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
                            <div class="input-focus-ring" style="position: absolute; inset: 0; border-radius: 10px; border: 2px solid transparent; transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none;"></div>
                        </div>
                    </div>

                    <div class="form-group" style="position: relative;">
                        <label class="form-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-weight: 600; color: #374151; font-size: 14px;">
                            <i data-lucide="calendar" style="width: 16px; height: 16px; color: #6b7280;"></i>
                            ${
                              mode === 'create'
                                ? 'Join Date'
                                : 'Registration Date'
                            }
                        </label>
                        <div class="input-wrapper" style="position: relative;">
                            <input type="date" class="form-input" id="userCreated"
                                   value="${
                                     userData?.created ||
                                     new Date().toISOString().split('T')[0]
                                   }"
                                   min="${
                                     new Date().toISOString().split('T')[0]
                                   }"
                                   style="width: 100%; border: 2px solid #e5e7eb; padding: 14px 16px; font-size: 15px; border-radius: 10px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: #fafbfc; font-weight: 400; ${
                                     isReadOnly
                                       ? 'cursor: not-allowed;'
                                       : 'cursor: pointer;'
                                   }"
                                   ${isReadOnly ? 'readonly' : ''}>
                            <div class="input-focus-ring" style="position: absolute; inset: 0; border-radius: 10px; border: 2px solid transparent; transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal-footer" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-top: 2px solid #e5e7eb; padding: 32px 32px; display: flex; gap: 16px; justify-content: flex-end; align-items: center;">
            <button class="btn-secondary-enhanced" onclick="closeUserModal()" style="padding: 14px 28px; font-weight: 600; border: 2px solid #d1d5db; background: white; color: #374151; border-radius: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-size: 15px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <i data-lucide="${
                  isReadOnly ? 'x' : 'arrow-left'
                }" style="width: 18px; height: 18px;"></i>
                ${isReadOnly ? 'Close' : 'Cancel'}
            </button>
            ${
              !isReadOnly
                ? `
                <button class="btn-primary-enhanced" onclick="saveUser('${
                  userData?.id || ''
                }')" style="padding: 14px 28px; font-weight: 600; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3), 0 2px 4px rgba(220, 38, 38, 0.1); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-size: 15px; display: flex; align-items: center; gap: 8px; position: relative; overflow: hidden;">
                    <div class="btn-glow" style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%); opacity: 0; transition: opacity 0.3s;"></div>
                    <i data-lucide="${
                      mode === 'create' ? 'user-plus' : 'save'
                    }" style="width: 18px; height: 18px; position: relative; z-index: 1;"></i>
                    <span style="position: relative; z-index: 1;">${
                      mode === 'create' ? 'Add User' : 'Save Changes'
                    }</span>
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
        status: 'Active',
        created: '2025-01-15',
      },
      {
        id: 'SA002',
        group: 'Group Juan',
        name: 'Vince Balce',
        role: 'Member',
        email: 'vince@cnsc.edu.ph',
        status: 'Inactive',
        created: '2025-02-01',
      },
      {
        id: 'SA003',
        group: 'Group Juan',
        name: 'Marinel Ledesma',
        role: 'Member',
        email: 'marinel@cnsc.edu.ph',
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
  const todayLogins = userLogs.filter(
    (log) =>
      log.timestamp &&
      typeof log.timestamp === 'string' &&
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
        <div class="card" style="padding: 0; overflow: visible;">
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
                <div style="overflow-x: visible;">
                    <div style="max-height: none; overflow-y: visible;">
                    <table class="table sticky-header" style="margin:0; width: 100%; table-layout: auto;">
                        <thead>
                            <tr>
                                <th style="padding-left: 24px; min-width: 220px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="clock" style="width:14px;height:14px;"></i>
                                        Timestamp
                                    </div>
                                </th>
                                <th style="min-width: 200px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="user" style="width:14px;height:14px;"></i>
                                        User
                                    </div>
                                </th>
                                <th style="min-width: 250px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="mail" style="width:14px;height:14px;"></i>
                                        Email Address
                                    </div>
                                </th>
                                <th style="min-width: 140px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="zap" style="width:14px;height:14px;"></i>
                                        Action
                                    </div>
                                </th>
                                <th style="min-width: 180px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="monitor" style="width:14px;height:14px;"></i>
                                        Device Type
                                    </div>
                                </th>
                                <th style="min-width: 160px;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <i data-lucide="globe" style="width:14px;height:14px;"></i>
                                        IP Address
                                    </div>
                                </th>
                                <th style="padding-right: 24px; min-width: 140px;">
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

// --- Expose commonly used handlers to global scope for legacy inline handlers ---
;(function exposeLegacyHandlers() {
  const handlers = {
    openUserModal,
    closeUserModal,
    saveUser,
    deleteMember,
    refreshRolesTable,
    setLoginActivityPage,
    showConfirm,
    showAlert,
    logout,
  }

  Object.keys(handlers).forEach((k) => {
    if (!window[k]) window[k] = handlers[k]
  })
})()
window.setLoginActivityPage = setLoginActivityPage

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
    gallery: [],
    committeeMembers: [
      'Dr. Juan Dela Cruz — Chair',
      'Ms. Maria Santos — Member',
      'Mr. Pedro Reyes — Member',
    ],
  }

  return `
    <header class="page-header">
      <div class="page-header-content">
        <div>
          <h1 class="page-title">
            <i data-lucide="info" style="width:28px;height:28px;vertical-align:middle;margin-right:8px;"></i>
            About Us
          </h1>
          <p class="page-subtitle">Learn more about the SPMO System and the team behind it</p>
        </div>
        <nav style="display:flex;align-items:center;gap:12px;">
          <button class="btn btn-primary" onclick="editAboutUs()" style="display:flex;align-items:center;gap:8px;">
            <i data-lucide="edit-3" style="width:16px;height:16px;"></i>
            Edit About Us
          </button>
          <time datetime="${currentYear}" style="text-align:right;color:#6b7280;font-size:14px;">Updated: ${currentYear}</time>
        </nav>
      </div>
    </header>

    <main class="page-content" style="padding:32px 24px;">
      <div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:32px;">
        
        <!-- Hero Section -->
        <section aria-labelledby="hero-title" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:16px; padding:48px 40px; box-shadow: 0 10px 40px rgba(102, 126, 234, 0.2);">
          <div style="display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:center;">
            <figure style="margin:0;width:120px;height:120px;border-radius:16px;background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:42px;box-shadow:0 8px 32px rgba(0,0,0,0.1);">
              ${(aboutContent.heroTitle || 'SPMO')
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </figure>
            <div>
              <h2 id="hero-title" style="margin:0 0 12px 0;font-size:36px;font-weight:700;color:white;line-height:1.2;">${
                aboutContent.heroTitle
              }</h2>
              <p id="hero-subtitle" style="font-size:18px;line-height:1.6;margin:0;color:rgba(255,255,255,0.95);font-weight:400;">${
                aboutContent.heroSubtitle
              }</p>
            </div>
          </div>
        </section>

        <!-- Mission & Vision -->
        <section aria-label="Mission and Vision">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(450px,1fr));gap:24px;">
            <article style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <header style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                <div style="width:56px;height:56px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-hidden="true">
                  <i data-lucide="target" style="width:28px;height:28px;color:white;"></i>
                </div>
                <h3 style="margin:0;font-size:22px;color:#111827;font-weight:700;">Our Mission</h3>
              </header>
              <p id="mission-text" style="color:#4b5563;line-height:1.7;margin:0;font-size:15px;">${
                aboutContent.mission
              }</p>
            </article>

            <article style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <header style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                <div style="width:56px;height:56px;background:linear-gradient(135deg,#764ba2 0%,#667eea 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-hidden="true">
                  <i data-lucide="eye" style="width:28px;height:28px;color:white;"></i>
                </div>
                <h3 style="margin:0;font-size:22px;color:#111827;font-weight:700;">Our Vision</h3>
              </header>
              <p id="vision-text" style="color:#4b5563;line-height:1.7;margin:0;font-size:15px;">${
                aboutContent.vision
              }</p>
            </article>
          </div>
        </section>

        <!-- Key Features -->
        <section aria-labelledby="features-heading" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <header style="text-align:center;margin-bottom:40px;">
            <h2 id="features-heading" style="margin:0 0 8px 0;font-size:28px;color:#111827;font-weight:700;">What We Offer</h2>
            <p style="margin:0;color:#6b7280;font-size:16px;">Comprehensive solutions for modern inventory management</p>
          </header>
          
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;">
            <article style="background:#f9fafb;border:1px solid #e5e7eb;padding:24px;border-radius:12px;">
              <div style="width:72px;height:72px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 0 20px 0;" aria-hidden="true">
                <i data-lucide="package" style="width:36px;height:36px;color:white;"></i>
              </div>
              <h3 style="margin:0 0 12px 0;color:#111827;font-size:18px;font-weight:600;">Inventory Management</h3>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Real-time tracking of stock levels, automated alerts, and comprehensive inventory reports</p>
            </article>

            <article style="background:#f9fafb;border:1px solid #e5e7eb;padding:24px;border-radius:12px;">
              <div style="width:72px;height:72px;background:linear-gradient(135deg,#764ba2 0%,#667eea 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 0 20px 0;" aria-hidden="true">
                <i data-lucide="shopping-cart" style="width:36px;height:36px;color:white;"></i>
              </div>
              <h3 style="margin:0 0 12px 0;color:#111827;font-size:18px;font-weight:600;">Procurement Automation</h3>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Streamlined purchase order creation, approval workflows, and vendor management</p>
            </article>

            <article style="background:#f9fafb;border:1px solid #e5e7eb;padding:24px;border-radius:12px;">
              <div style="width:72px;height:72px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 0 20px 0;" aria-hidden="true">
                <i data-lucide="bar-chart-3" style="width:36px;height:36px;color:white;"></i>
              </div>
              <h3 style="margin:0 0 12px 0;color:#111827;font-size:18px;font-weight:600;">Analytics & Reporting</h3>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Powerful dashboards and customizable reports for data-driven decisions</p>
            </article>

            <article style="background:#f9fafb;border:1px solid #e5e7eb;padding:24px;border-radius:12px;">
              <div style="width:72px;height:72px;background:linear-gradient(135deg,#764ba2 0%,#667eea 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 0 20px 0;" aria-hidden="true">
                <i data-lucide="users" style="width:36px;height:36px;color:white;"></i>
              </div>
              <h3 style="margin:0 0 12px 0;color:#111827;font-size:18px;font-weight:600;">Multi-User Access</h3>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Role-based permissions ensuring secure and organized collaboration</p>
            </article>
          </div>
        </section>

        <!-- Team Section -->
        <section aria-labelledby="team-heading" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <header style="text-align:center;margin-bottom:40px;">
            <h2 id="team-heading" style="margin:0 0 8px 0;font-size:28px;color:#111827;font-weight:700;">Meet the Coordinators</h2>
            <p style="margin:0;color:#6b7280;font-size:16px;">The dedicated team behind SPMO System</p>
          </header>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
            <article style="background:#f9fafb;border:1px solid #e5e7eb;padding:28px;border-radius:12px;text-align:center;">
              <figure style="margin:0 auto 20px;width:96px;height:96px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:white;box-shadow:0 4px 12px rgba(102,126,234,0.3);" aria-label="Cherry Ann Quila">CQ</figure>
              <h3 style="margin:0 0 6px 0;color:#111827;font-size:18px;font-weight:600;">Cherry Ann Quila</h3>
              <p style="margin:0 0 12px 0;color:#667eea;font-weight:600;font-size:14px;">QA & Papers</p>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Leading QA initiatives to maintain excellence and alignment in all project and paper outputs.</p>
            </article>

            <article style="background:#f9fafb;border:1px solid #e5e7eb;padding:28px;border-radius:12px;text-align:center;">
              <figure style="margin:0 auto 20px;width:96px;height:96px;background:linear-gradient(135deg,#764ba2 0%,#667eea 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:white;box-shadow:0 4px 12px rgba(118,75,162,0.3);" aria-label="Vince Balce">VB</figure>
              <h3 style="margin:0 0 6px 0;color:#111827;font-size:18px;font-weight:600;">Vince Balce</h3>
              <p style="margin:0 0 12px 0;color:#764ba2;font-weight:600;font-size:14px;">Project Lead/Lead Developer</p>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Leading strategic direction and architecting robust system features for project success.</p>
            </article>

            <article style="background:#f9fafb;border:1px solid #e5e7eb;padding:28px;border-radius:12px;text-align:center;">
              <figure style="margin:0 auto 20px;width:96px;height:96px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:white;box-shadow:0 4px 12px rgba(102,126,234,0.3);" aria-label="Marinel Ledesma">ML</figure>
              <h3 style="margin:0 0 6px 0;color:#111827;font-size:18px;font-weight:600;">Marinel Ledesma</h3>
              <p style="margin:0 0 12px 0;color:#667eea;font-weight:600;font-size:14px;">Co Developer & Documentation</p>
              <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Ensuring quality standards with comprehensive support and clear project documentation.</p>
            </article>
          </div>
        </section>

        <!-- Inspection Committee -->
        <section aria-labelledby="committee-heading" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <header style="text-align:center;margin-bottom:32px;">
            <h2 id="committee-heading" style="margin:0 0 8px 0;font-size:28px;color:#111827;font-weight:700;">Inspection Committee Members</h2>
            <p style="margin:0;color:#6b7280;font-size:16px;">Official committee responsible for audits and compliance</p>
          </header>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
            ${
              (aboutContent.committeeMembers || [])
                .map((m) => {
                  // Normalize to an object: support legacy string format or structured object
                  let member = {
                    name: '',
                    role: '',
                    position: '',
                    inspectionArea: '',
                  }
                  if (!m) return null
                  if (typeof m === 'string') {
                    // Legacy formats: "Name — Role" or "Name — Role | Position | Area"
                    const parts = m.split('—')
                    const left = (parts[0] || m).trim()
                    const right = parts.slice(1).join('—').trim()
                    const extras =
                      right.indexOf('|') !== -1
                        ? right.split('|').map((s) => s.trim())
                        : [right.trim()]
                    member.name = left
                    member.role = extras[0] || ''
                    member.position = extras[1] || ''
                    member.inspectionArea = extras[2] || ''
                  } else if (typeof m === 'object') {
                    member.name = m.name || m.title || ''
                    member.role = m.role || ''
                    member.position = m.position || ''
                    member.inspectionArea = m.inspectionArea || m.area || ''
                  }

                  const name = escapeHtml(String(member.name || '').trim())
                  const role = escapeHtml(String(member.role || '').trim())
                  const position = escapeHtml(
                    String(member.position || '').trim()
                  )
                  const area = escapeHtml(
                    String(member.inspectionArea || '').trim()
                  )

                  const initials = (name || '')
                    .split(' ')
                    .map((p) => p[0] || '')
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()

                  return `
                    <article style="background:#f9fafb;border:1px solid #e5e7eb;padding:28px;border-radius:12px;text-align:center;">
                      <figure style="margin:0 auto 20px;width:96px;height:96px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:white;box-shadow:0 4px 12px rgba(102,126,234,0.3);" aria-label="${name}">${initials}</figure>
                      <h3 style="margin:0 0 6px 0;color:#111827;font-size:18px;font-weight:600;">${name}</h3>
                      ${
                        role
                          ? `<p style="margin:0 0 8px 0;color:#667eea;font-weight:600;font-size:14px;">${role}</p>`
                          : ''
                      }
                      ${
                        position
                          ? `<p style="margin:0 0 12px 0;color:#9ca3af;font-weight:500;font-size:13px;">${position}</p>`
                          : ''
                      }
                      ${
                        area
                          ? `<p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">${area}</p>`
                          : ''
                      }
                    </article>
                  `
                })
                .filter((x) => x !== null)
                .join('') ||
              `<div style="grid-column:1/-1;text-align:center;color:#6b7280;padding:20px;">No committee members listed</div>`
            }
          </div>
        </section>

        <!-- Headed By Section -->
        <section aria-labelledby="leadership-heading" style="background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);border:2px solid #bae6fd;border-radius:16px;padding:40px;box-shadow:0 4px 12px rgba(2,132,199,0.1);">
          <div style="text-align:center;max-width:800px;margin:0 auto;">
            <header style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:28px;">
              <div style="width:56px;height:56px;background:#0284c7;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(2,132,199,0.3);" aria-hidden="true">
                <i data-lucide="shield-check" style="width:28px;height:28px;color:white;"></i>
              </div>
              <h2 id="leadership-heading" style="margin:0;font-size:28px;color:#111827;font-weight:700;">Headed by</h2>
            </header>
            
            <article style="background:white;border-radius:16px;padding:32px;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
              <div style="display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;">
                <figure style="margin:0;width:96px;height:96px;background:linear-gradient(135deg,#0284c7 0%,#0369a1 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:white;border:4px solid white;box-shadow:0 8px 20px rgba(2,132,199,0.3);" aria-label="Supply Officer III">SO</figure>
                <div style="text-align:left;">
                  <h3 style="margin:0 0 6px 0;color:#111827;font-size:24px;font-weight:700;">Supply Officer III</h3>
                  <p style="margin:0 0 10px 0;color:#0284c7;font-weight:600;font-size:17px;">Supply and Property Management Office</p>
                  <p style="margin:0;color:#6b7280;font-size:15px;font-style:italic;line-height:1.5;">Overseeing strategic management and coordination of SPMO operations</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Contact Section -->
        <section aria-labelledby="contact-heading" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <div style="text-align:center;max-width:700px;margin:0 auto;">
            <div style="width:72px;height:72px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;box-shadow:0 4px 12px rgba(102,126,234,0.25);" aria-hidden="true">
              <i data-lucide="mail" style="width:36px;height:36px;color:white;"></i>
            </div>
            <header style="margin-bottom:32px;">
              <h2 id="contact-heading" style="margin:0 0 8px 0;font-size:28px;color:#111827;font-weight:700;">Contact Information</h2>
              <p style="margin:0;color:#6b7280;line-height:1.6;font-size:16px;">Get in touch with us for questions or support</p>
            </header>
            
            <address style="font-style:normal;display:grid;gap:16px;text-align:left;">
              <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:10px;display:flex;align-items:center;gap:16px;">
                <div style="width:48px;height:48px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-hidden="true">
                  <i data-lucide="building-2" style="width:24px;height:24px;color:white;"></i>
                </div>
                <div style="min-width:0;">
                  <p style="margin:0 0 4px 0;font-weight:600;color:#111827;font-size:15px;">Institution</p>
                  <p id="institution-text" style="margin:0;color:#6b7280;font-size:14px;word-break:break-word;">${
                    aboutContent.institution
                  }</p>
                </div>
              </div>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:10px;display:flex;align-items:center;gap:16px;">
                <div style="width:48px;height:48px;background:linear-gradient(135deg,#764ba2 0%,#667eea 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-hidden="true">
                  <i data-lucide="mail" style="width:24px;height:24px;color:white;"></i>
                </div>
                <div style="min-width:0;">
                  <p style="margin:0 0 4px 0;font-weight:600;color:#111827;font-size:15px;">Institutional Email</p>
                  <a href="mailto:${
                    aboutContent.email
                  }" id="email-text" style="margin:0;color:#667eea;font-size:14px;word-break:break-word;text-decoration:none;">${
    aboutContent.email
  }</a>
                </div>
              </div>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:20px;border-radius:10px;display:flex;align-items:center;gap:16px;">
                <div style="width:48px;height:48px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-hidden="true">
                  <i data-lucide="phone" style="width:24px;height:24px;color:white;"></i>
                </div>
                <div style="min-width:0;">
                  <p style="margin:0 0 4px 0;font-weight:600;color:#111827;font-size:15px;">Contact Number</p>
                  <a href="tel:${aboutContent.phone.replace(
                    /[^0-9+]/g,
                    ''
                  )}" id="phone-text" style="margin:0;color:#667eea;font-size:14px;word-break:break-word;text-decoration:none;">${
    aboutContent.phone
  }</a>
                </div>
              </div>
            </address>
          </div>
        </section>

        <!-- Footer -->
        <footer style="text-align:center;padding:24px 0;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#6b7280;font-size:14px;">© ${currentYear} SPMO System - Camarines Norte State College. All rights reserved.</p>
        </footer>
      </div>
    </main>
  `
}

// ----------------------------- //
// Support Page (Submit Ticket Only)//
// ----------------------------- //
function generateSupportPage() {
  // Render initial shell; tickets will be loaded by refreshSupportTickets
  const ticketRows =
    '<tr><td colspan="5" style="text-align:center;padding:20px;color:#6b7280;">Loading…</td></tr>'

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
              <div id="support-total" style="font-size:12px;color:#6b7280;">0 total</div>
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
        <!-- Modal container for ticket preview -->
        <div id="support-ticket-modal" class="modal-overlay" style="display:none;"></div>
        </div>
    `
}

// Note: escapeHtml is already defined earlier in this file. Do not redeclare it here
// to avoid duplicate identifier errors during bundling. Use the existing escapeHtml.

// Refresh tickets list (re-render only tickets table body without full page reload)
async function refreshSupportTickets() {
  if (AppState.currentPage !== 'support') return
  const body = document.getElementById('support-ticket-body')
  const totalEl = document.getElementById('support-total')
  if (!body) return
  body.innerHTML =
    '<tr><td colspan="5" style="text-align:center;padding:20px;color:#6b7280;">Loading…</td></tr>'
  try {
    const res = await fetch('/api/support-tickets')
    if (!res.ok) throw new Error('Failed to load')
    const tickets = await res.json()
    totalEl && (totalEl.textContent = `${tickets.length} total`)
    if (!tickets || tickets.length === 0) {
      body.innerHTML =
        '<tr><td colspan="5" style="text-align:center;padding:20px;color:#6b7280;">No support tickets yet</td></tr>'
      return
    }

    body.innerHTML = tickets
      .map((t) => {
        const msg = (t.message || '').slice(0, 100)
        const created = t.created_at || t.created || ''
        const statusBadge = `<span class="badge ${
          t.status === 'Open' ? 'yellow' : 'green'
        }" style="font-size:11px;">${t.status}</span>`
        const attachmentsBtn =
          t.attachments && t.attachments.length
            ? `<button class="btn btn-secondary" onclick="previewTicket(${t.id})" style="padding:6px 8px;font-size:12px;">Preview</button>`
            : ''
        return `<tr>
          <td style="font-weight:600;color:#111827;">${escapeHtml(t.name)}</td>
          <td>${escapeHtml(t.email)}</td>
          <td>${escapeHtml(msg)}${
          (t.message || '').length > 100 ? '…' : ''
        }</td>
          <td>${statusBadge}</td>
          <td style="font-size:12px;color:#6b7280;">${created}<div style="margin-top:6px;">${attachmentsBtn}</div></td>
        </tr>`
      })
      .join('')
  } catch (e) {
    body.innerHTML =
      '<tr><td colspan="5" style="text-align:center;padding:20px;color:#6b7280;">Unable to load tickets</td></tr>'
  }
}

// Preview ticket modal which shows full message and attachments and allows status update
async function previewTicket(id) {
  // Locate or create modal overlay
  let overlay = document.getElementById('support-ticket-modal')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = 'support-ticket-modal'
    overlay.className = 'modal-overlay'
    // ensure overlay is visible when created (page template initializes it with display:none)
    overlay.style.display = 'block'
    document.body.appendChild(overlay)
  }

  overlay.classList.add('active')
  // make sure the overlay is shown (some templates set display:none initially)
  overlay.style.display = 'block'
  // Ensure content container
  if (!overlay.querySelector('.modal-content')) {
    const wrapper = document.createElement('div')
    wrapper.className = 'modal-content compact'
    // dialog semantics: labelled by the ticket title and described by the message body
    wrapper.setAttribute('role', 'dialog')
    wrapper.setAttribute('aria-modal', 'true')
    wrapper.setAttribute('aria-labelledby', 'support-ticket-title')
    wrapper.setAttribute('aria-describedby', 'support-modal-body')
    wrapper.style.cssText =
      'max-width:800px;margin:6vh auto;max-height:88vh;overflow:auto;padding:0;'
    overlay.appendChild(wrapper)
  }

  const content = overlay.querySelector('.modal-content')
  // initial loading shell using semantic elements
  content.innerHTML = `
    <header class="modal-header" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; border-bottom: none; padding: 32px 24px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;">
          <i data-lucide="life-buoy" style="width:32px;height:32px;color:white;"></i>
        </div>
        <div style="flex:1;">
          <h2 id="support-ticket-title" style="color:white;font-size:20px;margin:0;">Support Ticket</h2>
          <p style="color:rgba(255,255,255,0.9);margin:4px 0 0 0;font-size:14px;">Ticket details and attachments</p>
        </div>
      </div>
      <button class="modal-close" aria-label="Close" style="color:white;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);width:36px;height:36px;border-radius:50%;"> 
        <i data-lucide="x" style="width:16px;height:16px;color:white;"></i>
      </button>
    </header>
    <main class="modal-body" id="support-modal-body" style="padding:32px 24px;background:#f9fafb;">
      <article style="background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <p style="margin:0;color:#6b7280;">Loading…</p>
      </article>
    </main>
    <footer class="modal-footer" style="padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:12px;">
      <button class="btn btn-secondary">Close</button>
    </footer>
  `

  // wire close handlers and backdrop click
  overlay
    .querySelector('.modal-close')
    ?.addEventListener('click', closeSupportModal)
  overlay
    .querySelector('.modal-footer .btn')
    ?.addEventListener('click', closeSupportModal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      // if dirty, confirm using in-UI dialog
      if (overlay._supportDirty) {
        showInUiConfirm('You have unsaved changes. Close without saving?', {
          title: 'Unsaved changes',
          confirmText: 'Close',
          cancelText: 'Cancel',
        }).then((keep) => {
          if (keep) closeSupportModal()
        })
        return
      }
      closeSupportModal()
    }
  })

  // focus trap + escape
  try {
    overlay._lastFocused = document.activeElement
    overlay._supportKeydown = function (e) {
      if (e.key === 'Escape') {
        // if dirty, confirm using in-UI dialog
        try {
          if (overlay._supportDirty) {
            showInUiConfirm('You have unsaved changes. Close without saving?', {
              title: 'Unsaved changes',
              confirmText: 'Close',
              cancelText: 'Cancel',
            }).then((keep) => {
              if (keep) closeSupportModal()
            })
            return
          }
        } catch (e) {}
        return closeSupportModal()
      }
      if (e.key !== 'Tab') return
      const focusable = Array.from(
        overlay.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', overlay._supportKeydown)
  } catch (e) {}

  // fetch ticket and replace content
  try {
    const res = await fetch(`/api/support-tickets/${id}`)
    if (!res.ok) throw new Error('Not found')
    const t = await res.json()
    const attachmentsHtml =
      (t.attachments || [])
        .map(
          (a) =>
            `<li style="margin-bottom:8px;"><a href="/support/attachment/${
              a.id
            }" target="_blank">${escapeHtml(a.original_name)}</a> (${Math.round(
              (a.size || 0) / 1024
            )} KB)</li>`
        )
        .join('') || '<li style="color:#6b7280">No attachments</li>'

    content.innerHTML = `
      <header class="modal-header" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; border-bottom: none; padding: 32px 24px; display:flex;align-items:center;justify-content:space-between;" role="banner">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <i data-lucide="life-buoy" style="width:32px;height:32px;color:white;"></i>
          </div>
          <div style="flex:1;">
            <h2 id="support-ticket-title" style="color:white;font-size:20px;margin:0;">Ticket: ${escapeHtml(
              t.ticket_id || '#' + t.id
            )}</h2>
            <p style="color:rgba(255,255,255,0.9);margin:4px 0 0 0;font-size:14px;">From ${escapeHtml(
              t.name
            )} &lt;${escapeHtml(t.email)}&gt;</p>
          </div>
        </div>
        <button class="modal-close" aria-label="Close" style="color:white;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;"> 
          <i data-lucide="x" style="width:16px;height:16px;color:white;"></i>
        </button>
      </header>
      <main class="modal-body" id="support-modal-body" style="padding:32px 24px;background:#f9fafb;">
        <article style="background:white;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="margin:0 0 12px 0;font-size:16px;font-weight:600;color:#111827;">Message</h3>
          <div style="margin-top:8px;padding:12px;background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb;white-space:pre-wrap;color:#111827;">${escapeHtml(
            t.message
          )}</div>
          <h3 style="margin:20px 0 12px 0;font-size:16px;font-weight:600;color:#111827;">Attachments</h3>
          <div style="margin-top:8px;" id="support-attachments-container"><ul style="margin:0;padding-left:18px;">${attachmentsHtml}</ul></div>
        </article>
      </main>
      <footer class="modal-footer" style="padding:16px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;display:flex;gap:8px;justify-content:space-between;align-items:center;">
        <div style="display:flex;flex-direction:column;align-items:flex-start;gap:6px;">
          <div style="font-size:13px;color:#6b7280;">Created: ${escapeHtml(
            t.created_at || t.created || ''
          )}</div>
          <div id="support-inline-feedback" role="status" aria-live="polite" style="font-size:13px;color:#6b7280;display:none;"></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label for="support-status-select" style="margin-right:6px;">Status:</label>
          <select id="support-status-select" style="padding:6px;border-radius:6px;border:1px solid #d1d5db;">
            <option value="Open" ${
              t.status === 'Open' ? 'selected' : ''
            }>Open</option>
            <option value="Closed" ${
              t.status === 'Closed' ? 'selected' : ''
            }>Closed</option>
          </select>
          <button class="btn btn-secondary" id="support-modal-close">Close</button>
          <button class="btn btn-primary" id="support-modal-save">Save</button>
        </div>
      </footer>
    `

    // track dirty state (status changes) and wire close handlers
    const modalEl = overlay
    const selectEl = overlay.querySelector('#support-status-select')
    if (selectEl) {
      modalEl._supportOriginalStatus = selectEl.value
      modalEl._supportDirty = false
      selectEl.addEventListener('change', () => {
        try {
          modalEl._supportDirty =
            selectEl.value !== modalEl._supportOriginalStatus
          const fb = overlay.querySelector('#support-inline-feedback')
          if (fb) {
            if (modalEl._supportDirty) {
              fb.style.display = 'block'
              fb.style.color = '#f59e0b' // amber
              fb.textContent = 'Unsaved changes'
            } else {
              fb.style.display = 'none'
              fb.textContent = ''
            }
          }
        } catch (e) {}
      })
    }

    // wire close handlers
    overlay
      .querySelector('.modal-close')
      ?.addEventListener('click', closeSupportModal)
    overlay
      .querySelector('#support-modal-close')
      ?.addEventListener('click', closeSupportModal)
    const saveBtn = overlay.querySelector('#support-modal-save')
    const feedbackEl = overlay.querySelector('#support-inline-feedback')
    overlay
      .querySelector('#support-modal-save')
      ?.addEventListener('click', async () => {
        // clear previous feedback
        if (feedbackEl) {
          feedbackEl.style.display = 'none'
          feedbackEl.textContent = ''
        }
        const result = await updateTicketStatus(t.id, { ui: { saveBtn } })
        // clear dirty flag on success so close won't prompt
        if (result && result.ok) {
          try {
            const modalNow = document.getElementById('support-ticket-modal')
            if (modalNow) modalNow._supportDirty = false
          } catch (e) {}
        }
      })

    // show image thumbnails for attachments (if images)
    try {
      const attachContainer = overlay.querySelector(
        '#support-attachments-container'
      )
      if (attachContainer) {
        const imgs = Array.from(attachContainer.querySelectorAll('a'))
        imgs.forEach((a) => {
          const href = a.getAttribute('href') || ''
          const lower = (a.textContent || '').toLowerCase()
          if (
            /(\.png|\.jpe?g|\.gif|\.webp)$/i.test(href) ||
            /(\.png|\.jpe?g|\.gif|\.webp)$/i.test(lower)
          ) {
            // try to create a small thumbnail preview next to the link
            const img = document.createElement('img')
            img.src = href
            img.alt = a.textContent || 'attachment'
            img.style.cssText =
              'width:64px;height:64px;object-fit:cover;border-radius:6px;margin-right:8px;border:1px solid #e5e7eb;'
            const wrapper = document.createElement('div')
            wrapper.style.cssText =
              'display:flex;align-items:center;margin-bottom:8px;'
            wrapper.appendChild(img)
            const linkWrap = document.createElement('div')
            linkWrap.innerHTML = a.outerHTML
            wrapper.appendChild(linkWrap)
            a.parentElement && a.parentElement.replaceWith(wrapper)
          }
        })
      }
    } catch (e) {}
    try {
      lucide.createIcons()
    } catch (e) {}
  } catch (e) {
    content.innerHTML = '<p>Unable to load ticket.</p>'
  }
}
window.previewTicket = previewTicket

// Accessible in-UI confirm dialog. Returns a Promise<boolean> that resolves to true when confirmed.
function showInUiConfirm(message, options = {}) {
  const title = options.title || 'Confirm'
  const confirmText = options.confirmText || 'Yes'
  const cancelText = options.cancelText || 'No'

  return new Promise((resolve) => {
    // if a dialog already exists, do not create another
    if (document.getElementById('ui-confirm-overlay')) {
      // fallback to native confirm if double-invoked
      try {
        return resolve(window.confirm(message))
      } catch (e) {
        return resolve(false)
      }
    }

    const overlay = document.createElement('div')
    overlay.id = 'ui-confirm-overlay'
    // use CSS class for theming
    overlay.className = 'ui-confirm-overlay'
    overlay.setAttribute('role', 'presentation')

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'alertdialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.setAttribute('aria-labelledby', 'ui-confirm-title')
    dialog.setAttribute('aria-describedby', 'ui-confirm-desc')
    // style via CSS class so it's easily themeable
    dialog.className = 'ui-confirm-dialog'

    dialog.innerHTML = `
      <h3 id="ui-confirm-title" class="ui-confirm-title">${title}</h3>
      <div id="ui-confirm-desc" class="ui-confirm-desc">${escapeHtml(
        String(message)
      )}</div>
      <div class="ui-confirm-actions">
        <button id="ui-confirm-cancel" class="btn btn-secondary">${cancelText}</button>
        <button id="ui-confirm-confirm" class="btn btn-primary">${confirmText}</button>
      </div>
    `

    overlay.appendChild(dialog)
    document.body.appendChild(overlay)

    // focus management
    const confirmBtn = document.getElementById('ui-confirm-confirm')
    const cancelBtn = document.getElementById('ui-confirm-cancel')
    const previouslyFocused = document.activeElement
    const focusable = [cancelBtn, confirmBtn]
    let focusIndex = 0
    focusable[focusIndex].focus()

    function cleanup(result) {
      try {
        document.removeEventListener('keydown', onKey)
      } catch (e) {}
      overlay.remove()
      try {
        if (previouslyFocused && typeof previouslyFocused.focus === 'function')
          previouslyFocused.focus()
      } catch (e) {}
      resolve(result)
    }

    function onKey(e) {
      if (e.key === 'Escape') return cleanup(false)
      if (e.key === 'Tab') {
        e.preventDefault()
        focusIndex =
          (focusIndex + (e.shiftKey ? -1 : 1) + focusable.length) %
          focusable.length
        focusable[focusIndex].focus()
      }
      if (e.key === 'Enter') {
        // Enter activates the currently focused button
        if (document.activeElement === cancelBtn) return cleanup(false)
        if (document.activeElement === confirmBtn) return cleanup(true)
      }
    }

    cancelBtn.addEventListener('click', () => cleanup(false))
    confirmBtn.addEventListener('click', () => cleanup(true))
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // clicking backdrop treats as cancel
        cleanup(false)
      }
    })
    document.addEventListener('keydown', onKey)
  })
}

function closeSupportModal() {
  const modal = document.getElementById('support-ticket-modal')
  if (!modal) return
  // if dirty, confirm before closing (use synchronous behaviour via Promise)
  try {
    if (modal._supportDirty) {
      // showInUiConfirm returns a Promise — block closing until user responds
      showInUiConfirm('You have unsaved changes. Close without saving?', {
        title: 'Unsaved changes',
        confirmText: 'Close',
        cancelText: 'Cancel',
      }).then((ok) => {
        if (!ok) return
        modal.className = 'modal-overlay'
        modal.style.display = 'none'
        try {
          if (modal._supportKeydown) {
            document.removeEventListener('keydown', modal._supportKeydown)
            modal._supportKeydown = null
          }
          if (
            modal._lastFocused &&
            typeof modal._lastFocused.focus === 'function'
          ) {
            modal._lastFocused.focus()
          }
        } catch (e) {}
        setTimeout(() => (modal.innerHTML = ''), 300)
      })
      return
    }
  } catch (e) {}

  modal.className = 'modal-overlay'
  modal.style.display = 'none'
  // remove keyboard handler if attached
  try {
    if (modal._supportKeydown) {
      document.removeEventListener('keydown', modal._supportKeydown)
      modal._supportKeydown = null
    }
    // restore focus
    if (modal._lastFocused && typeof modal._lastFocused.focus === 'function') {
      modal._lastFocused.focus()
    }
  } catch (e) {}
  setTimeout(() => (modal.innerHTML = ''), 300)
}

async function updateTicketStatus(id, opts = {}) {
  const select = document.getElementById('support-status-select')
  if (!select) return { ok: false, error: 'no-select' }
  const status = select.value
  const ui = opts.ui || {}
  const saveBtn = ui.saveBtn || document.getElementById('support-modal-save')
  const feedbackEl = document.getElementById('support-inline-feedback')

  // disable UI
  if (saveBtn) {
    saveBtn.disabled = true
    saveBtn.setAttribute('aria-disabled', 'true')
    // show spinner
    const spinner = document.createElement('span')
    spinner.className = 'spinner'
    spinner.style.cssText =
      'display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:rgba(255,255,255,1);border-radius:50%;margin-right:8px;vertical-align:middle;'
    spinner.id = 'support-save-spinner'
    saveBtn.prepend(spinner)
  }

  try {
    const res = await fetch(`/api/support-tickets/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const msg = text || 'Failed to update'
      if (feedbackEl) {
        feedbackEl.style.display = 'block'
        feedbackEl.style.color = '#b91c1c'
        feedbackEl.textContent = `Error: ${msg}`
      } else {
        showAlert('Unable to update status', 'error')
      }
      return { ok: false, error: msg }
    }
    // success
    if (feedbackEl) {
      feedbackEl.style.display = 'block'
      feedbackEl.style.color = '#16a34a'
      feedbackEl.textContent = 'Status updated'
    } else {
      showAlert('Status updated', 'success')
    }
    // small delay so user sees the message
    setTimeout(() => {
      try {
        closeSupportModal()
      } catch (e) {}
      refreshSupportTickets()
    }, 650)
    return { ok: true }
  } catch (e) {
    if (feedbackEl) {
      feedbackEl.style.display = 'block'
      feedbackEl.style.color = '#b91c1c'
      feedbackEl.textContent = 'Network error while updating status'
    } else {
      showAlert('Unable to update status', 'error')
    }
    return { ok: false, error: e }
  } finally {
    // cleanup UI
    try {
      const spinner = document.getElementById('support-save-spinner')
      spinner && spinner.remove()
      if (saveBtn) {
        saveBtn.disabled = false
        saveBtn.removeAttribute('aria-disabled')
      }
    } catch (e) {}
  }
}
window.refreshSupportTickets = refreshSupportTickets

// Committee HTML placeholder. The real HTML is generated inside editAboutUs
let committeeHtml = ''

function editAboutUs() {
  let modal = document.getElementById('edit-about-modal')
  if (!modal) {
    modal = document.createElement('div')
    modal.id = 'edit-about-modal'
    modal.className = 'modal-overlay'
    document.body.appendChild(modal)
  }

  // Prepare current content safely from AppState (fallback to defaults)
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
    gallery: [],
    committeeMembers: [],
  }

  // Build committee members HTML separately to keep template literal simple
  let committeeHtml = ''
  const members = currentContent.committeeMembers || []
  if (members.length > 0) {
    committeeHtml = members
      .map((m) => {
        let mem = { name: '', role: '', position: '', area: '' }
        if (typeof m === 'string') {
          const parts = m.split('—')
          mem.name = (parts[0] || '').trim()
          const rest = parts.slice(1).join('—').trim()
          if (rest) {
            const extras = rest.split('|').map((s) => s.trim())
            mem.role = extras[0] || ''
            mem.position = extras[1] || ''
            mem.area = extras[2] || ''
          }
        } else if (typeof m === 'object' && m !== null) {
          mem.name = m.name || m.title || ''
          mem.role = m.role || ''
          mem.position = m.position || ''
          mem.area = m.inspectionArea || m.area || ''
        }

        return `
          <div class="committee-member-row" style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;">
            <input class="committee-name-input" type="text" value="${String(
              mem.name
            )
              .replace(/"/g, '&quot;')
              .replace(/</g, '&lt;')
              .replace(
                />/g,
                '&gt;'
              )}" placeholder="Name" style="flex:1;min-width:160px;padding:8px;border:1px solid #d1d5db;border-radius:6px;">
            <input class="committee-role-input" type="text" value="${String(
              mem.role
            )
              .replace(/"/g, '&quot;')
              .replace(/</g, '&lt;')
              .replace(
                />/g,
                '&gt;'
              )}" placeholder="Role" style="flex:1;min-width:140px;padding:8px;border:1px solid #d1d5db;border-radius:6px;">
            <input class="committee-position-input" type="text" value="${String(
              mem.position
            )
              .replace(/"/g, '&quot;')
              .replace(/</g, '&lt;')
              .replace(
                />/g,
                '&gt;'
              )}" placeholder="Position" style="flex:1;min-width:140px;padding:8px;border:1px solid #d1d5db;border-radius:6px;">
            <input class="committee-area-input" type="text" value="${String(
              mem.area
            )
              .replace(/"/g, '&quot;')
              .replace(/</g, '&lt;')
              .replace(
                />/g,
                '&gt;'
              )}" placeholder="Inspection Area" style="flex:1;min-width:160px;padding:8px;border:1px solid #d1d5db;border-radius:6px;">
            <div class="committee-controls" style="display:flex;flex-direction:column;gap:6px;">
              <button type="button" class="btn btn-secondary" onclick="moveCommitteeMemberUp(this)" title="Move up">⯅</button>
              <button type="button" class="btn btn-secondary" onclick="moveCommitteeMemberDown(this)" title="Move down">⯆</button>
              <button type="button" class="btn btn-danger" onclick="removeCommitteeMember(this)" title="Remove">Remove</button>
            </div>
          </div>
        `
      })
      .join('')
  } else {
    committeeHtml =
      '<div class="about-card" style="color:#6b7280;padding:8px;border-radius:6px;background:#fff;border:1px dashed #e5e7eb;">No members yet. Use &quot;Add Member&quot; to create one.</div>'
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
                
        <!-- Inspection Committee Members -->
        <div style="padding: 16px; background: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827; font-weight: 600;">Inspection Committee Members</h3>
          <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;">Add, remove or reorder committee members. Use <code>Name — Role</code> for clarity.</p>
                    <div id="committee-list">
                      ${committeeHtml}
                    </div>
            <div style="margin-top:10px;display:flex;gap:8px;">
              <button type="button" class="btn btn-primary" onclick="addCommitteeMember()" style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;">Add Member</button>
              <button type="button" class="btn btn-secondary" onclick="(function(){ const c=document.getElementById('committee-list'); if(!c) return; c.querySelectorAll('.committee-member-row').forEach(r=>{ r.querySelectorAll('input').forEach(i=>i.value='') }); })()" style="padding:8px 12px;">Clear All</button>
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
  // Collect committee members from dynamic list inputs (if present)
  const committeeListEl = document.getElementById('committee-list')
  let committeeMembers = []
  if (committeeListEl) {
    const rows = Array.from(
      committeeListEl.querySelectorAll('.committee-member-row')
    )
    committeeMembers = rows
      .map((r) => {
        const name = (r.querySelector('.committee-name-input') || {}).value
          ? r.querySelector('.committee-name-input').value.trim()
          : ''
        const role = (r.querySelector('.committee-role-input') || {}).value
          ? r.querySelector('.committee-role-input').value.trim()
          : ''
        const position = (r.querySelector('.committee-position-input') || {})
          .value
          ? r.querySelector('.committee-position-input').value.trim()
          : ''
        const area = (r.querySelector('.committee-area-input') || {}).value
          ? r.querySelector('.committee-area-input').value.trim()
          : ''
        if (!name && !role && !position && !area) return null
        return {
          name: name || '',
          role: role || '',
          position: position || '',
          inspectionArea: area || '',
        }
      })
      .filter((x) => x !== null)
  } else {
    committeeMembers = []
  }

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
    committeeMembers,
    // image fields removed — not stored anymore
  }

  // Close modal and refresh
  closeEditAboutModal()
  loadPageContent('about')
  showAlert('About Us content updated successfully!', 'success')
}

// Image removal helpers removed — images are no longer used on About page

// --- Committee member list helpers (used in Edit About modal) ---
function addCommitteeMember(value = {}) {
  const list = document.getElementById('committee-list')
  if (!list) return
  const wrapper = document.createElement('div')
  wrapper.className = 'committee-member-row'
  wrapper.style.cssText =
    'display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;'
  const name =
    value && value.name ? String(value.name).replace(/"/g, '&quot;') : ''
  const role =
    value && value.role ? String(value.role).replace(/"/g, '&quot;') : ''
  const position =
    value && value.position
      ? String(value.position).replace(/"/g, '&quot;')
      : ''
  const area =
    value && (value.inspectionArea || value.area)
      ? String(value.inspectionArea || value.area).replace(/"/g, '&quot;')
      : ''
  wrapper.innerHTML = `
    <input class="committee-name-input" type="text" value="${name}" placeholder="Name" style="flex:1;min-width:160px;padding:8px;border:1px solid #d1d5db;border-radius:6px;">
    <input class="committee-role-input" type="text" value="${role}" placeholder="Role" style="flex:1;min-width:140px;padding:8px;border:1px solid #d1d5db;border-radius:6px;">
    <input class="committee-position-input" type="text" value="${position}" placeholder="Position" style="flex:1;min-width:140px;padding:8px;border:1px solid #d1d5db;border-radius:6px;">
    <input class="committee-area-input" type="text" value="${area}" placeholder="Inspection Area" style="flex:1;min-width:160px;padding:8px;border:1px solid #d1d5db;border-radius:6px;">
    <div class="committee-controls" style="display:flex;flex-direction:column;gap:6px;">
      <button type="button" class="btn btn-secondary" onclick="moveCommitteeMemberUp(this)" title="Move up">⯅</button>
      <button type="button" class="btn btn-secondary" onclick="moveCommitteeMemberDown(this)" title="Move down">⯆</button>
      <button type="button" class="btn btn-danger" onclick="removeCommitteeMember(this)" title="Remove">Remove</button>
    </div>
  `
  list.appendChild(wrapper)
  return wrapper
}

function removeCommitteeMember(buttonEl) {
  const row = buttonEl.closest('.committee-member-row')
  if (!row) return
  row.remove()
}

function moveCommitteeMemberUp(buttonEl) {
  const row = buttonEl.closest('.committee-member-row')
  if (!row) return
  const prev = row.previousElementSibling
  if (prev) row.parentNode.insertBefore(row, prev)
}

function moveCommitteeMemberDown(buttonEl) {
  const row = buttonEl.closest('.committee-member-row')
  if (!row) return
  const next = row.nextElementSibling
  if (next) row.parentNode.insertBefore(next, row)
}

// Expose helpers to global scope so inline onclick handlers work
window.addCommitteeMember = addCommitteeMember
window.removeCommitteeMember = removeCommitteeMember
window.moveCommitteeMemberUp = moveCommitteeMemberUp
window.moveCommitteeMemberDown = moveCommitteeMemberDown

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

  // Group activities by time periods
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const groupedActivities = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  }

  combinedActivities.forEach((activity) => {
    // Simple date parsing for demo - in real app, use proper date parsing
    const activityDate = new Date(
      activity.timestamp || activity.createdAt || now
    )
    if (activityDate >= today) {
      groupedActivities.today.push(activity)
    } else if (activityDate >= yesterday) {
      groupedActivities.yesterday.push(activity)
    } else if (activityDate >= weekAgo) {
      groupedActivities.thisWeek.push(activity)
    } else {
      groupedActivities.older.push(activity)
    }
  })

  // Activity type configurations
  const activityTypes = {
    system: { icon: 'settings', color: '#6b7280', bgColor: '#f9fafb' },
    user: { icon: 'user', color: '#3b82f6', bgColor: '#eff6ff' },
    inventory: { icon: 'package', color: '#10b981', bgColor: '#f0fdf4' },
    alert: { icon: 'alert-triangle', color: '#f59e0b', bgColor: '#fffbeb' },
    error: { icon: 'x-circle', color: '#ef4444', bgColor: '#fef2f2' },
    success: { icon: 'check-circle', color: '#10b981', bgColor: '#f0fdf4' },
    info: { icon: 'info', color: '#3b82f6', bgColor: '#eff6ff' },
  }

  function renderActivityGroup(title, activities, showHeader = true) {
    if (activities.length === 0) return ''

    return `
      ${
        showHeader
          ? `<div class="activity-group-header" style="padding: 16px 24px 8px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
        <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 8px;">
          ${title} (${activities.length})
        </h4>
      </div>`
          : ''
      }
      <div class="activity-group" style="display: flex; flex-direction: column;">
        ${activities
          .map((activity, index) => {
            const typeConfig =
              activityTypes[activity.type] || activityTypes.info
            const iconName = activity.icon || typeConfig.icon
            const iconColor = activity.color || typeConfig.color
            const bgColor = activity.read ? '#ffffff' : typeConfig.bgColor
            const borderLeft = activity.read ? 'transparent' : iconColor
            const priority = activity.priority || 'normal'
            const priorityStyles = {
              high: 'border-left: 4px solid #ef4444; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);',
              normal: '',
              low: 'opacity: 0.8;',
            }

            return `
            <div class="activity-item" style="display: flex; align-items: flex-start; gap: 16px; padding: 20px 24px; background: ${bgColor}; border-left: 3px solid ${borderLeft}; border-bottom: 1px solid #e5e7eb; transition: all 0.2s ease; cursor: pointer; position: relative; ${
              priorityStyles[priority] || ''
            }"
                 onclick="handleActivityItemClick(event, '${activity.id}')"
                 onmouseover="this.style.background='${
                   activity.read ? '#f9fafb' : '#f0f9ff'
                 }'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                 onmouseout="this.style.background='${bgColor}'; this.style.transform='translateY(0)'; this.style.boxShadow='none'">

              <!-- Priority indicator for high priority -->
              ${
                priority === 'high'
                  ? `
                <div style="position: absolute; top: 12px; right: 12px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 2s infinite;"></div>
              `
                  : ''
              }

              <!-- Activity Content -->
              <div class="activity-content" style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px;">
                  <div style="flex: 1; min-width: 0;">
                    <h4 class="activity-title" style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827; line-height: 1.4;">${
                      activity.title
                    }</h4>
                    <p class="activity-message" style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">${
                      activity.message
                    }</p>
                  </div>
                  <div class="activity-meta" style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0;">
                    <span class="activity-time" style="font-size: 12px; color: #9ca3af; white-space: nowrap;">${
                      activity.time
                    }</span>
                    ${
                      !activity.read
                        ? `
                      <span class="activity-status" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: ${iconColor}; color: white; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
                        New
                      </span>
                    `
                        : ''
                    }
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="activity-actions" style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
                  ${
                    !activity.read
                      ? `
                    <button class="activity-action-btn" onclick="event.stopPropagation(); markNotificationAsRead('${activity.id}')"
                            style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: ${iconColor}; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;"
                            onmouseover="this.style.background='${iconColor}dd'; this.style.transform='translateY(-1px)'"
                            onmouseout="this.style.background='${iconColor}'; this.style.transform='translateY(0)'">
                      <i data-lucide="check" style="width: 14px; height: 14px;"></i>
                      Mark Read
                    </button>
                  `
                      : ''
                  }
                  <button class="activity-action-btn secondary" onclick="event.stopPropagation(); dismissActivity('${
                    activity.id
                  }')"
                          style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: transparent; color: #6b7280; border: 1px solid #d1d5db; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;"
                          onmouseover="this.style.background='#f9fafb'; this.style.borderColor='#9ca3af'"
                          onmouseout="this.style.background='transparent'; this.style.borderColor='#d1d5db'">
                    <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          `
          })
          .join('')}
      </div>
    `
  }

  return `
    <!-- Custom CSS for animations and enhanced styling -->
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .activity-item {
        animation: slideIn 0.3s ease-out;
      }

      .activity-item:nth-child(1) { animation-delay: 0.05s; }
      .activity-item:nth-child(2) { animation-delay: 0.1s; }
      .activity-item:nth-child(3) { animation-delay: 0.15s; }
      .activity-item:nth-child(4) { animation-delay: 0.2s; }
      .activity-item:nth-child(5) { animation-delay: 0.25s; }

      .activity-group-header {
        position: sticky;
        top: 0;
        z-index: 10;
        backdrop-filter: blur(8px);
        background: rgba(249, 250, 251, 0.95);
      }

      .filter-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .filter-tab {
        padding: 8px 16px;
        border: none;
        background: transparent;
        color: #6b7280;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 8px 8px 0 0;
        transition: all 0.2s;
        position: relative;
      }

      .filter-tab.active {
        color: #3b82f6;
        background: #eff6ff;
      }

      .filter-tab:hover:not(.active) {
        color: #374151;
        background: #f9fafb;
      }

      .filter-tab.active::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: #3b82f6;
      }

      .search-container {
        position: relative;
        margin-bottom: 16px;
      }

      .search-input {
        width: 100%;
        padding: 12px 16px 12px 44px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        transition: all 0.2s;
        background: white;
      }

      .search-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        width: 18px;
        height: 18px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-card {
        background: white;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        text-align: center;
        transition: all 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .bulk-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }

      .bulk-actions.hidden {
        display: none;
      }

      /* Responsive header styles */
      @media (max-width: 1024px) {
        .page-header-content {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 16px !important;
        }

        .stats-grid {
          justify-content: center;
        }

        .page-subtitle {
          margin-left: 0 !important;
        }
      }

      @media (max-width: 768px) {
        .page-header-content {
          gap: 12px !important;
        }

        .stats-grid {
          flex-wrap: wrap;
          justify-content: space-around;
        }

        .stat-card {
          min-width: 70px !important;
          flex: 1;
          max-width: 80px;
        }

        .btn-text {
          display: none;
        }

        .page-title {
          font-size: 20px !important;
        }

        .page-subtitle {
          font-size: 13px !important;
          margin-top: 4px !important;
        }
      }

      @media (max-width: 480px) {
        .page-header-content {
          gap: 8px !important;
        }

        .stats-grid {
          gap: 4px !important;
        }

        .stat-card {
          padding: 6px 8px !important;
          min-width: 50px !important;
        }

        .stat-number {
          font-size: 16px !important;
        }

        .stat-label {
          font-size: 10px !important;
        }

        .page-title {
          font-size: 18px !important;
        }

        .page-title span {
          display: block;
        }
      }
    </style>

    <div class="page-header">
      <div class="page-header-content" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 16px; min-width: 0; flex: 1;">
          <button class="btn btn-secondary" onclick="navigateToPage('dashboard')" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; transition: all 0.2s; flex-shrink: 0;"
                  onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i>
            Back
          </button>
          <div style="min-width: 0; flex: 1;">
            <h1 class="page-title" style="display: flex; align-items: center; gap: 12px; margin: 0; word-break: break-word;">
              <span style="flex: 1; min-width: 0;">Activity & Notifications</span>
            </h1>
            <p class="page-subtitle" style="margin: 8px 0 0 0; color: #6b7280; word-break: break-word;">Stay updated with system activities and important notifications</p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; flex-shrink: 0;">
          <!-- Quick Stats -->
          <div class="stats-grid" style="display: flex; gap: 8px; margin: 0;">
            <div class="stat-card" style="padding: 8px 12px; min-width: 60px;">
              <div class="stat-number" style="font-size: 18px; color: #ef4444;">${unreadCount}</div>
              <div class="stat-label">Unread</div>
            </div>
            <div class="stat-card" style="padding: 8px 12px; min-width: 60px;">
              <div class="stat-number" style="font-size: 18px; color: #10b981;">${
                combinedActivities.length
              }</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-card" style="padding: 8px 12px; min-width: 60px;">
              <div class="stat-number" style="font-size: 18px; color: #f59e0b;">${
                groupedActivities.today.length
              }</div>
              <div class="stat-label">Today</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${
              unreadCount > 0
                ? `
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #fde68a; border-radius: 12px; padding: 8px 16px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1); flex-shrink: 0;">
                  <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; animation: pulse 2s infinite; flex-shrink: 0;"></div>
                  <span style="font-size: 14px; font-weight: 600; color: #b45309; white-space: nowrap;">${unreadCount} unread</span>
                </div>
              `
                : ''
            }
            <button class="btn btn-secondary" onclick="markAllNotificationsRead()" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; transition: all 0.2s; white-space: nowrap;"
                    onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              <i data-lucide="check-check" style="width: 16px; height: 16px;"></i>
              <span class="btn-text">Mark all read</span>
            </button>
            <button class="btn btn-secondary" onclick="clearAllNotifications()" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; transition: all 0.2s; white-space: nowrap;"
                    onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
              <span class="btn-text">Clear all</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="page-content">
      <!-- Search and Filters -->
      <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div class="search-container">
          <i data-lucide="search" class="search-icon"></i>
          <input type="text" class="search-input" placeholder="Search notifications..." oninput="filterActivities(this.value)">
        </div>

        <div class="filter-tabs">
          <button class="filter-tab active" onclick="filterByType('all', this)">All</button>
          <button class="filter-tab" onclick="filterByType('unread', this)">Unread</button>
          <button class="filter-tab" onclick="filterByType('system', this)">System</button>
          <button class="filter-tab" onclick="filterByType('alert', this)">Alerts</button>
          <button class="filter-tab" onclick="filterByType('today', this)">Today</button>
        </div>
      </div>

      <!-- Bulk Actions (hidden by default) -->
      <div class="bulk-actions hidden" id="bulk-actions">
        <span style="font-size: 14px; color: #374151; font-weight: 500;">0 selected</span>
        <button class="btn btn-secondary" onclick="bulkMarkRead()" style="padding: 6px 12px; font-size: 12px;">
          <i data-lucide="check" style="width: 14px; height: 14px;"></i>
          Mark Read
        </button>
        <button class="btn btn-danger" onclick="bulkDismiss()" style="padding: 6px 12px; font-size: 12px;">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          Dismiss
        </button>
      </div>

      ${
        combinedActivities.length === 0
          ? `
          <div class="card" style="text-align: center; padding: 80px 32px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #e2e8f0;">
            <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 32px; position: relative;">
              <i data-lucide="bell-off" style="width: 60px; height: 60px; color: #94a3b8;"></i>
              <div style="position: absolute; top: -8px; right: -8px; width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                <i data-lucide="plus" style="width: 16px; height: 16px; color: white;"></i>
              </div>
            </div>
            <h3 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px; font-weight: 700;">All caught up!</h3>
            <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6;">No new notifications or activities at the moment. We'll notify you when something important happens.</p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
              <button class="btn btn-primary" onclick="refreshActivities()" style="display: flex; align-items: center; gap: 8px; padding: 12px 24px;">
                <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
                Refresh
              </button>
              <button class="btn btn-secondary" onclick="navigateToPage('dashboard')" style="padding: 12px 24px;">
                Back to Dashboard
              </button>
            </div>
          </div>
        `
          : `
          <div class="card" style="padding: 0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 12px;">
            ${renderActivityGroup('Today', groupedActivities.today)}
            ${renderActivityGroup('Yesterday', groupedActivities.yesterday)}
            ${renderActivityGroup('This Week', groupedActivities.thisWeek)}
            ${renderActivityGroup('Older', groupedActivities.older)}
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
      // Update activity view in-place if visible, otherwise refresh activity page
      try {
        saveNotifications()
        updateNotificationBadge()
        const activityList = document.getElementById('recent-activity-list')
        if (activityList && AppState.currentPage === 'dashboard') {
          // Update notifications area only (recent activity may include notifications)
          try {
            renderNotifications(currentNotificationFilter)
          } catch (e) {}
        } else if (AppState.currentPage === 'activity') {
          // If on the activity page, re-render the full activity area
          try {
            const body = document.getElementById('main-content')
            if (body) body.innerHTML = generateActivityPage()
            lucide.createIcons()
            initializePageEvents('activity')
          } catch (e) {}
        }
      } catch (e) {
        // Fallback to full page content reload when something unexpected occurs
        loadPageContent('activity')
      }
      updateNotificationBadge()
    }
  }
}

function dismissActivity(activityId) {
  if (AppState.notifications) {
    const index = AppState.notifications.findIndex((n) => n.id === activityId)
    if (index !== -1) {
      AppState.notifications.splice(index, 1)
      saveNotifications()
      updateNotificationBadge()

      // Update UI
      if (AppState.currentPage === 'activity') {
        const body = document.getElementById('main-content')
        if (body) body.innerHTML = generateActivityPage()
        lucide.createIcons()
        initializePageEvents('activity')
      }
    }
  }
}

function filterActivities(searchTerm) {
  const activityItems = document.querySelectorAll('.activity-item')
  const searchLower = searchTerm.toLowerCase()

  activityItems.forEach((item) => {
    const title =
      item.querySelector('.activity-title')?.textContent.toLowerCase() || ''
    const message =
      item.querySelector('.activity-message')?.textContent.toLowerCase() || ''

    if (
      title.includes(searchLower) ||
      message.includes(searchLower) ||
      searchTerm === ''
    ) {
      item.style.display = 'flex'
    } else {
      item.style.display = 'none'
    }
  })

  // Update group headers visibility
  const activityGroups = document.querySelectorAll('.activity-group')
  activityGroups.forEach((group) => {
    const visibleItems = group.querySelectorAll(
      '.activity-item[style*="display: flex"]'
    )
    const header = group.previousElementSibling
    if (header && header.classList.contains('activity-group-header')) {
      header.style.display = visibleItems.length > 0 ? 'block' : 'none'
    }
  })
}

function filterByType(type, buttonElement) {
  // Update active tab
  document
    .querySelectorAll('.filter-tab')
    .forEach((tab) => tab.classList.remove('active'))
  buttonElement.classList.add('active')

  const activityItems = document.querySelectorAll('.activity-item')

  activityItems.forEach((item) => {
    let show = true

    switch (type) {
      case 'unread':
        show = item.querySelector('.activity-status') !== null
        break
      case 'system':
        show =
          item.querySelector(
            '[data-lucide="settings"], [data-lucide="package"], [data-lucide="users"], [data-lucide="trending-up"]'
          ) !== null
        break
      case 'alert':
        show =
          item.querySelector(
            '[data-lucide="alert-triangle"], [data-lucide="x-circle"]'
          ) !== null
        break
      case 'today':
        const todayHeader =
          item.closest('.activity-group')?.previousElementSibling
        show = todayHeader && todayHeader.textContent.includes('Today')
        break
      case 'all':
      default:
        show = true
        break
    }

    item.style.display = show ? 'flex' : 'none'
  })

  // Update group headers visibility
  const activityGroups = document.querySelectorAll('.activity-group')
  activityGroups.forEach((group) => {
    const visibleItems = group.querySelectorAll(
      '.activity-item[style*="display: flex"]'
    )
    const header = group.previousElementSibling
    if (header && header.classList.contains('activity-group-header')) {
      header.style.display = visibleItems.length > 0 ? 'block' : 'none'
    }
  })
}

function bulkMarkRead() {
  const selectedItems = document.querySelectorAll('.activity-item.selected')
  selectedItems.forEach((item) => {
    const activityId = item
      .querySelector('.activity-action-btn')
      ?.getAttribute('onclick')
      ?.match(/'([^']+)'/)?.[1]
    if (activityId) {
      markNotificationAsRead(activityId)
    }
  })

  // Clear selection
  clearBulkSelection()
}

function bulkDismiss() {
  const selectedItems = document.querySelectorAll('.activity-item.selected')
  const activityIds = []

  selectedItems.forEach((item) => {
    const activityId = item
      .querySelector('.activity-action-btn.secondary')
      ?.getAttribute('onclick')
      ?.match(/'([^']+)'/)?.[1]
    if (activityId) {
      activityIds.push(activityId)
    }
  })

  // Confirm bulk dismiss
  if (activityIds.length > 0) {
    showInUiConfirm(
      `Dismiss ${activityIds.length} notification${
        activityIds.length > 1 ? 's' : ''
      }?`,
      {
        confirmText: 'Dismiss',
        title: 'Bulk Dismiss',
      }
    ).then((confirmed) => {
      if (confirmed) {
        activityIds.forEach((id) => dismissActivity(id))
        clearBulkSelection()
      }
    })
  }
}

function clearBulkSelection() {
  document.querySelectorAll('.activity-item.selected').forEach((item) => {
    item.classList.remove('selected')
    item.style.background = item.dataset.originalBg || ''
  })

  updateBulkActionsVisibility()
}

function updateBulkActionsVisibility() {
  const selectedCount = document.querySelectorAll(
    '.activity-item.selected'
  ).length
  const bulkActions = document.getElementById('bulk-actions')

  if (bulkActions) {
    if (selectedCount > 0) {
      bulkActions.classList.remove('hidden')
      bulkActions.querySelector(
        'span'
      ).textContent = `${selectedCount} selected`
    } else {
      bulkActions.classList.add('hidden')
    }
  }
}

function refreshActivities() {
  // Refresh the activity page
  if (AppState.currentPage === 'activity') {
    const body = document.getElementById('main-content')
    if (body) {
      body.innerHTML = generateActivityPage()
      lucide.createIcons()
      initializePageEvents('activity')
    }
  }
}

// Enhanced activity item click handling for selection
function handleActivityItemClick(event, activityId) {
  const item = event.currentTarget
  const isCtrlPressed = event.ctrlKey || event.metaKey

  if (isCtrlPressed) {
    // Multi-select mode
    event.preventDefault()
    item.classList.toggle('selected')

    if (item.classList.contains('selected')) {
      item.dataset.originalBg = item.style.background
      item.style.background = '#e0f2fe'
      item.style.borderLeftColor = '#0284c7'
    } else {
      item.style.background = item.dataset.originalBg || ''
      delete item.dataset.originalBg
    }

    updateBulkActionsVisibility()
  } else {
    // Single click - mark as read
    markNotificationAsRead(activityId)
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
    renderNotifications(currentNotificationFilter)
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
  // Ensure Product Date cannot be backdated: set min and clamp to today if necessary
  try {
    const today = new Date().toISOString().split('T')[0]
    const dateInput = modal.querySelector('#productDate')
    if (dateInput) {
      dateInput.min = today
      if (!dateInput.value || dateInput.value < today) dateInput.value = today
    }
  } catch (e) {}
  // Attach dynamic SKU handling: update hidden SKU and preview when category changes
  try {
    const categorySelect = modal.querySelector('#productCategory')
    const skuHidden = modal.querySelector('#productSku')
    const skuPreview = modal.querySelector('#product-id-badge')

    function deriveProductTypeFromCategoryId(catId) {
      const sel = (MockData.categories || []).find(
        (c) => String(c.id) === String(catId)
      )
      if (!sel) return 'expendable'
      const name = String(sel.name || '').toLowerCase()
      if (name.includes('semi')) return 'semi-expendable'
      if (name.includes('non')) return 'non-expendable'
      if (name.includes('expendable')) return 'expendable'
      const code = String(sel.code || '').toLowerCase()
      if (code.startsWith('se')) return 'semi-expendable'
      if (code.startsWith('n')) return 'non-expendable'
      if (code.startsWith('e')) return 'expendable'
      return 'expendable'
    }

    function generateSkuForType(type) {
      const prefix =
        { expendable: 'E', 'semi-expendable': 'SE', 'non-expendable': 'N' }[
          type
        ] || 'E'
      const existingSkus = (MockData.products || [])
        .map((p) => p.id || p.sku)
        .filter((s) => s && typeof s === 'string' && s.startsWith(prefix))
        .map((s) => parseInt(s.replace(prefix, '')) || 0)
        .sort((a, b) => b - a)
      const nextNumber = existingSkus.length > 0 ? existingSkus[0] + 1 : 1
      return `${prefix}${String(nextNumber).padStart(3, '0')}`
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', () => {
        const selectedId = categorySelect.value
        const derivedType = deriveProductTypeFromCategoryId(selectedId)
        // If there is already an SKU assigned and user is editing, allow regeneration
        const newSku = generateSkuForType(derivedType)
        if (skuHidden) skuHidden.value = newSku
        if (skuPreview) skuPreview.textContent = newSku
      })
    }
  } catch (e) {
    // non-fatal
    console.error('Error attaching SKU updater:', e)
  }
}

function closeProductModal() {
  const modal = document.getElementById('product-modal')
  modal.classList.remove('active')
  AppState.currentModal = null
}

async function saveProduct(productId) {
  const modal = document.getElementById('product-modal')
  const name = modal.querySelector('#productName').value.trim()
  const selectedCategoryId = modal
    .querySelector('#productCategory')
    .value.trim()
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

  // Prevent backdating the product date
  const clampedProductDate = clampDateToToday(date)

  if (!name) {
    showAlert('Product name is required', 'error')
    return
  }

  const totalValue = unitCost * quantity

  // Generate SKU for new products
  // Prefer SKU value supplied by modal (updated when category changes)
  const modalSkuInput = modal.querySelector('#productSku')
  let sku = (modalSkuInput && modalSkuInput.value) || productId
  let databaseId = null
  // Determine selected category object and derive a product "type" from it
  const selectedCategory = (MockData.categories || []).find(
    (c) => String(c.id) === String(selectedCategoryId)
  )

  // Derive product type string used for display and SKU prefix detection.
  // Fall back to 'expendable' when unknown.
  const productTypeFromCategory = (() => {
    if (!selectedCategory) return 'expendable'
    const name = String(selectedCategory.name || '').toLowerCase()
    if (name.includes('semi')) return 'semi-expendable'
    if (name.includes('non')) return 'non-expendable'
    if (name.includes('expendable')) return 'expendable'
    // Also check code if name is not descriptive
    const code = String(selectedCategory.code || '').toLowerCase()
    if (code.startsWith('se')) return 'semi-expendable'
    if (code.startsWith('n')) return 'non-expendable'
    if (code.startsWith('e')) return 'expendable'
    return 'expendable'
  })()

  if (!productId) {
    // Create new product: generate SKU based on derived product type
    const categoryPrefix =
      {
        expendable: 'E',
        'semi-expendable': 'SE',
        'non-expendable': 'N',
      }[productTypeFromCategory] || 'E'

    // Find the next available number for this category prefix
    const existingSkus = (MockData.products || [])
      .map((p) => p.id || p.sku)
      .filter((s) => s && typeof s === 'string' && s.startsWith(categoryPrefix))
      .map((s) => parseInt(s.replace(categoryPrefix, '')) || 0)
      .sort((a, b) => b - a)

    const nextNumber = existingSkus.length > 0 ? existingSkus[0] + 1 : 1
    sku = `${categoryPrefix}${String(nextNumber).padStart(3, '0')}`
  } else {
    // Edit existing product: productId is the SKU, find the database ID
    const existingProduct = (MockData.products || []).find(
      (p) => p.id === productId || p.sku === productId
    )
    if (existingProduct && existingProduct.databaseId) {
      databaseId = existingProduct.databaseId
    }
    // Keep the existing SKU
    sku = productId
  }

  try {
    const productData = {
      id: sku,
      name,
      description,
      quantity,
      unitCost,
      totalValue,
      date: clampedProductDate,
      // store both the category id and a derived type for backward compatibility
      category_id: selectedCategoryId || null,
      category_code: selectedCategory ? selectedCategory.code || null : null,
      type:
        productTypeFromCategory ||
        (selectedCategory ? selectedCategory.name : null),
      unit,
      databaseId: databaseId, // Include database ID for updates
    }

    await saveProductToAPI(productData)
    showAlert(
      `Product "${name}" ${productId ? 'updated' : 'added'} successfully!`,
      'success'
    )
  } catch (error) {
    showAlert(
      `Failed to ${productId ? 'update' : 'add'} product: ${error.message}`,
      'error'
    )
    return
  }

  closeProductModal()
  await loadProductsFromAPI()
  // Try to update products table in-place when present
  try {
    const tbody = document.getElementById('products-table-body')
    if (tbody) {
      // If existing row, replace; otherwise append. Use authoritative MockData.
      const prod = MockData.products.find(
        (p) => p.id === (productData.id || productData.sku)
      )
      if (prod) {
        const existing = tbody.querySelector(`tr[data-id="${prod.id}"]`)
        const rowHtml = renderProductRow ? renderProductRow(prod) : null
        if (existing && rowHtml) existing.outerHTML = rowHtml
        else if (rowHtml) tbody.insertAdjacentHTML('beforeend', rowHtml)
        if (window.lucide) lucide.createIcons()
        return
      }
    }
  } catch (e) {
    // ignore and fallback
  }
  // fallback
  loadPageContent('products') // refresh list
}

async function deleteProduct(productId) {
  const ok = await showConfirm('Delete this product?', 'Delete Product')
  if (!ok) return

  // Find the product name and database ID before deleting
  const product = MockData.products.find((p) => p.id === productId)
  const productName = product ? product.name : 'Product'
  const databaseId = product ? product.databaseId : productId

  try {
    await deleteProductFromAPI(databaseId)
    showAlert(`${productName} has been successfully deleted`, 'success')
  } catch (error) {
    showAlert(`Failed to delete product: ${error.message}`, 'error')
    return
  }

  // Update products table in-place when possible
  await loadProductsFromAPI()
  try {
    const tbody = document.getElementById('products-table-body')
    if (tbody) {
      const row = tbody.querySelector(`tr[data-id="${productId}"]`)
      if (row) row.remove()
      if (window.lucide) lucide.createIcons()
      return
    }
  } catch (e) {}
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
        <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          <i data-lucide="${productIcon}" style="width: 32px; height: 32px; color: white;"></i>
        </div>
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
                            ${(MockData.categories || [])
                              .map((c) => {
                                const label = `${c.code || c.id} - ${c.name}`
                                const selected =
                                  String(productData?.category_id || '') ===
                                  String(c.id)
                                return `<option value="${c.id}" ${
                                  selected ? 'selected' : ''
                                }>${escapeHtml(label)}</option>`
                              })
                              .join('')}
                        </select>
                        <!-- SKU preview and hidden SKU field -->
                        <div style="margin-top:8px; display:flex; align-items:center; gap:8px;">
                            <div id="product-id-badge" style="font-weight:700;color:#111827;background:#eef2ff;padding:6px 10px;border-radius:8px;">${
                              productData?.id || ''
                            }</div>
                            <input type="hidden" id="productSku" value="${
                              productData?.id || ''
                            }">
                        </div>
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
        <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
          <i data-lucide="${categoryIcon}" style="width: 32px; height: 32px; color: white;"></i>
        </div>
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
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400e;">Category ID: ${
                categoryData.code || categoryData.id
              }</h4>
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

  ;(async () => {
    try {
      const payload = { name: name.trim(), description: description.trim() }
      let resp
      if (!categoryId) {
        // Create on server
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw await response.json()
        resp = await response.json()
        // push returned category
        const cat = resp.data
        MockData.categories = MockData.categories || []
        MockData.categories.push(cat)
        showAlert(`Category "${cat.name}" added successfully!`, 'success')
      } else {
        // Update on server
        const response = await fetch(
          `/api/categories/${encodeURIComponent(categoryId)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRF-TOKEN': getCsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify(payload),
          }
        )
        if (!response.ok) throw await response.json()
        resp = await response.json()
        const updated = resp.data
        MockData.categories = MockData.categories || []
        const idx = MockData.categories.findIndex(
          (c) => String(c.id) === String(categoryId)
        )
        if (idx !== -1) MockData.categories[idx] = updated
        showAlert(`Category "${updated.name}" updated successfully!`, 'success')
      }
    } catch (err) {
      console.error('Error saving category to API', err)
      showAlert(
        'Failed to save category (server error). Falling back to local.',
        'warning'
      )
      // fallback local behavior
      if (!categoryId) {
        const nextIndex = MockData.categories.length + 1
        const padded = String(nextIndex).padStart(3, '0')
        const newCategory = {
          // temporary client-only id to avoid colliding with numeric server IDs
          id: `temp-${Date.now()}`,
          code: `C${padded}`,
          name: name.trim(),
          description: description.trim(),
        }
        MockData.categories.push(newCategory)
      } else {
        const existing = MockData.categories.find((c) => c.id === categoryId)
        if (existing) {
          existing.name = name.trim()
          existing.description = description.trim()
        }
      }
    } finally {
      closeCategoryModal()
      // Try to update categories table in-place
      try {
        const tbody = document.getElementById('categories-table-body')
        if (tbody) {
          // Re-render entire table body using MockData
          if (typeof renderCategoryRow === 'function') {
            tbody.innerHTML = (MockData.categories || [])
              .map((c) => renderCategoryRow(c))
              .join('')
            if (window.lucide) lucide.createIcons()
            return
          }
        }
      } catch (e) {}
      loadPageContent('categories') // refresh table/page
    }
  })()
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

  ;(async () => {
    try {
      const response = await fetch(
        `/api/categories/${encodeURIComponent(categoryId)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
          },
          credentials: 'same-origin',
        }
      )
      if (!response.ok) throw await response.json()
      // remove locally
      MockData.categories = MockData.categories.filter(
        (c) => c.id !== categoryId
      )
      showAlert(`${categoryName} has been successfully deleted`, 'success')
    } catch (err) {
      console.error('Error deleting category via API', err)
      showAlert(
        'Failed to delete category on server. Falling back to local delete.',
        'warning'
      )
      MockData.categories = MockData.categories.filter(
        (c) => c.id !== categoryId
      )
    } finally {
      // update categories table in-place if possible
      try {
        const tbody = document.getElementById('categories-table-body')
        if (tbody) {
          const row = tbody.querySelector(`tr[data-id="${categoryId}"]`)
          if (row) row.remove()
          if (window.lucide) lucide.createIcons()
          return
        }
      } catch (e) {}
      loadPageContent('categories')
    }
  })()
}

// -----------------------------//
// Stock In Modal and Functions //
// -----------------------------//

function openStockInModal(mode = 'create', stockId = null) {
  const modal = document.getElementById('stockin-modal')
  const modalContent = modal.querySelector('.modal-content')

  let stockData = null
  if (stockId && mode === 'edit') {
    // support passing either an id (string/number) or the full record object
    if (typeof stockId === 'object') {
      stockData = stockId
    } else {
      stockData = stockInData.find((r) => r && r.id == stockId) || null
    }
  }

  modalContent.innerHTML = generateStockInModal(mode, stockData)
  modal.classList.add('active')
  lucide.createIcons()
  // Prevent backdating: ensure date input min is today and value is not before today
  try {
    const today = new Date().toISOString().split('T')[0]
    const dateInput = modal.querySelector('#date-input')
    if (dateInput) {
      dateInput.min = today
      if (!dateInput.value || dateInput.value < today) dateInput.value = today
    }
  } catch (e) {}

  // Populate inline recent records table inside modal
  ;(async () => {
    const tbody = document.getElementById('modal-stockin-recent-body')
    if (!tbody) return
    try {
      // Ensure we have fresh data
      const rows = await loadStockInFromAPI()
      if (!rows || rows.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:12px;">No recent records</td></tr>'
        return
      }
      // Show up to 10 most recent
      tbody.innerHTML = rows
        .filter(Boolean)
        .slice(0, 10)
        .map((r) => {
          const tx = r.transactionId || r.transaction_id || r.id || ''
          const date = formatDate(
            r.date || r.date_received || r.created_at || ''
          )
          const prod = r.productName || r.product_name || ''
          const qty = r.quantity ?? r.qty ?? 0
          return `<tr><td style="font-weight:500;">${tx}</td><td>${date}</td><td style="font-weight:500;">${prod}</td><td>${qty}</td></tr>`
        })
        .join('')
    } catch (e) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:12px;">Failed loading</td></tr>'
      console.error('Failed loading recent stock in for modal', e)
    }
  })()

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

  // Normalize incoming stockData (accept snake_case from API or camelCase used in UI)
  const _sd = stockData || {}
  const normalizedStock = {
    id: _sd.id || _sd.id || '',
    transactionId: _sd.transactionId || _sd.transaction_id || _sd.id || '',
    sku: _sd.sku || _sd.sku || '',
    productName: _sd.productName || _sd.product_name || '',
    quantity: Number(_sd.quantity ?? _sd.qty ?? 0),
    unitCost: Number(_sd.unitCost ?? _sd.unit_cost ?? 0),
    totalCost: Number(
      _sd.totalCost ??
        _sd.total_cost ??
        (_sd.quantity ?? 0) * Number(_sd.unit_cost ?? _sd.unitCost ?? 0)
    ),
    supplier: _sd.supplier || '',
    receivedBy: _sd.receivedBy || _sd.received_by || '',
    date: formatDate(_sd.date || _sd.date_received || _sd.created_at || ''),
  }

  const dateValue =
    normalizedStock.date ||
    (mode === 'create' ? new Date().toISOString().split('T')[0] : '')
  const unitCostValue = (normalizedStock.unitCost || 0).toFixed(2)
  const totalValue = formatCurrency(normalizedStock.totalCost || 0)
  const skuValue = normalizedStock.sku
  const productNameValue = normalizedStock.productName
  const quantityValue = normalizedStock.quantity || ''
  const supplierValue = normalizedStock.supplier
  const receivedByValue = normalizedStock.receivedBy
  const stockIdValue = normalizedStock.id || ''

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
           value="${skuValue || ''}"
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
            value="${productNameValue || ''}"
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
           value="${quantityValue}"
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
            value="${supplierValue || ''}"
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
            value="${receivedByValue || ''}"
                           placeholder="Enter receiver name"
                           style="border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 14px; transition: all 0.2s;"
                           ${isReadOnly ? 'readonly' : ''}>
                </div>
            </div>
    </div>

    <!-- Recent stock-in records (mini table inside modal) -->
    <div style="padding: 16px 24px; background: white; border-radius: 12px; margin-top: 12px;">
      <h4 style="margin:0 0 12px 0;font-size:14px;color:#111827;">Recent Stock In Records</h4>
      <div style="max-height:200px; overflow:auto; border:1px solid #e5e7eb; border-radius:8px; padding:8px;">
        <table class="table" style="margin:0;">
          <thead>
            <tr>
              <th style="width:30%">Transaction</th>
              <th style="width:25%">Date</th>
              <th style="width:35%">Product</th>
              <th style="width:10%">Qty</th>
            </tr>
          </thead>
          <tbody id="modal-stockin-recent-body">
            <tr><td colspan="4" style="text-align:center;color:#6b7280;padding:12px;">Loading...</td></tr>
          </tbody>
        </table>
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
                <button class="btn btn-primary" onclick="saveStockIn('${stockIdValue}')" style="padding: 10px 24px; font-weight: 500; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); box-shadow: 0 4px 6px rgba(22, 163, 74, 0.25); transition: all 0.2s;">
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

// Helper: clamp a yyyy-mm-dd string to today (return input if empty -> today)
function clampDateToToday(dateStr) {
  const today = new Date().toISOString().split('T')[0]
  if (!dateStr) return today
  return dateStr < today ? today : dateStr
}
window.clampDateToToday = clampDateToToday

async function saveStockIn(stockId) {
  const date = document.getElementById('date-input').value
  const sku = document.getElementById('sku-input').value
  const productName = document.getElementById('product-input').value
  const quantity = parseInt(document.getElementById('qty-input').value) || 0
  const unitCost = parseFloat(document.getElementById('uc-input').value) || 0
  const totalCost = quantity * unitCost
  const supplier = document.getElementById('supplier-input').value
  const receivedBy = document.getElementById('receivedby-input').value

  const isEdit = stockId && stockId !== ''

  // Try to preserve existing transactionId when editing; otherwise generate one for new records
  let transactionId = null
  if (isEdit) {
    const existing = stockInData.find((s) => s.id === stockId)
    transactionId = existing ? existing.transactionId || existing.id : null
  }
  if (!transactionId) transactionId = generateTransactionId()

  // Prevent backdating: clamp date to today
  const clampedDate = clampDateToToday(date)

  // Build payload: include `id` only when editing so saveStockInToAPI chooses PUT for edits and POST for creates
  const newRecord = {
    ...(isEdit ? { id: stockId } : {}),
    transactionId,
    date: clampedDate,
    // API expects date_received; include both camelCase and snake_case aliases
    dateReceived: clampedDate,
    date_received: clampedDate,
    productName,
    sku,
    quantity,
    unitCost,
    totalCost,
    supplier,
    receivedBy,
  }

  try {
    await saveStockInToAPI(newRecord)
    showAlert(
      `Stock In record ${stockId ? 'updated' : 'added'} & inventory updated`,
      'success'
    )
  } catch (error) {
    showAlert(
      `Failed to ${stockId ? 'update' : 'save'} stock in: ${error.message}`,
      'error'
    )
    return
  }

  console.log('Saving stock-in record:', newRecord)

  closeStockInModal()
  // Update stock-in table in-place if present
  try {
    const tbody = document.getElementById('stock-in-table-body')
    if (tbody) {
      // find the saved record (authoritative from MockData / stockInData)
      const rec = stockInData.find(
        (r) =>
          r.id === newRecord.id || r.transactionId === newRecord.transactionId
      )
      if (rec && typeof renderStockInRow === 'function') {
        const existing = tbody.querySelector(`tr[data-id="${rec.id}"]`)
        const rowHtml = renderStockInRow(rec)
        if (existing) existing.outerHTML = rowHtml
        else tbody.insertAdjacentHTML('beforeend', rowHtml)
        if (window.lucide) lucide.createIcons()
        refreshProductsViewIfOpen()
        return
      }
    }
  } catch (e) {}
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

  try {
    await deleteStockInFromAPI(id)
    // Restore inventory (reverse addition)
    if (record) restoreInventoryFromDeletedStockIn(record)
    showAlert(`${recordInfo} deleted & inventory adjusted`, 'success')
  } catch (error) {
    showAlert(`Failed to delete stock in: ${error.message}`, 'error')
    return
  }

  // Reload the page
  try {
    const tbody = document.getElementById('stock-in-table-body')
    if (tbody) {
      const row = tbody.querySelector(`tr[data-id="${id}"]`)
      if (row) row.remove()
      if (window.lucide) lucide.createIcons()
      refreshProductsViewIfOpen()
      return
    }
  } catch (e) {}
  loadPageContent('stock-in')
  refreshProductsViewIfOpen()
}

function renderStockInRows() {
  if (!stockInData || stockInData.length === 0)
    return '<tr><td colspan="10" style="text-align:center; padding:32px 12px; color:#6b7280; font-size:14px; font-style:italic;">No records found</td></tr>'
  // Guard against null/undefined entries
  return stockInData
    .filter(Boolean)
    .map((r, i) => renderStockInRow(r, i))
    .join('')
}

function renderStockInRow(r, index) {
  const id = r?.id || ''
  const transactionId = r?.transactionId || ''
  const date = r?.date || ''
  const productName = r?.productName || ''
  const sku = r?.sku || ''
  const quantity = r?.quantity ?? 0
  const unitCost = Number(r?.unitCost) || 0
  const totalCost = Number(r?.totalCost) || 0
  const supplier = r?.supplier || ''
  const receivedBy = r?.receivedBy || ''

  return `
    <tr data-id="${id}" style="${
    index % 2 === 0 ? 'background-color: white;' : 'background-color: #f9fafb;'
  }">
      <td style="font-weight: 500;">${transactionId}</td>
      <td>${date}</td>
      <td style="font-weight: 500;">${productName}</td>
      <td style="color: #6b7280;">${sku}</td>
      <td>${quantity}</td>
      <td>${formatCurrency(unitCost)}</td>
      <td style="font-weight: 500;">${formatCurrency(totalCost)}</td>
      <td style="color: #6b7280;">${supplier}</td>
      <td style="color: #6b7280;">${receivedBy}</td>
      <td>
        <div class="table-actions">
          <button class="icon-action-btn icon-action-danger" title="Delete" onclick="deleteStockIn('${id}')">
            <i data-lucide="trash-2"></i>
          </button>
          <button class="icon-action-btn icon-action-warning" title="Edit" onclick="openStockInModal('edit','${id}')">
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
    .filter(
      (r) =>
        r.transactionId &&
        typeof r.transactionId === 'string' &&
        r.transactionId.startsWith(`SI-${year}-`)
    )
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

    // Auto-detect low-stock items when opening the modal (if SKU not pre-filled)
    try {
      const products = window.MockData?.products || []
      const lowItems = products.filter((p) => Number(p.quantity || 0) <= 20)
      if (
        (!skuInput || !skuInput.value || skuInput.value.trim() === '') &&
        lowItems.length
      ) {
        const preview = lowItems
          .slice(0, 5)
          .map((p) => `${p.id}${p.name ? ` (${p.name})` : ''}: ${p.quantity}`)
          .join('; ')
        showAlert(
          `Low stock detected for ${lowItems.length} item${
            lowItems.length === 1 ? '' : 's'
          }: ${preview}${lowItems.length > 5 ? '; ...' : ''}`,
          'warning'
        )
      }
    } catch (e) {}

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
        // Inline banner + alert when product stock is low (threshold: 20)
        try {
          const banner = document.getElementById('so-lowstock-banner')
          if (typeof prod.quantity === 'number' && prod.quantity <= 20) {
            // show transient alert
            showAlert(
              `Low stock: only ${prod.quantity} unit${
                prod.quantity === 1 ? '' : 's'
              } available for ${prod.name}.`,
              'warning'
            )
            // show inline banner with details
            if (banner) {
              banner.textContent = `Requested item low in stock — only ${prod.quantity} available.`
              banner.style.display = 'block'
            }
          } else if (banner) {
            banner.style.display = 'none'
          }
        } catch (e) {}
        // Prevent entering quantity greater than available; auto-adjust on input
        if (qty) {
          qty.setAttribute('max', prod.quantity)
          // If current value exceeds available, clamp now and show banner
          if (parseInt(qty.value) > prod.quantity) {
            qty.value = prod.quantity
            const banner = document.getElementById('so-lowstock-banner')
            if (banner) {
              banner.textContent = `Requested quantity exceeded available stock — adjusted to ${prod.quantity}.`
              banner.style.display = 'block'
            }
          }
          // Add input listener to auto-clamp if user types higher than available
          qty.removeEventListener('input', qtyInputClampHandler)
          qty.addEventListener('input', qtyInputClampHandler)
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
    // quantity clamp handler: defined here to access modal scope
    function qtyInputClampHandler(e) {
      const val = parseInt(e.target.value) || 0
      const max = parseInt(e.target.getAttribute('max')) || Infinity
      const banner = document.getElementById('so-lowstock-banner')
      if (val > max) {
        e.target.value = max
        if (banner) {
          banner.textContent = `Requested quantity exceeded available stock — adjusted to ${max}.`
          banner.style.display = 'block'
        }
      } else {
        // hide banner when quantity within limits
        if (banner) banner.style.display = 'none'
      }
      updateTotal()
    }

    // Hide inline banner when modal closes or when SKU changes to a different product
    // Ensure banner is hidden initially if no low stock
    try {
      const banner = document.getElementById('so-lowstock-banner')
      if (banner && banner.textContent.trim() === 'Low stock')
        banner.style.display = 'none'
      // hide banner when modal close (listen on modal close button)
      const closeBtn = modal.querySelector('.modal-close')
      if (closeBtn)
        closeBtn.addEventListener(
          'click',
          () => banner && (banner.style.display = 'none')
        )
      // hide banner when SKU input changes to empty or different SKU
      skuInput.addEventListener('input', () => {
        const b = document.getElementById('so-lowstock-banner')
        if (b) b.style.display = 'none'
      })
    } catch (e) {}
    // Prevent backdating: ensure so-date min is today and value is not before today
    try {
      const today = new Date().toISOString().split('T')[0]
      const soDate = modal.querySelector('#so-date')
      if (soDate) {
        soDate.min = today
        if (!soDate.value || soDate.value < today) soDate.value = today
      }
    } catch (e) {}
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
          <!-- Inline low-stock banner (hidden by default). Visible until modal close or SKU change -->
          <div id="so-lowstock-banner" style="display:none;margin-top:8px;padding:8px 12px;border-radius:8px;background:#fff7ed;color:#92400e;font-weight:600;font-size:13px;">Low stock</div>
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

async function saveStockOut(stockId) {
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

  const isEdit = stockId && stockId !== ''

  // Prevent backdating: clamp date to today
  const clampedSoDate = clampDateToToday(date)

  // Validate available stock: find product by SKU (case-insensitive)
  try {
    const prod = (window.MockData?.products || []).find(
      (p) => (p.id || '').toLowerCase() === (sku || '').toLowerCase()
    )
    if (prod) {
      const available = Number(prod.quantity || 0)
      if (!isEdit && available <= 20) {
        // Block creating a stock out when available stock is <= 20
        showAlert(
          `Cannot proceed: available stock for ${
            prod.name || sku
          } is ${available}, which is at or below the minimum allowed (20). Please restock before issuing.`,
          'error'
        )
        return
      }
      // If editing, allow but still clamp quantity to available
      if (isEdit && quantity > available) {
        showAlert(
          `Adjusted quantity to available stock (${available}).`,
          'warning'
        )
        // override record quantity
        quantity = available
      }
    }
  } catch (e) {}

  const record = Object.assign(
    {},
    // only include id when editing so saveStockOutToAPI chooses PUT for edits
    isEdit ? { id: stockId } : {},
    {
      issueId: isEdit
        ? stockOutData.find((s) => s && s.id == stockId)?.issueId ||
          generateStockOutIssueId()
        : generateStockOutIssueId(),
      date: clampedSoDate,
      // include both aliases so server accepts 'date_issued'
      dateIssued: clampedSoDate,
      date_issued: clampedSoDate,
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
  )

  let saved = null
  try {
    saved = await saveStockOutToAPI(record)
    showAlert(
      `Stock Out record ${stockId ? 'updated' : 'added'} & inventory updated`,
      'success'
    )
  } catch (error) {
    // If server returned 422 on create, show a specific friendly toast message
    if (!stockId && error && error.status === 422) {
      showAlert('Failed to add stock out because of the stocks', 'error')
    } else {
      showAlert(
        `Failed to ${stockId ? 'update' : 'save'} stock out: ${error.message}`,
        'error'
      )
    }
    return
  }

  // Update DOM if Stock Out table is present to avoid full page reload
  const tbody = document.getElementById('stock-out-table-body')
  if (tbody) {
    const existingRow = tbody.querySelector(`tr[data-id="${saved.id}"]`)
    if (existingRow) {
      // replace existing row with authoritative server response
      existingRow.outerHTML = renderStockOutRow(saved)
    } else {
      // append new row
      tbody.insertAdjacentHTML('beforeend', renderStockOutRow(saved))
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
  return stockOutData
    .filter(Boolean)
    .map((s, i) => renderStockOutRow(s, i))
    .join('')
}

function renderStockOutRow(s) {
  const id = s?.id || ''
  const issueId = s?.issueId || ''
  const date = s?.date || ''
  const productName = s?.productName || ''
  const sku = s?.sku || ''
  const quantity = s?.quantity ?? 0
  const unitCost = Number(s?.unitCost) || 0
  const totalCost = Number(s?.totalCost) || 0
  const department = s?.department || ''
  const issuedTo = s?.issuedTo || ''
  const issuedBy = s?.issuedBy || ''
  const status = s?.status || ''

  return `
        <tr data-id="${id}">
            <td class="font-semibold">${issueId}</td>
            <td>${date}</td>
            <td>${productName}</td>
            <td class="text-sm text-gray-600">${sku}</td>
            <td>${quantity}</td>
            <td>${formatCurrency(unitCost)}</td>
            <td class="font-semibold">${formatCurrency(totalCost)}</td>
            <td><span class="badge">${department}</span></td>
            <td>${issuedTo}</td>
            <td>${issuedBy}</td>
            <td><span class="badge ${
              status === 'Completed'
                ? 'green'
                : status === 'Pending'
                ? 'yellow'
                : status === 'Cancelled'
                ? 'red'
                : ''
            }">${status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="icon-action-btn" title="View" onclick="viewStockOutDetails('${id}')">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="icon-action-btn icon-action-warning" title="Edit" onclick="editStockOut('${id}')">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="icon-action-btn icon-action-danger" title="Delete" onclick="deleteStockOut('${id}')">
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
  const record = stockOutData.find((s) => s.id == id)
  const recordInfo = record
    ? `${record.productName} (${record.transactionId})`
    : 'Stock Out record'

  try {
    await deleteStockOutFromAPI(id)
    // Restore inventory (reverse addition)
    if (record) restoreInventoryFromDeletedStockOut(record)
    showAlert(`${recordInfo} deleted & inventory adjusted`, 'success')
  } catch (error) {
    showAlert(`Failed to delete stock out: ${error.message}`, 'error')
    return
  }
  // Update stock-out table in-place when possible
  try {
    const tbody = document.getElementById('stock-out-table-body')
    if (tbody) {
      const row = tbody.querySelector(`tr[data-id="${id}"]`)
      if (row) row.remove()
      if (window.lucide) lucide.createIcons()
      refreshProductsViewIfOpen()
      return
    }
  } catch (e) {}
  loadPageContent('stock-out')
  refreshProductsViewIfOpen()
}

function viewStockOutDetails(id) {
  const rec = stockOutData.find((s) => s.id == id)
  if (!rec) {
    showAlert('Record not found', 'error')
    return
  }
  openStockOutModal('view', rec)
}

function editStockOut(id) {
  const rec = stockOutData.find((s) => s.id == id)
  if (!rec) {
    showAlert('Record not found', 'error')
    return
  }
  openStockOutModal('edit', rec)
}

function generateStockOutIssueId() {
  const year = new Date().getFullYear()
  const existing = stockOutData
    .filter(
      (r) =>
        r.issueId &&
        typeof r.issueId === 'string' &&
        r.issueId.startsWith(`SO-${year}-`)
    )
    .map((r) => parseInt(r.issueId.split('-')[2]) || 0)
  const next = Math.max(...existing, 0) + 1
  return `SO-${year}-${String(next).padStart(3, '0')}`
}

// ===== STATUS MANAGEMENT =====
async function initStatusManagement(filter = 'all') {
  const mainContent = document.getElementById('main-content')
  if (!mainContent) return
  AppState.currentStatusFilter = filter

  // Load latest user requests from localStorage (kept for backward compatibility)
  try {
    loadUserRequests()
  } catch (e) {
    // ignore
  }

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
            <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Requester</th>
                      <th>Department</th>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit</th>
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
        </div>
    `

  // Immediately fetch latest purchase requests from server and populate status list
  ;(async () => {
    try {
      const resp = await fetch('/api/purchase-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
      })

      if (resp.ok) {
        const payload = await resp.json()
        const rows = payload.data || payload || []

        AppState.statusRequests = (rows || []).map((r) => {
          // Normalize server fields to UI-friendly shape
          const obj = {}
          obj.id = r.request_id || r.requestId || r.id || ''
          obj.requester = r.requester || r.name || r.requester_name || ''
          obj.email = r.email || ''
          obj.department = r.department || r.dept || ''
          // items may be an array or a string; show first item or joined list
          if (Array.isArray(r.items)) {
            try {
              obj.item = r.items
                .map((it) =>
                  typeof it === 'object'
                    ? it.description || it.name || JSON.stringify(it)
                    : it
                )
                .join('; ')
            } catch (e) {
              obj.item = String(r.items)
            }
          } else {
            obj.item = r.items || r.items_text || r.items_string || ''
          }
          obj.unit = r.unit || ''
          // map quantity from various possible server fields
          obj.quantity = Number(
            r.quantity || r.qty || (r.metadata && r.metadata.quantity) || 0
          )
          obj.priority = (r.priority || r.priority_level || 'low')
            .toString()
            .toLowerCase()
          obj.status = (r.status || 'incoming').toString().toLowerCase()
          obj.updatedAt = formatDate(
            r.submitted_at ||
              r.updated_at ||
              r.created_at ||
              r.submittedAt ||
              r.timestamp ||
              ''
          )
          // cost may be present in top-level or inside metadata
          obj.cost = Number(
            r.cost || r.total_cost || (r.metadata && r.metadata.cost) || 0
          )
          obj.returnRemarks =
            r.returnRemarks ||
            r.return_remarks ||
            (r.metadata && r.metadata.returnRemarks) ||
            []
          obj.source = (
            r.source ||
            (r.metadata && r.metadata.source) ||
            'user-form'
          ).toString()
          // keep raw server object for advanced views if needed
          obj._raw = r
          return obj
        })
      } else {
        console.warn('Failed to load purchase requests:', resp.status)
      }
    } catch (e) {
      console.error('Error fetching purchase requests:', e)
    }

    // Update table body and status cards after fetch (or fallback)
    try {
      const body = document.getElementById('status-table-body')
      if (body)
        body.innerHTML = renderStatusRows(
          AppState.currentStatusFilter || filter || 'all'
        )
      refreshStatusCards()
      lucide.createIcons()
    } catch (e) {
      // ignore UI update errors
    }
  })()

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
    return `<tr><td colspan="11" style="text-align:center;padding:16px;color:#6b7280;">No records</td></tr>`
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
                <td>${
                  typeof r.quantity !== 'undefined'
                    ? r.quantity || r.quantity === 0
                      ? r.quantity
                      : '-'
                    : '-'
                }</td>
                <td>${r.unit || '-'}</td>
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

// Update a status request row (used by inline onclick handlers)
async function updateStatusRow(id, newStatus) {
  // Update local AppState first for snappy UI
  const rec = (AppState.statusRequests || []).find((r) => r.id === id)
  if (!rec) {
    showAlert('Request not found', 'error')
    return
  }
  const oldStatus = rec.status
  rec.status = newStatus
  rec.updatedAt = new Date().toISOString().split('T')[0]

  // Optimistically refresh UI
  refreshStatusCards()
  const tbody = document.getElementById('status-table-body')
  if (tbody)
    tbody.innerHTML = renderStatusRows(AppState.currentStatusFilter || 'all')

  // Try to persist change to server if API exists
  try {
    const res = await fetch(`/api/status-requests/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken(),
      },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) throw new Error('Failed to update on server')
    showAlert('Status updated', 'success')
  } catch (e) {
    // Revert on failure
    rec.status = oldStatus
    refreshStatusCards()
    if (tbody)
      tbody.innerHTML = renderStatusRows(AppState.currentStatusFilter || 'all')
    showAlert('Unable to update status on server', 'error')
  }
}
window.updateStatusRow = updateStatusRow

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
    // After adding Quantity and Unit columns, Priority is now at cell index 6
    const rowPriority = row.cells[6].innerText.toLowerCase()

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
  closeEditAboutModal,
  saveAboutUs,
  // New activity & notification functions
  dismissActivity,
  filterActivities,
  filterByType,
  bulkMarkRead,
  bulkDismiss,
  clearBulkSelection,
  updateBulkActionsVisibility,
  refreshActivities,
  handleActivityItemClick,
}

Object.assign(window, exposedFunctions)
// Ensure status persistence helpers are available globally
window.loadStatusRequests = loadStatusRequests
window.saveStatusRequests = saveStatusRequests
