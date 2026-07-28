import { stitch } from "@google/stitch-sdk";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: join(import.meta.dirname, "../server/.env") });

const outDir = join(import.meta.dirname, "../stitch-output");
mkdirSync(outDir, { recursive: true });

const PROMPTS = {
  chat: `Design a dark-themed mobile chat screen for a dating app called Matchalize. 
The screen is 390px wide (iPhone). Background is pure black #000000.
Color scheme: black backgrounds, orange #f97316 accents, white text.

HEADER (56px height):
- Left: back arrow button (circle, dark bg)
- Center: 38px circular avatar, partner first name in bold white 16px, below it "CSE · 3rd Year" in dim gray 11px, green dot "Online" indicator
- Right: 3-dot menu button

MESSAGES AREA (fills remaining space, scrollable):
- Date separator pill "Today" centered, small dim text on dark bg
- Their messages: left-aligned, dark glass bubble (#ffffff0d background, white border), rounded corners 18px with flat bottom-left
- My messages: right-aligned, solid orange #f97316 bubble, white text, rounded corners with flat bottom-right
- Image message: their bubble contains a rounded photo (12px radius) with small caption below
- Reply message: their bubble has a thin card above showing quoted text with a 2px orange left border
- Each message tail shows timestamp "2:34 PM" in tiny dim text, my messages also show blue double-check ✓✓ read receipt
- Reactions: small emoji badge (14px) overlapping bottom-right of bubble

INPUT TRAY at bottom:
- Emoji smiley button on left
- Text input "Message" with rounded 20px border, dark glass bg
- Orange circular send button with arrow icon when text entered
- When no text: dark circle with + icon

Design should be minimalistic, clean, modern, like WhatsApp dark mode but with orange accent. No gradients. Sharp clean edges. Tight spacing.`,

  empty: `Design a dark-themed empty chat state for a dating app. 
Background pure black #000000. Orange accent #f97316.

Center of screen:
- 72px circular avatar of the match with thin orange border
- Bold white text "You matched with Priya!"
- Subtitle in dim gray: "Start a conversation — say something about their prompts or interests."
- Below: "ICE BREAKERS" label in uppercase tiny dim text
- 5 icebreaker suggestion pills in a column: orange text on dark glass bg with thin orange border, each 12px rounded
  - "What's your branch? How do you like it so far?"
  - "Best chai spot on campus?"
  - "What's the most interesting thing you've learned this semester?"
  - "Favourite way to procrastinate before exams?"
  - "What's your 3AM scroll-of-shame content?"

Design is minimalistic, clean, centered, dark.`,

  emoji: `Design an emoji picker panel that slides up from bottom of a dark chat screen.
Background: #0a0a0a with subtle top border.
Height: about 280px.

- Header row: "Emoji" label on left, close × on right
- Search input at top (optional, dimmed)
- 8 columns × 5 rows grid of common emojis: 😀😊😂❤️🔥👍😭🥰😍😎🤔💀✨🎉👋🙄😴🥺😭💀🥺😍🥰😎🤔👍🎉✨💀😭😀😊😂❤️🔥
- Each emoji is 32px, centered in its cell
- Subtle grid lines or cell bg on hover
- Bottom bar with category icons (smiley, heart, hand, etc) in orange when active

Dark theme, clean, minimalistic.`,

  profile: `Design a profile bottom sheet modal for a dating app match.
Slides up from bottom, covers 85% of screen. Dark theme #000000.
Rounded top corners 20px.

- Top: thin gray drag handle bar centered
- Photo area: large photo (390×440) of the person, full-width, rounded top corners
- Below photo: name "Priya Sharma, 21" in bold white 20px
- Branch and year: "CSE · 3rd Year" in orange 14px
- Bio: "Coffee addict. Night owl. Building cool stuff." in white 14px
- Prompts section: card with question in dim text, answer in white
  - "My ideal night study session includes..." → "With lo-fi beats and infinite chai"
  - "A hot take I have about our college..." → "The canteen maggi is overrated"
- Interests tags: orange pill tags "Coding" "Anime" "Photography" "Music" "Travel"
- Close button: thin × at top right

Clean, minimalistic, modern.`,

  action: `Design a long-press context menu for a chat message bubble.
Dark theme. Appears as a floating card above the message.

Small rounded card (12px radius) with dark glass background (#1a1a1a with subtle border):
- 4 rows, each with icon + label text:
  1. Copy icon + "Copy" 
  2. Reply arrow + "Reply"
  3. Heart outline + "React"
  4. Trash icon + "Delete" (in red #ef4444 for own messages)
- Each row: 44px height, 16px icon on left, 15px white text, padding 0 20px
- Subtle separator between rows
- Card has soft shadow, appears slightly above the pressed message
- Behind: dark overlay dimming the rest of the screen

Clean, minimalistic, iOS-style context menu.`,
};

async function generateDesigns() {
  console.log("Creating Stitch project...");
  const project = await stitch.createProject("Matchalize Chat UI");

  for (const [name, prompt] of Object.entries(PROMPTS)) {
    console.log(`Generating: ${name}...`);
    try {
      const screen = await project.generate(prompt);
      const htmlUrl = await screen.getHtml();
      const imageUrl = await screen.getImage();

      console.log(`  HTML: ${htmlUrl}`);
      console.log(`  Image: ${imageUrl}`);

      writeFileSync(
        join(outDir, `${name}-urls.json`),
        JSON.stringify({ htmlUrl, imageUrl, prompt }, null, 2)
      );
    } catch (err) {
      console.error(`  Error generating ${name}:`, err.message);
    }
  }

  console.log("Done! Check stitch-output/ for URLs.");
}

generateDesigns().catch(console.error);
