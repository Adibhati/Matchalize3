import path from 'path';
import { QA_ORIGIN, VIDEOS_DIR } from './browser.mjs';
import {
  advanceSplash,
  loginViaOtp,
  makeContext,
  closeContext,
  touchSwipe,
  longPress,
  tap,
  sleep,
  deckApi,
} from './browser.mjs';

const SCENES_DIR = VIDEOS_DIR;

function svgPhotoBuffer(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#3a1d0d"/><circle cx="300" cy="320" r="150" fill="#8f4a1f"/><text x="300" y="560" text-anchor="middle" font-family="Georgia" font-size="90" fill="#ffc89f">${label}</text></svg>`;
  return Buffer.from(svg);
}

// ===== SHARED DRIVERS =====================================================

async function topCardPrompt(page) {
  const data = await deckApi(page);
  const top = data.users?.[0];
  return top?.prompts?.[0]?.question || 'Exceptional Match';
}

async function popLike(page, tileSelector, { note, flower } = {}) {
  await longPress(page, tileSelector);
  await sleep(250);
  await tap(page, page.locator(flower ? '.flower-btn' : '.letter-btn'));
  if (note) {
    await tap(page, page.locator('textarea.premium-input'));
    await page.locator('textarea.premium-input').fill(note);
    await tap(page, page.locator('.premium-send-btn'));
    await sleep(1600);
  } else {
    await sleep(1400);
  }
}

