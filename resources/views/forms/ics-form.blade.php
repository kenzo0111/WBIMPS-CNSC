<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Custodian Slip</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            max-width: 850px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
            font-size: 12px;
            line-height: 1.2;
        }

        .form-container {
            background: white;
            padding: 0;
            border: 2px solid #000;
            position: relative;
        }

        .annex {
            position: absolute;
            top: 15px;
            right: 20px;
            font-weight: bold;
            font-size: 14px;
        }

        .form-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 40px 0 25px 0;
            letter-spacing: 1px;
        }

        .entity-section {
            padding: 0 20px;
            margin-bottom: 15px;
        }

        .entity-row {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }

        .entity-row label {
            font-weight: bold;
            margin-right: 5px;
            white-space: nowrap;
        }

        .entity-row .colon {
            margin-right: 5px;
        }

        .entity-row input {
            border: none;
            border-bottom: 1px solid #000;
            background: transparent;
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            padding: 2px 5px;
        }

        .entity-row input:focus {
            outline: none;
            background: #f8f9fa;
        }

        .fund-cluster {
            width: 200px;
        }

        .ics-number {
            width: 150px;
            margin-left: auto;
        }

        .inventory-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }

        .inventory-table th,
        .inventory-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            vertical-align: middle;
        }

        .inventory-table th {
            background-color: white;
            font-weight: bold;
            height: 25px;
        }

        .inventory-table .qty-col { width: 8%; }
        .inventory-table .unit-col { width: 8%; }
        .inventory-table .unit-cost-col { width: 10%; }
        .inventory-table .total-cost-col { width: 12%; }
        .inventory-table .description-col { width: 40%; }
        .inventory-table .item-no-col { width: 12%; }
        .inventory-table .useful-life-col { width: 10%; }

        .inventory-table .data-row {
            height: 45px;
        }

        .inventory-table .data-row.large {
            height: 90px;
        }

        .inventory-table input,
        .inventory-table textarea {
            width: 100%;
            border: none;
            background: transparent;
            font-family: 'Times New Roman', serif;
            font-size: 10px;
            text-align: center;
            padding: 2px;
            resize: none;
        }

        .inventory-table .description-col input,
        .inventory-table .description-col textarea {
            text-align: left;
            padding: 4px;
            height: calc(100% - 8px);
        }

        .inventory-table input:focus,
        .inventory-table textarea:focus {
            outline: 1px solid #007bff;
            background: #f8f9ff;
        }

        .amount-header {
            position: relative;
        }

        .amount-divider {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #000;
        }

        .total-row {
            height: 30px;
            font-weight: bold;
        }

        .total-row .total-label {
            text-align: right;
            padding-right: 15px;
            font-weight: bold;
        }
        .total-cost-input {
            font-weight: bold;
        }

        .signatures-section {
            margin-top: 0;
            height: 150px;
            display: flex;
        }

        .signature-block {
            flex: 1;
            border-right: 1px solid #000;
            border-top: 1px solid #000;
            padding: 15px;
            position: relative;
        }

        .signature-block:last-child {
            border-right: none;
        }

        .signature-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 12px;
        }

        .signature-line {
            position: absolute;
            bottom: 55px;
            left: 15px;
            right: 15px;
            height: 1px;
            border-bottom: 1px solid #000;
        }

        .signature-name {
            position: absolute;
            bottom: 40px;
            left: 0;
            right: 0;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
        }

        .signature-name input {
            border: none;
            background: transparent;
            text-align: center;
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            font-weight: bold;
            width: 80%;
        }

        .signature-subtitle {
            position: absolute;
            bottom: 28px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
        }

        .signature-position {
            position: absolute;
            bottom: 15px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 11px;
        }

        .signature-position input {
            border: none;
            background: transparent;
            text-align: center;
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            width: 70%;
        }

        .signature-date {
            position: absolute;
            bottom: 2px;
            left: 0;
            right: 0;
            text-align: center;
        }

        .signature-date input {
            border: none;
            background: transparent;
            text-align: center;
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            width: 80px;
        }

        .print-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin: 20px 0;
            float: right;
        }

        .print-btn:hover {
            background: #0056b3;
        }

        @media print {
            body {
                background: white;
                padding: 0;
                margin: 0;
            }

            .form-container {
                border: 2px solid #000;
                margin: 0;
            }

            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="annex">Annex A.3</div>

        <h1 class="form-title">INVENTORY CUSTODIAN SLIP</h1>

        <div class="entity-section">
            <div class="entity-row">
                <label>Entity Name</label>
                <span class="colon">:</span>
                <input type="text" class="fund-cluster" placeholder="Enter Entity Name" title="Entity Name">
                <div style="margin-left: auto; display: flex; align-items: center;">
                    <label>ICS No.</label>
                    <input type="text" class="ics-number" placeholder="Enter ICS Number" title="ICS Number">
                </div>
            </div>
            <div class="entity-row">
                <label>Fund Cluster</label>
                <span class="colon">:</span>
                <input type="text" class="fund-cluster" placeholder="Enter Fund Cluster" title="Fund Cluster">
            </div>
        </div>

        <table class="inventory-table">
            <thead>
                <tr>
                    <th rowspan="2" class="qty-col">Quantity</th>
                    <th rowspan="2" class="unit-col">Unit</th>
                    <th colspan="2" class="amount-header">Amount</th>
                    <th rowspan="2" class="description-col">Description</th>
                    <th rowspan="2" class="item-no-col">Item No.</th>
                    <th rowspan="2" class="useful-life-col">Estimated Useful Life</th>
                </tr>
                <tr>
                    <th class="unit-cost-col">Unit Cost</th>
                    <th class="total-cost-col">Total Cost</th>
                </tr>
            </thead>
            <tbody>
                <tr class="data-row large">
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td class="description-col">
                        <div class="cell-content"></div>
                    </td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                </tr>
                <tr class="data-row">
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td class="description-col">
                        <div class="cell-content"></div>
                    </td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                </tr>
                <tr class="data-row">
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td class="description-col">
                        <div class="cell-content"></div>
                    </td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                </tr>
                <tr class="data-row">
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td class="description-col">
                        <div class="cell-content"></div>
                    </td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                </tr>
                <tr class="data-row">
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td class="description-col">
                        <div class="cell-content"></div>
                    </td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                </tr>
                <tr class="data-row">
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td class="description-col">
                        <div class="cell-content"></div>
                    </td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                </tr>
                <tr class="data-row">
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                    <td class="description-col">
                        <div class="cell-content"></div>
                    </td>
                    <td><div class="cell-content"></div></td>
                    <td><div class="cell-content"></div></td>
                </tr>
                <tr class="total-row">
                    <td colspan="3" class="total-label">TOTAL</td>
                    <td><div class="total-cost-value"></div></td>
                    <td colspan="3"></td>
                </tr>
            </tbody>
        </table>

        <div class="signatures-section">
            <div class="signature-block">
                <div class="signature-title">Received from :</div>
                <div class="signature-line"></div>
                <div class="signature-name">
                    ARSENIO GEM A. GARCILLANOSA
                </div>
                <div class="signature-subtitle">Signature Over Printed Name</div>
                <div class="signature-position">
                    Supply Officer III/Admin Officer V
                </div>
                <div class="signature-date">
                    <input type="text" placeholder="Date">
                </div>
            </div>

            <div class="signature-block">
                <div class="signature-title">Received by:</div>
                <div class="signature-line"></div>
                <div class="signature-name">
                    <input type="text" placeholder="Receiver Name">
                </div>
                <div class="signature-subtitle">Signature Over Printed Name</div>
                <div class="signature-position">
                    <input type="text" placeholder="Department/Office">
                </div>
                <div class="signature-date">
                    <input type="text" placeholder="Date">
                </div>
            </div>
        </div>
    </div>
</body>
</html>