'use strict';
/**
 * bloodBankController.js — HTTP layer for Blood Bank routes.
 */

const bloodBankService = require('../services/bloodBankService');
const { truncateCoords } = require('../utils/sanitize');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/banks
const registerBank = asyncHandler(async (req, res) => {
  const bank = await bloodBankService.registerBank(req.user._id, req.body);
  const io = req.app.get('io');
  if (io) {
    const { emitToAdmins } = require('../utils/socketEmit');
    emitToAdmins(io, 'admin:bankPending', { bankId: bank._id, name: bank.name });
  }
  res.status(201).json({ success: true, message: 'Blood bank registration submitted for review.', bank });
});

// GET /api/banks
const getBanks = asyncHandler(async (req, res) => {
  const banks = await bloodBankService.getBanks(req.query, req.user);
  banks.forEach((b) => {
    if (b.location && b.location.coordinates) {
      const isOwner = req.user && String(b.owner?._id || b.owner) === String(req.user._id);
      if (!isOwner && req.user?.role !== 'admin') {
        b.location.coordinates = truncateCoords(b.location.coordinates);
      }
    }
    if (b.inventory && !b.bloodStock) {
      b.bloodStock = b.inventory;
    }
  });
  res.status(200).json({ success: true, count: banks.length, banks });
});

// GET /api/banks/:id
const getBankById = asyncHandler(async (req, res) => {
  const bank = await bloodBankService.getBankById(req.params.id);
  if (bank.location && bank.location.coordinates) {
    bank.location.coordinates = truncateCoords(bank.location.coordinates);
  }
  res.status(200).json({ success: true, bank });
});

// PATCH /api/banks/:id
const updateBank = asyncHandler(async (req, res) => {
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
});

// GET /api/banks/:id/inventory
const getBankInventory = asyncHandler(async (req, res) => {
  const inventory = await bloodBankService.getInventory(req.params.id);
  res.status(200).json({ success: true, inventory });
});

// PATCH /api/banks/:id/inventory
const updateBankInventory = asyncHandler(async (req, res) => {
  const inventory = await bloodBankService.updateInventory(req.params.id, req.user._id, req.body.updates);
  
  const io = req.app.get('io');
  if (io) {
    const { emitToRole } = require('../utils/socketEmit');
    emitToRole(io, 'user', 'inventory:updated', { bankId: req.params.id, inventory });
  }
  
  res.status(200).json({ success: true, message: 'Inventory updated successfully.', inventory });
});

// PATCH /api/banks/:id/stock — absolute inventory values (frontend compat)
const setBloodStock = asyncHandler(async (req, res) => {
  const bank = await bloodBankService.setBloodStock(req.params.id, req.user._id, req.body.bloodStock);

  const io = req.app.get('io');
  if (io) {
    const { emitToRole } = require('../utils/socketEmit');
    emitToRole(io, 'user', 'inventory:updated', {
      bankId: req.params.id,
      inventory: bank.inventory,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Blood stock updated successfully.',
    bank,
  });
});

module.exports = {
  registerBank,
  getBanks,
  getBankById,
  updateBank,
  getBankInventory,
  updateBankInventory,
  setBloodStock,
};
