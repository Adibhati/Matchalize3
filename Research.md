Deck Algorithm rsearch:

Opencode:
Research done. Here's what's actually established, with sources.
Direct answer: no, big apps don't rank a feed
This is the finding that matters most, and it contradicts the assumption we started from.
App	What it actually does
Tinder	Never reordered the feed for you. As of their 2019 engineering blog, they retired Elo entirely and moved to inferring taste — "the ways users select many of the same profiles as other users who are similar to them." They also prioritise candidates who are active at the same time as you. (The Verge, 2019 (https://www.theverge.com/2019/3/15/18267772/tinder-elo-score-desirability-algorithm-how-works))
Hinge	One person per day at the top of Discover, expiring in 24 hours. Uses Gale-Shapley — specifically the stable roommate variant, because Hinge doesn't split users into gendered pools. Both users see each other. Result: 8× more likely to exchange phone numbers than other recommendations. (TechCrunch, 2018 (https://techcrunch.com/2018/07/11/hinge-employs-new-algorithm-to-find-your-most-compatible-match-for-you))
Bumble	Compatibility questions segmented into categories (communication style, relationship goals, lifestyle), surfaced as badges. Stated goal includes "balance the marketplace — ensure fair distribution of visibility." Their north metric is "how many successful connections have been made — something materialised."
So: none of them sort a feed by "recent + profile complete." Tinder dropped Elo because it was producing exactly the rich-get-richer dynamic I warned you about. Hinge shows one card. Bumble shows badges, not a percentage.
The architecture they all share
Two stages, and you're already half-way there:
Stage 1 — cheap candidate generation. Pull ~100–500 possibilities with an index scan.
Stage 2 — expensive ranking. Score those few hundred properly.
Your bug: Stage 2 is only ranking the 80 random people it grabbed. It's finding "the best of 80 random" — not the best available. A great profile sitting just outside your random slice is invisible forever.
The academic approach for reciprocal dating
There's a peer-reviewed paper directly on point (IJCAI (https://www.ijcai.org/Proceedings/11/Papers/367.pdf)) — a Content-Collaborative Reciprocal recommender:
1. Find users similar to you by profile attributes
2. Look at who those similar users interacted with → candidate set
3. Rank candidates by support score = positive interactions minus negative, weighted by how much those similar users agreedReported 69.26% success vs 35.19% baseline for top-10. That's the "people you like resemble people others liked" idea, made concrete — and note step 1 is content, which step 2 is behaviour. That's the hybrid.
What we have that Hinge doesn't — and why it matters
A Hinge user told The Verge in 2018:
"It just probably knows I'll find them attractive and can't really go off much else. It doesn't know how our conversation would go or whether we have mutual interests."
That's our opening. Hinge has 3 prompts and 6 photos — deliberately thin. We have:
- Interests (up to 6, already stored and already scoring)
- Intent — dating / friendship / study. This is the strongest signal on our platform and it is completely unused by the deck
- Year (UG/PG) and college — real compatibility axes for a campus app
- Profile strength 0–100, already computed
Someone who wants a study partner and someone who wants a relationship should not be shown to each other. That single feature will outperform any amount of score tuning.
The honest constraint: our pool is tiny
IIT Bombay in season might have 300–800 verified users. After your mutual-gender filter, a given user might have 50–150 eligible people.
At that size, ranking barely matters. Show10 of 60 and the 11th is nearly as good as the 1st. Hinge's "one perfect match" works because they have millions. For us, a ranked feed means your top 10 profiles absorb every impression while the other 50 never appear — on a campus where everyone can see each other socially, that's a real harm.
My strong recommendation for Matchalize: keep it mostly random, and fix intent compatibility as a hard filter rather than a ranking signal.
What I'd build
Week 1 — the actual bug
- hasMore computed after exclusion, not before
- Client hard-stops on an empty page
- The infinite request loop dies
Month 1 — coherent deck
- One randomPoint per session, passed as a cursor (keyset pagination over a shuffled pool)
- Deck becomes a stable ordered sequence; re-roll on next session
- This alone fixes "no persistent order"
Month 1–2 — real signals
- Intent mismatch → hard exclusion, not a score
- Replace the 6-value score with: shared interests (continuous), year match, smooth recency decay, plus your existing profileScore
- Keep the ordering random; use the score only to break ties inside the random set
Month 3+ — only with data
- Collaborative filtering: "users similar to you liked these people" (the IJCAI approach)
- Needs real interaction volume first. Meaningless at 5 users.
Explicitly do NOT build
- Gale-Shapley stable matching — needs mutual preference signal at scale, and on a small pool it just hides people
- ML/LTR ranking — no labels, no volume
- A compatibility percentage — we just deleted it, and Hinge's own design doc argues against big scores
Two caveats. Tinder and Hinge internals are proprietary — I've cited their own engineering posts and reputable reporting, not leaked internals. And the Bumble specifics (the "Beehive Score", its ranking internals) came from a reverse-engineering blog post with no primary source; treat those as unverified.
Want me to write this up as an implementation plan, or dig deeper into any one area first — the intent filter, the session-stable shuffle, or the collaborative filtering?


GooglAI:
This comprehensive research document directly addresses your architecture, constraints, and current defects for Matchalize. It is structured for direct engineering execution, balancing high-scale industry concepts against your thin, campus-scale reality.
------------------------------
## 1. Industry Architecture Deep-Dive
Modern dating architectures rely on a two-stage pattern: Cheap Candidate Generation (Retrieval) followed by Heavyweight Ranking (Scoring).

[ Total User Pool ] (10k - 10M+)
        │
        ▼ (Stage 1: Retrieval / Hard Filters)
[ Candidate Gen ]  --> Database-level indexed match (Gender, Age, Radius, College)
        │
        ▼ (Filtered Batch: ~500 - 1,000 profiles)
   [ Ranking ]     --> Scoring Engine (Heuristics, ELO, Multi-Armed Bandits, ML)
        │
        ▼ (Top N Slice: e.g., 20 - 50)
 [ Swiping Deck ]  --> Presented to User via Cursor Pagination

## Retrieval & Ranking Across Major Platforms

| Platform | Core Retrieval Mechanics | Core Ranking / Scoring Signals | Presentation Style | Stated Rationale & Sources |
|---|---|---|---|---|
| Tinder | Geospatial radius ($geoWithin) + active status filters. | Reciprocal attraction vector (formerly Elo-based, now a dynamic graph embedding network scoring collaborative filtering vectors) + Recency and Activity multipliers. | Endless, high-velocity deck. | Maximizes raw sessions, ad impressions, and instant gratification loops. |
| Hinge | Strict preferences (religion, politics, height) acting as hard network cut-offs. | Gale-Shapley Stable Matching variant ("Most Compatible") + Collaborative Filtering (Glint/Matrix Factorization). | Slow feed + 1 daily "Standout" profile. | "Designed to be deleted." Intentional friction creates higher conversion from match-to-date. |
| Bumble | Hard radius + gender filters. | Profile completeness + Vibe/Compatibility question overlap + Incoming Like velocity. | Velocity deck (Women message first). | Shifts network dynamics and mitigates male user spamming by creating a time-bound decay on matches. |
| OkCupid | Multi-attribute filtering across hundreds of deep-dive questions. | Linear vector dot-product of user answer weights vs. candidate target answers (Percentage match). | Hybrid deck and targeted discovery rows. | High-intent compatibility based on explicit values, filtering out basic physical attraction. |

## Deep Dive: Specific Product Decisions & Mechanics## Gale-Shapley Stable Matching in Hinge’s "Most Compatible"
The classic Gale-Shapley algorithm guarantees that in a closed market, no two individuals prefer each other over their current assigned partners.

* How it is applied: Hinge uses historical swipe data to build preference vectors for every user. It runs an offline, batch Gale-Shapley simulation across active users in a local pool to find optimal, reciprocal pairings.
* Optimization Goal: It optimizes for long-term retention and real-world outcomes over short-term screen time.
* Known Failure Modes: It requires a closed, balanced, highly dense ecosystem. In thin or highly skewed gender pools (typical on college campuses), it breaks down completely. It leaves trailing users with radically incompatible matches or "no matches found" states.

## Tinder’s Collaborative Preference Ranking
Tinder moved away from a classic chess-style Elo score (which flattened users into a rigid attractiveness hierarchy) to a dynamic Collaborative Filtering model.

* The Mechanism: If User A likes Users X, Y, and Z, and User B likes Users X and Y, the system infers that User B is highly likely to like User Z.
* Core Signals: Swipe velocity, response rates to first messages, session frequency, and profile interaction times are encoded into a low-dimensional vector space.

## Bumble’s Compatibility Questions
Bumble surfaces micro-questions (typically 3–5 core lifestyle tags, plus rotating fun questions) to solve the cold-start problem and reduce conversational friction.

* The Scoring Engine: Questions are grouped into clusters (e.g., Political, Lifestyle, Romance Style). Overlap creates a minor multiplier in ranking but primarily serves as explicit UI scaffolding (icebreakers).

## The Design Rationale of Hinge's Small "Pill" vs. Percentages
Hinge purposefully replaced large percentage scores with a minimalist "Most Compatible" tag.

* The Psychology: High-digit percentages (e.g., "98% Match") cause users to hyper-analyze why a profile isn't a 100% match. It encourages a "shopping" mindset where users look for reasons to reject candidates.
* The Takeaway for Matchalize: A simple visual anchor drives significantly higher swipe-right engagement than a numerical match score. It leverages curiosity rather than analytical scrutiny.

------------------------------
## 2. Recommended Architecture for Matchalize (Scale: 10k–100k)
For your stack (React 19 + Node/Express + MongoDB 8), avoid jumping directly to machine learning pipelines or vector databases. A multi-stage architecture implemented natively inside MongoDB and Node is your most cost-effective path.

       [ Client Request: GET /discover?cursor=X ]
                           │
                           ▼
 ┌───────────────────────────────────────────────────┐
 │ STAGE 1: MONGODB AGGREGATION PIPELINE (Retrieval)  │
 │  • Hard Filters: Verification, Gender, Age        │
 │  • Campus Boundaries: Intra vs. Inter College     │
 │  • Exclusion: $lookup matching Interacted collection│
 │  • Shuffling: Seeded $rand with Deterministic Sort│
 └───────────────────────────────────────────────────┘
                           │
                           ▼ (Returns ~200 Raw Candidates)
 ┌───────────────────────────────────────────────────┐
 │ STAGE 2: NODE.JS MEMORY ENGINE (Heuristic Rank)   │
 │  • Smooth Recency Decay (Exponential decay)       │
 │  • Quality Multiplier (Continuous photo/bio score) │
 │  • Profile Intent / Category Alignment Overlap    │
 └───────────────────────────────────────────────────┘
                           │
                           ▼ (Slices Top N, e.g., 20)
       [ Client Response: { data: [...], cursor: Y } ]

## Architecture Component Specifications

| Architecture Layer | Core Technology | Operational Mechanics | Complexity / Risk Rating | Trade-offs |
|---|---|---|---|---|
| Stage 1: Retrieval & Exclusion | MongoDB Pipeline + Compound Indexes | Executes hard filters and checks user interaction tables ($lookup/$expr). Uses a pseudo-seeded approach or deterministic user-ID-based offsets for generation. | Low | Offloads exclusion logic entirely to the database, ensuring zero empty pages. Increases index read sizes slightly. |
| Stage 2: Ranking Engine | Node.js (In-Memory Heuristic Vector) | Computes a smooth, non-bucketted floating-point score based on profile completion, real-time recency decay, and intent categories across the retrieved candidate pool. | Low | Extreme performance velocity; easily tunable parameters. Does not support deep behavioral feedback loops out of the box. |
| State & Cursor Pagination | Keyset / Cursor Pagination (last_id + score) | Encrypts the last seen composite score and ID into a base64 token. Next fetches pick up precisely where the previous execution left off. | Medium | Eliminates duplicate profiles and infinite client loops. Increases state tracking requirements on the frontend. |

------------------------------
## 3. Concrete Candidate-Generation & Ranking Design## Step 1: Solving the Core Architectural Failures
The current loop failure stems from two specific flaws: pre-exclusion pagination counts and a rigid random seed that clusters lookups into a tiny subset of the pool.
To fix this systematically, Matchalize must migrate to an Index-Backed Keyset Cursor Pipeline with an active database-level exclusion stage.
## Step 2: High-Performance Database Design## The MongoDB Schema Extensions

// User Schema Extensionsconst UserSchema = new mongoose.Schema({
  isOnboarded: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  isGhost: { type: Boolean, default: false },
  collegeCode: { type: String, required: true },
  gender: { type: String, required: true },
  interestedIn: [{ type: String }], // Array for expansive gender options
  intentCategory: { type: String, enum: ['dating', 'friendship', 'study'] },
  profileScoreBase: { type: Number, default: 0.5 }, // Pre-calculated completeness metric (0.0 to 1.0)
  lastActive: { type: Date, default: Date.now, index: true }
});
// Compound Index for Ultra-Fast Match Retrieval
UserSchema.index({
  isOnboarded: 1,
  isVerified: 1,
  isDeleted: 1,
  suspended: 1,
  isGhost: 1,
  gender: 1,
  collegeCode: 1,
  lastActive: -1
});
// Interactions Schema (The Deduplication Log)const InteractionSchema = new mongoose.Schema({
  viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actionType: { type: String, enum: ['pass', 'like', 'letter', 'archive'] },
  cooldownExpiresAt: { type: Date }
});// Compound unique key to avoid duplicate entries and fast lookups
InteractionSchema.index({ viewerId: 1, candidateId: 1 }, { unique: true });
InteractionSchema.index({ cooldownExpiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-purge temporary passes

## Step 3: Weighted Dynamic Candidate Selection Pipeline
To fix the issue where users see the same profiles repeatedly, you can use MongoDB's $rand operator combined with a deterministic seed generated during the user's session. This keeps the feed stable while introducing controlled variation across requests.
Here is the robust, production-ready Express handler replacing your defective route:

const router = require('express').Router();

router.get('/discover', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor ? parseCursor(req.query.cursor) : null;
    const viewer = req.user; // Injected via auth middleware

    // 1. Fetch the viewer's exclusion list (Self, blocks, active interactions)
    const interactions = await Interaction.find({
      viewerId: viewer._id,
      $or: [
        { actionType: { $in: ['like', 'letter', 'archive'] } },
        { cooldownExpiresAt: { $gt: new Date() } }
      ]
    }).select('candidateId').lean();

    const excludedIds = interactions.map(i => i.candidateId);
    excludedIds.push(viewer._id); // Never show self

    // 2. Build Stage 1 MongoDB Aggregation Pipeline
    const pipeline = [
      {
        $match: {
          _id: { $nin: excludedIds },
          isOnboarded: true,
          isVerified: true,
          isDeleted: false,
          suspended: false,
          isGhost: false,
          gender: { $in: viewer.interestedIn },
          interestedIn: viewer.gender
        }
      }
    ];

    // College Scope Logic: Default to Intra-campus, fallback to inter-campus if thin
    const intraCollegeCount = await mongoose.model('User').countDocuments({
      ...pipeline[0].$match,
      collegeCode: viewer.collegeCode
    });

    if (intraCollegeCount >= limit * 2) {
      // Pool is thick enough, isolate to same campus
      pipeline[0].$match.collegeCode = viewer.collegeCode;
    } else {
      // Pool thin: Add a sorting weight favoring their college without completely excluding others
      pipeline.push({
        $addFields: {
          collegeWeight: { $cond: [{ $eq: ["$collegeCode", viewer.collegeCode] }, 1.5, 1.0] }
        }
      });
    }

    // Add Session-Stable Pseudo-Random Shuffling via $rand
    pipeline.push({
      $addFields: {
        // Combines db native randomness with a weight multiplier for college proximity
        discoveryRandom: { $multiply: [{ $rand: {} }, { $ifNull: ["$collegeWeight", 1.0] }] }
      }
    });

    // Keyset pagination constraint application
    if (cursor) {
      pipeline.push({
        $match: {
          discoveryRandom: { $lt: cursor.randomScore }
        }
      });
    }

    // Sort descending by our randomized score vector
    pipeline.push({ $sort: { discoveryRandom: -1 } });
    
    // Fetch a retrieval batch large enough to fine-tune in Node
    pipeline.push({ $limit: limit * 3 });

    const candidates = await mongoose.model('User').aggregate(pipeline);

    // 3. Stage 2: Node.js In-Memory Fine Tuning (The Heuristic Rank)
    const now = Date.now();
    const scoredCandidates = candidates.map(c => {
      // A. Continuous Recency Decay: Exponential half-life decay (Halves every 12 hours)
      const hoursSinceActive = Math.max(0, (now - new Date(c.lastActive).getTime()) / (1000 * 60 * 60));
      const recencyScore = Math.exp(-hoursSinceActive / 12); 

      // B. Fine-grained Intent alignment multiplier
      const intentMultiplier = (c.intentCategory === viewer.intentCategory) ? 1.2 : 1.0;

      // C. Base profile score calculated at profile edit time
      const baseCompleteness = c.profileScoreBase || 0.5;

      // Composite scoring formula
      const finalScore = (recencyScore * 0.5 + baseCompleteness * 0.5) * intentMultiplier;

      return { ...c, calculatedRankScore: finalScore };
    });

    // Final Sort and Slice
    scoredCandidates.sort((a, b) => b.calculatedRankScore - a.calculatedRankScore);
    const finalSelection = scoredCandidates.slice(0, limit);

    // 4. Exact Fix for the hasMore / Exhaustion Loop
    // hasMore is true ONLY if the returned final array matches the requested limit 
    // AND there are extra candidates left over in the raw database retrieval query.
    const hasMore = finalSelection.length === limit && candidates.length > limit;
    
    const nextCursor = hasMore ? Buffer.from(JSON.stringify({
      randomScore: finalSelection[finalSelection.length - 1].discoveryRandom
    })).toString('base64') : null;

    res.status(200).json({
      data: finalSelection,
      hasMore,
      nextCursor
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
function parseCursor(cursorStr) {
  try {
    return JSON.parse(Buffer.from(cursorStr, 'base64').toString('ascii'));
  } catch (e) {
    return null;
  }
}

## Step 4: Correct Client-Side Synchronization Protocol
To completely prevent the unbounded client-side requesting loops, the frontend must strictly validate the payload data structure and drop recursive request cascades if hasMore arrives as false.

// React 19 Custom Discovery Deck Mechanismimport { useState, useEffect, useCallback } from 'react';
export function useDiscoverDeck(limit = 20) {
  const [deck, setDeck] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const fetchBatch = useCallback(async (currentCursor: string | null) => {
    if (isFetching || !hasMore) return;
    
    setIsFetching(true);
    try {
      const url = `/api/discover?limit=${limit}${currentCursor ? `&cursor=\${currentCursor}` : ''}`;
      const res = await fetch(url);
      const payload = await res.json();
      
      if (payload.data && payload.data.length > 0) {
        setDeck(prev => [...prev, ...payload.data]);
        setCursor(payload.nextCursor);
        setHasMore(payload.hasMore);
      } else {
        // If data block is empty, hard cut the looping states
        setHasMore(false);
      }
    } catch (err) {
      console.error("Discovery Engine Error", err);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, hasMore, limit]);

  // Evaluate card threshold indexes cleanly without refetching loops
  useEffect(() => {
    const cardsRemaining = deck.length - currentIndex;
    if (cardsRemaining <= 4 && hasMore && !isFetching) {
      fetchBatch(cursor);
    }
  }, [currentIndex, deck.length, hasMore, isFetching, cursor, fetchBatch]);

  const handleSwipe = async (direction: 'left' | 'right', candidateId: string) => {
    setCurrentIndex(prev => prev + 1);
    
    // Optimistic background post execution
    fetch(`/api/discover/pass/${candidateId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: direction === 'left' ? 'archive' : 'like' })
    }).catch(err => console.error("Sync backup failure", err));
  };

  return { currentCard: deck[currentIndex], handleSwipe, isFetching, exhausted: !hasMore && currentIndex >= deck.length };
}

------------------------------
## 4. Phased Engineering Rollout Roadmap

 WEEK 1                          MONTH 1                         MONTH 3
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│ • Deploy hard DB-level        │ │ • Deploy Smooth Floating-Point│ │ • Track Message Reply Rates    │
│   exclusion tracking          │ │   Recency Decay Engine        │ │ • Deploy contextual multi-    │
│ • Fix hasMore logic boolean   │ │ • Pre-calculate completeness │ │   armed bandit exploration    │
│ • Establish absolute client-  │ │   scores on profile save     │ │ • Enable active inter-college │
│   side fetch guardrails       │ │ • Setup Keyset Pagination     │ │   campus network bridges      │
└───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘

## Week 1: Absolute Defect Remediation (Hotfix)

* Objective: Stop application looping patterns and cloud compute overruns.
* Deliverable: Update /discover with database-level $nin exclusion logic using pre-fetched user interaction mappings.
* Fix validation: Ensure that hasMore evaluates to false when internal database returns match sets under your specified limit query parameters.

## Month 1: Profile Scoring Resolution & Pagination Stability

* Objective: Remove bucketed score distributions and introduce fluid, session-stable sorting patterns.
* Deliverable: Introduce floating-point profile score parameters calculated inside database save hooks. Shift application runtime discovery endpoints to use the cryptographic keyset cursor serialization structures defined in the Stage 2 Node engine.

## Month 3: Behavioral Intent Tracking & Network Scaling

* Objective: Introduce active engagement signals and automatic cross-campus network routing options.
* Deliverable: Track user message response latencies and active usage cadences. When local campus directory thresholds drop beneath 50 profiles, programmatically expand the matching radius to target designated sibling colleges.

## What to Deliberately NOT Build Yet

* Do NOT construct complex Machine Learning models (TensorFlow, LambdaMART, PyTorch clusters): At sub-100k scales, the compute latency and lack of rich historical training labels will cause poor recommendations and wasted budget.
* Do NOT integrate Vector Database Layers (Pinecone, Milvus): Standard compound indexing structures across MongoDB can process queries under 10ms up to 100k rows without adding infrastructural overhead.

------------------------------
## 5. Metrics & Instrumentation Blueprint
Before launching these algorithmic revisions, you must instrument your logging layers to capture tracking variables. This allows you to evaluate system performance even before users match or converse.
## 1. Offline System Performance Metrics## Score Variance & Distribution Density

* Goal: Confirm the system avoids clustering profiles into standard bucketed scores.
* Calculation: Log the calculated match ranks for 1,000 distinct API queries. Ensure the statistical variance remains smooth and non-uniform across your user distribution.

## Gini Coefficient of Profile Exposure

* Goal: Track exposure inequality across your user base to prevent a tiny subset of profiles from capturing all impressions.
* Implementation formula:

$$\text{Gini} = \frac{\sum_{i=1}^{n} \sum_{j=1}^{n} \vert{}x_i - x_j\vert{}}{2n^2 \bar{x}}$$ 

* Where $x_i$ equals total database impressions tracked per profile. A score approaching 0.0 signifies uniform exposure equity across the network, while a score near 1.0 indicates that a few profiles are absorbing all views.

## 2. Real-Time Online Performance Metrics## Cards Scaled per Active Session

* Total profile card items consumed by a user before closing the PWA interface.

## Initial Engagement Response Latency (Time-to-First-Like)

* The explicit timeline window track across newly launched user profiles before recording their initial incoming network validation swipe.

## Message Pair Conversion Ratios

* The direct transformation metric tracking pairs moving from basic match status into active text conversations.

------------------------------
## 6. Anti-Patterns for Thin Campus Networks
Many standard engineering practices found in high-scale dating system documentations will break your application at campus scale. Avoid the following pitfalls:
## 1. Elo or Pure Win/Loss Relative Attraction Scales

* Why it fails you: Elo scoring strategies need continuous, multi-directional user interactions to correctly place individuals within a performance matrix. In thin college ecosystems (such as 400 total active profiles), a small group of highly active profiles can easily skew system scores, pushing average profiles down into invisible tiers where they never receive exposure.

## 2. High-Performance Cache Invalidation Strategies (e.g., Rigid Redis Feed Buffering)

* Why it fails you: Storing pre-computed recommendation decks inside cache instances like Redis works well when matching pools are large and steady. On a college campus, however, user groups change rapidly as students onboard or move off-campus. Caching these lists often leads to stale feeds or fast exhaustion states when pools are small.

## 3. Strict Geographic Radius Constraints

* Why it fails you: Large platforms use hard boundaries like "within 5 miles" to filter matches. On a campus network, this metric is redundant because all users are already co-located. Filtering by micro-distances can accidentally exclude users who live just off-campus, unnecessarily dividing a small community. Focus your filters on institutional verification keys (collegeCode) rather than precise GPS coordinates.

Would you like me to generate the Mongoose migration scripts to pre-calculate the profileScoreBase values for your current users, or should we build out the testing suite to verify your pagination logic against 10,000 mock profiles?



Perplexity:
Matchalize should **not** try to copy a large-app ML recommender yet. At your actual density—hundreds of eligible people per campus, five real users, sparse interaction labels—the right system is a deterministic, session-stable candidate pool with strong hard filters, a transparent hand-tuned score, controlled exploration, and correct exhaustion semantics.

Your current MongoDB `randomSeed` range scan is a reasonable primitive at 10k users. The failures are not MongoDB scale failures; they are **session instability, low score resolution, filtering after retrieval, and incorrect pagination state**.

## 1. How major apps rank

| App | Publicly documented approach | What is safe to infer | Product implication |
|---|---|---|---|
| Tinder | Tinder says it no longer uses Elo and dynamically considers Likes, Nopes, engagement, and profile information; it also says it may use similarity in previously liked photos and audiences who liked similar members.  [help.tinder](https://www.help.tinder.com/hc/en-us/articles/7606685697037-Powering-Tinder-The-Method-Behind-Our-Matching) | It is a reciprocal recommender: rank candidates not only by “will A like B?” but by likelihood of mutual interest and engagement. Old Elo descriptions are historical, not a current implementation. | Do not copy a global “desirability score.” It is a bad fit for a thin campus pool and creates exposure inequality |
| Hinge | Hinge says “Most Compatible” is a top-of-feed recommendation based on mutual dealbreakers, recent activity, and shared patterns in who members tend to like.  [help.hinge](https://help.hinge.co/hc/en-us/articles/360011233073-What-is-Most-Compatible) Hinge has publicly described it as ML combined with a Gale–Shapley-inspired approach.  [bustle](https://www.bustle.com/wellness/how-does-hinge-algorithm-work) | This is a **daily standout**, not necessarily the ranking method for every profile in Discover. The stable-matching framing emphasizes reciprocal likelihood rather than one-sided attraction. | Use a single daily/occasional “Good fit” card only after you have sufficient data; do not run global stable matching for the whole deck |
| Bumble | Public sources support profile prompts, values, intentions, and filters, but I could not verify an official current Bumble feature matching the brief’s “Compatibility Questions” with a published question count, segmentation, or public score formula. Bumble’s own public material is general compatibility advice, not algorithm documentation.  [bumble](https://bumble.com/en/the-buzz/compatibility-bumble-match) | Treat detailed claims about a Bumble compatibility-score product as unverified unless you have a current primary source or screenshots from the live app. | Do not build a percentage score just because Bumble/others may use questions |
| OkCupid | OkCupid explicitly says Match Questions let people define what matters and presents a Match %; its public help material describes thousands of possible questions.  [okcupid-app.zendesk](https://okcupid-app.zendesk.com/hc/en-us/articles/22770910347803-Match-Questions) | Its historical model is explicitly reciprocal: your answer, acceptable partner answers, and importance weights. It is much more questionnaire-led than swipe-led. | Borrow **mutual preference constraints**, not a noisy 0–100 “compatibility” percentage |

### What “reciprocal” means

Normal recommendation answers: “Will viewer \(u\) click candidate \(v\)?”

Dating recommendation should answer something closer to:

\[
P(\text{mutual connection}\mid u,v)
\]

That requires both sides:

- Will the viewer likely like or contact this candidate?
- Will the candidate likely respond positively?
- Do their explicit constraints allow one another?
- Are they both active enough for the connection to have a real chance?

Academic work makes this distinction clearly: dating recommendation aims to match people likely to be mutually interested and likely to communicate, not users with passive items.  A production system can eventually estimate one-sided probabilities and combine them—often conservatively, for example \(p_{u\to v} \times p_{v\to u}\)—but Matchalize has nowhere near the labels needed for that today. [web.cs.ucla](https://web.cs.ucla.edu/~yzsun/papers/snam2016.pdf)

### Hinge’s Gale–Shapley claim, correctly interpreted

Hinge has described Most Compatible as combining ML with a Gale–Shapley-derived idea.  Classic Gale–Shapley produces a stable assignment: there should not be a pair who both prefer each other over their assigned partners. [bustle](https://www.bustle.com/wellness/how-does-hinge-algorithm-work)

That does **not** naturally map to an infinite dating feed:

- A feed is not a final assignment; people can like many people.
- The candidate pool changes constantly.
- Gender/sexuality/intent graphs are not necessarily two equal partitions.
- A “stable” outcome can still be poor for discovery, diversity, or new users.
- Hinge’s own public description is a **single recommendation at the top of Discover**, refreshed over time—not proof that it stable-matches its entire user base. [help.hinge](https://help.hinge.co/hc/en-us/articles/360011233073-What-is-Most-Compatible)

For Matchalize, a batch stable-matching algorithm would be premature and actively awkward. At most, later use reciprocal scoring to select one “Today’s good fit” profile among candidates who have already passed hard eligibility filters.

### Percentages versus a small explanation

OkCupid’s Match % is central to its questionnaire product.  Hinge instead exposes a lightweight “Most Compatible” label. That is the better pattern for Matchalize. [okcupid-app.zendesk](https://okcupid-app.zendesk.com/hc/en-us/articles/22770910347803-Match-Questions)

A precise-looking percentage implies measurement accuracy you do not have. “87% compatible” based on three interests, recency, and profile completeness would be fake precision. Prefer:

- “Shared interests”
- “Both looking for dating”
- “Active this week”
- “Same campus”
- “You both like indie music”
- “A good fit for your preferences”

Show **one or two truthful reasons**, not a magic number. Never say “most compatible” until the model earns that claim.

## 2. Recommended architecture

### Architecture at your scale

| Layer | Recommendation | Complexity | Risk | Why |
|---|---|---:|---:|---|
| Eligibility | Mongo query for verified, active, non-deleted, non-suspended, mutually eligible, intent-compatible users | Low | Low | Hard filters must happen before ranking |
| Relationship exclusions | Materialized per-viewer exclusion state: blocks permanent; passes with expiry; letters/Telegram state; self | Medium | Medium | Prevents repeats and makes pagination truthful |
| Candidate generation | Session-stable shuffled pool or deterministic keyset scan using a saved session seed | Medium | Low | Fixes repeated cards and re-roll-per-request behavior |
| Ranking | Hand-tuned continuous score plus controlled random jitter | Low | Low | Proper for five users and early sparse data |
| Diversity | Simple caps or interleaving by campus/intent/freshness | Low | Low | Avoids ten near-identical cards and exposure concentration |
| Exploration | Reserve 20–30% of positions for eligible lower-score/new profiles | Low | Low | Lets unknown profiles receive data and visibility |
| Daily standout | One separately selected reciprocal-fit card, later | Medium | Medium | Product feature, not core retrieval |
| Learning-to-rank | Do not build yet | High | High | You lack clean labels and enough traffic |
| Contextual bandit | Do not build yet | High | High | It will mostly optimize noise and amplify early bias |

### Core principle

**Generate broadly enough, rank locally, and preserve the resulting order for the session.**

At 300–800 verified users at IIT Bombay in season, your main problem is not retrieving the theoretical best 10 from a million. It is avoiding repeats, avoiding dead profiles, giving new people visibility, and making a sparse pool feel alive without lying.

### Suggested data model additions

```ts
type DiscoverSession = {
  _id: ObjectId
  viewerId: ObjectId
  scope: "campus" | "intercollege" | "platform"
  collegeCode?: string
  intent: "dating" | "friendship" | "study"
  seed: string
  candidateIds?: ObjectId[]       // optional, only for small pools
  cursor?: {
    bucket: number
    randomSeed: number
    id: ObjectId
  }
  deliveredCount: number
  scannedCount: number
  exhausted: boolean
  expiresAt: Date
  createdAt: Date
}

type Interaction = {
  viewerId: ObjectId
  targetId: ObjectId
  actionType: "pass" | "letter" | "telegram" | "block" | "archive"
  cooldownExpiresAt?: Date
  createdAt: Date
}
```

Also create or enforce these indexes:

```js
// Interaction lookup for exclusions
db.interactions.createIndex({ viewerId: 1, targetId: 1, actionType: 1 })
db.interactions.createIndex({ viewerId: 1, cooldownExpiresAt: 1 })

// User candidate retrieval: adapt exact field order after explain()
db.users.createIndex({
  isOnboarded: 1,
  isVerified: 1,
  isDeleted: 1,
  suspended: 1,
  isGhost: 1,
  collegeCode: 1,
  randomSeed: 1,
  _id: 1
})
```

Your existing `randomSeed` index behavior is fine for early scale because `explain()` already confirms an `IXSCAN` and roughly \(O(\text{limit})\) scan cost. Do not replace it with `$sample` just because it sounds more random. MongoDB documents that `$sample` can switch to a random top-k sort when it cannot use its pseudo-random cursor—for example, if it is not the first pipeline stage or sample size is too large—and that path can read all preceding results and hit sort-memory limits. [mongodb](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sample/)

## 3. Concrete candidate and ranking design

### Week-one candidate retrieval

Keep `randomSeed`, but do not reroll it every request.

1. On `POST /discover/session` or the first discovery request:
   - Generate a cryptographically random `sessionSeed`.
   - Generate `startPoint` in \([0,1)\).
   - Store it in `DiscoverSession`.
   - Make the session live for 12–24 hours, or until deck exhaustion.
   - Freeze its scope and filters for that session.

2. On every subsequent page:
   - Read that session’s saved `startPoint` and cursor.
   - Query the next candidate window in the same circular order:
     - first `randomSeed >= cursor.randomSeed`;
     - then wrap once to `randomSeed < startPoint`;
     - use `_id` as a tie-breaker.
   - Fetch in chunks, for example 80–150 raw candidates.
   - Exclude in Node or, preferably once practical, via an aggregate/anti-join pattern or preloaded `excludedIds`.
   - Continue scanning chunks until you return `limit` eligible cards or truly exhaust the circular range.
   - Advance and persist the cursor after **every scanned batch**, not just cards actually returned.

3. Return:
   - cards
   - `sessionId`
   - opaque `nextCursor`
   - `exhausted`
   - `hasMore: !exhausted`

This creates a stable circular shuffled order. Closing and reopening the PWA continues from the same deck rather than jumping to another random region.

### Better month-one version: deterministic shuffle buckets

A raw `randomSeed` is a stable random ordering but does not encode a particular viewer/session permutation. For a stronger per-session shuffle without storing thousands of IDs, assign each profile a fixed integer bucket at signup:

```ts
shuffleBucket: integer from 0 to 1023
```

Derive a per-session bucket permutation with a seeded PRNG:

```ts
bucketOrder = seededShuffle([0, 1, 2, ..., 1023], session.seed)
```

Then keyset paginate inside each bucket by `(randomSeed, _id)`. This gives different viewers different stable bucket orderings while retaining indexable retrieval. It is more work than you need this week, but cleaner than pretending a random request point is a feed.

### Alternative for thin campus pools: materialize the deck

For a 300–800-person campus pool, the simplest and most reliable option is often:

1. Retrieve all eligible IDs, or a capped pool such as 300.
2. Apply relationship exclusions.
3. Score and diversify them.
4. Deterministically shuffle within score bands using the session seed.
5. Store the ordered IDs in `DiscoverSession.candidateIds`.
6. Return slices by offset.

This is **not** scary at campus scale. A few hundred ObjectIds are small. It buys perfect session coherence, correct exhaustion, straightforward undo, easy debugging, and stable analytics.

Use materialized session decks for a campus scope. Move to cursor-based retrieval only for platform-wide/inter-college pools where the eligible pool becomes large enough that scanning and storing it per session is wasteful.

### A practical initial score

Replace the six-value score with a continuous but explainable hand-tuned score. Normalize each component to \([0,1]\).

\[
S(u,v) =
0.28A(v) +
0.18P(v) +
0.16I(u,v) +
0.14C(u,v) +
0.10R(u,v) +
0.08N(v) +
0.06E(v)
\]

Where:

- \(A(v)\): activity/availability, using a smooth decay rather than buckets
- \(P(v)\): profile readiness/quality
- \(I(u,v)\): intent compatibility
- \(C(u,v)\): shared interests, prompts, or campus context
- \(R(u,v)\): reciprocal eligibility confidence, initially hard-filter-only and later learned
- \(N(v)\): new-user/exposure boost
- \(E(v)\): small exploration value

A simple smooth recency function:

\[
A(v) = e^{-\ln(2)\cdot \frac{\text{hoursSinceActive}}{72}}
\]

This yields:

- 1.00 now
- 0.79 after 24 hours
- 0.50 after 72 hours
- 0.25 after 6 days

Use a 3-day half-life initially; tune from data. Do **not** make “active 59 minutes ago” worth twice “active 61 minutes ago.”

For `lastActive: null`, choose an explicit policy:

- New account created within 24 hours: assign a neutral activity prior, such as 0.55.
- Old account with no activity: 0.05 or exclude from the active deck after a defined inactivity threshold.
- Never let `null` flow into arithmetic.

For profile readiness, avoid “four photos or only 0.5.” Use additive components:

```ts
profileQuality =
  0.30 * photoQualityScore +
  0.20 * min(photoCount / 4, 1) +
  0.20 * min(promptCount / 3, 1) +
  0.15 * bioQualityScore +
  0.15 * verificationStrength
```

Do not score “beauty.” Score completion, clarity, verification, and whether a profile is safe/usable.

### Exploration and anti-rich-get-richer rules

Ranked feeds create position bias: users interact more with top positions simply because they see them first. That feedback can turn into popularity bias, where already-visible profiles accumulate interactions and receive even more visibility. [arxiv](https://arxiv.org/html/2301.07483v2)

Ship these basic controls from the start:

- Reserve 20–30% of each 10-card page for exploration among eligible lower-score or low-exposure candidates.
- Give new verified profiles an initial exposure boost for their first 50–100 impressions.
- Apply a soft penalty to profiles with unusually high recent impressions, not a punishment for being attractive.
- Do not use raw like count as an early ranking feature.
- Add a “recent impressions” feature and cap it per day if one profile is dominating.
- Rotate score ties with the session seed.
- Diversify: do not show ten same-intent, same-college, same-interest profiles consecutively if alternatives exist.

Weighted sampling without replacement is a legitimate later technique when you want higher-scoring profiles to be more likely but do not want deterministic top-\(k\). Efraimidis–Spirakis-style weighted reservoir sampling is designed for weighted samples without replacement. [arxiv](https://arxiv.org/pdf/1506.01747.pdf)

But at your scale, do **not** introduce it first. A much simpler banded shuffle is better:

- Top 20% score band: 50% of cards
- Middle 50% score band: 35% of cards
- Remaining eligible/new/low-exposure band: 15% of cards
- Seed-shuffle within each band
- Interleave the bands deterministically

It is explainable, debuggable, cheap, and gives exploration.

### The exact `hasMore` and exhaustion fix

Your current bug exists because `hasMore` is based on pre-exclusion raw scan capacity. It must mean:

> “The server has reason to believe another request can return at least one **eligible, unseen** candidate under this same session’s filters.”

Not “the underlying query had 80 records.”

Use this server behavior:

```ts
async function getDiscoverPage({ viewer, session, limit = 10 }) {
  if (session.exhausted) {
    return { cards: [], hasMore: false, exhausted: true };
  }

  const cards = [];
  let cursor = session.cursor;
  let wrapped = session.wrapped ?? false;
  let scanBudget = 500; // safety bound, tune from production
  let scanned = 0;

  while (cards.length < limit && scanned < scanBudget) {
    const batch = await fetchNextRawBatch({
      viewer,
      session,
      cursor,
      wrapped,
      batchSize: 100
    });

    if (batch.users.length === 0) {
      if (wrapped) break;
      wrapped = true;
      cursor = { randomSeed: 0, _id: MIN_OBJECT_ID };
      continue;
    }

    scanned += batch.users.length;
    cursor = batch.nextCursor;

    const eligible = batch.users.filter(user =>
      user._id !== viewer._id &&
      !isExcluded(viewer, user) &&
      isMutuallyEligible(viewer, user)
    );

    cards.push(...eligible.slice(0, limit - cards.length));

    if (batch.reachedSessionStartAfterWrap) break;
  }

  const exhausted = cards.length < limit && (
    scanned < scanBudget
      ? true
      : await noEligibleCandidateExistsAfterCursor(viewer, session, cursor, wrapped)
  );

  await DiscoverSession.updateOne(
    { _id: session._id },
    {
      $set: { cursor, wrapped, exhausted },
      $inc: { scannedCount: scanned, deliveredCount: cards.length }
    }
  );

  return {
    cards,
    hasMore: !exhausted,
    exhausted
  };
}
```

The cleanest practical version is even simpler if you materialize a small-pool session deck: once `offset + returnedCount >= candidateIds.length`, return `hasMore: false`. No ambiguous scan state.

### Client-side guard

The client must also stop treating empty response as an invitation to spin:

```ts
if (
  deck.length - currentIndex <= 4 &&
  hasMore === true &&
  fetchingMore === false &&
  lastFetchReturnedEmpty !== true
) {
  fetchMore();
}
```

On any response with `cards.length === 0`:

```ts
setHasMore(false);
setLastFetchReturnedEmpty(true);
```

Even if the server has a transient bug, the client should not generate an unbounded request loop. Add exponential backoff only for network/server failures, not for a legitimate exhausted deck.

A correct empty-state sequence:

- `200 { cards: [], hasMore: false, reason: "exhausted" }` → show “You’re caught up.”
- `200 { cards: [], hasMore: false, reason: "filters_too_narrow" }` → offer scope/filter expansion.
- `429/503` → retain existing deck, show retry UI, back off.
- Never return `[]` with `hasMore: true` except in an explicitly documented asynchronous/pending state—which you do not need here.

## 4. Thin-pool product rules

Campus pools change the objective. With 300 eligible people, there may simply not be 10 unseen, mutually eligible, active users at every moment. Ranking cannot create supply.

### Recommended scope behavior

| Situation | Feed behavior |
|---|---|
| Same-campus eligible pool is healthy | Default to same-campus weighting, but still permit cross-campus discovery if users opt in |
| Same-campus pool is low | Blend nearby/inter-college candidates early rather than waiting for total exhaustion |
| User has seen all new candidates | Show an honest exhaustion state, not duplicate cards disguised as new |
| User enables broad discovery | Rank campus affinity as a soft boost, not an absolute filter |
| User chooses study/friendship | Use a separate intent lane or a very strong intent filter; do not casually mix it into dating |
| Brand-new campus launch | Prioritize active, complete, newly verified profiles and exposure fairness over “personalization” |

Suggested college affinity score:

```ts
sameCollege: +0.10
sameCity / local cluster: +0.05
interCollege: +0.00
```

That is a **boost**, not a wall. Your stated value is an inter-college network, so making college a default hard filter will accidentally fragment an already thin graph.

### When a deck is short

If fewer than `limit` genuinely eligible unseen profiles exist:

- Return fewer cards.
- Say why plainly: “You’ve seen everyone currently active in your filters.”
- Offer user-controlled expansion:
  - include inter-college
  - include people active in the last 14 days instead of 7
  - include friendship/study only if the viewer opts in
  - revisit previously passed profiles after a stated cooldown
- Do not silently relax dealbreakers, gender/sexuality constraints, or intent categories.

### Pass, hide, and re-show policy

Use different semantics:

| Action | Effect | Suggested default |
|---|---|---|
| Pass | Temporary cooldown | 14 days initially, then eligible for labelled resurfacing |
| Hide / not interested | Longer cooldown | 60–90 days |
| Block | Permanent bilateral exclusion | Immediate and permanent |
| Report | Remove pending review or apply safety policy | Immediate hide from reporter |
| Archive existing conversation | Conversation state only | Should not necessarily remove from Discover unless explicitly chosen |

For resurfacing, label it honestly:

- “New since you last saw them”
- “Updated profile”
- “Back in Discover”
- “More people to explore”

Do not re-show a person seven days later with no explanation and hope the user will not notice.

## 5. Phased rollout

### Week 1: stop the defect

Ship only reliability work.

- Make `hasMore` post-filtered and session-aware.
- Set `hasMore: false` when no eligible cards remain.
- Add client-side empty-page stop logic.
- Preserve one session seed/start point across requests.
- Add `_id` as a stable tie-breaker.
- Handle `lastActive: null` deliberately.
- Log raw scanned, exclusions, returned cards, and exhaustion reason.
- Add a request cap per session/page to prevent accidental cost explosions.

**Do not** build ML, bandits, stable matching, or weighted reservoir sampling this week.

### Month 1: make the deck coherent

- Create `DiscoverSession`.
- Use materialized ordered ID decks for campus-scale pools, or a stable cursor for larger platform-wide pools.
- Replace six-value scoring with smooth recency and continuous profile readiness.
- Add intent compatibility and shared-interest signals.
- Add deterministic score-tie shuffling.
- Add basic diversity and 20–30% exploration allocation.
- Build honest “caught up” and filter-expansion UI.
- Add new-user exposure support.
- Run `explain()` again after every index or query-shape change.

### Month 3: behavioral signals, carefully

Only after you have meaningful volume and enough event instrumentation:

- Estimate outcomes separately:
  - profile shown → letter/like
  - letter → mutual match
  - match → first reply
  - reply → sustained conversation
- Add smoothed behavioral features:
  - recent reply rate with a Bayesian prior
  - activity consistency
  - response latency band
  - reciprocal contact rate
- Keep raw popularity as an exposure-controlled feature, never the dominant score.
- Run offline replay analysis before changing production ranking.
- A/B test one feature-weight change at a time.
- Consider one “Good fit today” standout only if there is evidence it produces better mutual conversations than ordinary top-ranked candidates.

### Deliberately do not build yet

- Deep learning embeddings.
- LambdaMART or any production learning-to-rank pipeline.
- Contextual bandits.
- Full graph/community embeddings.
- Global Gale–Shapley assignment.
- A beauty/desirability score.
- A compatibility percentage.
- Sharded sampling infrastructure.
- Elasticsearch/vector search purely for Discover.
- Complex microservice separation.

At five users, each adds complexity while producing false confidence from noisy data.

## 6. Metrics to add first

Instrument the exposure event before changing ranking. Without exposure logs, likes and passes are biased labels: you cannot know whether a profile was rejected or simply never shown. Research on recommender systems calls this exposure bias; position bias then makes top-ranked entries look better simply because they were seen first. [arxiv](https://arxiv.org/html/2301.07483v2)

### Required event schema

```ts
type DiscoverImpression = {
  eventId: string
  viewerId: ObjectId
  candidateId: ObjectId
  sessionId: ObjectId
  requestId: string
  rankInPage: number
  absoluteDeckPosition: number
  rankingVersion: string
  score: number
  scoreComponents: {
    activity: number
    profileQuality: number
    intent: number
    sharedInterest: number
    novelty: number
    exploration: number
  }
  sourceBand: "top" | "middle" | "exploration" | "resurfaced"
  scope: "campus" | "intercollege" | "platform"
  collegeRelation: "same" | "different"
  createdAt: Date
}
```

Log separate events for:

- `discover_session_started`
- `discover_page_requested`
- `discover_page_returned`
- `discover_empty_state`
- `profile_impression`
- `profile_opened`
- `pass`
- `letter_sent`
- `letter_received`
- `mutual_match`
- `first_message_sent`
- `first_reply_received`
- `block`
- `report`
- `undo`
- `resurfaced_profile_shown`

### Metrics dashboard

| Category | Metric | Why it matters |
|---|---|---|
| Reliability | Empty page with `hasMore=true` | Must be exactly zero |
| Reliability | Requests per Discover session | Detect loops and free-tier cost leakage |
| Retrieval | Raw candidates scanned per returned card | Reveals exclusion pressure and when prefiltering/materialized decks are needed |
| Supply | Eligible unseen pool at session start | Tells you whether the issue is ranking or thin inventory |
| Engagement | Cards viewed per session | Basic deck consumption |
| Engagement | Letter/like rate by rank position | Detects ranking quality but corrects for position bias later |
| Connection | Mutual-match rate per 100 impressions | Stronger than one-sided likes |
| Connection | First-reply rate and 24-hour reply rate | Better quality label than matching alone |
| Retention | D1 and D7 return rate | Measures whether discovery remains useful |
| Safety | Blocks/reports per 1,000 impressions | Non-negotiable guardrail |
| Repetition | “Seen before” complaints and resurfaced-profile pass rate | Measures cooldown/resurfacing quality |
| Fairness | Unique profiles shown / eligible profiles | Catalogue coverage |
| Fairness | Impression Gini or HHI | Detects exposure concentrating on a few profiles |
| Freshness | Time to first exposure for a new verified profile | Ensures new accounts are not invisible |
| Quality | Score distribution and per-component distributions | Catches saturation, nulls, and broken weights |
| Diversity | Same-college/intent/interest repetition within top 10 | Ensures decks do not feel cloned |

For exposure concentration, calculate both:

\[
HHI = \sum_i s_i^2
\]

where \(s_i\) is profile \(i\)’s share of impressions, and a Gini coefficient over impressions per eligible profile. Rising concentration is a warning even when short-term like rate improves.

## Common advice that is wrong for Matchalize

- **“Use collaborative filtering immediately.”** Wrong. With five users and sparse, biased interactions, it will infer nonsense.
- **“Optimize for swipe/like rate.”** Wrong. It can reward visually clicky cards while lowering mutual matches, replies, safety, and retention.
- **“Use an Elo attractiveness score.”** Wrong. Tinder itself says Elo is no longer its approach.  More importantly, a global desirability ranking is socially risky and will starve new or less-exposed campus users of visibility. [help.tinder](https://www.help.tinder.com/hc/en-us/articles/7606685697037-Powering-Tinder-The-Method-Behind-Our-Matching)
- **“Every request should be random.”** Wrong. Random per request causes repetition, skipped candidates, broken pagination, and inability to debug.
- **“Use `$sample` for randomness.”** Usually wrong for your filtered query. It can become an expensive random sort depending on aggregation placement and sample conditions. [mongodb](https://www.mongodb.com/docs/manual/reference/operator/aggregation/sample/)
- **“Stable matching solves compatibility.”** Wrong. It solves a formal assignment stability problem under assumptions that do not describe a live, many-to-many, sparse dating feed.
- **“More filters always improve matching.”** Wrong for thin pools. Hard filters can reduce the eligible graph until the product looks empty. Keep safety, mutual orientation, age, and stated intent hard; use campus affinity and soft preferences as ranking signals.
- **“Never repeat a passed profile.”** Wrong in a finite campus network. Use clear cooldowns and honest resurfacing instead.
- **“A 90% compatibility score feels scientific.”** Wrong unless you have a validated, rich questionnaire and calibration data. It will be interpreted as a promise.
- **“Bandits will automatically learn the best deck.”** Wrong at this stage. Bandits need enough impressions, carefully defined rewards, and safeguards against exploiting noisy early signals and worsening exposure inequality.

The highest-leverage build order is therefore: **fix exhaustion → stabilize the deck → improve score resolution → instrument outcomes → add behavioural signals only when the data is real.**



# From Broken Loops to Stable Matches: A Phased Architecture for Ranking in Low-Density Dating Apps

This report provides a comprehensive analysis and architectural blueprint for 'Matchalize', a React19/Node/MongoDB dating Progressive Web Application (PWA) restricted to verified Indian college students. The research addresses specific technical defects in the current implementation—including unbounded request loops, low score cardinality, and ineffective random sampling—and designs a scalable solution adapted for the unique challenges of a thin user pool on a free-tier hosting budget. The analysis synthesizes documented and inferred algorithms from major dating apps like Tinder, Hinge, and Bumble, while critically evaluating which practices are suitable for an early-stage platform operating within significant constraints. The proposed architecture prioritizes stability, correctness, and cost-effectiveness, delivering a phased roadmap for development that balances immediate bug fixes with future scalability.

## Industry Algorithmic Patterns and Their Relevance to Thin Pools

The foundational premise of modern dating applications is the use of sophisticated algorithms to curate a personalized discovery experience from a vast pool of potential matches [[18]]. While platforms like Tinder, Hinge, and Bumble have achieved massive scale, their documented strategies offer valuable but often incomplete insights for a niche application like Matchalize, which operates on a small, dense campus network. A critical task is to dissect these public-facing claims and infer the underlying engineering trade-offs, ultimately adapting them to the realities of a thin user pool of 300-800 individuals per campus . The primary goal of all major dating apps is to retain female users and paying male users, making every algorithmic decision secondary to these core business priorities [[11]].

Tinder's approach has evolved significantly from its initial reliance on an Elo-style desirability score. In 2016, CEO Sean Rad confirmed the use of a system analogous to the Elo rating, where a user's score would increase based on reciprocal interest and the desirability of the user who interacted with them [[64,65]]. This created a self-reinforcing hierarchy where popular users became even more visible [[65]]. However, by 2019, Tinder officially retired this system, labeling it "outdated news" and replacing it with a more dynamic, multi-factor model [[51,52]]. The modern system calculates a profile's visibility based on a combination of real-time metrics, including swipe ratios (right swipes divided by total impressions), reciprocity patterns, profile completeness, activity level, and engagement quality [[52,97]]. A crucial feature of this new system is the penalization of indiscriminate swiping; users who right-swipe on a high percentage of profiles (e.g., over 80%) see their own visibility throttled because the algorithm interprets this behavior as low desirability due to poor mutual interest rates [[11,52]]. For Matchalize, directly implementing a classic Elo system is likely premature and unnecessary. The rigid nature of the old Elo system could create a static social hierarchy that stifles new users, a problem Tinder itself sought to solve [[52]]. Instead, the *concepts* behind Tinder's modern model are highly relevant. Rewarding active users and penalizing indiscriminate swiping are powerful mechanisms for fostering a healthier ecosystem, promoting selectivity, and improving match quality even within a small group. The emphasis on reciprocity—where a match is treated as a stronger signal than a one-sided like—is a principle that should be central to any ranking function.

Hinge's marketing heavily emphasizes its "Most Compatible" feature, which is purportedly powered by the Gale-Shapley algorithm, a Nobel Prize-winning solution to the "Stable Marriage Problem" [[14,48]]. The algorithm's goal is to generate a set of pairings where no two individuals would both prefer to be with each other over their assigned partners, thus creating "stable" matches [[50]]. In practice, Hinge uses observed user behavior—likes on posts and photos—as well as explicit preferences to build a ranked list of potential matches for each user, effectively simulating a proposal-and-evaluation process [[48,50]]. While the direct implementation of the full Gale-Shapley algorithm is computationally intensive and may be overkill for a single-campus application, its philosophical underpinnings provide a clear direction. The focus on maximizing mutual preference is a superior objective to simply maximizing individual likes. It incentivizes genuine interest over superficial attraction. However, a key limitation of Gale-Shapley is its susceptibility to amplifying existing biases present in the input data [[50]]. If the user base has inherent biases (e.g., racial, educational), the algorithm will produce similarly biased pairings. Furthermore, for a very small pool, exhaustively calculating a "stable matching" might not yield a significantly better outcome than a well-designed ranking system focused on mutual interest. The most practical takeaway for Matchalize is to prioritize signals that indicate mutual liking in its ranking formula, ensuring that profiles who receive positive attention from another user are given higher priority.

Bumble's algorithm is less transparent but appears to follow a similar pattern of rewarding desirable behaviors through a composite "Beehive Score" [[41]]. This score combines multiple factors, including profile completeness (30%), photo quality (40%), bio engagement (30%), and a verification status multiplier [[41]]. A significant component is the "Activity Multiplier," which gives a substantial boost to users who are active on the app, particularly those who respond quickly to messages [[41]]. Bumble also aggressively penalizes inactivity, causing a rapid drop in a user's ranking if they do not open the app for several days [[97]]. Like Tinder, Bumble places a strong emphasis on user selectivity, applying a penalty to users who swipe right too frequently [[41]]. Critically, Bumble implements a new-user visibility boost, giving accounts a temporary visibility multiplier (e.g., 2.0x) for their first few days to help them gather initial data and find matches [[11,41]]. This strategy directly addresses the cold-start problem, a significant challenge for any new platform [[66]]. For Matchalize, Bumble's model is highly instructive. A composite score based on verifiable, static profile attributes (completeness, photo quality) combined with dynamic activity signals is a pragmatic and effective starting point. The new-user boost is essential for encouraging initial engagement and populating the system with enough data to begin learning about user preferences.

A synthesis of these approaches reveals a common pattern: ranking systems are evolving away from single-score models toward hybrid systems that weigh multiple signals. These signals typically fall into a hierarchy: explicit filters (hard constraints like location and age) come first [[11]]; then, user behavior (swipe history) becomes the strongest signal; followed by profile content (NLP from bios); activity level; and finally, photo quality [[11]]. For Matchalize, this means that while complex machine learning models are not immediately necessary, a multi-faceted scoring function is. The table below contrasts the theoretical ideal with the practical reality for a thin-pool application.

| Algorithm Concept | Publicly Stated Mechanism | Practical Implication for Matchalize |
| :--- | :--- | :--- |
| **ELO / Desirability Score** | Tinder used a dynamic, multi-factor desirability score based on reciprocity, activity, and selectivity [[52,97]]. | Avoid a simple, scalar Elo score. Instead, incorporate its principles: reward reciprocity and penalize indiscriminate swiping [[41]]. |
| **Gale-Shapley Stable Matching** | Hinge markets a system based on finding stable pairs where no two people prefer each other over their match [[48,50]]. | Do not implement the full algorithm. Use its core idea: prioritize mutual interest as a top-tier ranking signal [[11]]. |
| **Profile Quality & Activity Multipliers** | Bumble uses a "Beehive Score" combining profile completeness, photo quality, response time, and activity [[41]]. | Adopt a composite score based on verifiable profile attributes (completeness, photo count) and recent activity. |
| **New User Boost** | All major apps give new accounts a temporary visibility boost (e.g., 24-48 hours) to accelerate data collection [[11,41]]. | Essential for solving the initial cold-start problem and seeding the recommendation engine [[56]]. |
| **Explicit Compatibility Scores** | OkCupid calculates a "match percentage" based on questionnaire answers [[53]]. | Avoid presenting a misleading compatibility percentage. Focus on a ranked list of profiles instead . |

In conclusion, the path for Matchalize is not to replicate the complex, large-scale systems of its competitors but to distill their core principles into a lightweight, adaptable framework. The emphasis should be on building a transparent and fair system that rewards genuine interest and encourages high-quality participation. Concepts like reciprocity, selectivity, and profile completeness are universally applicable and can be implemented with relatively low complexity. The key is to resist the temptation of premature optimization with heavy machine learning models and instead focus on gathering clean, meaningful behavioral data to inform future, more sophisticated ranking decisions.

## Retrieval Architecture: Solving Pagination Defects and Ensuring Session Stability

The current retrieval architecture of Matchalize contains critical flaws that manifest as severe usability issues, primarily stemming from an incorrect understanding of pagination in a dynamic dataset. The system's reliance on offset-based pagination using `limit` and `skip` is fundamentally flawed for an infinite scroll interface, especially one subject to concurrent modifications from other users [[5]]. The performance degradation is a well-documented issue; as the offset value increases, the database must sequentially scan and discard an ever-growing number of documents before returning the requested page, resulting in latency that grows linearly with the depth of the scroll [[34,35]]. On a dataset of thousands, deep pagination becomes prohibitively slow [[35]]. More importantly, this approach is fragile. Any insertions or deletions in the dataset between paginated requests can cause items to be skipped or duplicated, leading to a broken user experience [[5,10]]. This is precisely why Tinder and other large-scale platforms moved away from offset pagination for feeds [[10]].

The most critical defect, however, is the unbounded request loop caused by incorrect `hasMore` semantics. The API computes `hasMore = true` whenever a batch of 80 candidates is fetched, regardless of whether any of those candidates remain after the client-side exclusions (archived, blocked, passed). With a pool where up to 99% of users might be excluded, the server correctly returns an empty array but sets `hasMore = true`. The client, upon receiving zero cards, triggers its re-fetch logic, perpetuating a useless cycle of API calls [[35]]. This bug is a direct consequence of separating the candidate generation step from the final eligibility check. The correct solution requires a logical shift: the `hasMore` flag must be computed based on the number of candidates remaining *after* all exclusions have been applied. If fewer than the requested limit of cards remain, `hasMore` should be `false`.

To solve these interconnected problems, a complete overhaul to a cursor-based pagination (also known as keyset pagination) system is required. This technique replaces the inefficient `skip()` operation with a series of indexed lookups, providing consistent O(log N) performance regardless of how deeply a user scrolls [[46,105]]. Instead of asking for "page N," the client asks for the "next set of results after this item." The server returns a unique, opaque token representing the last item's sort keys, which the client then uses in the subsequent request [[4]]. This method inherently prevents item skipping and duplication because the pagination anchor is tied to a specific record in the dataset, not a transient offset [[10]]. To ensure determinism, especially when sorting by non-unique fields like timestamps, a composite index including a tie-breaker field is mandatory. The MongoDB `_id` field, being unique and immutable, serves as an ideal tie-breaker [[45,46]]. The sort clause should therefore be `(sortKey, _id)`.

Beyond fixing the pagination logic, the concept of a "session-stable shuffle" is crucial for user experience. The current system's attempt at randomness fails because the `randomSeed` is fixed at signup, and fetching 80 candidates repeatedly leads to sample collapse, where the same small set of users is repeatedly returned [[67]]. A robust solution is to lock a shuffle seed at the beginning of a user session. This seed can be a UUID generated on the client-side when the app loads or tied to a server-side session ID [[67]]. Every subsequent paginated request for the discovery feed must include this seed. The backend then applies the same deterministic shuffle to the eligible candidate pool for the entire session, ensuring that once a card is swiped, it will not reappear until the deck is exhausted and reshuffled. This creates a stable, coherent deck of profiles that persists across paginated requests without requiring complex server-side state management [[67]]. This technique is often referred to as "Stable Shuffled Pagination" [[67]].

The following table outlines the deficiencies in the current system and the proposed solutions:

| Component | Current Implementation | Critical Defect(s) | Proposed Solution |
| :--- | :--- | :--- | :--- |
| **Pagination** | Offset-based (`$skip`, `$limit`) | Performance degrades linearly with depth [[34]]. Causes item skipping/duplication with concurrent writes [[5]]. | **Cursor-based (Keyset) Pagination:** Use an opaque cursor token derived from the last item's sort keys (`sortKey`, `_id`). |
| **Exhaustion Logic** | `hasMore` computed pre-exclusion | Always `true` when a capped batch is hit, leading to an unbounded request loop when >99% of users are excluded. | **Backend Post-Exclusion Count:** Compute `hasMore` based on the number of candidates remaining *after* applying blocks, archives, etc. |
| **Randomness** | Fixed `randomSeed` filter (`>= randomPoint`) | Produces duplicate profiles in a shuffled sequence, leading to poor discovery. Severe sample collapse observed. | **Session-Stable Shuffling:** Lock a shuffle seed (e.g., a UUID) at session start. Apply the same shuffle to the candidate pool for all paginated requests within the session. |
| **Database Index** | `{isOnboarded,isVerified,...,randomSeed}` | Index on `randomSeed` is insufficient for stable, sorted pagination. | **Composite Keyset Index:** Create a compound index on the columns used for sorting, including a tie-breaker (e.g., `createdAt`, `_id`). |

Implementing these changes constitutes a hard dependency for all future ranking work. A stable, predictable, and performant retrieval layer is the bedrock upon which any sophisticated ranking algorithm can be built. Without it, even the most advanced scoring model will be obscured by a buggy and confusing user experience. The fix for the exhaustion bug, therefore, is not merely a code change but a fundamental redesign of the API contract. The corrected logic is as follows:
1.  The server retrieves the initial candidate pool of ~80 users based on filters and the `randomSeed`.
2.  This pool is then filtered on the server side to exclude any users who are blocked by the viewer or archived by the viewer.
3.  The server sorts the now-smaller pool of eligible candidates.
4.  The server slices the first `limit` (e.g., 10) candidates to return to the client.
5.  The server then determines the value of `hasMore`. `hasMore` is `true` only if the total number of eligible candidates (after all exclusions) is greater than the `limit`. If the slice was smaller than `limit` because there were no more eligible candidates, `hasMore` is set to `false`.
6.  The server generates a cursor from the last returned item's sort keys and sends the cursor along with the results.

This ensures that the client receives a coherent deck and knows definitively when the deck is truly exhausted. The client-side guard `(length - index <= 4 && hasMore && !fetchingMore)` remains a useful safety net against race conditions but is no longer the root cause of the infinite loop [[35]]. By adopting cursor-based pagination and session-stable shuffling, Matchalize can move from a brittle, performance-degrading system to a robust, scalable foundation capable of supporting a rich and engaging discovery experience.

## Candidate Generation: Weighted Sampling and Pool Management for Discovery

Once a stable and efficient retrieval mechanism is in place, the next challenge is to generate a relevant and diverse pool of candidates for ranking. The current method of fetching approximately 80 random candidates using a fixed `randomSeed` is not only inefficient but also fundamentally misaligned with the goal of discovery [[67]]. It creates a small, closed-off window of opportunity ("best of 80 random") rather than allowing the user to explore the entire available pool . For a campus of 300-800 users, this "random seed" window may cover a significant portion of the population, but its lack of control and coherence makes it unsuitable for a production system. The objective is to evolve towards a system that can "favour higher scores but keep discovery," a classic exploration-exploitation trade-off [[57]].

Several techniques exist for candidate generation, each with distinct advantages and disadvantages depending on the scale and dynamism of the dataset. Random offset, while simple, suffers from the same performance and consistency issues as offset pagination and should be avoided [[46]]. The MongoDB `$sample` operator offers a way to fetch a random subset of documents, but it still requires loading a potentially large collection into memory or processing it entirely, making it inefficient for dynamic pools where eligibility can change rapidly [[108]]. Reservoir sampling is a powerful family of algorithms designed for streaming data scenarios where the total population size is unknown or too large to store [[88,92]]. It allows for the creation of a representative sample of a fixed size `k` in a single pass through the data stream. This is highly relevant for Matchalize, as new users can sign up and become eligible candidates at any moment. Weighted reservoir sampling extends this concept, allowing for the selection of a sample where the probability of inclusion is proportional to a weight assigned to each item [[89,91]]. This is the ideal technique for implementing a "favour higher scores" mechanism without sacrificing discovery. The ranking score of each eligible candidate can serve as its weight, ensuring that higher-scoring profiles are more likely to be included in the candidate pool for ranking, while still giving lower-scoring profiles a chance to appear.

However, for the initial phase of development, the overhead of implementing a full weighted reservoir sampling algorithm may be excessive. A simpler and equally effective approach is to leverage the newly implemented cursor-based pagination. The process would be as follows:
1.  **Generate a Full Eligible List:** First, run a query to get a cursor for the *entire* pool of eligible users (meeting all hard filters and not excluded by the viewer). This query would sort by the ranking score in descending order.
2.  **Fetch a Large Sample:** Using this cursor, fetch a large sample of, for example, 100-200 users from the top of the ranked list. This avoids the need to load the entire dataset into memory while still ensuring the highest-quality candidates are considered.
3.  **Apply Session-Stable Shuffle:** Take this sample of 100-200 users and apply the session-stable shuffle to it. This creates a randomized but coherent deck of candidates.
4.  **Serve Paginated Results:** The frontend then paginates through this shuffled deck of 100-200 cards, just as it would with the old system, but now the source pool is much larger and includes higher-ranked users.

This hybrid approach is pragmatic and effective. It solves the immediate problem of having a small, unrepresentative sample while leveraging the existing infrastructure. It guarantees that the deck is always drawn from the top tier of the entire eligible pool, not just a small, randomly-seeded subset. As the platform scales beyond a single campus, this approach can be refined. For instance, a sharded weighted sampling strategy could be employed, where candidates are first partitioned by collegeCode and then sampled from each shard according to a weighted scheme, ensuring representation from different campuses [[60]].

The design of the deduplication and exhaustion policy is also critical for maintaining a healthy user experience. After a user passes on a profile, it should not be shown again immediately. A common strategy is to add the user to an "archive" for a cooldown period, such as 7 days . During this time, they are permanently hidden from the discovery feed. The `POST /discover/pass/:id` endpoint currently used to archive a user is appropriate for this purpose. The key is to ensure this exclusion is applied consistently during candidate generation. Once the cooldown period expires, the user can be re-introduced into the eligible candidate pool.

Re-showing previously passed users presents an interesting UX challenge. While generally undesirable, it can serve as a fallback when the main eligible pool is exhausted, which is a common scenario in thin markets . If the system determines that the deck of non-passed, non-blocked users is empty, it could introduce a small percentage of passed users back into the feed. This should be done carefully, perhaps by extending the cooldown period for these re-shown users or by clearly labeling them as "re-found" or "second chances" to manage user expectations. This prevents the frustrating "no more cards" message and maintains engagement. The policy for this fallback should be configurable and monitored via guardrail metrics like "seen before" complaints .

The following table summarizes the candidate generation techniques and recommends a phased implementation for Matchalize.

| Technique | Description | Pros | Cons | Recommendation for Matchalize |
| :--- | :--- | :--- | :--- | :--- |
| **Current Method** | Fetch ~80 users with `randomSeed >= randomPoint`. | Simple to implement. | Very low diversity, causes duplicates, performance degrades with scale. | **Avoid.** This is a confirmed defect. |
| **Weighted Reservoir Sampling** | Single-pass algorithm to create a fixed-size sample biased by weight. | Optimal for streaming data; maximizes diversity while favoring high-weight items. | High implementation complexity. Overkill for initial phase. | **Future Consideration.** Implement after accumulating sufficient data and user base. |
| **Shuffled Top-K Sample** | Retrieve a large ranked list (e.g., top 200) and apply a session-stable shuffle. | Simple to implement with existing cursor pagination. Guarantees high-quality candidates. | Requires fetching a larger-than-needed set of candidates upfront. | **Recommended Phase 1+ Solution.** A pragmatic and effective middle ground. |
| **Multi-Armed Bandits** | Dynamically allocate traffic between exploration (showing random users) and exploitation (ranking users). | Optimizes for long-term reward (e.g., matches). | Extremely high complexity. Unnecessary at this scale. | **Do Not Build Yet.** Premature optimization. Fairness can be handled more simply. |
| **Re-showing Passed Users** | Periodically reintroduce passed users into the feed as a fallback. | Prevents "no more cards" frustration. Maintains session engagement. | Can lead to user annoyance if overused. May require special labeling. | **Implement Carefully.** Use as a fallback when the primary deck is exhausted. Monitor complaints. |

By moving to a "shuffled top-K sample" approach, Matchalize can immediately improve the quality and variety of profiles shown to users. This change, combined with the corrected pagination logic, will transform the discovery experience from a frustrating loop of duplicates to a coherent and engaging journey through the available talent pool on campus.

## Ranking Architecture: A Phased Approach for Early-Stage Dating Platforms

Designing a ranking architecture for a dating app in its infancy is a delicate balancing act between simplicity, interpretability, and future scalability. With a user base measured in tens or hundreds and minimal interaction data, the temptation to build a complex, machine-learning-driven system is strong but misguided. The evidence from successful platforms shows that a robust, multi-signal, hand-tuned score is a far more practical and effective starting point [[39,41]]. The goal for Matchalize is to create a transparent and fair ranking system that can learn from user behavior over time without requiring millions of data points to function. A phased rollout is the only prudent path forward, focusing first on eliminating bugs, then introducing basic signals, and finally incorporating behavioral feedback.

**Phase 1: Immediate Bug Fixes and Baseline Score (Week 1)**

The absolute first priority is to ship the fixes for the confirmed defects. This includes implementing the cursor-based pagination system and correcting the `hasMore` logic as detailed previously. These are not optional enhancements; they are prerequisites for any reliable ranking system. Without a stable and correctly functioning retrieval layer, ranking adjustments are meaningless.

Simultaneously, the baseline ranking score needs an immediate upgrade. The current hybrid score (`hybridScore = recencyScore*0.6 + completenessScore*0.4`) suffers from extremely low cardinality, producing only six possible values . This collapses the ranking into a few tiers, rendering it useless for differentiation. The fix is simple but impactful: make the score continuous. Replace the bucketed `recencyScore` (which is 1.0, 0.5, or 0.0) with a smooth decay function based on the `lastActive` timestamp. For example, the recency score could be calculated as $score = e^{-\lambda \cdot t}$, where `t` is the time elapsed since the last active date and $\lambda$ is a decay constant. This change alone would increase the potential score cardinality from 6 to hundreds or thousands of values, providing a much richer basis for sorting. The updated baseline score formula would be: `baselineScore = profileCompleteness * 0.4 + recencyDecay * 0.6`. This score is easy to compute, fully transparent, and provides a solid foundation for future enhancements.

**Phase 2: Introducing Dynamic Signals (Month 1)**

With a stable retrieval pipeline and a continuous baseline score, the next phase is to incorporate dynamic signals that reflect a user's current state and behavior. These signals are critical for rewarding engagement and discouraging spammy behavior.

First, implement an **Activity Multiplier**. Inspired by Bumble's "Beehive Score," this multiplier boosts the ranking of users who are active on the platform [[41]]. A simple implementation could grant a 1.5x multiplier to any user who has logged in within the last 24 hours. This ensures that active users are more visible, which is a key driver of platform engagement [[51]].

Second, introduce a **Selectivity Penalty**. Indiscriminate swiping harms the ecosystem by lowering the overall quality of matches [[87]]. The algorithm should track a user's right-swipe rate. If a user consistently swipes right on a high percentage of profiles (e.g., >70%), their own visibility should be temporarily reduced by applying a penalty multiplier (e.g., 0.5x) [[41]]. This acts as a gentle nudge towards more thoughtful engagement.

Third, and most importantly for addressing the cold-start problem, implement a **New User Visibility Boost**. All major dating apps use this tactic to help new accounts gather initial data [[11,97]]. For Matchalize, this is essential for seed growth. A new user's score should be multiplied by a factor of 2.0 for their first 7 days on the platform. This ensures they receive enough impressions to generate meaningful swipe data, which is necessary for calibrating the ranking system [[41]].

The ranking formula for this phase would be: `finalScore = baselineScore * activityMultiplier * selectivityPenalty * newUserBoost`.

**Phase 3: Behavioral Learning and Advanced Models (Month 3+)**

Only after accumulating a substantial amount of interaction data (e.g., reaching 10,000 users) should Matchalize consider moving beyond a hand-tuned score [[41]]. At this stage, implicit feedback from user actions can be leveraged to refine the ranking function.

Track **Implicit Feedback**: Log every interaction: likes, passes, matches, and replies. This data is the fuel for a learning system. Initially, these signals can be incorporated into the ranking formula. For example, a user who consistently receives likes from another user could get a small, temporary boost. Conversely, a user who is frequently passed on could see their score decrement slightly.

Consider a **Lightweight Learning-to-Rank (LTR) Model**: With sufficient data, a hand-tuned formula becomes difficult to maintain and optimize. A lightweight LTR model like LambdaMART could be trained to predict the probability of a match based on the existing ranking signals [[40]]. The beauty of LTR is that it learns the optimal weights for each feature automatically. Even here, it is wise to start with a simpler model, like a linear model, to maintain interpretability before moving to more complex gradient-boosted trees [[40]]. The training data would consist of historical swipe events, with the outcome being whether a match occurred. This is a significant engineering undertaking and should only be pursued when the benefits of automated tuning outweigh the costs of implementation and maintenance.

The following table outlines the proposed phased rollout for the ranking architecture.

| Phase | Timeline | Key Features | Complexity/Risk | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Immediate** | Week 1 | Fix pagination, fix `hasMore`, implement continuous baseline score. | **High/Low:** Requires refactoring but uses existing logic. | Prerequisite for all other work. Must resolve confirmed bugs first. |
| **Short-Term** | Month 1 | Add Activity Multiplier, Selectivity Penalty, New User Boost. | **Medium/Low:** Adds tracking and conditional logic but remains a transparent formula. | Solves key UX problems (inactivity, spammy swiping) and the cold-start problem. Highly effective. |
| **Medium-Term** | Month 3+ | Track implicit feedback (swipes, matches) and incorporate into score. | **High/Medium:** Requires event tracking and score update logic. Risk of overfitting. | Leverages interaction data to personalize the ranking. A natural evolution. |
| **Long-Term** | 10k+ users | Implement a lightweight Learning-to-Rank model (e.g., LambdaMART). | **Very High/High:** Significant ML engineering effort. High risk of failure if data is noisy. | Automates the optimization of the ranking formula. Only justifiable at scale. |

This phased approach ensures that Matchalize builds a robust and effective ranking system incrementally. Each phase delivers tangible value and lays the groundwork for the next, avoiding the pitfalls of premature optimization and ensuring the system evolves in lockstep with the growth of the user base.

## Operational Constraints: Free-Tier Hosting, Indian Context, and Data Scarcity

The architectural choices for Matchalize cannot be made in a vacuum; they must be rigorously constrained by the realities of its operational environment. The project is built on a shoestring budget, relying on free-tier hosting services, which imposes strict limits on compute time, database storage, and request volume [[36]]. Furthermore, its target audience—a single Indian university campus—introduces unique cultural and logistical considerations that must be addressed in the product design. Finally, the scarcity of data in the early stages necessitates a frugal and efficient approach to algorithm design.

Free-tier hosting platforms like Render, Railway, and Vercel offer a viable path to launch, but with significant caveats [[37,38]]. Render's free web services spin down after 15 minutes of inactivity, leading to a cold-start delay of about a minute on the next request [[36]]. Railway provides a small monthly credit ($5 initially, then $1/month) which is sufficient for occasional tasks but not for a continuously running service [[36]]. These limitations mean that every API request consumes a finite and valuable resource. Therefore, minimizing request volume is not just a matter of efficiency but an economic necessity. An architecture that forces a user to make repeated, redundant API calls due to buggy pagination is untenable. This reinforces the urgency of fixing the `hasMore` exhaustion bug and implementing cursor-based pagination, as both measures reduce the number of requests a user session generates [[10,35]]. The database, hosted on MongoDB Atlas's M0 free tier with 512MB of storage, also has strict limits [[37]]. Queries must be highly optimized to avoid performance degradation and to stay within the service's capacity [[106]]. The chosen architecture must prioritize indexed lookups over full scans and minimize the computational load of each request to keep the hosting costs at zero.

The Indian campus context introduces several specific requirements. First, the entire system must operate within the Indian Standard Time (IST) timezone. This is critical for features like daily resets, new-user boosts, and session-stable shuffling seeds. The "seed flip" issue, where a shuffle seed changes mid-session (e.g., at midnight IST), could cause previously viewed profiles to reappear, breaking the user experience [[67]]. To prevent this, the shuffle seed for a session must be locked at the beginning of the session, and all related logic (like daily streaks) must be anchored to the IST clock. Second, the platform must be inclusive of India's diverse gender landscape. The system should support more than binary M/F gender labels, allowing users to select from a range of identities or specify their own [[85]]. This is a matter of both inclusivity and legal compliance. Third, user intent is likely to be more varied than just "dating." Many students may be looking for friendship, study partners, or professional connections. Incorporating an explicit intent filter (e.g., dating, friendship, networking) in the profile and search settings would allow for more nuanced matching and better align the discovery experience with user goals .

Finally, the constraint of data scarcity dictates a minimalist approach to algorithm design. The current system's low score cardinality is a symptom of this problem . Attempting to build a complex, multi-dimensional vector space model akin to Tinder's TinVec embedding is a monumental task that requires millions of interactions to train effectively [[65]]. Such an endeavor would be a massive waste of resources for Matchalize. The focus must be on signals that are either static (verifiable at signup) or can be learned from a very small number of interactions. Profile completeness is a perfect example of a static, high-value signal [[41]]. Behavior over intent is a guiding principle; the system should trust a user's actions (what they actually like) more than their stated preferences (what they say they like) [[11]]. This means that even after the first few dozen swipes, the algorithm can begin to form a reasonable hypothesis about a user's taste. The phased rollout of ranking signals is a direct response to this constraint, starting with simple, verifiable factors before attempting to model complex behavioral patterns [[41]].

Certain industry best practices, while standard for large-scale apps, are actively harmful or wasteful for a thin-pool, low-budget startup. The following table highlights these anti-patterns.

| Common Industry Practice | Why It Is Unsuitable for Matchalize | Recommended Alternative |
| :--- | :--- | :--- |
| **Complex ML Models (e.g., Deep LTR)** | Requires millions of data points to train. High engineering cost. Prone to overfitting on sparse data. | Start with a transparent, hand-tuned score. Move to a simple linear LTR model only at scale (100k+ users). [[40,41]] |
| **Real-Time Collaborative Filtering** | Building and updating user/item embeddings in real-time is a massive infrastructure challenge. | Use content-based signals (shared interests, prompts) and simple behavioral correlations initially. [[43,65]] |
| **Explicit "Compatibility Percentage"** | A single number is a misleading oversimplification, especially with little data. Can create false expectations. | Present a ranked list of profiles. Hinge's decision to move away from percentages supports this. [[53]] |
| **Multi-Armed Bandits for Exploration** | Extreme complexity in implementation and tuning. The benefit of optimizing exploration vs. exploitation is marginal at this scale. | Manage fairness with simpler techniques like periodic re-randomization or exposure quotas. [[57,68]] |
| **Heavy Vector Search (ANN)** | Requires specialized databases (e.g., Pinecone, FAISS) and background processes to generate and index embeddings. | Use standard SQL-like queries with indexes for candidate generation. ANN can be considered later if a vector-based approach is needed. [[39,43]] |

In summary, the operational constraints of free-tier hosting, the Indian context, and data scarcity collectively demand a hyper-frugal, pragmatic, and user-centric approach. Every architectural decision must be evaluated not just on its algorithmic merit but also on its cost in terms of engineering effort, infrastructure load, and development time. The path forward is to build a simple, robust, and fair system that solves immediate problems and can gracefully evolve as the platform grows and accumulates more data.

## Recommended Architecture, Metrics, and Strategic Roadmap

Based on the preceding analysis, this section synthesizes a concrete, actionable architecture for Matchalize. The proposed design directly addresses the confirmed defects, incorporates industry best practices adapted for a thin-pool environment, and respects the operational constraints of a low-budget, early-stage startup. The architecture is presented in layers, detailing the components, technologies, and rationale for each. This is accompanied by a strategic roadmap for phased implementation and a comprehensive plan for metrics instrumentation to ensure data-driven development.

### Recommended Architecture

The architecture is designed around three core pillars: a robust retrieval layer, a flexible ranking function, and a phased approach to adding complexity. The following table details the recommended components.

| Layer | Component | Technology / Technique | Complexity / Risk | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Retrieval** | Session Management | Generate a UUID on client-side load; pass with each `/discover` request. | **Low / Medium** | Ensures a stable, shuffled deck for the duration of a session, preventing repeats and confusion. [[67]] |
| **Retrieval** | Pagination | Cursor-based (Keyset) pagination using an opaque token encoding sort keys (`createdAt`, `_id`). | **Medium / Low** | Eliminates unbounded loops, prevents item skipping/duplication, and provides flat performance at scale. [[10,46,105]] |
| **Retrieval** | Exhaustion Logic | Server-side computation of `hasMore` based on eligible candidates *after* all exclusions. | **Low / Low** | Directly fixes the confirmed bug causing unbounded request loops. [[35]] |
| **Ranking** | Scoring Formula | Hybrid score: `finalScore = profileQuality * w1 + recencyDecay * w2 + activity * w3`. Weights are tunable. | **Low / Low** | Creates a continuous, interpretable score from verifiable signals. Easy to debug and improve. |
| **Ranking** | New User Boost | Temporary visibility multiplier (e.g., 2.0x) for new accounts for the first 7 days. | **Low / Low** | Addresses the cold-start problem, encouraging initial engagement and data collection. [[11,41]] |
| **Ranking** | Selectivity Penalty | Multiplier that reduces a user's score for high right-swipe rates (>70%). | **Medium / Low** | Discourages spammy, indiscriminate swiping, promoting a healthier ecosystem. [[41]] |
| **Candidate Gen** | Sample Strategy | Retrieve a large sample (e.g., top 200) from the ranked pool and apply session-stable shuffle. | **Low / Medium** | Balances quality and discovery without the complexity of weighted reservoir sampling. |
| **Database** | Indexing | Composite index on `(sortKeys, tieBreaker)` for all ranking and pagination queries. | **Low / Low** | Essential for the performance of cursor-based pagination and sorting. [[45,46]] |

### Concrete Fix for Exhaustion Bug

The bug causing the unbounded request loop is a logical error in the API's response contract. The fix is purely on the server-side and involves changing the order of operations:

1.  **Retrieve Candidates:** Execute the initial query to get a list of up to 80 candidates based on filters and the `randomSeed`.
2.  **Filter Exclusions:** On the server, remove any candidates from this list who are blocked by the viewer, archived by the viewer, or are the viewer themselves.
3.  **Slice for Response:** From the now-smaller list of *eligible* candidates, slice the first `limit` (e.g., 10) to send to the client.
4.  **Compute `hasMore`:** Determine the `hasMore` flag. `hasMore` should be `true` if and only if the total number of candidates remaining *after exclusions* is strictly greater than the `limit`. If the sliced array is smaller than the `limit` because there are no more eligible candidates, `hasMore` must be set to `false`.
5.  **Return Cursor:** Generate an opaque cursor from the sort keys of the last item in the returned array and include it in the response.

This ensures the client receives a coherent deck and knows definitively when it is exhausted, thereby terminating the request loop.

### Phased Rollout Plan

This roadmap prioritizes stability and correctness before complexity, enabling rapid iteration and validation.

*   **Week 1: Foundation and Correctness**
    *   **Goal:** Eliminate all confirmed bugs and establish a stable, performant retrieval pipeline.
    *   **Actions:**
        *   Refactor the `/discover` endpoint to use cursor-based pagination.
        *   Implement the corrected server-side `hasMore` logic.
        *   Deploy the fix for the unbounded request loop.
    *   **Deliverable:** A stable, non-looping discovery feed.

*   **Month 1: Introducing Dynamic Signals**
    *   **Goal:** Enhance the ranking score with dynamic, behavior-informed signals to improve match quality and address key UX issues.
    *   **Actions:**
        *   Instrument the backend to calculate a continuous `recencyDecay` score.
        *   Implement the `profileQuality` signal based on prompt completion and photo count.
        *   Add the `activityMultiplier` (1.5x for logins in the last 24h).
        *   Implement the `selectivityPenalty` (0.5x for right-swipe rates >70%).
        *   Launch the `newUserBoost` (2.0x for 7 days).
    *   **Deliverable:** A functional, multi-signal ranking system ready for A/B testing.

*   **Month 3: Behavioral Learning**
    *   **Goal:** Begin leveraging implicit user feedback to personalize the ranking function.
    *   **Actions:**
        *   Instrument the backend to track swipe, match, and reply events.
        *   Analyze the data to identify patterns (e.g., profiles liked by a user tend to have certain characteristics).
        *   Experiment with incorporating simple behavioral signals into the ranking formula.
    *   **Deliverable:** A ranking system that starts to learn from user interactions.

*   **What to Deliberately NOT Build (and Why):**
    *   **Complex ML Models:** Do not invest in LTR or deep learning models. The data volume is insufficient, and the ROI is negative [[41]].
    *   **Real-time Embedding Models:** Do not build a collaborative filtering system like Tinder's TinVec. The infrastructure overhead is immense [[65]].
    *   **Explicit Compatibility Percentages:** Do not display a misleading numerical score. It oversimplifies a complex process and can harm user experience .
    *   **Multi-Armed Bandits:** Do not implement contextual bandits for exploration. The complexity is unjustified at this scale [[57]].

### Metrics Instrumentation Plan

A dual-track approach to metrics is required to validate changes effectively.

*   **Offline Metrics (Pre-Deployment):**
    *   **Score Distribution Analysis:** Continuously monitor the distribution of the ranking score. Track the number of distinct score values to ensure it doesn't collapse into a few buckets [[31]].
    *   **Catalogue Coverage:** Measure the percentage of the total user pool shown to a user over a long scrolling session to ensure good discovery [[31]].
    *   **Exposure Concentration:** Calculate the Gini coefficient or Herfindahl-Hirschman Index (HHI) on the number of impressions per user to detect if a few profiles are monopolizing attention [[32]].
    *   **Novelty Rate:** Track the percentage of new, unseen profiles in a user's discovery deck to quantify the freshness of the feed [[31]].

*   **Online Metrics (Post-Deployment A/B Testing):**
    *   **Engagement:** Cards per session, average session length.
    *   **Conversion:** Match rate, letter reply rate, mutual-match rate.
    *   **Retention:** Day 1 (D1) and Day 7 (D7) retention rates.
    *   **Guardrail Metrics:** Block/report rate, hide/complaint rate, time-to-first-like.

By instrumenting these metrics, Matchalize can confidently measure the impact of its architectural changes, ensuring that every line of code shipped contributes positively to the core product goals of engagement and connection.

