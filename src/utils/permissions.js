/**
 * Permission utility functions
 * @param {string[]} userFlags
 * @param {string} requiredFlag
 * @param {boolean} isOwn
 * @param {string} resourceAdminSteamId
 * @param {string} currentUserSteamId
 * @returns {boolean}
 */
export function hasPermission(userFlags, requiredFlag, isOwn = false, resourceAdminSteamId = null, currentUserSteamId = null) {
  if (userFlags.includes('@web/root')) {
    return true;
  }

  if (userFlags.includes(requiredFlag)) {
    return true;
  }

  if (isOwn && resourceAdminSteamId && currentUserSteamId) {
    const ownFlag = `${requiredFlag}.own`;

    const isResourceOwner = resourceAdminSteamId === currentUserSteamId;
    if (userFlags.includes(ownFlag) && isResourceOwner) {
      return true;
    }
  }

  return false;
}

/**
 * @param {string[]} userFlags
 * @param {string} baseFlag
 * @returns {boolean}
 */
export function hasAnyPermission(userFlags, baseFlag) {
  if (userFlags.includes('@web/root')) {
    return true;
  }
  
  if (userFlags.includes(baseFlag)) {
    return true;
  }
  
  if (userFlags.includes(`${baseFlag}.own`)) {
    return true;
  }
  
  return false;
}

/**
 * @param {string[]} userFlags
 * @param {string} baseFlag
 * @returns {'root' | 'full' | 'own' | 'none'}
 */
export function getPermissionLevel(userFlags, baseFlag) {
  if (userFlags.includes('@web/root')) {
    return 'root';
  }
  
  if (userFlags.includes(baseFlag)) {
    return 'full';
  }
  
  if (userFlags.includes(`${baseFlag}.own`)) {
    return 'own';
  }
  
  return 'none';
}