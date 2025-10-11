<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Appendix 71 - Property Acknowledgment Receipt</title>
	<style>
		  @page { size: A4 portrait; margin: 25mm 15mm; }
		  /* Use Times New Roman as requested. If Dompdf does not have the exact font available,
			  it will fall back to the generic Times or serif family. To embed Times New Roman
			  explicitly, add the font to Dompdf's font directory and configure it in the package config. */
		  body { font-family: 'Times New Roman', Times, serif; color: #000; font-size: 12px; }
		.small { font-size: 11px; }
		.muted { color: #444; }
		.header { width:100%; margin-bottom: 6px; }
		.right { text-align: right; }
		.center { text-align: center; }
		table { width: 100%; border-collapse: collapse; }
		th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }
		th { background: #f2f2f2; }
		.no-border { border: none !important; }
		.signature { margin-top: 30px; }
		/* center signature line and footer cells */
		.sign-line { border-top: 1px solid #000; width: 85%; margin: 8px auto 0; display: block; }
		.items-table tfoot td { text-align: center; }
		.col-50 { width: 50%; display: inline-block; vertical-align: top; }
		.meta-row td { border: none; padding: 2px 0; }
		.meta-left { width: 65%; }
		.meta-right { width: 25%; }
		.items-table th, .items-table td { font-size: 11px; }
	</style>
</head>
<body>

	<div class="header">
		<div style="float:right;"><strong><em>Appendix 71</em></strong></div>
		<div style="clear:both"></div>
	</div>

	<h2 class="center" style="margin:4px 0 6px 0;">PROPERTY ACKNOWLEDGMENT RECEIPT</h2>

	<table class="meta-row" style="margin-bottom:6px;">
		<tr>
			<td class="meta-left"><strong>Entity Name :</strong> <?php echo e($entityName ?? '____________________________________'); ?></td>
		</tr>
		<tr>
			<td class="meta-left"><strong>Fund Cluster:</strong> <?php echo e($fundCluster ?? '____________________________________'); ?></td>
            <td class="meta-right"><strong>PAR No.:</strong> <?php echo e($parNo ?? '_______________'); ?></td>
		</tr>
	</table>

	<table class="items-table" style="margin-top:4px;">
		<thead>
			<tr>
				<th style="width:6%;">Quantity</th>
				<th style="width:8%;">Unit</th>
				<th style="width:36%;">Description</th>
				<th style="width:20%;">Property Number</th>
				<th style="width:15%;">Date Acquired</th>
				<th style="width:15%;">Amount</th>
			</tr>
		</thead>
		<tbody>
			
			<?php for($i = 0; $i < ($rows ?? 20); $i++): ?>
			<tr>
				<td>&nbsp;</td>
				<td>&nbsp;</td>
				<td>&nbsp;</td>
				<td>&nbsp;</td>
				<td>&nbsp;</td>
				<td>&nbsp;</td>
			</tr>
			<?php endfor; ?>
		</tbody>
		<tfoot>
			<tr>
				<td colspan="3" style="vertical-align: top; padding: 12px 6px;">
					<div><strong>Received by:</strong></div>
					<div style="height:60px;"></div>
					<div class="sign-line"></div>
					<div style="margin-top:4px;"><?php echo e($receivedByName ?? '_______________________________________'); ?></div>
					<div class="small">Signature over Printed Name of End User</div>
					<div style="height:6px;"></div>
					<div><?php echo e($receivedByPosition ?? '__________________________________'); ?></div>
					<div class="small">Position/Office</div>
					<div style="height:6px;"></div>
					<div><?php echo e($receivedDate ?? '_________________'); ?></div>
					<div class="small">Date</div>
				</td>
				<td colspan="3" style="vertical-align: top; padding: 12px 6px;">
					<div><strong>Issued by:</strong></div>
					<div style="height:60px;"></div>
					<div class="sign-line"></div>
					<div style="margin-top:4px;"><?php echo e($issuedByName ?? '________________________________________'); ?></div>
					<div class="small">Signature over Printed Name of Supply and/or Property Custodian</div>
					<div style="height:6px;"></div>
					<div><?php echo e($issuedByPosition ?? '_______________________________'); ?></div>
					<div class="small">Position/Office</div>
					<div style="height:6px;"></div>
					<div><?php echo e($issuedDate ?? '_________________'); ?></div>
					<div class="small">Date</div>
				</td>
			</tr>
		</tfoot>
	</table>

</body>
</html>

<?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/pdf/property_acknowledge_report_pdf.blade.php ENDPATH**/ ?>