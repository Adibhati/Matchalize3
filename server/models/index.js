/**
 * 📦 MODEL BARREL
 *
 * Every model in one import, so `config/db.js` can verify indexes at boot
 * without depending on the import order of whatever file happens to use it.
 *
 * WHY THIS EXISTS: the boot-time index check needs a known, non-empty set of
 * registered models. Reading `mongoose.modelNames()` inside db.js works today
 * only because index.js imports every route above the connectDB() call — an
 * accident of file ordering. Import this barrel instead and the check is
 * correct no matter who calls connectDB (server boot, a script, a test).
 *
 * ⚠️ WHEN YOU ADD A NEW MODEL, ADD IT HERE TOO. Without it the new model's
 * indexes are never verified at boot, which is the exact failure this file
 * exists to prevent.
 */
export { default as Alignment } from './Alignment.js';
export { default as Analytics } from './Analytics.js';
export { default as Block } from './Block.js';
/* College and CollegeRequest were previously absent from this barrel and only
   reached modelNames() by accident of import order — routes/admin.js happens to
   import them before connectDB() runs. That is exactly the coupling this file
   exists to remove, and it meant their indexes were verified only as long as
   that import ordering held. */
export { default as College } from './College.js';
export { default as CollegeRequest } from './CollegeRequest.js';
export { default as DeckImpression } from './DeckImpression.js';
export { default as DiscoverSession } from './DiscoverSession.js';
export { default as Interaction } from './Interaction.js';
export { default as Message } from './Message.js';
export { default as Notification } from './Notification.js';
export { default as OTP } from './OTP.js';
export { default as Report } from './Report.js';
export { default as Setting } from './Setting.js';
export { default as User } from './User.js';
/* Waitlist was removed for the IIT Bombay pilot. The invite list is the gate,
   not a public queue, so the model, its routes, and its page are gone rather
   than merely unmounted — an orphaned collection with indexes still being
   verified at boot is worse than no collection. Restore all three together if
   a staged launch ever needs them back. */