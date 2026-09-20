import mongoose from 'mongoose';
import User from '../../models/User.js';
import Interaction from '../../models/Interaction.js';
import Notification from '../../models/Notification.js';
import Match from '../../models/Match.js';
import Message from '../../models/Message.js';
import Report from '../../models/Report.js';
import { connectMongo, disconnectMongo, resetTestDb } from '../lib/mongo.mjs';
import { QA_ORIGIN } from '../lib/env.mjs';
import { buildPersonas, flattenPersonas } from './personas.mjs';
import { CAST_ORDER } from './cast.mjs';

const H = 3600 * 1000;
const D = 24 * H;

function pairKey(a, b) {
  return [a._id.toString(), b._id.toString()].sort().join('__');
}

async function fetchConfig() {
  const res = await fetch(`${QA_ORIGIN}/api/config`);
  return res.json();
}

export async function seedSociety() {
  await connectMongo(process.env.MONGODB_URI);
  await resetTestDb();
  const cfg = await fetchConfig();
  const { castUsers, fillers } = buildPersonas(cfg);

  const docs = flattenPersonas({ castUsers, fillers }).map(({ role, user }) => ({ ...user }));
  const inserted = await User.insertMany(docs);
  const byRole = {};
  const byEmail = {};
  const emailToRole = {};
  for (const key of CAST_ORDER) emailToRole[castUsers[key].email] = key;
  for (const doc of inserted) {
    byEmail[doc.email] = doc;
    const role = emailToRole[doc.email];
    if (role) byRole[role] = doc;
  }
  const all = inserted;
  const maleFillers = all.filter((u) => String(u.gender).toLowerCase() === 'male' && !u._role);
  const femaleFillers = all.filter((u) => String(u.gender).toLowerCase() === 'female' && !u._role);
  const match = (base, off) => { const d = new Date(Date.now() - off); return d; };

  // --- 1. LETTERS / TELEGRAMS (Inbox content for the cast) ---
  const letter = async ({ from, to, type, note, hoursAgo = 0, cleared = false }) => {
    const it = await Interaction.create({
      actorId: from._id,
      targetId: to._id,
      actionType: type,
      letterContent: note,
      targetArtifact: null,
      cooldownExpiresAt: null,
      createdAt: match(null, hoursAgo * H),
      updatedAt: match(null, hoursAgo * H),
    });
    await Notification.create({
      recipientId: to._id,
      senderId: from._id,
      type: type === 'seal_stamp' ? 'priority_seal' : 'new_letter',
      interactionRef: it._id,
      isCleared: cleared,
      createdAt: match(null, hoursAgo * H),
      updatedAt: match(null, hoursAgo * H),
    });
    return it;
  };

  await letter({ from: byRole.arjun, to: byRole.drishti, type: 'letter', note: 'The way the light falls on the library steps at six — I think you’d see it the same way.', hoursAgo: 1, cleared: true });
  await letter({ from: byRole.mira, to: byRole.anika, type: 'letter', note: 'Your mess doodle of the chef got me through finals week. Dinner sometime?', hoursAgo: 2 });
  await letter({ from: byRole.ved, to: byRole.anika, type: 'seal_stamp', note: 'Priority note — amphitheatre, sunset, tonight. You in?', hoursAgo: 2 });
  await letter({ from: byRole.ved, to: byRole.arohi, type: 'letter', note: 'Welcome to campus. If you want a map that’s actually honest, I know good shortcuts.', hoursAgo: 3 });

  // --- 2. SEEDED MATCHES + CONVERSATIONS (history for Matches/Chat scenes) ---
  const seedMatch = async ({ a, b, sinceDays, thread }) => {
    const pkey = pairKey(a, b);
    const m = await Match.create({
      users: [a._id, b._id],
      pairKey: pkey,
      isActive: true,
      unlockedByInteractionId: new mongoose.Types.ObjectId(),
      createdAt: match(null, sinceDays * D),
      updatedAt: match(null, sinceDays * D),
    });
    let t = sinceDays * D;
    for (const [idx, mtext] of thread.entries()) {
      const [senderKey, text, read] = mtext;
      const senderDoc = byRole[senderKey] || byEmail[senderKey];
      await Message.create({
        matchId: m._id,
        senderId: senderDoc._id,
        type: 'text',
        text,
        reactions: [],
        readAt: read === false ? null : match(null, t - 30 * 60 * 1000),
        deliveryStatus: 'sent',
        createdAt: match(null, t),
        updatedAt: match(null, t),
      });
      t -= (9 + idx) * H;
    }
    return m;
  };

  const matches = {};
  matches['anika-rohan'] = await seedMatch({
    a: byRole.anika, b: byRole.rohan, sinceDays: 6, thread: [
      ['rohan', 'Okay that physics lecture was genuinely cursed today.', false],
      ['anika', 'RIGHT? I took notes in a different language by minute 20.', false],
      ['rohan', 'Lol. Coffee rescue mission at CCC tomorrow?', false],
      ['anika', 'Deal. If you bring the cold brew, I’ll bring the good playlist.', false],
      ['rohan', 'The one with the Coachella sets from 2022?', true],
      ['anika', 'Shhh. It’s sentimental.', true],
    ],
  });
  matches['anika-f1'] = await seedMatch({
    a: byRole.anika, b: maleFillers[0], sinceDays: 4, thread: [
      [maleFillers[0]._role || maleFillers[0].email, 'Saw you at the quizzing club. You argued with the quizmaster? Respect.', false],
      ['anika', 'Haha, the question was objectively wrong. A matter of principle!', false],
      [maleFillers[0]._role || maleFillers[0].email, 'Our principles usually cost us points, but I respect it.', false],
    ],
  });
  matches['anika-f2'] = await seedMatch({
    a: byRole.anika, b: maleFillers[1], sinceDays: 3, thread: [
      [maleFillers[1]._role || maleFillers[1].email, 'Your photography page is criminally under-followed.', false],
      ['anika', 'Cheap phone, golden hour. I’ll take it.', false],
      [maleFillers[1]._role || maleFillers[1].email, 'Golden hour does all the work. Jk, your eye is good.', true],
    ],
  });
  matches['drishti-raj'] = await seedMatch({
    a: byRole.drishti, b: byRole.raj, sinceDays: 2, thread: [
      ['raj', 'Hey, we matched a while ago. You’re hard to pin down.', false],
      ['raj', 'Anyway, I’m hosting a small thing at my wing this Friday.', true],
      ['drishti', 'I’m a bit busy with submissions this week.', true],
      ['raj', 'Right. Busy. Sure.', false],
    ],
  });
  matches['sanya-nishant'] = await seedMatch({
    a: byRole.sanya, b: byRole.nishant, sinceDays: 5, thread: [
      ['nishant', 'You have an unfair advantage in our cricket debates: you actually play.', true],
      ['sanya', 'And yet you still argue with me about spin bowling.', true],
      ['nishant', 'Some hills are worth dying on.', true],
    ],
  });

  // --- 3. KABIR: 3 pending community reports (auto-shadowban at 3, not suspended) ---
  const kabirReporters = femaleFillers.slice(0, 3);
  for (let i = 0; i < kabirReporters.length; i++) {
    await Report.create({
      reporter: kabirReporters[i]._id,
      reported: byRole.kabir._id,
      reason: i === 0 ? 'Harassment or bullying' : i === 1 ? 'Inappropriate photos' : 'Fake profile or spam',
      details: '',
      status: 'pending',
      createdAt: match(null, (5 - i) * H + (i % 2) * 3 * H),
    });
  }
  await User.updateOne(
    { _id: byRole.kabir._id },
    { $set: { isGhost: true, shadowbannedAt: new Date(Date.now() - 4 * H), contentFrozen: true } }
  );

  // --- 4. TIME-WARP user timestamps + lastActive ---
  const recentRoles = ['anaya', 'drishti', 'arjun', 'anika', 'sanya', 'arohi', 'khushi'];
  const now = Date.now();
  const backdate = async (u, createdAgo, activeAgo) => {
    await User.updateOne(
      { _id: u._id },
      {
        $set: {
          createdAt: new Date(now - createdAgo),
          updatedAt: new Date(now - (createdAgo / 2)),
          lastActive: new Date(now - activeAgo),
        },
      }
    );
  };
  for (const u of all) {
    const activeAgo = recentRoles.includes(u._role)
      ? 0
      : u._role === 'rohan' || u._role === 'mira' || u._role === 'ved' || u._role === 'nishant' || u._role === 'raj'
        ? (8 + (u.email.length % 10)) * H
        : (12 + (u.email.charCodeAt(2) % 30)) * H;
    await backdate(u, 30 * D + (u._fillIdx || 0) * 37 * 60 * 1000, activeAgo);
  }

  const world = {
    byRole,
    byEmail,
    castUsers,
    matches,
    kabirReporters: kabirReporters.map((r) => r._id),
    connectors: { anikaRohan: matches['anika-rohan']._id, drishtiRaj: matches['drishti-raj']._id, sanyaNishant: matches['sanya-nishant']._id },
  };

  await disconnectMongo();
  return world;
}