async function tapInterestChip(page, interest) {
  const chip = page
    .locator('button.tactile-btn')
    .filter({ hasText: new RegExp(`^\\s*${interest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
    .first();
  await chip.tap();
}

async function driveOnboarding(page, cfg, profile, { fast = false } = {}) {
  const wait = (ms) => (fast ? sleep(Math.round(ms / 3)) : sleep(ms));
  const advance = async () => {
    await touchSwipe(page, { y0: 640, y1: 130, steps: 16, pause: 40 });
    await wait(950);
  };
  const genderMap = { female: 'FEMALE', male: 'MALE' };

  await page.locator('text=The Dossier.').first().waitFor({ timeout: 30000 });
  await wait(700);
  await advance(); // intro -> vitals

  // VITALS
  await page.locator('input[placeholder="e.g. Arjun"]').fill(profile.name || 'Campus Writer');
  const d = String(profile.dobD || '09').padStart(2, '0');
  const m = String(profile.dobM || '06').padStart(2, '0');
  const y = String(profile.dobY || '2005');
  await page.locator('input[placeholder="DD"]').fill(d);
  await page.locator('input[placeholder="MM"]').fill(m);
  await page.locator('input[placeholder="YYYY"]').fill(y);
  await wait(400);
  await advance(); // vitals -> coordinates

  // COORDINATES
  const g = genderMap[profile.gender] || 'FEMALE';
  await page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${g}\\s*$`) }).first().tap();
  for (const gi of profile.interestedIn || ['MALE']) {
    let idx = 0;
    if (!['EVERYONE'].includes(gi)) idx = 1; // identity group renders first, interested-in second
    const chip = page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${gi}\\s*$`) }).nth(idx);
    await chip.tap();
  }
  // Branch and Hostel were removed from the Coordinates chapter along with their
  // schema fields, so there is nothing to tap or fill here any more. Do not
  // reintroduce selectors for them — if this harness ever needs a college or
  // location signal again, it should come from the college picker in Auth.
  const era = profile.era || 'UG';
  await page.locator('button:has-text("Select UG / PG...")').tap();
  await page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${era}\\s*$`) }).first().tap().catch(() => {});
  await wait(300);
  await advance(); // coordinates -> portrait

  // PORTRAIT
  await page.locator('button:has-text("Primary Photo")').first().tap();
  await page.locator('input[type="file"]').setInputFiles({ name: 'portrait.svg', mimeType: 'image/svg+xml', buffer: svgPhotoBuffer('P0') });
  await wait(3200);
  await page
    .locator('textarea[placeholder="What drives you? What are your passions?"]')
    .fill(profile.bio || 'Here for the conversations, the afternoon light, and the mess chai that somehow tastes different at 6pm.');
  await wait(300);
  await advance(); // portrait -> whispers

  // WHISPERS — 3 slots (horizontal pager; each slot becomes a card once answered)
  const prompts = profile.prompts || (cfg.prompts || []).slice(0, 3);
  const answers = [
    'Honestly? The ritual matters more than the loud thing.',
    'Engineers plan, poets improvise. I do both.',
    'Ask me after 10pm — my night-owl brain is sharper.',
  ];
  for (let slot = 0; slot < 3; slot++) {
    const add = page.locator('button:has-text("+ Select a Whisper")').first();
    if (await add.isVisible().catch(() => false)) {
      await add.tap();
      await wait(500);
      const qText = prompts[slot]?.question || prompts[slot] || '';
      await page.getByText(qText, { exact: true }).first().tap().catch(async () => {
        await page.getByText(qText.slice(0, 18), { exact: false }).first().tap().catch(() => {});
      });
      await wait(500);
    }
    const area = page.locator('textarea[placeholder="Your answer..."]').nth(slot);
    await area.fill(answers[slot % answers.length]);
    await wait(250);
  }
  await advance(); // whispers -> parameters

  // PARAMETERS
  for (const intent of profile.intent || ['Dating']) {
    const chip = page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${intent}\\s*$`) }).first();
    await chip.tap();
  }
  for (const it of profile.curiosities || (cfg.interests || []).slice(0, 3)) {
    await tapInterestChip(page, it).catch(() => {});
  }
  await wait(300);
  await advance(); // parameters -> alignment


  // REVIEW — publish
  const publish = page.locator('button:has-text("Publish Profile & Enter")');
  await publish.waitFor({ timeout: 15000 }).catch(() => {});
  if (await publish.isVisible().catch(() => false)) {
    await publish.tap();
  }
  await sleep(3000);
}

// ===== SCENES =============================================================

const definitions = [
  {
    id: 's01',
    name: 'Onboarding — The Dossier',
    blurb: 'Brand-new student Khushi signs in with her campus email and transcribes her story — Vitals, Coordinates, Portrait, Whispers, Parameters, Alignment — then publishes her profile.',
  },
  {
    id: 's02',
    name: 'Discover — Curating the Deck',
    blurb: 'Anaya browses the discovery deck: long-presses a tile to pop the letter press, sends a handwritten letter, and swipes past the rest.',
  },
  {
    id: 's08',
    name: 'Safety — Report & Block',
    blurb: 'Drishti reports a profile from the card menu and permanently blocks a match from her chat — creating the report trail that reaches the admin next.',
  },
  {
    id: 's03',
    name: 'The Alignment — Instant Chat',
    blurb: 'Drishti likes Arjun and the campus lights up: instant match and the first opening letter.',
  },
  {
    id: 's04',
    name: 'Letters — The Binder',
    blurb: 'Anika opens her Letters tab: conversations, unread messages, and the search that finds messages instantly.',
  },
  {
    id: 's05',
    name: 'Live Chat',
    blurb: 'Split-screen realtime chat: anika and rohan message each other live and react to a message. Everything relays over websockets.',
  },
  {
    id: 's06',
    name: 'The Letterbox',
    blurb: 'Anika opens her Letterbox from the bell, accepts a letter from Mira, then connects on a Priority Telegram from Ved.',
  },
  {
    id: 's07',
    name: 'Profile — The Dossier',
    blurb: 'Anika polishes her dossier: edits her bio and drops a new curiosity into her recorded list.',
  },
  {
    id: 's11',
    name: 'Severing Ties',
    blurb: 'Sanya unmatches Nishant from the chat options — an irreversible decision, confirmed and done.',
  },
  {
    id: 's09',
    name: 'Admin — The Archivist',
    blurb: 'The campus admin reviews pending community reports, opens Kabir’s file, and suspends the account.',
  },
  {
    id: 's10',
    name: 'Locked Out',
    blurb: 'Kabir tries to sign back in — the archive returns a suspended verdict and bars the door.',
  },
  {
    id: 's12',
    name: 'Admin — The Ledger',
    blurb: 'Back on the admin dashboard: live campus stats, active bans, and the safety ledger reflecting everything the run did.',
  },
  {
    id: 's14',
    name: 'The Splash',
    blurb: 'The cinematic entry — tagline, and the automatic pass into the archives.',
  },
  {
    id: 's15',
    name: 'The Encore',
    blurb: 'Arohi joins fast — a quick onboarding — and her letterbox already holds a welcome letter.',
  },
];

export { definitions };

async function runS01({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's01');
  const { context, page } = await makeContext(browser, dir, 's01');
  await loginViaOtp(page, 'khushi.verma@iitb.ac.in');
  await page.locator(`text=The Dossier.`).first().waitFor({ timeout: 20000 });
  await driveOnboarding(page, cfg, { name: 'Khushi Verma', gender: 'female', interestedIn: ['MALE'], dobD: 12, dobM: 3, dobY: 2006 });
  await page.locator('img').first().waitFor({ timeout: 30000 }).catch(() => {});
  await sleep(2500);
  return closeContext({ context, videoDir: dir, name: 's01' });
}

async function runS02({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's02');
  const { context, page } = await makeContext(browser, dir, 's02');
  await loginViaOtp(page, 'anaya.mehta@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2500);
  try {
    await popLike(page, await topCardPrompt(page), { note: 'The library-steps light at six. I think we both noticed.', flower: false });
  } catch (e) {
    log(`  [warn] anaya letter failed: ${e.message}`);
  }
  await sleep(2200);
  try {
    await touchSwipe(page, { y0: 640, y1: 130, steps: 16, pause: 40 }); // pass
    await sleep(1600);
  } catch (e) {
    log(`  [warn] anaya pass failed: ${e.message}`);
  }
  try {
    await popLike(page, await topCardPrompt(page), { flower: true });
  } catch (e) {
    log(`  [warn] anaya flower failed: ${e.message}`);
  }
  await sleep(2200);
  return closeContext({ context, videoDir: dir, name: 's02' });
}

async function runS03({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's03');
  const { context, page } = await makeContext(browser, dir, 's03');
  await loginViaOtp(page, 'drishti.iyer@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2500);
  try {
    await popLike(page, await topCardPrompt(page), { flower: true });
  } catch (e) {
    log(`  [warn] drishti like failed: ${e.message}`);
  }
  await page.getByText('You are Aligned', { exact: true }).first().waitFor({ timeout: 20000 });
  await sleep(1800);
  await page.locator('button:has-text("Open Chat")').tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(3000);
  return closeContext({ context, videoDir: dir, name: 's03' });
}

async function runS04({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's04');
  const { context, page } = await makeContext(browser, dir, 's04');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1500);
  await tap(page, page.getByRole('button', { name: 'Letters' }));
  await page.locator('text="Rohan Gokhale"').first().waitFor({ timeout: 15000 });
  await sleep(1200);
  const search = page.getByPlaceholder('Search letters...');
  await search.fill('rohan');
  await sleep(1200);
  await page.getByRole('button', { name: 'Clear search' }).tap().catch(() => {});
  await sleep(800);
  await page.locator('text="Rohan Gokhale"').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(2500);
  await page.getByRole('button', { name: 'Go back to letters' }).tap();
  await sleep(1500);
  return closeContext({ context, videoDir: dir, name: 's04' });
}

async function runS05({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's05');
  const a = await makeContext(browser, path.join(dir, 'anika'), 'anika');
  const b = await makeContext(browser, path.join(dir, 'rohan'), 'rohan');
  try {
    await loginViaOtp(a.page, 'anika.singh@iitb.ac.in');
    await loginViaOtp(b.page, 'rohan.g@iitb.ac.in');
    await a.page.locator('img').first().waitFor({ timeout: 30000 });
    await b.page.locator('img').first().waitFor({ timeout: 30000 });
    await tap(a.page, a.page.getByRole('button', { name: 'Letters' }));
    await a.page.locator('text="Rohan Gokhale"').first().tap();
    await tap(b.page, b.page.getByRole('button', { name: 'Letters' }));
    await b.page.locator('text="Anika Singh"').first().tap();
    await a.page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await b.page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await sleep(1500);

const send = async (lpage, text) => {
      const box = lpage.getByPlaceholder('Write a message...');
      await box.fill(text);
      await lpage.locator('button[aria-label="Send message"]').tap();
      await sleep(1600);
    };
    const waitText = async (page, text, ms = 9000) => {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: ms });
    };

    await send(a.page, 'Hey! Still awake, or drowning in submissions?');
    await waitText(b.page, 'still awake');
    await sleep(900);
    await send(b.page, 'Finals week. The library is my second home now.');
    await waitText(a.page, 'second home now');
    await sleep(900);
    await send(a.page, 'Cold brew rescue mission at CCC tomorrow?');
    await waitText(b.page, 'Cold brew rescue mission');
    await sleep(900);
    await send(b.page, "It's a date. Bring the good playlist.");
    await waitText(a.page, "It's a date. Bring the good playlist.");

    try {
      await longPress(a.page, 'text="It\'s a date. Bring the good playlist."', 560);
      await tap(a.page, a.page.locator('button:has-text("React")'), { timeout: 8000 });
      await tap(a.page, a.page.getByRole('button', { name: 'React with ❤️' }), { timeout: 8000 });
      await sleep(1800);
    } catch (e) {
      log(`  [warn] s05 reaction failed: ${e.message}`);
    }
    await sleep(2000);
  } finally {
    const v1 = await closeContext({ context: a.context, videoDir: path.join(dir, 'anika'), name: 'anika' });
    const v2 = await closeContext({ context: b.context, videoDir: path.join(dir, 'rohan'), name: 'rohan' });
    return [v1, v2].filter(Boolean);
  }
}

async function runS06({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's06');
  const { context, page } = await makeContext(browser, dir, 's06');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1200);
  await tap(page, page.getByRole('button', { name: 'View notifications' }));
  await page.getByText('sent a letter.', { exact: false }).first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.locator('text="Mira Nair"').first().waitFor({ timeout: 15000 });
  await sleep(1400);
  await page.locator('button[aria-label="Accept"]').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(2600);
  await page.getByRole('button', { name: 'Go back to letters' }).tap().catch(() => {});
  await sleep(900);
  await tap(page, page.getByRole('button', { name: 'View notifications' }));
  await page.locator('text="Ved Desai"').first().waitFor({ timeout: 15000 });
  await sleep(1400);
  await page.locator('button[aria-label="Accept"]').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(3000);
  return closeContext({ context, videoDir: dir, name: 's06' });
}

async function runS07({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's07');
  const { context, page } = await makeContext(browser, dir, 's07');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(800);
  await tap(page, page.getByRole('button', { name: 'Profile' }));
  await page.getByText('About Me', { exact: true }).first().waitFor({ timeout: 15000 });
  await sleep(1200);
  try {
    const aboutEdit = page.getByText('About Me', { exact: true }).first().locator('xpath=..').locator('button:has-text("Edit")');
    await aboutEdit.tap();
    await sleep(900);
    const bio = page.locator('textarea[placeholder="Write your bio..."]');
    if (await bio.isVisible().catch(() => false)) {
      await bio.fill('Just finished my first hackathon. Here for the chase scenes, the chai, and the long talks by the lake.');
      await bio.press('Tab'); // commit onBlur
      await sleep(1200);
    }
  } catch (e) {
    log(`  [warn] s07 bio edit failed: ${e.message}`);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(800);
  try {
    const curEdit = page.getByText('Recorded Curiosities', { exact: true }).first().locator('xpath=..').locator('button:has-text("Edit")');
    await curEdit.tap();
    await sleep(900);
    const tags = (cfg.interests || []).slice(-3);
    const chip = page.locator('button.tactile-btn').filter({ hasText: tags[0] }).first();
    await chip.tap().catch(() => {});
    await sleep(1000);
  } catch (e) {
    log(`  [warn] s07 curiosity edit failed: ${e.message}`);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(2500);
  return closeContext({ context, videoDir: dir, name: 's07' });
}

async function runS08({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's08');
  const { context, page } = await makeContext(browser, dir, 's08');
  await loginViaOtp(page, 'drishti.iyer@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2000);
  try {
    await tap(page, page.locator('button:has(svg.lucide-more-vertical)'));
    await tap(page, page.locator('button:has-text("Report Profile")'));
    await page.locator('text="Report User"').first().waitFor({ timeout: 10000 });
    await sleep(800);
    const reason = page.getByRole('button', { name: 'Harassment or bullying', exact: true }).first();
    await reason.tap().catch(async () => {
      const other = page.getByRole('button', { name: 'Other', exact: true }).first();
      await other.tap().catch(() => {});
    });
    const details = page.locator('textarea[placeholder="Provide any additional context..."]');
    if (await details.isVisible().catch(() => false)) {
      await details.fill('Repeatedly pestering in DMs despite being told to stop.');
    }
    await tap(page, page.locator('button:has-text("Submit Report")'));
    await page.locator('text="Report submitted."').first().waitFor({ timeout: 10000 }).catch(() => {});
    await sleep(1800);
  } catch (e) {
    log(`  [warn] s08 report failed: ${e.message}`);
  }
  try {
    await tap(page, page.getByRole('button', { name: 'Letters' }));
    await page.locator('text="Raj Kulkarni"').first().waitFor({ timeout: 15000 });
    await page.locator('text="Raj Kulkarni"').first().tap();
    await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await sleep(1200);
    await tap(page, page.getByRole('button', { name: 'Open chat options' }));
    await tap(page, page.locator('button:has-text("Block User")'));
    await sleep(3000);
  } catch (e) {
    log(`  [warn] s08 block failed: ${e.message}`);
  }
  return closeContext({ context, videoDir: dir, name: 's08' });
}

async function runS09({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's09');
  const { context, page } = await makeContext(browser, dir, 's09');
  await loginViaOtp(page, 'admin@test.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await page.goto(`${QA_ORIGIN}/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Total Users', { exact: true }).first().waitFor({ timeout: 25000 }).catch(() => {});
  await sleep(2500);
  try {
    await page.locator('button:has-text("Reports")').tap();
    await page.locator('text="Kabir Anand"').first().waitFor({ timeout: 20000 });
    await sleep(1200);
    await page.locator('text="Kabir Anand"').first().tap();
    await sleep(700);
    const action = page.locator('button:has-text("Action")').first();
    if (await action.isVisible().catch(() => false)) {
      await action.tap();
      await sleep(1600);
    }
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(700);
  } catch (e) {
    log(`  [warn] s09 reports action failed: ${e.message}`);
  }
  try {
    await page.locator('button:has-text("Users")').tap().catch(() => {});
    await sleep(700);
    const search = page.getByPlaceholder('Search by name or email...').first();
    await search.fill('kabir');
    await search.press('Enter');
    await page.locator('text="Kabir Anand"').first().waitFor({ timeout: 20000 });
    await page.locator('text="Kabir Anand"').first().tap();
    await sleep(700);
    await page.locator('button:has-text("Suspend")').tap();
    await sleep(2200);
    await page.keyboard.press('Escape').catch(() => {});
  } catch (e) {
    log(`  [warn] s09 suspend failed: ${e.message}`);
  }
  await sleep(1800);
  return closeContext({ context, videoDir: dir, name: 's09' });
}

