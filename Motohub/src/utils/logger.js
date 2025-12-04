import { collection, addDoc, getFirestore } from 'firebase/firestore';

/**
 * Creates a log entry in the database with detailed information
 * @param {string} type - The type of log (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} userId - The ID of the user performing the action
 * @param {string} userName - The name of the user performing the action
 * @param {string} userRole - The role of the user performing the action
 * @param {string} action - Action performed (e.g., 'Created user', 'Updated part')
 * @param {string} resource - The resource being acted upon (e.g., 'User', 'Part', 'Vehicle')
 * @param {string} resourceId - The ID of the resource
 * @param {Object} oldData - The previous state of the resource (for updates)
 * @param {Object} newData - The new state of the resource
 * @param {Object} metadata - Additional metadata (IP, device, etc.)
 */
export const createLog = async ({
  type,
  userId = null,
  userName = 'System',
  userRole = 'system',
  action,
  resource,
  resourceId = null,
  oldData = null,
  newData = null,
  metadata = {}
}) => {
  try {
    const db = getFirestore();
    const logData = {
      type,
      timestamp: Date.now(), // Use numeric timestamp for proper ordering
      timestampDate: new Date().toISOString(), // Keep ISO string for display
      userId,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      oldData,
      newData,
      metadata,
      changes: oldData && newData ? getChanges(oldData, newData) : null
    };

    await addDoc(collection(db, 'logs'), logData);
  } catch (error) {
    console.error('Error creating log:', error);
    // Don't throw error to prevent disrupting main functionality
  }
};

/**
 * Helper function to get differences between old and new data
 */
const getChanges = (oldData, newData) => {
  const changes = {};
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  
  allKeys.forEach(key => {
    const oldValue = oldData[key];
    const newValue = newData[key];
    
    // Skip undefined values and only track actual changes
    if (oldValue === undefined && newValue === undefined) return;
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        from: oldValue !== undefined ? oldValue : null,
        to: newValue !== undefined ? newValue : null
      };
    }
  });
  
  return Object.keys(changes).length > 0 ? changes : null;
};

/**
 * Log types available in the system
 */
export const LOG_TYPES = {
  // CRUD Operations
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  READ: 'READ',
  
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  
  // Authorization
  ACCESS_GRANTED: 'ACCESS_GRANTED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  
  // System
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING',
};

/**
 * Resource types in the system
 */
export const RESOURCES = {
  USER: 'User',
  VEHICLE: 'Vehicle',
  PART: 'Part',
  PARTS_REQUEST: 'Parts Request',
  SERVICE_REPORT: 'Service Report',
  PROMOTION: 'Promotion',
  INVENTORY: 'Inventory',
  TRANSACTION: 'Transaction',
  NOTIFICATION: 'Notification',
};

/**
 * Helper functions for common log operations
 */
