;(function () {
  'use strict'

  // Module scope variables
  const form = document.getElementById('purchaseRequestForm')
  const dialogConfirm = document.getElementById('requestDialog')
  const dialogSuccess = document.getElementById('successDialog')
  const dialogText = document.getElementById('dialogText')
  const successText = document.getElementById('successText')

  // Wizard state
  let currentStep = 1
  const totalSteps = 3

  // --- Small helper utilities ---
  function byId(id) {
    return document.getElementById(id)
  }

  function harvestForm() {
    const data = new FormData(form)
    const obj = {}
    data.forEach((v, k) => (obj[k] = v))

    // Collect items from table
    const items = []
    const rows = document.querySelectorAll('#itemsTableBody tr')
    rows.forEach((row) => {
      const item = {
        item_description: row.querySelector('.item-description').value,
        unit: row.querySelector('.item-unit').value,
        quantity: row.querySelector('.item-quantity').value,
        unit_cost: parseFormattedNumber(
          row.querySelector('.item-unit-cost').value
        ),
        total_cost: parseFormattedNumber(
          row.querySelector('.item-total-cost').value
        ),
      }
      items.push(item)
    })
    obj.items = items
    // Include optional PR/pdf-specific fields if available
    obj.entityName = byId('entityName')?.value || ''
    obj.prNo = byId('prNo')?.value || ''
    obj.fundCluster = byId('fundCluster')?.value || ''
    obj.responsibilityCenterCode = byId('responsibilityCenterCode')?.value || ''
    obj.approvedBy = byId('approvedBy')?.value || ''
    obj.approverDesignation = byId('approverDesignation')?.value || ''

    // Also include a numeric overall total (unformatted) to make it easier for the server
    // be robust to the '₱' formatting in the UI field.
    // Prefer raw numeric overall total if available (from hidden field)
    const overallRawField = byId('overallTotalCostRaw')
    if (overallRawField && overallRawField.value) {
      obj.overallTotalCost =
        Number(String(overallRawField.value || '').replace(/[^\d.-]/g, '')) || 0
    } else {
      const overallField = byId('overallTotalCost')
      if (overallField) {
        const raw = String(overallField.value || '').replace(/[^\d.-]/g, '')
        obj.overallTotalCost = raw ? Number(raw) : 0
      }
    }

    return obj
  }

  function goHome() {
    // navigate back to the user's home page
    window.location.href = '/user/home'
  }

  // --- Toast UI ---
  function createToastContainer() {
    let c = byId('ui-alert-container')
    if (!c) {
      c = document.createElement('div')
      c.id = 'ui-alert-container'
      c.className = 'ui-alert-container'
      c.setAttribute('aria-live', 'polite')
      document.body.appendChild(c)
    }
    return c
  }

  function showToast({ message = '', type = 'info', duration = 3500 } = {}) {
    try {
      const container = createToastContainer()
      const toast = document.createElement('div')
      toast.className = `ui-toast ui-toast-${type}`
      toast.setAttribute('role', 'status')
      toast.setAttribute('aria-atomic', 'true')

      const inner = document.createElement('div')
      inner.className = 'ui-toast-inner'
      const text = document.createElement('div')
      text.className = 'ui-toast-text'
      text.textContent = message
      const close = document.createElement('button')
      close.className = 'ui-toast-close'
      close.setAttribute('aria-label', 'Dismiss notification')
      close.innerHTML = '&times;'
      const progress = document.createElement('div')
      progress.className = 'ui-toast-progress'

      close.addEventListener('click', () => removeToast(toast))
      inner.appendChild(text)
      inner.appendChild(close)
      toast.appendChild(inner)
      toast.appendChild(progress)
      container.appendChild(toast)

      requestAnimationFrame(() => toast.classList.add('ui-toast-in'))

      let start = Date.now()
      let elapsed = 0
      let rafId = null
      let paused = false
      function tick() {
        if (paused) {
          rafId = requestAnimationFrame(tick)
          return
        }
        elapsed = Date.now() - start
        const pct = Math.min(1, elapsed / duration)
        progress.style.transform = `scaleX(${1 - pct})`
        if (elapsed >= duration) removeToast(toast)
        else rafId = requestAnimationFrame(tick)
      }

      toast.addEventListener('mouseenter', () => {
        paused = true
      })
      toast.addEventListener('mouseleave', () => {
        paused = false
        start = Date.now() - elapsed
      })
      toast.addEventListener('focusin', () => {
        paused = true
      })
      toast.addEventListener('focusout', () => {
        paused = false
        start = Date.now() - elapsed
      })

      rafId = requestAnimationFrame(tick)

      function removeToast(node) {
        if (!node) return
        node.classList.remove('ui-toast-in')
        node.classList.add('ui-toast-out')
        setTimeout(() => node.remove(), 320)
        if (rafId) cancelAnimationFrame(rafId)
      }

      toast.removeToast = () => removeToast(toast)
      return toast
    } catch (err) {
      // fallback
      console.log(message)
    }
  }

  // alias kept for backward-compat
  function toast(msg) {
    showToast({ message: msg, type: 'info' })
  }

  // friendly currency formatting
  function formatCurrency(value) {
    if (value === null || value === undefined || String(value).trim() === '')
      return '—'
    const raw = String(value).replace(/,/g, '').trim()
    const num = Number(raw)
    if (Number.isNaN(num)) return value
    try {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
      }).format(num)
    } catch (e) {
      const fixed = num.toFixed(2)
      return '₱' + fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  }

  // Format number with thousand separators (no currency symbol)
  function formatNumberWithCommas(value) {
    if (value === null || value === undefined || String(value).trim() === '')
      return ''
    const raw = String(value).replace(/,/g, '').trim()
    const num = Number(raw)
    if (Number.isNaN(num) || num === 0) return ''
    try {
      return new Intl.NumberFormat('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    } catch (e) {
      const fixed = num.toFixed(2)
      return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
  }

  // Parse formatted number (remove commas)
  function parseFormattedNumber(value) {
    if (value === null || value === undefined || String(value).trim() === '')
      return 0
    const raw = String(value).replace(/,/g, '').trim()
    return parseFloat(raw) || 0
  }

  // --- Calculation / validation ---
  function calculateRowTotal(row) {
    const qty = parseFloat(row.querySelector('.item-quantity').value) || 0
    const unitCost = parseFormattedNumber(
      row.querySelector('.item-unit-cost').value
    )
    const total = qty * unitCost
    row.querySelector('.item-total-cost').value =
      total > 0 ? formatNumberWithCommas(total) : ''
    calculateOverallTotal()
  }

  function calculateOverallTotal() {
    const rows = document.querySelectorAll('#itemsTableBody tr')
    let overallTotal = 0
    rows.forEach((row) => {
      const total = parseFormattedNumber(
        row.querySelector('.item-total-cost').value
      )
      overallTotal += total
    })
    const overallField = byId('overallTotalCost')
    overallField.value = overallTotal > 0 ? formatCurrency(overallTotal) : ''
    const overallRaw = byId('overallTotalCostRaw')
    if (overallRaw)
      overallRaw.value = overallTotal > 0 ? Number(overallTotal.toFixed(2)) : ''
    if (currentStep === 3) updateSummary()
  }

  function addItemRow() {
    const tbody = byId('itemsTableBody')
    const row = document.createElement('tr')
    row.innerHTML = `
            <td class="col-desc"><input type="text" class="item-description" placeholder="e.g., Laptop" required></td>
            <td class="col-unit"><input type="text" class="item-unit" placeholder="e.g., pcs" required></td>
            <td class="col-qty"><input type="number" class="item-quantity" min="1" step="1" placeholder="1" required></td>
            <td class="col-unit-cost"><input type="text" class="item-unit-cost" inputmode="decimal" placeholder="0.00" required></td>
            <td class="col-total"><input type="text" class="item-total-cost" placeholder="Auto-calculated" readonly></td>
            <td class="col-actions"><button type="button" class="remove-item-btn" title="Remove Item">×</button></td>
        `
    tbody.appendChild(row)

    // Get unit cost input for formatting
    const unitCostInput = row.querySelector('.item-unit-cost')

    // Add event listeners
    row
      .querySelector('.item-quantity')
      .addEventListener('input', () => calculateRowTotal(row))

    // Format unit cost on blur (when user leaves the field)
    unitCostInput.addEventListener('blur', () => {
      const value = parseFormattedNumber(unitCostInput.value)
      if (value > 0) {
        unitCostInput.value = formatNumberWithCommas(value)
      }
      calculateRowTotal(row)
    })

    // Allow only numbers, decimal point, and commas during input
    unitCostInput.addEventListener('input', () => {
      // Remove non-numeric characters except decimal and comma
      let value = unitCostInput.value.replace(/[^\d.,]/g, '')
      unitCostInput.value = value
      calculateRowTotal(row)
    })

    row
      .querySelector('.remove-item-btn')
      .addEventListener('click', () => removeItemRow(row))

    // Calculate immediately if values are set
    calculateRowTotal(row)
  }

  function removeItemRow(row) {
    row.remove()
    calculateOverallTotal()
  }

  function onResetForm() {
    // form reset fires before DOM values change, use slight delay
    setTimeout(() => {
      toast('Form cleared')
      currentStep = 1
      updateProgress()
      // Clear table and add one empty row
      byId('itemsTableBody').innerHTML = ''
      addItemRow()
      byId('overallTotalCost').value = ''
    }, 50)
  }

  // --- Wizard helpers ---
  function updateProgress() {
    const fill = byId('progressFill')
    fill.style.width = `${(currentStep / totalSteps) * 100}%`
    document
      .querySelectorAll('.step')
      .forEach((s, i) => s.classList.toggle('active', i + 1 === currentStep))
    document
      .querySelectorAll('.wizard-step')
      .forEach((s, i) => s.classList.toggle('active', i + 1 === currentStep))
    if (currentStep === 3) updateSummary()
  }

  function updateSummary() {
    const fields = [
      'email',
      'requester',
      'department',
      'designation',
      'purpose',
      'neededDate',
      'priority',
      'entityName',
      'prNo',
      'fundCluster',
      'responsibilityCenterCode',
      'approvedBy',
      'approverDesignation',
    ]
    fields.forEach((field) => {
      const target = byId(`summary-${field}`)
      if (!target) return
      let value = '-'
      if (field === 'priority') {
        const checked = document.querySelector('input[name="priority"]:checked')
        value = checked ? checked.value : '-'
      } else {
        const el = byId(field)
        value = el ? el.value || '-' : '-'
      }

      if (value !== '-') {
        if (field === 'neededDate') {
          const d = new Date(value)
          value = isNaN(d.getTime())
            ? value
            : d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
        }
      }

      target.textContent = value
    })

    // Update items table
    const summaryItems = byId('summary-items')
    const rows = document.querySelectorAll('#itemsTableBody tr')
    if (rows.length > 0) {
      let html =
        '<table><thead><tr><th>Description</th><th>Unit</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr></thead><tbody>'
      rows.forEach((row) => {
        const desc = row.querySelector('.item-description').value || '-'
        const unit = row.querySelector('.item-unit').value || '-'
        const qty = row.querySelector('.item-quantity').value || '-'
        const unitCost = row.querySelector('.item-unit-cost').value
          ? formatCurrency(row.querySelector('.item-unit-cost').value)
          : '-'
        const total = row.querySelector('.item-total-cost').value
          ? formatCurrency(row.querySelector('.item-total-cost').value)
          : '-'
        html += `<tr><td>${desc}</td><td>${unit}</td><td>${qty}</td><td>${unitCost}</td><td>${total}</td></tr>`
      })
      html += '</tbody></table>'
      summaryItems.innerHTML = html
    } else {
      summaryItems.innerHTML = '-'
    }

    // Update overall total
    const overallTotal = byId('overallTotalCost').value
    byId('summary-overallTotalCost').textContent = overallTotal || '-'
  }

  function validateCurrentStep() {
    const stepEl = byId(`step${currentStep}`)
    if (!stepEl) return true

    let ok = true

    if (currentStep === 2) {
      // Validate items table
      const rows = document.querySelectorAll('#itemsTableBody tr')
      if (rows.length === 0) {
        showToast({
          message: 'Please add at least one item',
          type: 'error',
          duration: 3000,
        })
        ok = false
      } else {
        rows.forEach((row) => {
          const inputs = row.querySelectorAll('input[required]')
          inputs.forEach((input) => {
            if (!String(input.value || '').trim().length) {
              input.style.borderColor = '#ff4444'
              input.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.3)'
              ok = false
            } else {
              input.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              input.style.boxShadow = 'none'
            }
          })
        })
        if (!ok)
          showToast({
            message: 'Please fill in all item details',
            type: 'error',
            duration: 3000,
          })
      }
    }

    const required = stepEl.querySelectorAll(
      'input[required], textarea[required]'
    )
    required.forEach((field) => {
      if (field.closest('#itemsTableBody')) return // Skip table inputs, handled above
      let valid = true
      if (field.type === 'radio') {
        valid = !!document.querySelector(`input[name="${field.name}"]:checked`)
      } else {
        valid = String(field.value || '').trim().length > 0
      }

      if (!valid) {
        field.style.borderColor = '#ff4444'
        field.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.3)'
        ok = false
      } else {
        field.style.borderColor = 'rgba(255, 255, 255, 0.2)'
        field.style.boxShadow = 'none'
      }
    })

    if (!ok && currentStep !== 2)
      showToast({
        message: 'Please fill in all required fields',
        type: 'error',
        duration: 3000,
      })
    return ok
  }

  function nextStep() {
    if (currentStep < totalSteps && validateCurrentStep()) {
      currentStep++
      updateProgress()
      showToast({
        message: `Step ${currentStep} of ${totalSteps}`,
        type: 'info',
        duration: 1500,
      })
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--
      updateProgress()
      showToast({
        message: `Step ${currentStep} of ${totalSteps}`,
        type: 'info',
        duration: 1200,
      })
    }
  }

  // --- Persistence / submit handlers ---
  async function handleRequestSubmit(e) {
    e.preventDefault()
    const payload = harvestForm()

    const shortPurpose = payload.purpose
      ? `Purpose: ${String(payload.purpose).slice(0, 80)}${
          String(payload.purpose).length > 80 ? '…' : ''
        }`
      : ''
    const itemCount = payload.items ? payload.items.length : 0
    const overallTotal = payload.overallTotalCost || '0'
    dialogText.textContent = `Submit request for ${itemCount} item(s) (${
      payload.priority || 'No priority'
    }) — Overall cost: ${formatCurrency(overallTotal)}${
      shortPurpose ? ' — ' + shortPurpose : ''
    }?`

    const proceed = await new Promise((res) => {
      if (typeof dialogConfirm.showModal === 'function') {
        dialogConfirm.showModal()
        dialogConfirm.addEventListener('close', function onClose() {
          dialogConfirm.removeEventListener('close', onClose)
          res(dialogConfirm.returnValue === 'confirm')
        })
      } else {
        res(confirm('Submit purchase request?'))
      }
    })

    if (!proceed) return

    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }
    const tokenMeta = document.querySelector('meta[name="csrf-token"]')
    if (tokenMeta && tokenMeta.content)
      headers['X-CSRF-TOKEN'] = tokenMeta.content

    try {
      const resp = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      })
      if (!resp.ok) throw new Error('Network response was not ok')
      const data = await resp.json()
      showSuccessServer(data)
    } catch (err) {
      console.error('Server save failed, falling back to localStorage', err)
      showSuccessLocal(payload)
    }
  }

  function findRequestIdFromServer(data) {
    // normalize server payload to pick an ID
    return data?.request_id || data?.requestId || data?.id || 'submitted'
  }

  function showSuccessServer(data) {
    const rid = findRequestIdFromServer(data)
    if (data.email_sent === true) {
      successText.textContent = `Request ${rid} submitted successfully. A confirmation email has been sent to you.`
      showToast({
        message: '✅ Confirmation email sent to your address.',
        type: 'success',
        duration: 4500,
      })
    } else if (data.email_sent === false) {
      successText.textContent = `Request ${rid} submitted successfully. We were unable to send a confirmation email — please contact admin if you don't receive one.`
      showToast({
        message:
          '⚠️ Could not send confirmation email. Your request was saved.',
        type: 'error',
        duration: 6000,
      })
    } else {
      successText.textContent = `Request ${rid} submitted successfully. Please check your email for confirmation and updates.`
      showToast({
        message: 'Request submitted.',
        type: 'success',
        duration: 3500,
      })
    }

    if (typeof dialogSuccess.showModal === 'function') {
      dialogSuccess.showModal()
      // only reset once the user closes the success dialog
      dialogSuccess.addEventListener('close', function onClose() {
        dialogSuccess.removeEventListener('close', onClose)
        form.reset()
        currentStep = 1
        updateProgress()
      })
    } else {
      form.reset()
      currentStep = 1
      updateProgress()
    }
  }

  function showSuccessLocal(d) {
    let existing = []
    try {
      const stored = localStorage.getItem('userPurchaseRequests')
      if (stored) existing = JSON.parse(stored)
    } catch (e) {
      console.error('Error reading local storage', e)
    }

    const y = new Date().getFullYear()
    const nextNumber = existing.length + 1
    const requestId = `REQ-${y}-` + String(nextNumber).padStart(3, '0')
    const ts = new Date().toISOString()
    const request = Object.assign(
      {},
      {
        requestId,
        email: d.email,
        requester: d.requester,
        department: d.department,
        designation: d.designation,
        items: d.items,
        purpose: d.purpose || null,
        neededDate: d.neededDate || 'Not specified',
        priority: d.priority,
        status: 'Incoming',
        submittedDate: ts,
        timestamp: ts,
        overallTotalCost: d.overallTotalCost || null,
      }
    )

    existing.push(request)
    try {
      localStorage.setItem('userPurchaseRequests', JSON.stringify(existing))
    } catch (e) {
      console.error('Error saving request:', e)
    }

    successText.textContent = `Request ${requestId} saved locally and will be visible in the dashboard. Please contact admin if you need confirmation.`
    if (typeof dialogSuccess.showModal === 'function') {
      dialogSuccess.showModal()
      dialogSuccess.addEventListener('close', function onClose() {
        dialogSuccess.removeEventListener('close', onClose)
        form.reset()
        currentStep = 1
        updateProgress()
      })
    } else {
      showToast({
        message: `Request ${requestId} saved locally.`,
        type: 'success',
      })
      form.reset()
      currentStep = 1
      updateProgress()
    }

    try {
      const itemCount = request.items ? request.items.length : 0
      const cost = request.overallTotalCost
        ? `Total ${formatCurrency(request.overallTotalCost)}`
        : ''
      const summary = [itemCount + ' item(s)', cost].filter(Boolean).join(' • ')
      if (summary)
        showToast({
          message: `${requestId} — ${summary}`,
          type: 'success',
          duration: 4200,
        })
    } catch (e) {
      /* ignore */
    }
  }

  // Optional helper used in developer console
  function clearAllRequests() {
    if (
      !confirm(
        '⚠️ Are you sure you want to clear ALL stored requests? This cannot be undone!'
      )
    )
      return
    try {
      localStorage.removeItem('userPurchaseRequests')
      showToast({
        message: '✅ All requests cleared from storage',
        type: 'success',
      })
    } catch (e) {
      console.error(e)
      showToast({ message: '❌ Error clearing storage', type: 'error' })
    }
  }

  // --- Preview helpers (Step 3 "View Form" button) ---
  async function viewFormPreview() {
    // Try to generate the server-side PDF and open it in a new tab. If the request fails or popups are blocked
    // fall back to the previous HTML-only preview.
    const payload = harvestForm()

    // Build headers (include CSRF token when present)
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }
    const tokenMeta = document.querySelector('meta[name="csrf-token"]')
    if (tokenMeta && tokenMeta.content)
      headers['X-CSRF-TOKEN'] = tokenMeta.content

    try {
      // Normalize items into structured objects so the server can populate the PDF table properly.
      const serverPayload = Object.assign({}, payload)
      // Map client-side names into values expected by the PDF template / controller
      if (payload.requester) serverPayload.requested_by = payload.requester
      if (payload.purpose) serverPayload.purpose = payload.purpose
      if (payload.designation) serverPayload.designation = payload.designation
      if (payload.neededDate) serverPayload.date = payload.neededDate
      if (payload.entityName) serverPayload.entity_name = payload.entityName
      if (payload.prNo) serverPayload.pr_no = payload.prNo
      if (payload.fundCluster) serverPayload.fund_cluster = payload.fundCluster
      if (payload.responsibilityCenterCode)
        serverPayload.responsibility_center_code =
          payload.responsibilityCenterCode
      if (payload.approvedBy) serverPayload.approved_by = payload.approvedBy
      if (payload.approverDesignation)
        serverPayload.approver_designation = payload.approverDesignation
      // Provide numeric overall_total_cost if the client generated it
      if (typeof payload.overallTotalCost !== 'undefined')
        serverPayload.overall_total_cost = payload.overallTotalCost || 0
      if (typeof payload.items === 'string' && payload.items.trim().length) {
        const lines = payload.items
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
        serverPayload.items = lines.map((line) => ({
          item_description: line,
          quantity: payload.quantity || '',
          unit_cost: payload.unitCost || '',
          total_cost: payload.totalCost || '',
          unit: payload.unit || '',
        }))
      }

      // Map a few common field names that the server-side PDF template expects
      if (payload.requester) serverPayload.requested_by = payload.requester
      if (payload.purpose) serverPayload.purpose = payload.purpose
      if (payload.designation) serverPayload.designation = payload.designation
      if (payload.neededDate) serverPayload.date = payload.neededDate

      const resp = await fetch('/purchase-request/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(serverPayload),
      })
      if (!resp.ok) throw new Error(`Server returned status ${resp.status}`)

      const blob = await resp.blob()
      const blobUrl = URL.createObjectURL(blob)

      // Attempt to open in a new tab/window. If blocked, trigger a download as a fallback.
      const win = window.open(blobUrl, '_blank')
      if (!win) {
        // Popup blocked — force download
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = 'purchase_request.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }

      // Release the blob url after some time
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 60 * 1000)
      return
    } catch (err) {
      showToast({
        message:
          'Could not generate PDF preview on the server — using local preview.',
        type: 'warning',
        duration: 3500,
      })
      // Fall through to render local preview like before
    }

    // Local HTML preview fallback (same as existing behavior)
    const overallTotal = payload.overallTotalCost
      ? formatCurrency(payload.overallTotalCost.replace(/[^\d.-]/g, ''))
      : '—'
    let itemsHtml = ''
    if (payload.items && Array.isArray(payload.items)) {
      itemsHtml = payload.items
        .map(
          (item) =>
            `${item.item_description || ''} (${item.quantity || ''} ${
              item.unit || ''
            }) - ${
              item.unit_cost ? formatCurrency(item.unit_cost) : ''
            } each, Total: ${
              item.total_cost ? formatCurrency(item.total_cost) : ''
            }`
        )
        .join('<br/>')
    } else {
      itemsHtml = (payload.items || '').replace(/\n/g, '<br/>')
    }

    const preview = window.open(
      '',
      '_blank',
      'width=900,height=700,scrollbars=yes,toolbar=no,menubar=no'
    )
    if (!preview) {
      showToast({
        message: 'Unable to open preview window — popup blocked?',
        type: 'error',
        duration: 3000,
      })
      return
    }

    const tableRow = (label, val) =>
      `<tr><td style="padding:8px 10px;border-bottom:1px solid #e9e9e9;font-weight:600; width:220px">${label}</td><td style="padding:8px 10px;border-bottom:1px solid #e9e9e9">${
        val || '—'
      }</td></tr>`

    const html =
      `<!doctype html><html><head><meta charset="utf-8"><title>Purchase Request Preview</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:18px;color:#111} .card{max-width:880px;margin:0 auto;border:1px solid #eee;border-radius:8px;padding:18px;background:#fff} h1{font-size:20px;margin:0 0 10px} table{width:100%;border-collapse:collapse;margin-top:12px} .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px} .btn{padding:8px 12px;border-radius:6px;border:1px solid #ccc;background:#fafafa;cursor:pointer}</style></head><body><div class="card"><h1>Purchase Request Preview</h1><table>` +
      tableRow('Email', payload.email) +
      tableRow('Requester', payload.requester) +
      tableRow('Department', payload.department) +
      tableRow('Designation', payload.designation) +
      tableRow('Items', itemsHtml) +
      tableRow('Overall Total Cost', overallTotal) +
      tableRow('Date of Request', payload.neededDate) +
      tableRow('Priority', payload.priority) +
      tableRow('Purpose', payload.purpose) +
      tableRow('Approved By', payload.approvedBy) +
      tableRow('Designation', payload.approverDesignation) +
      `</table><div class="actions"><button class="btn" onclick="window.print()">Print</button><button class="btn" onclick="window.close()">Close</button></div><div style="margin-top:12px;font-size:12px;color:#666">Preview generated locally — not submitted.</div></div></body></html>`

    preview.document.open()
    preview.document.write(html)
    preview.document.close()
  }

  // --- Department Dropdown Helpers ---
  function getDepartmentCategories() {
    return {
      'Main Campus (Daet)': [
        { value: 'CAS', label: 'College of Arts and Sciences (CAS)' },
        {
          value: 'CBPA',
          label: 'College of Business and Public Administration (CBPA)',
        },
        { value: 'COENG', label: 'College of Engineering (CoEng)' },
        {
          value: 'CCMS',
          label: 'College of Computing and Multimedia Studies (CCMS)',
        },
        { value: 'GS', label: 'Graduate School (GS)' },
      ],
      'Satellite Campuses': [
        {
          value: 'COED',
          label: 'College of Education (CoEd) – Abaño Campus (Daet)',
        },
        {
          value: 'CANR',
          label:
            'College of Agriculture and Natural Resources (CANR) – Labo Campus',
        },
        {
          value: 'COTT',
          label:
            'College of Trades and Technology (CoTT) – Jose Panganiban Campus',
        },
        {
          value: 'CFAST',
          label:
            'College of Fisheries, Aquatic Sciences and Technology (CFAST) – Mercedes Campus',
        },
        {
          value: 'ENTIENZA',
          label: 'Entienza Campus (Sta. Elena)',
        },
      ],
      'Key Executive Offices': [
        { value: 'OP', label: 'Office of the President (OP)' },
        {
          value: 'OVPAA',
          label: 'Office of the Vice President for Academic Affairs (OVPAA)',
        },
        {
          value: 'OVPFA',
          label:
            'Office of the Vice President for Administration & Finance (OVPFA)',
        },
        {
          value: 'OVPRE',
          label:
            'Office of the Vice President for Research and Extension (OVPRE)',
        },
        {
          value: 'OVPFA_alt',
          label: 'Office of the Vice President for Finance Affairs (OVPFA)',
        },
      ],
      'Student Services': [
        { value: 'AO', label: 'Admission Office (AO)' },
        {
          value: 'OSSD',
          label: 'Office of Student Services and Development (OSSD)',
        },
        { value: 'GCO', label: 'Guidance and Counseling Office (GCO)' },
        { value: 'LIB', label: 'Library (LIB)' },
        { value: 'MDS', label: 'Medical and Dental Services (MDS)' },
        { value: 'RO', label: "Registrar's Office (RO)" },
        { value: 'SFAU', label: 'Student Financial Assistance Unit (SFAU)' },
        { value: 'TEO', label: 'Testing and Evaluation Office (TEO)' },
        { value: 'ECS', label: 'Electronic Counseling Services (ECS)' },
      ],
      'Administrative & Operational Units': [
        { value: 'AAO', label: 'Alumni Affairs Office (AAO)' },
        { value: 'ICO', label: 'Internal Control Office (ICO)' },
        { value: 'ASD', label: 'Auxilliary Services Division (ASD)' },
        { value: 'GSO', label: 'General Services Office (GSO)' },
        {
          value: 'ITSO',
          label: 'Information Technology Services Office (ITSO)',
        },
        { value: 'LAO', label: 'Legal Affairs Office (LAO)' },
        { value: 'MP', label: 'Motorpool (MP)' },
        { value: 'PPD', label: 'Physical Plan Division (PPD)' },
        { value: 'PDO', label: 'Planning and Development Office (PDO)' },
        {
          value: 'PICRO',
          label: 'Public Information and Community Relations Office (PICRO)',
        },
        { value: 'ADMIN', label: 'Administrative Office (ADMIN)' },
        { value: 'HR', label: 'Human Resources (HR)' },
        { value: 'ACCOUNTING', label: 'Accounting Office (ACCOUNTING)' },
        { value: 'CASHIER', label: 'Cashier (CASHIER)' },
      ],
      'Academic & Research Support': [
        {
          value: 'CEID',
          label: 'Center for Education and Instructional Development (CEID)',
        },
        {
          value: 'CEID2',
          label: 'Center for Equity, Inclusivity, and Diversity (CEID2)',
        },
        { value: 'CPAU', label: 'Culture and Performing Arts Unit (CPAU)' },
        { value: 'ESD', label: 'Extension Services Division (ESD)' },
        {
          value: 'FMRC',
          label: 'Fabrication and Manufacturing Research Center (FMRC)',
        },
        {
          value: 'IPMO',
          label: 'Intellectual Property Management Office (IPMO)',
        },
        {
          value: 'ISRO',
          label: 'Integrated Sustainability and Resilience Office (ISRO)',
        },
        { value: 'IRO', label: 'International Relations Office (IRO)' },
        {
          value: 'MSIO',
          label: 'Management System and Improvement Office (MSIO)',
        },
        { value: 'NSTP', label: 'NSTP Office (NSTP)' },
        { value: 'QAO', label: 'Quality Assurance Office (QAO)' },
        {
          value: 'QPRDI',
          label: 'Queen Pineapple Research and Development Institute (QPRDI)',
        },
        { value: 'RSD', label: 'Research Services Division (RSD)' },
        { value: 'SWK', label: 'Sentro ng Wika at Kultura (SWK)' },
        { value: 'SPRC', label: 'Social Policy Research Center (SPRC)' },
        { value: 'SDO', label: 'Sports and Development Office (SDO)' },
        { value: 'LAB', label: 'Laboratory Services (LAB)' },
        { value: 'RND', label: 'Research & Development (RND)' },
      ],
      Other: [{ value: '__other__', label: 'Other (enter manually)' }],
    }
  }

  function generateDepartmentOptionsHTMLWithLabels(currentLabel = '') {
    const departmentCategories = getDepartmentCategories()
    return Object.keys(departmentCategories)
      .map((category) => {
        const departments = departmentCategories[category]
        const options = departments
          .map(
            (d) =>
              `<option value="${d.label}" ${
                currentLabel === d.label ? 'selected' : ''
              }>${d.label}</option>`
          )
          .join('')
        return `<optgroup label="${category}">${options}</optgroup>`
      })
      .join('')
  }

  // --- Event wiring ---
  function handleActionClick(e) {
    const btn = e.target.closest('button')
    const action = btn?.dataset?.action
    // Prevent the browser's default submit behavior when we intentionally control submits
    if (action === 'submit-form') e.preventDefault()
    if (!action) return
    switch (action) {
      case 'go-home':
        return goHome()
      case 'next-step':
        return nextStep()
      case 'view-form':
        return viewFormPreview()
      case 'prev-step':
        return prevStep()
      case 'goto-step-1':
        currentStep = 1
        updateProgress()
        break
      case 'goto-step-2':
        currentStep = 2
        updateProgress()
        break
      case 'submit-form':
        // prefer the newer requestSubmit API when available (it triggers the submit event)
        if (typeof form.requestSubmit === 'function')
          return form.requestSubmit()
        return form.submit()
    }
  }

  function init() {
    updateProgress()

    // Populate department dropdown
    const deptSelect = byId('department')
    if (deptSelect) {
      const defaultOption =
        '<option value="" disabled selected>Select Department</option>'
      deptSelect.innerHTML =
        defaultOption + generateDepartmentOptionsHTMLWithLabels()
    }

    // Add initial item row
    addItemRow()

    // central click handler for buttons using data-action attributes
    document.addEventListener('click', handleActionClick)

    // Add item button
    byId('addItemBtn').addEventListener('click', addItemRow)

    // Auto-fill designation based on approver
    const approvedBySelect = byId('approvedBy')
    const designationInput = byId('approverDesignation')
    if (approvedBySelect && designationInput) {
      approvedBySelect.addEventListener('change', () => {
        const val = approvedBySelect.value
        let desig = ''
        if (val === 'ATTY. RYAN L. ESTEVEZ, DPA') desig = 'PRESIDENT'
        else if (val === 'DR. DOLORES C. VOLANTE')
          desig = 'VICE PRESIDENT FOR ACADEMIC AFFAIRS (VPAA)'
        else if (val === 'DR. MARIA CRISTINA C. AZUELO')
          desig = 'VICE PRESIDENT FOR ADMINISTRATION AND FINANCE (VPAF)'
        else if (val === 'DR. ROSALIE A. ALMADRONES')
          desig = 'VICE PRESIDENT FOR RESEARCH AND EXTENSION (VPRE)'

        if (desig) designationInput.value = desig
      })
    }

    // form submit, reset
    form.addEventListener('submit', handleRequestSubmit)
    form.addEventListener('reset', onResetForm)

    // priority change updates summary
    document
      .querySelectorAll('input[name="priority"]')
      .forEach((i) => i.addEventListener('change', updateSummary))

    // Prevent selecting a past date for 'neededDate' - set min to today
    const neededEl = byId('neededDate')
    if (neededEl) {
      const today = new Date()
      // format YYYY-MM-DD
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const minDate = `${yyyy}-${mm}-${dd}`
      neededEl.setAttribute('min', minDate)

      // Default to today
      if (!neededEl.value) {
        neededEl.value = minDate
      }

      // If the current value is before min, clear it
      if (neededEl.value && neededEl.value < minDate) {
        neededEl.value = ''
        toast('Date of request cannot be earlier than today')
      }

      // guard manual input/change as well
      neededEl.addEventListener('change', () => {
        if (neededEl.value && neededEl.value < minDate) {
          neededEl.value = ''
          showToast({
            message: 'Date of request cannot be in the past',
            type: 'error',
          })
        }
        if (currentStep === 3) updateSummary()
      })
    }

    // expose a couple helpers for dev environment
    window.PurchaseRequest = {
      openSuccessDialog: () => dialogSuccess.showModal?.(),
      clearAllRequests,
    }
  }

  // start
  document.addEventListener('DOMContentLoaded', init)
})()
