const router      = require('express').Router();
const { verifyToken } = require('../middleware/auth');

// Valid Indian state codes for GSTIN
const VALID_STATE_CODES = new Set([
  '01','02','03','04','05','06','07','08','09','10',
  '11','12','13','14','15','16','17','18','19','20',
  '21','22','23','24','25','26','27','28','29','30',
  '31','32','33','34','35','36','37','38',
  '96','97','98',  // special territory codes
]);

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Optional: checksum verification (GSTIN digit 15)
function verifyChecksum(gstin) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let factor = 2;
  let sum    = 0;
  for (let i = 0; i < 14; i++) {
    const code  = chars.indexOf(gstin[i]);
    if (code === -1) return false;
    const digit = factor * code;
    sum   += Math.floor(digit / 36) + (digit % 36);
    factor = (factor === 2) ? 3 : 2;
  }
  const expectedIdx   = (36 - (sum % 36)) % 36;
  const expectedChar  = chars[expectedIdx];
  return gstin[14] === expectedChar;
}

router.get('/gstin', verifyToken, (req, res) => {
  const raw = (req.query.gstin || '').trim().toUpperCase();

  if (!raw) {
    return res.json({ valid: false, message: 'Enter a GSTIN to validate' });
  }

  if (raw.length !== 15) {
    return res.json({ valid: false, message: `GSTIN must be 15 characters (got ${raw.length})` });
  }

  if (!GSTIN_REGEX.test(raw)) {
    return res.json({ valid: false, message: 'Invalid format — expected: 99AAAAA9999A9Z9' });
  }

  const stateCode = raw.slice(0, 2);
  if (!VALID_STATE_CODES.has(stateCode)) {
    return res.json({ valid: false, message: `Unknown state code: ${stateCode}` });
  }

  if (!verifyChecksum(raw)) {
    return res.json({ valid: false, message: 'Checksum digit does not match — check for typos' });
  }

  return res.json({ valid: true, message: 'Valid GSTIN' });
});

module.exports = router;
