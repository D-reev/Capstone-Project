import { collection, addDoc, getFirestore } from 'firebase/firestore';

/**
 * Creates a log entry in the database
 * @param {string} type - The type of log (e.g., 'PAGE_VIEW', 'USER_CREATED', etc.)
 * @param {string} userId - The ID of the user performing the action
 * @param {string} description - Optional description of the action
 * @param {Object} details - Optional additional details about the action
 */
export const createLog = async (type, userId = null, description = null, details = null) => {
  try {
    const db = getFirestore();
    const logData = {
      type,
      timestamp: new Date().toISOString(),
    };

    if (userId) {
      logData.userId = userId;
    }

    if (description) {
      logData.description = description;
    }

    if (details) {
      logData.details = details;
    }

    await addDoc(collection(db, 'logs'), logData);
  } catch (error) {
    console.error('Error creating log:', error);
    // Don't throw error to prevent disrupting main functionality
  }
};

/**
 * Log types available in the system
 */
export const LOG_TYPES = {
  // Page navigation
  PAGE_VIEW: 'PAGE_VIEW',
  
  // Security
  UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
  
  // User management
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  
  // Parts requests
  PARTS_REQUEST_CREATED: 'PARTS_REQUEST_CREATED',
  PARTS_REQUEST_APPROVED: 'PARTS_REQUEST_APPROVED',
  PARTS_REQUEST_REJECTED: 'PARTS_REQUEST_REJECTED',
  
  // Inventory
  INVENTORY_ADDED: 'INVENTORY_ADDED',
  INVENTORY_UPDATED: 'INVENTORY_UPDATED',
  INVENTORY_DELETED: 'INVENTORY_DELETED',
};

/**
 * Helper functions for common log operations
 */
export const logHelpers = {
  // User actions
  userLogin: (userId) => createLog(LOG_TYPES.USER_LOGIN, userId, 'User logged in'),
  userLogout: (userId) => createLog(LOG_TYPES.USER_LOGOUT, userId, 'User logged out'),
  userCreated: (adminId, newUserName, newUserRole) => 
    createLog(LOG_TYPES.USER_CREATED, adminId, `Created new ${newUserRole} account: ${newUserName}`),
  userUpdated: (adminId, userName) => 
    createLog(LOG_TYPES.USER_UPDATED, adminId, `Updated user: ${userName}`),
  userDeleted: (adminId, userName) => 
    createLog(LOG_TYPES.USER_DELETED, adminId, `Deleted user: ${userName}`),
  
  // Parts request actions
  partsRequestCreated: (userId, requestId, partsCount, totalAmount) => 
    createLog(
      LOG_TYPES.PARTS_REQUEST_CREATED, 
      userId, 
      `Created parts request with ${partsCount} item${partsCount !== 1 ? 's' : ''} (₱${totalAmount.toFixed(2)})`,
      { requestId, partsCount, totalAmount }
    ),
  partsRequestApproved: (adminId, mechanicName, requestId, details) => 
    createLog(
      LOG_TYPES.PARTS_REQUEST_APPROVED, 
      adminId, 
      `Approved parts request for ${mechanicName}`,
      { requestId, ...details }
    ),
  partsRequestRejected: (adminId, requestId, details) => 
    createLog(
      LOG_TYPES.PARTS_REQUEST_REJECTED, 
      adminId, 
      `Rejected parts request`,
      { requestId, ...details }
    ),
  
  // Inventory actions
  inventoryAdded: (adminId, partName, quantity) => 
    createLog(
      LOG_TYPES.INVENTORY_ADDED, 
      adminId, 
      `Added ${partName} to inventory (Qty: ${quantity})`,
      { partName, quantity }
    ),
  inventoryUpdated: (adminId, partName) => 
    createLog(LOG_TYPES.INVENTORY_UPDATED, adminId, `Updated inventory: ${partName}`),
  inventoryDeleted: (adminId, partName) => 
    createLog(LOG_TYPES.INVENTORY_DELETED, adminId, `Deleted from inventory: ${partName}`),
  
  // Page views
  pageView: (userId, pageName) => 
    createLog(LOG_TYPES.PAGE_VIEW, userId, `Viewed ${pageName}`, { page: pageName }),
  
  // Security
  unauthorizedAccess: (userId, page) => 
    createLog(
      LOG_TYPES.UNAUTHORIZED_ACCESS_ATTEMPT, 
      userId, 
      `Attempted to access ${page} without authorization`,
      { page }
    ),
};
