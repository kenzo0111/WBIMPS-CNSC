<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Requisition and Issue Slip</title>
    <style>
        @page {
            margin: 20px;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
            margin: 0;
            padding: 0;
        }
        .header-title {
            text-align: right;
            font-style: italic;
            font-size: 9pt;
            margin-bottom: 5px;
        }
        .main-title {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
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
        .signature-table {
            margin-top: 15px;
            border: 1px solid #000;
        }
        .signature-table th,
        .signature-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            font-size: 9pt;
        }
        .signature-table th {
            background-color: #ffffff;
            font-weight: bold;
            text-align: center;
        }
        .signature-table td {
            height: 18px;
        }
        .footer {
            margin-top: 10px;
            font-size: 8pt;
        }
    </style>
</head>
<body>
    <div class="header-title">Appendix 63</div>
    
    <div class="main-title">REQUISITION AND ISSUE SLIP</div>
    
    <table class="info-table">
        <tr>
            <td class="label">Entity Name :</td>
            <td class="field"></td>
            <td style="width: 50px;"></td>
            <td class="label">Fund Cluster :</td>
            <td class="field"></td>
        </tr>
    </table>
    
    <table class="main-table">
        <thead>
            <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">Division : </td>
                <td colspan="4" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">Responsibility Center Code : </td>
            </tr>
            <tr>
                <td colspan="4" style="border: none; border-right: 1px solid #000; text-align: left; padding: 3px; font-size: 9pt;">Office : </td>
                <td colspan="4" style="border: none; text-align: left; padding: 3px; font-size: 9pt;">RIS No. : </td>
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
            <?php for($i = 0; $i < 20; $i++): ?>
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
            <?php endfor; ?>
            <tr>
                <td colspan="8" style="text-align: left; padding: 5px; height: 50px; vertical-align: top;">
                    Purpose: _______________________________________________________________________________
                    <br>
                    _______________________________________________________________________________
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
                <td colspan="2">&nbsp;</td>
                <td colspan="2">&nbsp;</td>
                <td>&nbsp;</td>
                <td colspan="2">&nbsp;</td>
            </tr>
            <tr>
                <td>Printed Name :</td>
                <td colspan="2">&nbsp;</td>
                <td colspan="2">&nbsp;</td>
                <td>&nbsp;</td>
                <td colspan="2">&nbsp;</td>
            </tr>
            <tr>
                <td>Designation :</td>
                <td colspan="2">&nbsp;</td>
                <td colspan="2">&nbsp;</td>
                <td>&nbsp;</td>
                <td colspan="2">&nbsp;</td>
            </tr>
            <tr>
                <td>Date :</td>
                <td colspan="2">&nbsp;</td>
                <td colspan="2">&nbsp;</td>
                <td>&nbsp;</td>
                <td colspan="2">&nbsp;</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/requisition_issue_slips_pdf.blade.php ENDPATH**/ ?>