async function runS10({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's10');
  const { context, page } = await makeContext(browser, dir, 's10');
  try {
    await loginViaOtp(page, 'kabir.anand@iitb.ac.in');
  } catch (e) {
    log(`  [warn] s10 login attempt logged failure: ${e.message}`);
  }
  await page.getByText(/suspend/i).first().waitFor({ timeout: 15000 }).catch(() => {});
  await sleep(3500);
  return closeContext({ context, videoDir: dir, name: 's10' });
}

async function runS11({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's11');
  const { context, page } = await makeContext(browser, dir, 's11');
  await loginViaOtp(page, 'sanya.sharma@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1000);
  await tap(page, page.getByRole('button', { name: 'Letters' }));
  await page.locator('text="Nishant Jain"').first().waitFor({ timeout: 15000 });
  await sleep(800);
  // open the chat and unmatch from the chat options
  await page.locator('text="Nishant Jain"').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(1200);
  await tap(page, page.getByRole('button', { name: 'Open chat options' }));
  await tap(page, page.locator('button:has-text("Unmatch")'));
  await sleep(3500);
  return closeContext({ context, videoDir: dir, name: 's11' });
}

async function runS12({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's12');
  const { context, page } = await makeContext(browser, dir, 's12');
  await loginViaOtp(page, 'admin@test.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await page.goto(`${QA_ORIGIN}/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Total Users', { exact: true }).first().waitFor({ timeout: 25000 }).catch(() => {});
  await sleep(4500);
  return closeContext({ context, videoDir: dir, name: 's12' });
}

async function runS14({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's14');
  const { context, page } = await makeContext(browser, dir, 's14');
  await advanceSplash(page, { maxSwipes: 8 });
  await page.locator('input[type="email"]').waitFor({ timeout: 20000 }).catch(() => {});
  await sleep(2000);
  return closeContext({ context, videoDir: dir, name: 's14' });
}

async function runS15({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's15');
  const { context, page } = await makeContext(browser, dir, 's15');
  await loginViaOtp(page, 'arohi.kapoor@iitb.ac.in');
  await page.locator('text=The Dossier.').first().waitFor({ timeout: 20000 });
  await driveOnboarding(page, cfg, { name: 'Arohi Kapoor', gender: 'female', interestedIn: ['MALE'], dobD: 22, dobM: 11, dobY: 2006, fast: true });
  await page.locator('img').first().waitFor({ timeout: 30000 }).catch(() => {});
  await sleep(1500);
  try {
    await tap(page, page.getByRole('button', { name: 'View notifications' }));
    await page.locator('text="Ved Desai"').first().waitFor({ timeout: 15000 });
    await sleep(3000);
  } catch (e) {
    log(`  [warn] s15 welcome letter peek failed: ${e.message}`);
  }
  return closeContext({ context, videoDir: dir, name: 's15' });
}

export const runners = {
  s01: runS01,
  s02: runS02,
  s03: runS03,
  s04: runS04,
  s05: runS05,
  s06: runS06,
  s07: runS07,
  s08: runS08,
  s09: runS09,
  s10: runS10,
  s11: runS11,
  s12: runS12,
  s14: runS14,
  s15: runS15,
};

export async function loadConfig() {
  const res = await fetch(`${QA_ORIGIN}/api/config`);
  return res.json();
}