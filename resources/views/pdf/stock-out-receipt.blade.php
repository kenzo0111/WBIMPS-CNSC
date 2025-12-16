<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Requisition and Issue Slip</title>
    <style>
        @page {
            size: A4;
            margin: 30px;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            margin-bottom: 20px;
        }
        .header-logo {
            width: 15%;
            text-align: center;
            vertical-align: middle;
        }
        .header-text {
            width: 70%;
            text-align: center;
            vertical-align: middle;
        }
        .school-name {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .office-name {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .address {
            font-size: 9pt;
        }
        .form-title {
            text-align: center;
            font-weight: bold;
            font-size: 14pt;
            margin-top: 20px;
            margin-bottom: 20px;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 10px;
        }
        .info-table td {
            padding: 3px 5px;
            font-size: 9pt;
        }
        .info-table .label {
            font-weight: normal;
        }
        .info-table .field {
            border-bottom: 1px solid #000;
            min-width: 200px;
        }
        .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            border: 1px solid #000;
        }
        .main-table th,
        .main-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            font-size: 9pt;
        }
        .main-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-style: italic;
        }
        .main-table .section-header {
            font-weight: bold;
            font-style: italic;
            background-color: #ffffff;
        }
        .main-table td {
            height: 20px;
        }
        .purpose-section {
            margin-top: 10px;
            border: 1px solid #000;
            padding: 5px;
            min-height: 40px;
        }
        .purpose-section .label {
            font-weight: normal;
        }
        .signature-section {
            width: 100%;
            margin-top: 40px;
            border-collapse: collapse;
        }
        .signature-cell {
            width: 25%;
            padding: 10px;
            vertical-align: top;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 80%;
            margin: 40px auto 5px auto;
            text-align: center;
            font-weight: bold;
        }
        .signature-label {
            text-align: center;
            font-size: 9pt;
        }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8pt;
            color: #666;
            padding: 10px 0;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <table class="header-table">
        <tr>
            <td class="header-logo">
                @if(extension_loaded('gd'))
                    <img src="{{ public_path('images/UCN1.png') }}" width="80" alt="Logo">
                @else
                    <div style="padding: 10px; border: 1px dashed #ccc; font-size: 8pt;">(Enable GD for Logo)</div>
                @endif
            </td>
            <td class="header-text">
                <div class="school-name">Camarines Norte State College</div>
                <div class="address">Daet, Camarines Norte</div>
                <div class="office-name">SUPPLY AND PROPERTY MANAGEMENT OFFICE</div>
            </td>
            <td class="header-logo">
                <!-- Spacer for balance -->
            </td>
        </tr>
    </table>

    <div style="text-align: right; font-style: italic; font-size: 12pt; margin-bottom: 5px;">Appendix 63</div>

    <div class="form-title">REQUISITION AND ISSUE SLIP</div>

    <table class="info-table">
        <tr>
            <td class="label">Entity Name :</td>
            <td class="field">Camarines Norte State College</td>
            <td style="width: 50px;"></td>
            <td class="label">Fund Cluster :</td>
            <td class="field">{{ $stockOut->fund_cluster ?? '' }}</td>
        </tr>
    </table>

    <table class="main-table">
        <thead>
            <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">Division : {{ $stockOut->department ?? '' }}</td>
                <td colspan="4" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">Responsibility Center Code : {{ $stockOut->responsibility_center_code ?? '' }}</td>
            </tr>
            <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">Office : </td>
                <td colspan="4" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">RIS No. : {{ $stockOut->issue_id }}</td>
            </tr>
            <tr>
                <th colspan="4" class="section-header">Requisition</th>
                <th colspan="2">Stock Available?</th>
                <th colspan="2" class="section-header">Issue</th>
            </tr>
            <tr>
                <th>Stock No.</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Yes</th>
                <th>No</th>
                <th>Quantity</th>
                <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($stockOutRecords as $record)
            <tr>
                <td>{{ $record->sku }}</td>
                <td>{{ $record->unit ?? '' }}</td>
                <td>{{ $record->product_name }}</td>
                <td>{{ $record->quantity }}</td>
                <td><span style="font-family: 'DejaVu Sans', sans-serif;">&#10004;</span></td>
                <td></td>
                <td>{{ $record->quantity }}</td>
                <td></td>
            </tr>
            @endforeach
            @for($i = count($stockOutRecords); $i < 20; $i++)
            <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
            </tr>
            @endfor
            <tr>
                <td colspan="8" style="text-align: left; padding: 5px; height: 50px; vertical-align: top;">
                    Purpose: {{ $stockOut->purpose ?? '' }}
                </td>
            </tr>
            <tr>
                <th></th>
                <th colspan="2">Requested by:</th>
                <th colspan="2">Approved by:</th>
                <th>Issued by:</th>
                <th colspan="2">Received by:</th>
            </tr>
            <tr>
                <td>Signature :</td>
                <td colspan="2"></td>
                <td colspan="2"></td>
                <td></td>
                <td colspan="2"></td>
            </tr>
            <tr>
                <td>Printed Name :</td>
                <td colspan="2">{{ $stockOut->issued_to ?? '' }}</td>
                <td colspan="2">{{ $stockOut->approved_by ?? '' }}</td>
                <td>{{ $stockOut->issued_by ?? '' }}</td>
                <td colspan="2">{{ $stockOut->issued_to ?? '' }}</td>
            </tr>
            <tr>
                <td>Designation :</td>
                <td colspan="2">{{ $stockOut->issued_to_designation ?? '' }}</td>
                <td colspan="2">{{ $stockOut->approved_by_designation ?? '' }}</td>
                <td>{{ $stockOut->issued_by_designation ?? '' }}</td>
                <td colspan="2"></td>
            </tr>
            <tr>
                <td>Date :</td>
                <td colspan="2">{{ $stockOut->date_issued ? $stockOut->date_issued->format('m/d/Y') : '' }}</td>
                <td colspan="2"></td>
                <td>{{ $stockOut->date_issued ? $stockOut->date_issued->format('m/d/Y') : '' }}</td>
                <td colspan="2">{{ $stockOut->date_issued ? $stockOut->date_issued->format('m/d/Y') : '' }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Generated by Supply Management System on {{ now()->format('F d, Y h:i A') }}
    </div>
</body>
</html>
