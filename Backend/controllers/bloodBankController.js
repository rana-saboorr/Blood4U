'use strict';
/**
 * bloodBankController.js — HTTP layer for Blood Bank routes.
 */

const bloodBankService = require('../services/bloodBankService');
const { truncateCoords } = require('../utils/sanitize');

// POST /api/banks
const registerBank = async (req, res, next) => {
  try {
    const bank = await bloodBankService.registerBank(req.user._id, req.body);
    // Notify admins of new registration
    const io = req.app.get('io');
    if (io) {
      const { emitToAdmins } = require('../utils/socketEmit');
      emitToAdmins(io, 'admin:bankPending', { bankId: bank._id, name: bank.name });
    }
    res.status(201).json({ success: true, message: 'Blood bank registration submitted for review.', bank });
  } catch (error) {
    next(error);
  }
};

// GET /api/banks
const getBanks = async (req, res, next) => {
  try {
    const banks = await bloodBankService.getBanks(req.query);
    // Truncate coords for public listing
    banks.forEach((b) => {
      if (b.location && b.location.coordinates) {
        b.location.coordinates = truncateCoords(b.location.coordinates);
      }
    });
    res.status(200).json({ success: true, count: banks.length, banks });
  } catch (error) {
    next(error);
  }
};

// GET /api/banks/:id
const getBankById = async (req, res, next) => {
  try {
    const bank = await bloodBankService.getBankById(req.params.id);
    if (bank.location && bank.location.coordinates) {
      bank.location.coordinates = truncateCoords(bank.location.coordinates);
    }
    res.status(200).json({ success: true, bank });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/banks/:id
const updateBank = async (req, res, next) => {
  try {
    const { bank, revertedToPending } = await bloodBankService.updateBank(req.params.id, req.user._id, req.body);
    
    if (revertedToPending) {
      const io = req.app.get('io');
      if (io) {
        const { emitToAdmins } = require('../utils/socketEmit');
        emitToAdmins(io, 'admin:bankPending', { bankId: bank._id, name: bank.name, reason: 'Profile updated' });
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: revertedToPending ? 'Blood bank updated. Profile is now pending review.' : 'Blood bank updated.', 
      bank 
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/banks/:id/inventory
const getBankInventory = async (req, res, next) => {
  try {
    const inventory = await bloodBankService.getInventory(req.params.id);
    res.status(200).json({ success: true, inventory });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/banks/:id/inventory
const updateBankInventory = async (req, res, next) => {
  try {
    const inventory = await bloodBankService.updateInventory(req.params.id, req.user._id, req.body.updates);
    
    const io = req.app.get('io');
    if (io) {
      const { emitToRole } = require('../utils/socketEmit');
      emitToRole(io, 'user', 'inventory:updated', { bankId: req.params.id, inventory });
    }
    
    res.status(200).json({ success: true, message: 'Inventory updated successfully.', inventory });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerBank, getBanks, getBankById, updateBank, getBankInventory, updateBankInventory };
