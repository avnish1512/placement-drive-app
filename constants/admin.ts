/**
 * Admin Configuration Constants
 * These constants ensure that student and admin messaging is properly connected
 */

// Default admin ID used throughout the app
// This should match the actual admin's Firebase UID
// For now, using 'admin' as a convention-based ID
export const DEFAULT_ADMIN_ID = 'admin';

// Admin email for reference (used in auth, not for messaging)
export const ADMIN_EMAIL = 'admin@sgu.edu.in';

// Default admin name
export const ADMIN_NAME = 'Admin';

/**
 * IMPORTANT: For the messaging system to work correctly:
 * 1. Students create conversations with adminId = DEFAULT_ADMIN_ID
 * 2. Admin queries for conversations where adminId = DEFAULT_ADMIN_ID
 * 3. This ensures conversations are found and visible to both sides
 * 
 * If you need to change the admin ID (e.g., to use the Firebase UID),
 * update DEFAULT_ADMIN_ID and restart the app.
 */
