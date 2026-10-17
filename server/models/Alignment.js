import mongoose from 'mongoose';

const alignmentSchema = new mongoose.Schema(
  {
    pairKey: {
      type: String,
      required: true,
      unique: true,
      // Always formatted as 'LowerObjectId__HigherObjectId'
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    unlockedByInteractionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Points back to the exact letter that sparked the alignment
    },

    /* ═══════════════════════════════════════════════════════════════════════
     * 🛡️ IDENTITY & PRIVACY  (Roulette, Stage 1)
     *
     * Three problems this solves, all found by inspection:
     *
     * 1. "Can this person see my profile?" was decided independently by each
     *    screen — Chat.jsx showed the name, NotificationDrawer the name AND
     *    photo, the push notification used the sender's name as the lock
     *    screen TITLE, and Chats search filtered on the real name. 22 inline
     *    render sites, no single rule. A promise of "your profile is hidden"
     *    is unkeepable when there is nothing to break.
     *
     * 2. `showCollege` is the ONLY identity field with a server-side strip
     *    (utils/publicCard.js:64-69). `name` and `photos` are on the
     *    CARD_FIELDS allowlist and are always sent. There was no way to say
     *    "you may not see this person's profile" — only "you may not see
     *    their college".
     *
     * 3. Roulette connections are profile-hidden by default, and a Deck
     *    connection and a Roulette connection land in the SAME document,
     *    because `pairKey` is unique per unordered pair. Whatever grants
     *    access therefore has to live on the document, not be inferred from
     *    which flow produced it.
     *
     * ⚠️ SOURCE IS PROVENANCE ONLY. It records where a connection was born and
     * NEVER authorises access. `source: 'roulette'` does not mean "hidden" and
     * `source: 'deck'` does not mean "visible". Only `profileGrants` decides
     * that. Keeping the two separate is what lets a hidden-Roulette pair that
     * later meets again on the Deck keep its original permissions instead of
     * being silently upgraded by the newer flow.
     * ═══════════════════════════════════════════════════════════════════════ */
    source: {
      type: String,
      enum: ['deck', 'roulette'],
      default: 'deck',
      /* Where the connection was born. Provenance, never authority.
       * Defaults to 'deck' rather than null on purpose: a row that somehow
       * arrives without this must not read as "unknown origin, treat
       * differently". Backfill (scripts/migrate-roulette-source.mjs) sets it
       * explicitly on existing rows; the default is only the safety net for
       * a future write that forgets it. */
    },

    profileGrants: {
      type: [
        {
          viewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // The person who gained the right to look.
          },
          subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // Whose public profile they may now see.
          },
          source: {
            type: String,
            enum: ['legacy', 'deck', 'roulette_visible', 'roulette_reveal'],
            required: true,
            /* WHY the access exists. 'legacy' = backfilled from a pre-Roulette
             * deck connection, which showed both profiles openly. 'deck' = a new
             * deck align. 'roulette_visible' = the person entered Roulette with
             * "show my profile" already on, so anyone they meet may see it.
             * 'roulette_reveal' = both parties explicitly agreed to share.
             *
             * Recorded rather than inferred so that a future question — "why
             * can this person see that profile?" — has an answer in the
             * database instead of requiring us to reconstruct history from
             * request timestamps. */
          },
          grantedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
      /* DELIBERATELY EMPTY BY DEFAULT. Absence of a grant means NO ACCESS.
       *
       * The alternative — treating "no grant yet" as "it's a deck connection,
       * so allow it" — is a special case keyed on a field, and a special case
       * is exactly what fails: the first hidden-Roulette row written before
       * its grants are populated would silently show the real name. An empty
       * array fails closed with no branch to get wrong. */
    },

    conversationAliases: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // This person.
          },
          alias: {
            type: String,
            trim: true,
            maxlength: 24,
            default: null,
            // The name the OTHER party sees for them in this conversation.
            /* Copied ONCE when the connection is created and never written
             * again. That is what makes it safe: a new Roulette session can
             * never rename an existing conversation, because an
             * already-connected pair never gets a new Align request at all
             * (spec §9.1) — so there is no code path that could overwrite
             * this. 24 chars is a display name, not a profile field. */
          },
        },
      ],
      default: [],
      /* Absent for connections that predate Roulette: those show the real name
       * via profileGrants, so no alias is needed and none is invented. */
    },

    revealRequest: {
      state: {
        type: String,
        enum: ['none', 'pending', 'accepted', 'declined', 'expired'],
        default: 'none',
        /* none → pending → (accepted | declined | expired)
         *
         * Transitions are single-document atomic findOneAndUpdate calls whose
         * filter includes the expected prior state, retried on a miss. NOT
         * transactions: MongoDB M0 and the local standalone mongod do not
         * support them, and none are used anywhere in this codebase. The
         * established pattern to copy is discover.js:1488-1516
         * (DECK_RACE_RETRIES + isConcurrentDeckRace). */
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      requestedAt: {
        type: Date,
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
      consents: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          /* Accumulated atomically. Reaching two entries IS mutual acceptance —
           * there is no separate "both clicked" flag that could disagree with
           * the list. */
        },
      ],
      /* A subdocument with defaults rather than an optional field, so the state
       * machine always has a defined state and callers never need `?.`. */
    },
  },
  {
    timestamps: true,
  }
);

