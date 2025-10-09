<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Order Preview</title>
    <style>
        /* Base styles from the Tailwind/React component */
        body {
            margin: 0;
            font-family: 'Times New Roman', Times, serif;
            font-size: 10px;
        }

        .purchase-order-doc {
            background-color: white;
        }

        /* Base styles */
        body {
            margin: 0;
            font-family: 'Times New Roman', Times, serif;
            font-size: 10px;
            background: #f3f4f6;
        }

            .purchase-order-doc {
                background-color: white;
                padding: 6px;
                border: 1px solid #d1d5db;
                max-width: 800px;
                margin: 0 auto;
            }

            .table-border-2 {
                border: 2px solid black;
            }

            .table-cell-border {
                border-right: 1px solid black;
                border-top: 1px solid black;
                padding: 4px;
            }

            .table-cell-border-right {
                border-right: 1px solid black;
                padding: 4px;
            }

            .table-cell-border-top {
                border-top: 1px solid black;
                padding: 4px;
            }

            .text-xs {
                font-size: 0.75rem;
            }

            .text-center {
                text-align: center;
            }

            .text-right {
                text-align: right;
            }

            .font-semibold {
                font-weight: 600;
            }

            .font-bold {
                font-weight: 700;
            }

            .italic {
                font-style: italic;
            }

            .underline {
                text-decoration: underline;
            }

            @media screen {
                .print-only {
                    display: none !important;
                }

                .screen-hidden {
                    display: none !important;
                }
            }

            @media print {
                body {
                    margin: 0;
                    padding: 0;
                    font-size: 10px;
                }

                .print-hidden {
                    display: none !important;
                }

                .purchase-order-doc {
                    border: none !important;
                    padding: 0 !important;
                    width: 100%;
                    box-shadow: none;
                }

                .table-cell-border,
                .table-cell-border-right,
                .table-cell-border-top {
                    padding: 2px 4px;
                }

                .h-8 {
                    height: 1.5rem !important;
                }

                table,
                tr,
                td {
                    border-color: black !important;
                }
            }
    </style>
</head>

