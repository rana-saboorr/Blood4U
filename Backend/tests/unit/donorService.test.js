/**
 * Unit tests for DonorService business logic.
 * Uses manual mocks to isolate from the database.
 */

// --- Mocks ---
jest.mock('../../repositories/donorRepository');
jest.mock('../../repositories/userRepository');
jest.mock('../../models/Donation');
jest.mock('../../models/User');

const donorRepository = require('../../repositories/donorRepository');
const donorService = require('../../services/donorService');

// Helper to create a mock donor object
const mockDonor = (overrides = {}) => ({
  _id: 'donor123',
  userId: 'user123',
  bloodGroup: 'A+',
  city: 'Lahore',
  available: true,
  donationCount: 2,
  lastDonationDate: null,
  isResting: false,
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

describe('DonorService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── registerDonor ──────────────────────────────────────────────────────────
  describe('registerDonor', () => {
    it('should throw if donor already exists', async () => {
      donorRepository.findByUserId.mockResolvedValue(mockDonor());
      await expect(donorService.registerDonor('user123', {})).rejects.toThrow(
        'You are already registered as a donor.'
      );
    });

    it('should create donor and return it', async () => {
      const User = require('../../models/User');
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
      donorRepository.findByUserId.mockResolvedValue(null);
      donorRepository.create.mockResolvedValue(mockDonor());

      const result = await donorService.registerDonor('user123', {
        fullName: 'Test Donor',
        bloodGroup: 'A+',
        city: 'Lahore',
      });

      expect(donorRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toHaveProperty('bloodGroup', 'A+');
    });

    it('should capture GeoJSON coordinates when lat/lng provided', async () => {
      const User = require('../../models/User');
      User.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
      donorRepository.findByUserId.mockResolvedValue(null);
      donorRepository.create.mockImplementation((data) => Promise.resolve(data));

      const result = await donorService.registerDonor('user123', {
        fullName: 'Geo Donor',
        lat: '31.5497',
        lng: '74.3436',
      });

      expect(result.location).toEqual({
        type: 'Point',
        coordinates: [74.3436, 31.5497],
      });
    });
  });

  // ── searchDonors ───────────────────────────────────────────────────────────
  describe('searchDonors', () => {
    it('should throw if bloodGroup is not provided', async () => {
      await expect(donorService.searchDonors({})).rejects.toThrow(
        'bloodGroup is required for smart matching.'
      );
    });

    it('should score and sort donors correctly', async () => {
      donorRepository.reactivateExpiredCooldowns.mockResolvedValue();
      donorRepository.findCompatible.mockResolvedValue([
        { bloodGroup: 'O+', city: 'Lahore', donationCount: 0, toObject: () => ({ bloodGroup: 'O+', city: 'Lahore', donationCount: 0 }) },
        { bloodGroup: 'A+', city: 'Lahore', donationCount: 5, toObject: () => ({ bloodGroup: 'A+', city: 'Lahore', donationCount: 5 }) },
      ]);

      const { donors } = await donorService.searchDonors({ bloodGroup: 'A+', city: 'Lahore' });
      // A+ exact match should rank first
      expect(donors[0].bloodGroup).toBe('A+');
      expect(donors[0].matchScore).toBeGreaterThan(donors[1].matchScore);
    });
  });

  // ── logManualDonation cooldown enforcement ─────────────────────────────────
  describe('logManualDonation', () => {
    it('should throw if donor is still in cooldown', async () => {
      donorRepository.findByUserId.mockResolvedValue(
        mockDonor({ lastDonationDate: new Date() }) // just donated
      );

      await expect(
        donorService.logManualDonation('user123', { location: 'Lahore', quantity: 1 })
      ).rejects.toThrow(/cooldown period/i);
    });

    it('should succeed if cooldown has expired', async () => {
      const past = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      const donor = mockDonor({ lastDonationDate: past });
      donorRepository.findByUserId.mockResolvedValue(donor);
      donorRepository.update.mockResolvedValue(donor);
      const Donation = require('../../models/Donation');
      Donation.create = jest.fn().mockResolvedValue({});

      const result = await donorService.logManualDonation('user123', {
        location: 'Karachi',
        quantity: 1,
      });

      expect(donor.donationCount).toBe(3);
      expect(donor.available).toBe(false);
    });
  });
});
