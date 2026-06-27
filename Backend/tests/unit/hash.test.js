const { hashPassword, comparePassword } = require('../../utils/hash');

describe('hashPassword & comparePassword', () => {
  it('should hash a password and verify it correctly', () => {
    const raw = 'MySecurePassword!23';
    const hashed = hashPassword(raw);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(raw);
    // bcrypt hash starts with $2
    expect(hashed.startsWith('$2')).toBe(true);
  });

  it('should return true for correct password', () => {
    const raw = 'CorrectHorseBatteryStaple';
    const hashed = hashPassword(raw);
    expect(comparePassword(raw, hashed)).toBe(true);
  });

  it('should return false for wrong password', () => {
    const raw = 'CorrectHorseBatteryStaple';
    const hashed = hashPassword(raw);
    expect(comparePassword('WrongPassword', hashed)).toBe(false);
  });

  it('should gracefully handle legacy SHA-256 format', () => {
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const legacyHash = `${salt}:${crypto.createHmac('sha256', salt).update('OldPassword').digest('hex')}`;
    expect(comparePassword('OldPassword', legacyHash)).toBe(true);
    expect(comparePassword('WrongPassword', legacyHash)).toBe(false);
  });
});
