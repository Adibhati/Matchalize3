import fs from 'fs';
import path from 'path';

const STATUS_GLYPH = { ok: '✓', warn: '⚠', fail: '✗' };

export function assertReportDir(reportDir) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(path.join(reportDir, 'videos'), { recursive: true });
  return reportDir;
}

// Copy a source video into reportDir/videos/<basename>; returns relative ref or null.
export function copyVideo(src, reportDir) {
  if (!src || !fs.existsSync(src)) return null;
  const base = path.basename(src);
  const dest = path.join(reportDir, 'videos', base);
  fs.copyFileSync(src, dest);
  return `videos/${base}`;
}

export function writeReport(results, reportDir, { analyzed = 'Not run' } = {}) {
  const rows = results.map((r) => {
    const glyph = STATUS_GLYPH[r.status] || '?';
    const links = (r.videoRefs || []).map((v) => `[▶ ${path.basename(v)}](${v})`).join(' ');
    return `| ${glyph} | \`${r.id}\` | ${r.name} | ${links || '_no video_'} | ${(r.durationMs / 1000).toFixed(1)}s |`;
  });

  const failed = results.filter((r) => r.status === 'fail').length;
  const warned = results.filter((r) => r.status === 'warn').length;
  const ok = results.filter((r) => r.status === 'ok').length;

  const sections = results
    .map((r) => {
      const glyph = STATUS_GLYPH[r.status] || '?';
      const links = (r.videoRefs || []).map((v) => `- ▶ [${path.basename(v)}](./${v})`).join('\n');
      const notes = (r.notes || []).map((n) => `- ${n}`).join('\n');
      return [
        `### ${glyph} ${r.id} — ${r.name}`,
        '',
        r.blurb,
        '',
        links || '- _no video captured_',
        notes ? `\n**Notes:**\n${notes}` : '',
        '',
      ].join('\n');
    })
    .join('\n');

  const md = `# Matchalize — Automated QA Walkthrough

_Generated ${new Date().toISOString()} by \`npm run qa\` (Playwright, test DB, seeded society)._

- **Scenes run:** ${results.length} · ✓ ${ok} · ⚠ ${warned} · ✗ ${failed} · total runtime ${(results.reduce((a, r) => a + r.durationMs, 0) / 1000).toFixed(0)}s
- **Server stats snapshot:** ${analyzed}
- Videos are recorded **webm clips**; open them side-by-side with the Feature Theater at \`client/dist/e2e/index.html\` (\`http://localhost:5051/e2e\`).

## Scene matrix

|  | id | Scene | Video | Time |
|---|---|---|---|---|
${rows.join('\n')}

## Scene details

${sections}

## Notes on reruns

- The society is **re-seeded** every full \`npm run qa\`. Daily budgets (7 letters / 1 telegram per user) mean repeated runs same-day will exhaust limits before the deck empties — re-seed (or wait) for a completely fresh run.
- Manual-only coverage: **Resend email delivery** (OTP is read straight from the test DB instead) and **Cloudinary photo hosting / moderation** (uploads use local disk in test mode). See \`client/e2e/MANUAL-CHECKS.md\`.
`;
  fs.writeFileSync(path.join(reportDir, 'REPORT.md'), md);
}

export function writeTheater(results, reportDir) {
  const cards = results
    .map((r) => {
      const links = (r.videoRefs || []).map((v) => {
        const b = path.basename(v);
        return `<div style="margin-bottom:18px"><h3>${b}</h3><video controls preload="none" style="width:100%;max-width:360px;border-radius:12px;background:#1c130a"><source src="${v}"><p>Your browser does not support webm video.</p></video></div>`;
      }).join('');
      return `<section style="margin-bottom:28px;padding:14px;border:1px solid #d4c5a9;border-radius:12px;background:#fdfbf7">
        <h2 style="margin:0 0 2px;color:#8b1a1a;font-weight:800">${r.status === 'ok' ? '✓' : r.status === 'warn' ? '⚠' : '✗'} ${r.id} — ${r.name}</h2>
        <p style="margin:0 0 10px;color:#4a3320;font-size:13px;line-height:1.5">${r.blurb}</p>
        ${links || '<p style="color:#a00">No video captured for this scene.</p>'}
        ${(r.notes || []).map((n) => `<p style="margin:2px 0;color:#8b6f4a;font-size:12px">— ${n}</p>`).join('')}
      </section>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Matchalize QA — Feature Theater</title>
<style>body{margin:0;font-family:Georgia,serif;background:#f4f1ea;color:#1c130a}
main{max-width:860px;margin:0 auto;padding:28px 20px 60px}
h1{font-size:26px;margin:0 0 4px}h2{font-size:17px}header{border-bottom:2px solid #8b1a1a;padding-bottom:14px;margin-bottom:24px}
.tag{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8b6f4a;font-family:monospace}</style></head>
<body><main><header>
<h1>Matchalize — Feature Theater</h1>
<p class="tag">Automated QA walkthroughs · ${new Date().toISOString().slice(0, 19)} · recorded webm clips</p>
</header>
${cards}
<footer style="margin-top:30px;border-top:1px solid #d4c5a9;padding-top:14px;font-size:12px;color:#8b6f4a">
Manual-only coverage (email delivery + photo moderation) is tracked in <code>client/e2e/MANUAL-CHECKS.md</code>.
</footer>
</main></body></html>
`;
  fs.writeFileSync(path.join(reportDir, 'index.html'), html);
}