alignmentSchema.index({ users: 1, isActive: 1 });

/* Serves the only query the resolver makes: "is there a grant from this viewer
 * to this subject on this connection?" Without it that lookup is a collection
 * scan on every render of a chat header. Compound on both ids so the index can
 * be used as a prefix match in either direction. */
alignmentSchema.index({ 'profileGrants.viewerId': 1, 'profileGrants.subjectId': 1 });

/**
 * 🛡️ ALIGNMENT INTEGRITY
 *
 * An alignment is by definition two people, and `pairKey` must describe exactly
 * those two. Nothing enforced either: `users` was an unbounded array, so a stray
 * `$push` could add a third person and the chat would silently become a
 * three-way conversation while `pairKey` still said two — no error anywhere,
 * just a silently wrong document.
 *
 * Sorting note: both construction sites build pairKey with a bare
 * `[a, b].sort().join('__')` (routes/discover.js, routes/notifications.js) —
 * default lexicographic sort on 24-char hex ObjectId strings. This hook must use
 * the identical expression or it will reject valid alignments. If either site
 * ever switches to an explicit comparator, change it here too.
 *
 * `pre('validate')` covers both `save()` and an explicit `.validate()`.
 */
alignmentSchema.pre('validate', function (next) {
  const users = Array.isArray(this.users) ? this.users : [];
  if (users.length !== 2) {
    return next(new Error(`Alignment must have exactly 2 users, got ${users.length}`));
  }
  const expected = users.map(String).sort().join('__');
  if (this.pairKey !== expected) {
    return next(new Error(`pairKey does not match users: expected "${expected}", got "${this.pairKey}"`));
  }

  /* 🛡️ GRANT INTEGRITY
   *
   * Same class of bug the two-user check above exists to prevent. Nothing
   * stopped a `$push` onto `profileGrants` naming a THIRD person, at which
   * point a two-person connection would hand out permission to see someone
   * who is not in it — and the failure would be silent, because a grant is
   * just two ids and nothing downstream ever checks who they belong to.
   *
   * Both ends of every grant must be one of this alignment's two users.
   */
  const memberIds = new Set(users.map(String));
  for (const grant of this.profileGrants || []) {
    const viewer = String(grant.viewerId);
    const subject = String(grant.subjectId);
    if (!memberIds.has(viewer)) {
      return next(new Error(`profileGrants viewerId ${viewer} is not a member of this alignment`));
    }
    if (!memberIds.has(subject)) {
      return next(new Error(`profileGrants subjectId ${subject} is not a member of this alignment`));
    }
    if (viewer === subject) {
      return next(new Error('profileGrants cannot grant a user access to their own profile'));
    }
  }

  next();
});

const Alignment = mongoose.model('Alignment', alignmentSchema);
export default Alignment;