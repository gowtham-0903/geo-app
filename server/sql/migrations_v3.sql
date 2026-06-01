-- GEO Pet Bottles — v3 Migration
-- Run once on the existing database

-- 1. Add address + pincode to suppliers
ALTER TABLE suppliers
  ADD COLUMN address TEXT     DEFAULT NULL,
  ADD COLUMN pincode VARCHAR(10) DEFAULT NULL;

-- 2. Add pincode to customers
ALTER TABLE customers
  ADD COLUMN pincode VARCHAR(10) DEFAULT NULL;

-- 3. Track whether an invoice line-item rate was manually overridden
ALTER TABLE sale_items
  ADD COLUMN rate_overridden TINYINT(1) NOT NULL DEFAULT 0;
