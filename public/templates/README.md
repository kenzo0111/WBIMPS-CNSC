Place the Excel template file(s) you want to use for exports in this directory.

Filename suggestions:

- rsmi-template.xlsx — Template for RSMI exports. The default export code expects this name and a sheet named "RSMI".

Template requirements:

- Include a header row on the first row. The export app will append rows after the last row in the sheet.
- If the sheet has placeholders like $DATE or $TITLE, the export code currently preserves them — replacing placeholders will be added separately if needed.

If no template is found or the template can't be loaded, the export will fallback to a generated Excel workbook.
