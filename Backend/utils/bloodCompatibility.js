/**
 * Blood group compatibility chart
 * Key = recipient blood group
 * Value = array of compatible donor blood groups
 */
const COMPATIBILITY = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
};

const ALL_GROUPS = Object.keys(COMPATIBILITY);

/**
 * Get all compatible donor blood groups for a recipient
 */
const getCompatibleGroups = (recipientGroup) => {
  if (recipientGroup === 'Any') {
    return ALL_GROUPS;
  }
  return COMPATIBILITY[recipientGroup] || [];
};

/**
 * Check if donor can give to recipient
 */
const isCompatible = (donorGroup, recipientGroup) => {
  const compatible = COMPATIBILITY[recipientGroup] || [];
  return compatible.includes(donorGroup);
};

module.exports = { COMPATIBILITY, getCompatibleGroups, isCompatible };