<body>
    <div class="purchase-order-container" style="max-width: 800px; margin: 0 auto; padding: 20px;">
        <div class="purchase-order-doc table-border-2" style="border: 1px solid #ccc; padding: 24px; font-size: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1
                    style="font-size: 14px; font-weight: bold; margin-bottom: 8px; font-family: 'Times New Roman', serif;">
                    PURCHASE ORDER</h1>
                <p
                    style="font-size: 12px; text-decoration: underline; text-underline-offset: 4px; color: black; margin-bottom: 4px;">
                    Camarines Norte State College</p>
                <p style="font-size: 10px; font-style: italic; color: #4b5563;">Entity Name</p>
            </div>

            <div class="table-border-2" style="border: 2px solid black;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <tbody>
                        <tr>
                            <td class="table-cell-border-right" style="width: 15%; font-weight: bold;">Supplier:</td>
                            <td colspan="3" class="table-cell-border-right" style="width: 45%;" id="po-supplier"></td>
                            <td class="table-cell-border-right" style="width: 15%; font-weight: bold;">P.O. No.:</td>
                            <td style="width: 25%; padding: 4px;" id="po-number"></td>
                        </tr>
                        <tr>
                            <td class="table-cell-border" style="width: 15%; font-weight: bold;">Address:</td>
                            <td colspan="3" class="table-cell-border-right table-cell-border-top" style="width: 45%;"
                                id="po-address"></td>
                            <td class="table-cell-border-right table-cell-border-top"
                                style="width: 15%; font-weight: bold;">Date:</td>
                            <td class="table-cell-border-top" style="width: 25%; padding: 4px;" id="po-date"></td>
                        </tr>
                        <tr>
                            <td class="table-cell-border" style="width: 15%; font-weight: bold;">TIN:</td>
                            <td colspan="3" class="table-cell-border-right table-cell-border-top" style="width: 45%;"
                                id="po-tin"></td>
                            <td class="table-cell-border-right table-cell-border-top"
                                style="width: 15%; font-weight: bold;">Mode of Procurement:</td>
                            <td class="table-cell-border-top" style="width: 25%; padding: 4px;" id="po-mode"></td>
                        </tr>

                        <tr>
                            <td colspan="6" class="table-cell-border-top" style="padding: 12px;">
                                <strong style="font-size: 12px;">Gentlemen:</strong>
                                <br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Please furnish this Office the following articles subject
                                to the terms and conditions contained herein:
                            </td>
                        </tr>

                        <tr>
                            <td class="table-cell-border" style="width: 20%; font-weight: bold;">Place of Delivery:</td>
                            <td colspan="2" class="table-cell-border-right table-cell-border-top" style="width: 30%;"
                                id="po-place"></td>
                            <td class="table-cell-border-right table-cell-border-top"
                                style="width: 20%; font-weight: bold;">Delivery Term:</td>
                            <td colspan="2" class="table-cell-border-top" style="width: 30%; padding: 4px;"
                                id="po-delivery-term"></td>
                        </tr>
                        <tr>
                            <td class="table-cell-border" style="width: 20%; font-weight: bold;">Date of Delivery:</td>
                            <td colspan="2" class="table-cell-border-right table-cell-border-top" style="width: 30%;"
                                id="po-delivery-date"></td>
                            <td class="table-cell-border-right table-cell-border-top"
                                style="width: 20%; font-weight: bold;">Payment Term:</td>
                            <td colspan="2" class="table-cell-border-top" style="width: 30%; padding: 4px;"
                                id="po-payment-term"></td>
                        </tr>

                        <tr>
                            <td class="table-cell-border text-center font-semibold"
                                style="width: 13%; min-width: 60px;">Stock/Property Number</td>
                            <td class="table-cell-border text-center font-semibold" style="width: 8%; min-width: 40px;">
                                Unit</td>
                            <td class="table-cell-border text-center font-semibold" style="width: 39%;">Description</td>
                            <td class="table-cell-border text-center font-semibold"
                                style="width: 10%; min-width: 60px;">Quantity</td>
                            <td class="table-cell-border text-center font-semibold"
                                style="width: 15%; min-width: 70px;">Unit Cost</td>
                            <td class="table-cell-border-top text-center font-semibold"
                                style="width: 15%; min-width: 70px;">Amount</td>
                        </tr>

                    <tbody id="po-items-body"></tbody>

                    <tr>
                        <td colspan="5" class="table-cell-border text-right font-semibold">Grand Total:</td>
                        <td class="table-cell-border-top text-right font-bold" id="po-grand-total"></td>
                    </tr>

                    <tr id="po-note-row" style="display:none;">
                        <td class="table-cell-border text-xs font-semibold">Note:</td>
                        <td colspan="5" class="table-cell-border-top text-xs" id="po-note"></td>
                    </tr>

                    <tr>
                        <td colspan="3" class="table-cell-border text-center"
                            style="padding: 16px; height: 160px; vertical-align: top;">
                            <p style="margin-bottom: 8px; font-style: italic; font-size: 10px;">In case of failure to
                                make the total delivery within the time specified above, a penalty of one percent (1%)
                                of the total contract price shall be imposed for each day of delay, until the obligation
                                is fully complied with.</p>
                            <p style="margin-bottom: 8px; font-style: italic; font-size: 10px;">Conforme:</p>
                            <div
                                style="width: 192px; margin: 0 auto 8px; height: 48px; border-bottom: 2px solid #dc2626;">
                            </div>
                            <p style="font-size: 10px; font-style: italic;">signature over printed name of supplier</p>
                            <div style="margin-top: 12px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 10px; margin-right: 8px;">Date:</span><span
                                    style="border-bottom: 1px solid black; display: inline-block; width: 80px; padding-bottom: 2px;"></span>
                            </div>
                        </td>
                        <td colspan="3" class="table-cell-border-top text-center"
                            style="padding: 16px; height: 160px; vertical-align: top;">
                            <div style="text-align: center; margin-top: 48px;">
                                <p style="margin-bottom: 8px; font-style: italic; font-size: 10px;">Very truly yours,
                                </p>
                                <div
                                    style="width: 192px; margin: 0 auto 8px; height: 48px; border-bottom: 2px solid #dc2626;">
                                </div>
                                <p style="font-size: 10px; font-style: italic;">signature over printed name of
                                    authorization</p>
                                <p style="font-size: 10px; font-style: italic;">College President</p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td class="table-cell-border font-semibold" style="width: 15%; min-width: 60px;">Fund Cluster:
                        </td>
                        <td class="table-cell-border-right table-cell-border-top" style="width: 35%;"
                            id="po-fund-cluster"></td>

                        <td class="table-cell-border font-semibold" style="width: 15%; min-width: 70px;">ORS/BURS No.:
                        </td>
                        <td colspan="3" class="table-cell-border-top" id="po-ors-no"></td>
                    </tr>

                    <tr>
                        <td class="table-cell-border font-semibold">Funds Available:</td>
                        <td class="table-cell-border-right table-cell-border-top" id="po-funds-available"></td>

                        <td class="table-cell-border font-semibold text-center" style="width: 15%;">Date of ORS/BURS:
                        </td>
                        <td class="table-cell-border" style="width: 15%;" id="po-ors-date"></td>
                        <td class="table-cell-border font-semibold text-center" style="width: 10%;">Amount:</td>
                        <td class="table-cell-border-top" style="width: 10%;" id="po-ors-amount"></td>
                    </tr>

                    <tr>
                        <td colspan="6" class="table-cell-border-top text-center"
                            style="padding: 16px; height: 80px; vertical-align: bottom;">
                            <div
                                style="height: 48px; border-bottom: 2px solid #dc2626; margin: 0 auto 8px; width: 192px;">
                            </div>
                            <p style="font-size: 10px; font-weight: bold;">Accountant's Signature</p>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // Provide a safe default for poData if not supplied by the caller
        window.poData = window.poData || { items: [] };

        function formatCurrency(amount) {
            if (amount === null || amount === undefined || amount === '') return '';
            return new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(amount));
        }

        function formatDate(dateString) {
            if (!dateString) return '';
            const d = new Date(dateString);
            return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        function calculateGrandTotal(items) {
            return (items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
        }

        // Render header fields
        document.getElementById('po-supplier').textContent = window.poData.supplier || '';
        document.getElementById('po-number').textContent = window.poData.poNumber || '';
        document.getElementById('po-address').textContent = window.poData.address || '';
        document.getElementById('po-date').textContent = formatDate(window.poData.dateOfPurchase);
        document.getElementById('po-tin').textContent = window.poData.tinNumber || '';
        document.getElementById('po-mode').textContent = window.poData.modeOfPayment || '';
        document.getElementById('po-place').textContent = window.poData.placeOfDelivery || '';
        document.getElementById('po-delivery-term').textContent = window.poData.deliveryTerm || '';
        document.getElementById('po-delivery-date').textContent = formatDate(window.poData.dateOfDelivery);
        document.getElementById('po-payment-term').textContent = window.poData.paymentTerm || '';

        // Render items
        const itemsBody = document.getElementById('po-items-body');
        itemsBody.innerHTML = '';
        (window.poData.items || []).forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                            <td class="table-cell-border text-center h-8">${item.stockPropertyNumber || ''}</td>
                            <td class="table-cell-border text-center h-8">${item.unit || ''}</td>
                            <td class="table-cell-border h-8">${item.description || ''}</td>
                            <td class="table-cell-border text-center h-8">${item.quantity || ''}</td>
                            <td class="table-cell-border text-right h-8">${item.unitCost ? '₱' + formatCurrency(item.unitCost) : ''}</td>
                            <td class="table-cell-border-top text-right h-8">${item.amount ? '₱' + formatCurrency(item.amount) : ''}</td>
                        `;
            itemsBody.appendChild(tr);
        });

        // Ensure at least 8 rows for spacing
        const minRows = 8;
        for (let i = itemsBody.children.length; i < minRows; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="table-cell-border h-8">&nbsp;</td><td class="table-cell-border h-8">&nbsp;</td><td class="table-cell-border h-8">&nbsp;</td><td class="table-cell-border h-8">&nbsp;</td><td class="table-cell-border h-8">&nbsp;</td><td class="table-cell-border-top h-8">&nbsp;</td>`;
            itemsBody.appendChild(tr);
        }

        const grandTotal = calculateGrandTotal(window.poData.items || []);
        document.getElementById('po-grand-total').textContent = grandTotal ? ('₱' + formatCurrency(grandTotal)) : '';

        if (window.poData.notes) {
            document.getElementById('po-note').textContent = window.poData.notes;
            document.getElementById('po-note-row').style.display = '';
        }

        document.getElementById('po-fund-cluster').textContent = window.poData.fundCluster || '';
        document.getElementById('po-ors-no').textContent = window.poData.orsBursNo || '';
        document.getElementById('po-funds-available').textContent = window.poData.fundsAvailable || '';
        document.getElementById('po-ors-date').textContent = formatDate(window.poData.orsBursDate);
        document.getElementById('po-ors-amount').textContent = window.poData.orsBursAmount || '';
    </script>
</body>

</html>