# Changelog

## 3.0.0
- Hybrid deployment package: GitHub Pages workflow + Google Apps Script backend.
- Added Near Miss, Unsafe Act, Unsafe Condition, Inspection, Training, PPE, Risk Assessment and WORKING_HOURS schemas.
- Added generic module CRUD, audit, soft archive, plant/department filters and pagination.
- Fixed Incident field-name normalization, 5 WHY upsert, serialized ID sequence, setup-per-request, Drive folder fallback, first-login password change, CAPA verification gating, BHXH year filtering and KPI actual-hours handling.
- Added Spreadsheet + attachment backup action.
- No migration step deletes existing records. New fields/sheets are additive.
