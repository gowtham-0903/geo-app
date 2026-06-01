-- ─────────────────────────────────────────────────────────────────
-- GEO Packs — Reset all transactional data
-- Keeps: users, bottle_types, machines, suppliers, customers,
--         expense_categories, company_settings
-- Clears: sales, sale_items, preform_purchases, production_entries,
--         expenses, payments_received, supplier_payments, bottle_costing
-- ─────────────────────────────────────────────────────────────────
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE sale_items;
TRUNCATE TABLE sales;
TRUNCATE TABLE preform_purchases;
TRUNCATE TABLE production_entries;
TRUNCATE TABLE expenses;
TRUNCATE TABLE payments_received;
TRUNCATE TABLE supplier_payments;
TRUNCATE TABLE bottle_costing;

-- Reset invoice counter to 1
UPDATE company_settings SET next_invoice_no = 1 WHERE id = 'singleton';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Transaction data cleared. Master data preserved.' AS status;
