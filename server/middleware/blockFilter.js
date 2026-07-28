import Block from '../models/Block.js';

/**
 * Returns a MongoDB query fragment that excludes blocked users
 * from any query that fetches users by _id.
 *
 * @param {ObjectId} userId - The authenticated user's ID
 * @returns {Promise<Object>} - Query fragment like { _id: { $nin: [...] } }
 */
export async function getBlockExclusionQuery(userId) {
  const blocks = await Block.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).lean();

  const blockedIds = blocks.map((b) =>
    b.blocker.toString() === userId.toString() ? b.blocked : b.blocker
  );

  if (blockedIds.length === 0) return {};
  return { _id: { $nin: blockedIds } };
}

/**
 * Checks if two specific users have a block relationship.
 *
 * @param {ObjectId} userA
 * @param {ObjectId} userB
 * @returns {Promise<boolean>}
 */
export async function areBlocked(userA, userB) {
  const block = await Block.findOne({
    $or: [
      { blocker: userA, blocked: userB },
      { blocker: userB, blocked: userA },
    ],
  });
  return !!block;
}