export const logHelpers = {
  // Authentication
  login: (userId, userName, userRole) => 
    createLog({
      type: LOG_TYPES.LOGIN,
      userId,
      userName,
      userRole,
      action: 'Logged in',
      resource: RESOURCES.USER,
      resourceId: userId
    }),
    
  logout: (userId, userName, userRole) => 
    createLog({
      type: LOG_TYPES.LOGOUT,
      userId,
      userName,
      userRole,
      action: 'Logged out',
      resource: RESOURCES.USER,
      resourceId: userId
    }),
    
  loginFailed: (email) => 
    createLog({
      type: LOG_TYPES.LOGIN_FAILED,
      action: 'Failed login attempt',
      resource: RESOURCES.USER,
      metadata: { email }
    }),

  // User Management
  createUser: (adminId, adminName, adminRole, newUserData) => 
    createLog({
      type: LOG_TYPES.CREATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Created ${newUserData.role} user: ${newUserData.displayName}`,
      resource: RESOURCES.USER,
      resourceId: newUserData.id,
      newData: newUserData
    }),
    
  updateUser: (adminId, adminName, adminRole, userId, oldData, newData) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Updated user: ${newData.displayName || oldData.displayName}`,
      resource: RESOURCES.USER,
      resourceId: userId,
      oldData,
      newData
    }),
    
  deleteUser: (adminId, adminName, adminRole, deletedUserData) => 
    createLog({
      type: LOG_TYPES.DELETE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Deleted user: ${deletedUserData.displayName}`,
      resource: RESOURCES.USER,
      resourceId: deletedUserData.id,
      oldData: deletedUserData
    }),

  // Vehicle Management
  createVehicle: (userId, userName, userRole, vehicleData) => 
    createLog({
      type: LOG_TYPES.CREATE,
      userId,
      userName,
      userRole,
      action: `Added vehicle: ${vehicleData.make} ${vehicleData.model} (${vehicleData.plateNumber})`,
      resource: RESOURCES.VEHICLE,
      resourceId: vehicleData.id,
      newData: vehicleData
    }),
    
  updateVehicle: (userId, userName, userRole, vehicleId, oldData, newData) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId,
      userName,
      userRole,
      action: `Updated vehicle: ${newData.plateNumber || oldData.plateNumber}`,
      resource: RESOURCES.VEHICLE,
      resourceId: vehicleId,
      oldData,
      newData
    }),
    
  deleteVehicle: (userId, userName, userRole, vehicleData) => 
    createLog({
      type: LOG_TYPES.DELETE,
      userId,
      userName,
      userRole,
      action: `Deleted vehicle: ${vehicleData.make} ${vehicleData.model} (${vehicleData.plateNumber})`,
      resource: RESOURCES.VEHICLE,
      resourceId: vehicleData.id,
      oldData: vehicleData
    }),

  // Parts/Inventory Management
  createPart: (adminId, adminName, adminRole, partData) => 
    createLog({
      type: LOG_TYPES.CREATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Added part: ${partData.name} (Qty: ${partData.quantity || partData.stock || 0})`,
      resource: RESOURCES.PART,
      resourceId: partData.id,
      newData: partData
    }),
    
  updatePart: (adminId, adminName, adminRole, partId, oldData, newData) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Updated part: ${newData.name || oldData.name}`,
      resource: RESOURCES.PART,
      resourceId: partId,
      oldData,
      newData
    }),
    
  deletePart: (adminId, adminName, adminRole, partData) => 
    createLog({
      type: LOG_TYPES.DELETE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Deleted part: ${partData.name}`,
      resource: RESOURCES.PART,
      resourceId: partData.id,
      oldData: partData
    }),
    
  restockPart: (adminId, adminName, adminRole, partName, oldStock, newStock, addedQty) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Restocked part: ${partName} (+${addedQty})`,
      resource: RESOURCES.INVENTORY,
      oldData: { stock: oldStock },
      newData: { stock: newStock },
      metadata: { addedQuantity: addedQty }
    }),

  // Parts Request Management
  createPartsRequest: (mechanicId, mechanicName, requestData) => 
    createLog({
      type: LOG_TYPES.CREATE,
      userId: mechanicId,
      userName: mechanicName,
      userRole: 'mechanic',
      action: `Created parts request with ${requestData.parts?.length || 0} items`,
      resource: RESOURCES.PARTS_REQUEST,
      resourceId: requestData.id,
      newData: requestData
    }),
    
  approvePartsRequest: (adminId, adminName, adminRole, requestId, requestData) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Approved parts request for ${requestData.mechanicName}`,
      resource: RESOURCES.PARTS_REQUEST,
      resourceId: requestId,
      oldData: { status: 'pending' },
      newData: { status: 'approved', ...requestData }
    }),
    
  rejectPartsRequest: (adminId, adminName, adminRole, requestId, requestData, reason) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Rejected parts request for ${requestData.mechanicName}`,
      resource: RESOURCES.PARTS_REQUEST,
      resourceId: requestId,
      oldData: { status: 'pending' },
      newData: { status: 'rejected', reason },
      metadata: { rejectionReason: reason }
    }),

  // Service Report Management
  createServiceReport: (mechanicId, mechanicName, reportData) => 
    createLog({
      type: LOG_TYPES.CREATE,
      userId: mechanicId,
      userName: mechanicName,
      userRole: 'mechanic',
      action: `Created service report for ${reportData.vehicleInfo?.plateNumber || 'vehicle'}`,
      resource: RESOURCES.SERVICE_REPORT,
      resourceId: reportData.id,
      newData: reportData
    }),
    
  updateServiceReport: (mechanicId, mechanicName, reportId, oldData, newData) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId: mechanicId,
      userName: mechanicName,
      userRole: 'mechanic',
      action: `Updated service report`,
      resource: RESOURCES.SERVICE_REPORT,
      resourceId: reportId,
      oldData,
      newData
    }),
    
  completeServiceReport: (mechanicId, mechanicName, reportId, reportData) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId: mechanicId,
      userName: mechanicName,
      userRole: 'mechanic',
      action: `Completed service report`,
      resource: RESOURCES.SERVICE_REPORT,
      resourceId: reportId,
      oldData: { status: 'pending' },
      newData: { status: 'completed', ...reportData }
    }),

  // Promotion Management
  createPromotion: (adminId, adminName, adminRole, promotionData) => 
    createLog({
      type: LOG_TYPES.CREATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Created promotion: ${promotionData.title}`,
      resource: RESOURCES.PROMOTION,
      resourceId: promotionData.id,
      newData: promotionData
    }),
    
  updatePromotion: (adminId, adminName, adminRole, promotionId, oldData, newData) => 
    createLog({
      type: LOG_TYPES.UPDATE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Updated promotion: ${newData.title || oldData.title}`,
      resource: RESOURCES.PROMOTION,
      resourceId: promotionId,
      oldData,
      newData
    }),
    
  deletePromotion: (adminId, adminName, adminRole, promotionData) => 
    createLog({
      type: LOG_TYPES.DELETE,
      userId: adminId,
      userName: adminName,
      userRole: adminRole,
      action: `Deleted promotion: ${promotionData.title}`,
      resource: RESOURCES.PROMOTION,
      resourceId: promotionData.id,
      oldData: promotionData
    }),

  // Access Control
  accessDenied: (userId, userName, userRole, resource) => 
    createLog({
      type: LOG_TYPES.ACCESS_DENIED,
      userId,
      userName,
      userRole,
      action: `Attempted unauthorized access`,
      resource,
      metadata: { reason: 'Insufficient permissions' }
    }),
};
