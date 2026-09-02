import { Router } from 'express';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth';
import { uploadNoteFiles } from '../middleware/upload';

// Controllers
import * as authCtrl from '../controllers/authController';
import * as notesCtrl from '../controllers/notesController';
import * as payCtrl from '../controllers/paymentController';
import * as couponCtrl from '../controllers/couponsController';
import * as reviewCtrl from '../controllers/reviewsController';
import * as contactCtrl from '../controllers/contactController';
import * as adminCtrl from '../controllers/adminController';

const router = Router();

// Apply token extraction across all API routes
router.use(authenticateToken);

// ==========================================
// PUBLIC & STUDENT AUTH ROUTES
// ==========================================
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/admin/login', authCtrl.adminLogin);
router.get('/auth/me', requireAuth, authCtrl.getCurrentUser);
router.put('/auth/profile', requireAuth, authCtrl.updateProfile);

// ==========================================
// NOTES & MARKETPLACE ROUTES
// ==========================================
router.get('/notes', notesCtrl.getNotes);
router.get('/notes/:id', notesCtrl.getNoteById);
router.get('/notes/:id/preview', notesCtrl.getPreview);
router.get('/notes/:id/download', requireAuth, notesCtrl.downloadNote);
router.get('/notes/:id/reader-content', requireAuth, notesCtrl.getReaderContent);
router.get('/notes/:id/reader', requireAuth, notesCtrl.getReaderContent);
router.get('/categories', notesCtrl.getCategories);
router.post('/wishlist/toggle', requireAuth, notesCtrl.toggleWishlist);
router.get('/library', requireAuth, notesCtrl.getStudentLibrary);

// ==========================================
// CHECKOUT & PAYMENT ROUTES (RAZORPAY & UPI)
// ==========================================
router.post('/payment/create-order', requireAuth, payCtrl.createCheckoutOrder);
router.post('/payment/verify', requireAuth, payCtrl.verifyPayment);
router.post('/payment/verify-upi', requireAuth, payCtrl.verifyUpiPayment);
router.get('/orders', requireAuth, payCtrl.getUserOrders);

// ==========================================
// COUPONS & REVIEWS
// ==========================================
router.post('/coupons/validate', couponCtrl.validateCoupon);
router.post('/reviews', requireAuth, reviewCtrl.addReview);

// ==========================================
// CONTACT & SUPPORT
// ==========================================
router.post('/contact', contactCtrl.submitContact);
router.post('/refunds', requireAuth, contactCtrl.submitRefundRequest);
router.get('/settings', adminCtrl.getSettings);

// ==========================================
// ADMIN DASHBOARD & CRUD ROUTES (PROTECTED)
// ==========================================
router.get('/admin/dashboard', requireAdmin, adminCtrl.getDashboardAnalytics);

// Admin Notes
router.get('/admin/notes', requireAdmin, adminCtrl.getAdminNotes);
router.post('/admin/notes', requireAdmin, uploadNoteFiles, adminCtrl.createAdminNote);
router.put('/admin/notes/:id', requireAdmin, uploadNoteFiles, adminCtrl.updateAdminNote);
router.delete('/admin/notes/:id', requireAdmin, adminCtrl.deleteAdminNote);

// Admin Orders
router.get('/admin/orders', requireAdmin, adminCtrl.getAdminOrders);
router.put('/admin/orders/:id/status', requireAdmin, adminCtrl.updateOrderStatus);

// Admin Users
router.get('/admin/users', requireAdmin, adminCtrl.getAdminUsers);
router.put('/admin/users/:id/status', requireAdmin, adminCtrl.toggleUserStatus);

// Admin Reviews
router.get('/admin/reviews', requireAdmin, adminCtrl.getAdminReviews);
router.put('/admin/reviews/:id/status', requireAdmin, adminCtrl.updateReviewStatus);
router.delete('/admin/reviews/:id', requireAdmin, adminCtrl.deleteReview);

// Admin Coupons
router.get('/admin/coupons', requireAdmin, adminCtrl.getAdminCoupons);
router.post('/admin/coupons', requireAdmin, adminCtrl.createAdminCoupon);
router.delete('/admin/coupons/:id', requireAdmin, adminCtrl.deleteAdminCoupon);

// Admin Contacts & Refunds
router.get('/admin/contacts', requireAdmin, adminCtrl.getAdminContacts);
router.post('/admin/contacts/:id/reply', requireAdmin, adminCtrl.replyContact);
router.get('/admin/refunds', requireAdmin, adminCtrl.getAdminRefunds);
router.put('/admin/refunds/:id', requireAdmin, adminCtrl.handleRefundDecision);

// Admin Settings
router.post('/admin/settings', requireAdmin, adminCtrl.updateSettings);

export default router;
