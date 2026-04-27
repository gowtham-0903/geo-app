-- ============================================================
-- GEO Pet Bottles — v2 Migration
-- Run this on your existing database to add all new features
-- ============================================================

-- 1. Company Settings (Tab 7 in Masters)
-- 1. Company Settings (Tab 7 in Masters)
CREATE TABLE IF NOT EXISTS company_settings (
  id              VARCHAR(36)   PRIMARY KEY DEFAULT 'singleton',
  company_name    VARCHAR(150)  NOT NULL DEFAULT 'GEO PACKS',
  gstin           VARCHAR(15)   DEFAULT '33AAOFG1270C1ZT',
  pan             VARCHAR(10)   DEFAULT NULL,
  address_line1   VARCHAR(200)  DEFAULT '2/127, A-KANNAN VALAGAM',
  address_line2   VARCHAR(200)  DEFAULT 'RUKKUMANIAMMAL NAGAR, POOLANKINAR (POST)',
  city            VARCHAR(100)  DEFAULT 'UDUMALPET',
  state           VARCHAR(100)  DEFAULT 'Tamil Nadu',
  state_code      VARCHAR(5)    DEFAULT '33',
  pincode         VARCHAR(10)   DEFAULT '642122',
  phone1          VARCHAR(20)   DEFAULT '9047046565',
  phone2          VARCHAR(20)   DEFAULT '9751546565',
  email           VARCHAR(100)  DEFAULT 'geopacks2015@gmail.com',
  bank_name       VARCHAR(100)  DEFAULT 'CANARA BANK',
  bank_account    VARCHAR(30)   DEFAULT NULL,
  bank_ifsc       VARCHAR(15)   DEFAULT NULL,
  bank_branch     VARCHAR(100)  DEFAULT NULL,
  jurisdiction    VARCHAR(100)  DEFAULT 'UDUMALPET',
  invoice_prefix  VARCHAR(20)   DEFAULT 'GEO',
  next_invoice_no INT           NOT NULL DEFAULT 1,
  logo_url        VARCHAR(500)  DEFAULT NULL,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default company settings (safe to run multiple times)
INSERT IGNORE INTO company_settings (id) VALUES ('singleton');

-- 2. Customer extra fields
ALTER TABLE customers
  ADD COLUMN state        VARCHAR(100) DEFAULT 'Tamil Nadu',
  ADD COLUMN state_code   VARCHAR(5)   DEFAULT '33',
  ADD COLUMN email        VARCHAR(100) DEFAULT NULL,
  ADD COLUMN billing_address TEXT       DEFAULT NULL,
  ADD COLUMN credit_days  INT          DEFAULT 0;

-- 3. Track invoice numbers on sales
ALTER TABLE sales
  ADD COLUMN invoice_number INT  DEFAULT NULL,
  ADD COLUMN place_of_supply VARCHAR(100) DEFAULT 'Tamil Nadu',
  ADD COLUMN narration      TEXT DEFAULT NULL;

-- 4. Invoice number sequence tracker (in company_settings already via next_invoice_no)
-- But we also need a unique index on invoice_number
CREATE UNIQUE INDEX idx_invoice_number ON sales(invoice_number);

-- 5. Add blowing_cost and cap_cost directly to bottle_types for quick reference
ALTER TABLE bottle_types
  ADD COLUMN default_blowing_cost DECIMAL(8,4) DEFAULT 0.7500,
  ADD COLUMN default_cap_cost     DECIMAL(8,4) DEFAULT 0.0000,
  ADD COLUMN hsn_code             VARCHAR(20)  DEFAULT '39233090';

-- 6. Update company_settings to ensure singleton row exists
INSERT INTO company_settings (id, company_name) VALUES ('singleton', 'GEO PACKS')
  ON DUPLICATE KEY UPDATE id = id;
