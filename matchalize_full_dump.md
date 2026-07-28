# Matchalize — Full Codebase Dump

> Verbatim contents of all project source and configuration files.
> Generated with latest changes applied.

## Client Files

### client/index.html
**Type:** `client/index.html`
**Size:** 24 lines (22 non-empty)

```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#fdfbf7" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <link rel="apple-touch-icon" href="/icons.svg" />
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Vintage Story Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
    
    <title>Matchalize — Your Campus. Your Story.</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

### client/.DS_Store
**Type:** `client/.DS_Store`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xd1 in position 309: invalid continuation byte
```

### client/.oxlintrc.json
**Type:** Linting
**Size:** 8 lines (8 non-empty)

```
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}

```

### client/vite.config.js
**Type:** Build Tools
**Size:** 14 lines (13 non-empty)

```
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/uploads': 'http://localhost:5005',
    },
  },
})

```

### client/.gitignore
**Type:** `client/.gitignore`
**Size:** 24 lines (22 non-empty)

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

```

### client/package.json
**Type:** Package Configuration
**Size:** 31 lines (31 non-empty)

```
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@sentry/react": "^10.66.0",
    "@tanstack/react-query": "^5.101.2",
    "framer-motion": "^12.42.0",
    "gsap": "^3.15.0",
    "lucide-react": "^1.25.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-pageflip": "^2.0.3",
    "react-router-dom": "^7.18.0",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.2",
    "oxlint": "^1.69.0",
    "vite": "^8.1.0"
  }
}

```

### client/dist/index.html
**Type:** `client/dist/index.html`
**Size:** 25 lines (23 non-empty)

```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#fdfbf7" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <link rel="apple-touch-icon" href="/icons.svg" />
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Vintage Story Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
    
    <title>Matchalize — Your Campus. Your Story.</title>
    <script type="module" crossorigin src="/assets/index-CXnz5YEk.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-RMP8OLYs.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>

```

### client/dist/splash-bg.mp4
**Type:** `client/dist/splash-bg.mp4`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xf9 in position 35: invalid start byte
```

### client/dist/manifest.json
**Type:** JSON Configuration: manifest.json
**Size:** 21 lines (21 non-empty)

```
{
  "name": "Matchalize",
  "short_name": "Matchalize",
  "description": "Campus dating app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

```

### client/dist/lover.mp4
**Type:** `client/dist/lover.mp4`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xfa in position 35: invalid start byte
```

### client/dist/icons.svg
**Type:** `client/dist/icons.svg`
**Size:** 24 lines (24 non-empty)

```
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="bluesky-icon" viewBox="0 0 16 17">
    <g clip-path="url(#bluesky-clip)"><path fill="#08060d" d="M7.75 7.735c-.693-1.348-2.58-3.86-4.334-5.097-1.68-1.187-2.32-.981-2.74-.79C.188 2.065.1 2.812.1 3.251s.241 3.602.398 4.13c.52 1.744 2.367 2.333 4.07 2.145-2.495.37-4.71 1.278-1.805 4.512 3.196 3.309 4.38-.71 4.987-2.746.608 2.036 1.307 5.91 4.93 2.746 2.72-2.746.747-4.143-1.747-4.512 1.702.189 3.55-.4 4.07-2.145.156-.528.397-3.691.397-4.13s-.088-1.186-.575-1.406c-.42-.19-1.06-.395-2.741.79-1.755 1.24-3.64 3.752-4.334 5.099"/></g>
    <defs><clipPath id="bluesky-clip"><path fill="#fff" d="M.1.85h15.3v15.3H.1z"/></clipPath></defs>
  </symbol>
  <symbol id="discord-icon" viewBox="0 0 20 19">
    <path fill="#08060d" d="M16.224 3.768a14.5 14.5 0 0 0-3.67-1.153c-.158.286-.343.67-.47.976a13.5 13.5 0 0 0-4.067 0c-.128-.306-.317-.69-.476-.976A14.4 14.4 0 0 0 3.868 3.77C1.546 7.28.916 10.703 1.231 14.077a14.7 14.7 0 0 0 4.5 2.306q.545-.748.965-1.587a9.5 9.5 0 0 1-1.518-.74q.191-.14.372-.293c2.927 1.369 6.107 1.369 8.999 0q.183.152.372.294-.723.437-1.52.74.418.838.963 1.588a14.6 14.6 0 0 0 4.504-2.308c.37-3.911-.63-7.302-2.644-10.309m-9.13 8.234c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.894 0 1.614.82 1.599 1.82.001 1-.705 1.82-1.6 1.82m5.91 0c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.893 0 1.614.82 1.599 1.82 0 1-.706 1.82-1.6 1.82"/>
  </symbol>
  <symbol id="documentation-icon" viewBox="0 0 21 20">
    <path ...

(Showing first 1500 chars of 24 total lines)
```

### client/dist/favicon.svg
**Type:** `client/dist/favicon.svg`
**Size:** 1 lines (1 non-empty)

```
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" fill="none" viewBox="0 0 48 46"><path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" style="fill:#863bff;fill:color(display-p3 .5252 .23 1);fill-opacity:1"/><mask id="a" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z" style="fill:#000;fill-opacity:1"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#ede6ff" rx="5.508" ry="14.704" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#ede6ff" rx="10.399" ry="29.851" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -...

(Showing first 1500 chars of 1 total lines)
```

### client/dist/sw.js
**Type:** Client Source: sw
**Size:** 74 lines (65 non-empty)

```
const CACHE_NAME = 'matchalize-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let data = { title: 'Matchalize', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: data.vibrate || [100, 50, 100],
    data: data.data || {},
    tag: data.data?.type || 'notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (data.matchId) {
            client.navigate(`/chat/${data.matchId}`);
          } else if (data.type === 'match') {
            client.navigate('/matches');
          }
          return;
        }
      }
      // Open new window
      const url = data.matchId ? `/chat/${data.matchId}` : '/matches';
      return self.clients.openWindow(url);
    })
  );
});

```

### client/dist/assets/Profile-CAkUab1b.js
**Type:** Client Source: Profile-CAkUab1b
**Size:** 13 lines (13 non-empty)

```
import{n as e,t}from"./sparkle-DRVo6mU8.js";import{A as n,D as r,a as i,d as a,h as o,k as s,m as c,n as l,o as u,p as d,u as f}from"./index-CXnz5YEk.js";var p=i(`pencil`,[[`path`,{d:`M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z`,key:`1a8usu`}],[`path`,{d:`m15 5 4 4`,key:`1mk7zo`}]]),m=i(`settings`,[[`path`,{d:`M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915`,key:`1i5ecw`}],[`circle`,{cx:`12`,cy:`12`,r:`3`,key:`1v7zrd`}]]),h=n(s(),1),g=r(),_={color:{paper:`#fdfbf7`,surface:`#ffffff`,surfaceAlt:`#f4f1ea`,border:`#e0d8c8`,borderDark:`#d4c5a9`,ink:`#1a1a1a`,inkMuted:`#8c8275`,inkSoft:`#4a4a4a`,accent:`#8b4513`,crimson:`#8b1a1a`,shadowWarm:`rgba(139, 69, 19, 0.12)`,shadowDark:`rgba(26, 26, 26, 0.20)`},font:{display:`'Playfair Display', Georgia, serif`,body:`'Inter', -apple-system, sans-serif`}};function v(e=64){let t=[0,18,4,22,8,16,2,24,6,14,10,20],n=[`0% 100%`];for(let r=0;r<=e;r++){let i=(r/e*100).toFixed(2),a=t[r%t.length];n.push(`${i}% ${a}%`)}return n.push(`100% 100%`),`polygon(${n.join(`,`)})`}var y=v(),b={prompt_0:`1.4deg`,photo_1:`-2.2deg`,photo_2:`1.8deg`,prompt_1:`-1.1deg`,prompt_2:`0.5deg`,photo_3:`-0.7deg`},x=...

(Showing first 1500 chars of 13 total lines)
```

### client/dist/assets/ellipsis-vertical-CiDXpsY1.js
**Type:** Client Source: ellipsis-vertical-CiDXpsY1
**Size:** 1 lines (1 non-empty)

```
import{a as e}from"./index-CXnz5YEk.js";var t=e(`ellipsis-vertical`,[[`circle`,{cx:`12`,cy:`12`,r:`1`,key:`41hilf`}],[`circle`,{cx:`12`,cy:`5`,r:`1`,key:`gxeob9`}],[`circle`,{cx:`12`,cy:`19`,r:`1`,key:`lyex9k`}]]);export{t};
```

### client/dist/assets/sparkle-DRVo6mU8.js
**Type:** Client Source: sparkle-DRVo6mU8
**Size:** 1 lines (1 non-empty)

```
import{a as e}from"./index-CXnz5YEk.js";var t=e(`map-pin`,[[`path`,{d:`M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0`,key:`1r0f0z`}],[`circle`,{cx:`12`,cy:`10`,r:`3`,key:`ilqhr7`}]]),n=e(`sparkle`,[[`path`,{d:`M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z`,key:`1s2grr`}]]);export{t as n,n as t};
```

### client/dist/assets/Chat-B26Vxm3o.js
**Type:** Client Source: Chat-B26Vxm3o
**Size:** 38 lines (38 non-empty)

```
import{n as e,t}from"./sparkle-DRVo6mU8.js";import{A as n,D as r,O as i,a,c as o,d as s,f as c,h as l,i as u,k as d,l as f,m as p,n as m,o as h,s as g}from"./index-CXnz5YEk.js";var _=a(`check-check`,[[`path`,{d:`M18 6 7 17l-5-5`,key:`116fxf`}],[`path`,{d:`m22 10-7.5 7.5L13 16`,key:`ke71qq`}]]),v=a(`chevron-left`,[[`path`,{d:`m15 18-6-6 6-6`,key:`1wnfg3`}]]),ee=a(`image`,[[`rect`,{width:`18`,height:`18`,x:`3`,y:`3`,rx:`2`,ry:`2`,key:`1m3agn`}],[`circle`,{cx:`9`,cy:`9`,r:`2`,key:`af1f0g`}],[`path`,{d:`m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21`,key:`1xmnt7`}]]),y=a(`mic`,[[`path`,{d:`M12 19v3`,key:`npa21l`}],[`path`,{d:`M19 10v2a7 7 0 0 1-14 0v-2`,key:`1vc78b`}],[`rect`,{x:`9`,y:`2`,width:`6`,height:`13`,rx:`3`,key:`s6n7sd`}]]),te=a(`search`,[[`path`,{d:`m21 21-4.34-4.34`,key:`14j7rj`}],[`circle`,{cx:`11`,cy:`11`,r:`8`,key:`4ej97u`}]]),b=n(d(),1),x=r(),S={surface:`#ffffff`,surfaceAlt:`#f4f1ea`,border:`#e0d8c8`,borderDark:`#d4c5a9`,shadowWarm:`rgba(139, 69, 19, 0.15)`},C=({src:e,caption:t})=>(0,x.jsxs)(`div`,{style:{backgroundColor:S.surface,padding:`12px 12px 32px 12px`,borderRadius:`4px`,boxShadow:`0 8px 24px ${S.shadowWarm}, 0 2px 6px rgba(0,0,0,0.1)`,width:`240px`,border:`1px solid ${S.border}`,position:`relative`,transition:`transform 0.18s ease`},children:[(0,x.jsx)(`span`,{style:{position:`absolute`,top:0,left:0,width:20,height:20,background:S.surface,clipPath:`polygon(0 0, 100% 0, 0 100%)`,zIndex:3,boxShadow:`2px 2px 4px rgba(0,0,0,0.15)`}}),(0,x.jsx)(`span`,{style:{posit...

(Showing first 1500 chars of 38 total lines)
```

### client/dist/assets/index-RMP8OLYs.css
**Type:** `client/dist/assets/index-RMP8OLYs.css`
**Size:** 1 lines (1 non-empty)

```
:root{--color-ink:#2c2c2c;--color-faded-ink:#6b6b6b;--color-parchment:#fdfbf7;--color-paper-white:#fff;--color-leather:#8b4513;--color-leather-dark:#5e2e0e;--color-sepia-border:#d4c5a9;--color-wax-red:#8b0000;--font-heading:"Playfair Display", serif;--font-handwriting:"Dancing Script", cursive;--font-typewriter:"Special Elite", cursive;--font-system:"Inter", sans-serif}*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}html,body{background-color:var(--color-parchment);color:var(--color-ink);font-family:var(--font-typewriter);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;margin:0;padding:0;overflow-x:hidden}h1,h2,h3{font-family:var(--font-heading);color:var(--color-ink);margin:0}p,span,div{font-family:var(--font-typewriter)}.app-container{background-color:var(--color-parchment);max-width:430px;min-height:100dvh;margin:0 auto;position:relative;overflow:hidden;box-shadow:0 0 60px #00000014}.page-canvas{background:var(--color-parchment);flex-direction:column;justify-content:center;align-items:center;gap:16px;width:100%;height:100dvh;display:flex}.vintage-title{color:var(--color-ink);letter-spacing:-1px;font-size:48px;font-weight:700}.vintage-subtitle{color:var(--color-faded-ink);font-size:16px;font-style:italic}::-webkit-scrollbar{display:none}*{-ms-overflow-style:none;scrollbar-width:none}.switch{width:64px;height:34px;font-size:17px;display:inline-block;position:relative}.switch input{opacity:0;width:0;height:0}.slider{cursor:pointer;background-color:#73c0fc;border-radius:30px;transition:all .4s;position:absolute;inset:0}.slider:before{content:"";z-index:2;background-color:#e8e8e8;border-radius:20px;width:30px;height:30px;transition:all .4s;position:absolute;bottom:2px;left:2px}.sun svg{z-index:1;fill:#fff;width:24px;height:24px;animation:15s linear infinite rotate;position:absolute;top:6px;left:36px}.moon svg{fill:#73c0fc;z-index:1;width:24px;height:24px;animation:5s linear infinite tilt;position:absolute;top:5px;left:5px}@keyframes rotate{0%{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes tilt{0%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}to{transform:rotate(0)}}input:checked+.slider{background-color:#183153}input:checked+.slider:before{transform:translate(30px)}button{transition:transform .1s}button:active{transform:scale(.98)}

```

### client/dist/assets/Discover-CBLCyt6d.js
**Type:** Client Source: Discover-CBLCyt6d
**Size:** 289 lines (259 non-empty)

```
import{t as e}from"./ellipsis-vertical-CiDXpsY1.js";import{n as t,t as n}from"./sparkle-DRVo6mU8.js";import{A as r,C as i,D as a,E as o,O as s,S as c,T as l,_ as u,a as d,b as f,d as p,g as m,h,k as g,m as _,o as v,p as y,v as b,w as x,x as S,y as C}from"./index-CXnz5YEk.js";function w(...e){let t=!Array.isArray(e[0]),n=t?0:-1,r=e[0+n],i=e[1+n],a=e[2+n],o=e[3+n],s=S(i,a,o);return t?s(r):s}var T=r(g(),1);function E(e){let t=o(()=>f(e)),{isStatic:n}=(0,T.useContext)(m);if(n){let[,n]=(0,T.useState)(e);(0,T.useEffect)(()=>t.on(`change`,n),[])}return t}function D(e,t){let n=E(t()),r=()=>n.set(t());return r(),l(()=>{let t=()=>i.preRender(r,!1,!0),n=e.map(e=>e.on(`change`,t));return()=>{n.forEach(e=>e()),c(r)}}),n}function O(e){C.current=[],e();let t=D(C.current,e);return C.current=void 0,t}function k(e,t,n,r){if(typeof e==`function`)return O(e);if(n!==void 0&&!Array.isArray(n)&&typeof t!=`function`)return j(e,t,n,r);let i=typeof t==`function`?t:w(t,n,r),a=Array.isArray(e)?A(e,i):A([e],([e])=>i(e)),o=Array.isArray(e)?void 0:e.accelerate;return o&&!o.isTransformed&&typeof t!=`function`&&Array.isArray(n)&&r?.clamp!==!1&&(a.accelerate={...o,times:t,keyframes:n,isTransformed:!0,...r?.ease?{ease:r.ease}:{}}),a}function A(e,t){let n=o(()=>[]);return D(e,()=>{n.length=0;let r=e.length;for(let t=0;t<r;t++)n[t]=e[t].get();return t(n)})}function j(e,t,n,r){let i=o(()=>Object.keys(n)),a=o(()=>({}));for(let o of i)a[o]=k(e,t,n[o],r);return a}function M(e){e.values.forEach(e=>e.stop())}function ...

(Showing first 1500 chars of 289 total lines)
```

### client/dist/assets/index-CXnz5YEk.js
**Type:** Client Source: index-CXnz5YEk
**Size:** 62 lines (61 non-empty)

```
const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Discover-CBLCyt6d.js","assets/ellipsis-vertical-CiDXpsY1.js","assets/sparkle-DRVo6mU8.js","assets/Matches-BsshHyL9.js","assets/Chat-B26Vxm3o.js","assets/Profile-CAkUab1b.js"])))=>i.map(i=>d[i]);
var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(e){throw n=[e],e}},s=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t),e=null),t.exports),c=(e,n)=>{let r={};for(var i in e)t(r,i,{get:e[i],enumerable:!0});return n||t(r,Symbol.toStringTag,{value:`Module`}),r},l=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},u=(n,r,a)=>(a=n==null?{}:e(i(n)),l(r||!n||!n.__esModule?t(a,`default`,{value:n,enumerable:!0}):a,n)),d=e=>a.call(e,`module.exports`)?e[`module.exports`]:l(t({},`__esModule`,{value:!0}),e);(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.int...

(Showing first 1500 chars of 62 total lines)
```

### client/dist/assets/Matches-BsshHyL9.js
**Type:** Client Source: Matches-BsshHyL9
**Size:** 1 lines (1 non-empty)

```
import{t as e}from"./ellipsis-vertical-CiDXpsY1.js";import{A as t,D as n,c as r,d as i,k as a,l as o,m as s,p as c,r as l,s as u,t as d}from"./index-CXnz5YEk.js";var f=t(a(),1),p=n(),m=({onOpenChat:t})=>{let n=JSON.parse(localStorage.getItem(`matchalize_user`)||`{}`)?._id,a=o(),[m,h]=(0,f.useState)(``),[g,_]=(0,f.useState)(null),{data:v,isLoading:y}=r({queryKey:[`matches`],queryFn:()=>c.get(`/matches`)}),b=v?.matches||[];(0,f.useEffect)(()=>{let e=e=>{a.setQueryData([`matches`],t=>{if(!t?.matches)return t;let r=[...t.matches],i=r.findIndex(t=>t._id===e.matchId);if(i===-1)return t;let a={...r[i],lastMessage:{text:e.text,senderId:e.senderId,createdAt:e.createdAt,readAt:e.readAt??null,type:e.type,image:e.image},yourTurn:e.senderId!==n};return r.splice(i,1),r.unshift(a),{...t,matches:r}})};return u.on(`new-message`,e),()=>u.off(`new-message`,e)},[a,n]);let x=async e=>{if(_(null),window.confirm(`Are you sure you want to unmatch? This cannot be undone.`))try{await c.delete(`/matches/${e}`),a.setQueryData([`matches`],t=>({...t||{},matches:(t?.matches||[]).filter(t=>t._id!==e)}))}catch{alert(`Failed to unmatch. Try again.`)}},S=e=>{if(!e)return``;let t=new Date(e),n=(Date.now()-t.getTime())/1e3;return n<60?`now`:n<3600?`${Math.floor(n/60)}m`:n<86400?`${Math.floor(n/3600)}h`:n<172800?`Yesterday`:t.toLocaleDateString(void 0,{month:`short`,day:`numeric`})},C=e=>{if(!e)return``;let t=new Date(e),n=(Date.now()-t.getTime())/1e3;return n<3600?`${Math.floor(Math.max(n,1)/60)}m ago`:n<86400?`...

(Showing first 1500 chars of 1 total lines)
```

### client/public/splash-bg.mp4
**Type:** `client/public/splash-bg.mp4`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xf9 in position 35: invalid start byte
```

### client/public/manifest.json
**Type:** JSON Configuration: manifest.json
**Size:** 21 lines (21 non-empty)

```
{
  "name": "Matchalize",
  "short_name": "Matchalize",
  "description": "Campus dating app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

```

### client/public/lover.mp4
**Type:** `client/public/lover.mp4`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xfa in position 35: invalid start byte
```

### client/public/icons.svg
**Type:** `client/public/icons.svg`
**Size:** 24 lines (24 non-empty)

```
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="bluesky-icon" viewBox="0 0 16 17">
    <g clip-path="url(#bluesky-clip)"><path fill="#08060d" d="M7.75 7.735c-.693-1.348-2.58-3.86-4.334-5.097-1.68-1.187-2.32-.981-2.74-.79C.188 2.065.1 2.812.1 3.251s.241 3.602.398 4.13c.52 1.744 2.367 2.333 4.07 2.145-2.495.37-4.71 1.278-1.805 4.512 3.196 3.309 4.38-.71 4.987-2.746.608 2.036 1.307 5.91 4.93 2.746 2.72-2.746.747-4.143-1.747-4.512 1.702.189 3.55-.4 4.07-2.145.156-.528.397-3.691.397-4.13s-.088-1.186-.575-1.406c-.42-.19-1.06-.395-2.741.79-1.755 1.24-3.64 3.752-4.334 5.099"/></g>
    <defs><clipPath id="bluesky-clip"><path fill="#fff" d="M.1.85h15.3v15.3H.1z"/></clipPath></defs>
  </symbol>
  <symbol id="discord-icon" viewBox="0 0 20 19">
    <path fill="#08060d" d="M16.224 3.768a14.5 14.5 0 0 0-3.67-1.153c-.158.286-.343.67-.47.976a13.5 13.5 0 0 0-4.067 0c-.128-.306-.317-.69-.476-.976A14.4 14.4 0 0 0 3.868 3.77C1.546 7.28.916 10.703 1.231 14.077a14.7 14.7 0 0 0 4.5 2.306q.545-.748.965-1.587a9.5 9.5 0 0 1-1.518-.74q.191-.14.372-.293c2.927 1.369 6.107 1.369 8.999 0q.183.152.372.294-.723.437-1.52.74.418.838.963 1.588a14.6 14.6 0 0 0 4.504-2.308c.37-3.911-.63-7.302-2.644-10.309m-9.13 8.234c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.894 0 1.614.82 1.599 1.82.001 1-.705 1.82-1.6 1.82m5.91 0c-.878 0-1.599-.82-1.599-1.82 0-.998.705-1.82 1.6-1.82.893 0 1.614.82 1.599 1.82 0 1-.706 1.82-1.6 1.82"/>
  </symbol>
  <symbol id="documentation-icon" viewBox="0 0 21 20">
    <path ...

(Showing first 1500 chars of 24 total lines)
```

### client/public/favicon.svg
**Type:** `client/public/favicon.svg`
**Size:** 1 lines (1 non-empty)

```
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" fill="none" viewBox="0 0 48 46"><path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" style="fill:#863bff;fill:color(display-p3 .5252 .23 1);fill-opacity:1"/><mask id="a" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z" style="fill:#000;fill-opacity:1"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#ede6ff" rx="5.508" ry="14.704" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#ede6ff" rx="10.399" ry="29.851" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -...

(Showing first 1500 chars of 1 total lines)
```

### client/public/sw.js
**Type:** Client Source: sw
**Size:** 74 lines (65 non-empty)

```
const CACHE_NAME = 'matchalize-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let data = { title: 'Matchalize', body: 'You have a new notification' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    vibrate: data.vibrate || [100, 50, 100],
    data: data.data || {},
    tag: data.data?.type || 'notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (data.matchId) {
            client.navigate(`/chat/${data.matchId}`);
          } else if (data.type === 'match') {
            client.navigate('/matches');
          }
          return;
        }
      }
      // Open new window
      const url = data.matchId ? `/chat/${data.matchId}` : '/matches';
      return self.clients.openWindow(url);
    })
  );
});

```

### client/src/index.css
**Type:** `client/src/index.css`
**Size:** 178 lines (156 non-empty)

```
/* ==========================================
   MATCHALIZE: THE SUNLIT LIBRARY THEME
   ========================================== */

:root {
  /* The Ink & Paper Palette */
  --color-ink: #2c2c2c;
  --color-faded-ink: #6b6b6b;
  --color-parchment: #fdfbf7;
  --color-paper-white: #ffffff;
  --color-leather: #8b4513;
  --color-leather-dark: #5e2e0e;
  --color-sepia-border: #d4c5a9;
  --color-wax-red: #8b0000;
  
  /* Typography */
  --font-heading: 'Playfair Display', serif;
  --font-handwriting: 'Dancing Script', cursive;
  --font-typewriter: 'Special Elite', cursive;
  --font-system: 'Inter', sans-serif;
}

/* Global Resets */
* {
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--color-parchment);
  color: var(--color-ink);
  font-family: var(--font-typewriter);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

h1, h2, h3 {
  font-family: var(--font-heading);
  color: var(--color-ink);
  margin: 0;
}

p, span, div {
  font-family: var(--font-typewriter);
}

/* The Book Frame (App Container) */
.app-container {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;
  position: relative;
  background-color: var(--color-parchment);
  /* Subtle shadow to make it feel like a physical screen/pages */
  box-shadow: 0 0 60px rgba(0,0,0,0.08);
  overflow: hidden;
}

/* Temporary Canvas Styling (To verify it works) */
.page-canvas {
  widt...

(Showing first 1500 chars of 178 total lines)
```

### client/src/main.jsx
**Type:** Client Source: mainx
**Size:** 19 lines (17 non-empty)

```
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react';
import './index.css'
import App from './App.jsx'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

```

### client/src/App.jsx
**Type:** Client Source: Appx
**Size:** 105 lines (96 non-empty)

```
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { AppConfigProvider } from './utils/AppConfigContext';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Splash from './pages/Splash.jsx';
import Auth from './pages/Auth.jsx';
import Onboarding from './pages/Onboarding.jsx';
import AppShell from './components/AppShell';
import socket from './utils/socket';
import ArchivalToast from './components/ArchivalToast.jsx';

function AppInner() {
  const { logout } = useAuth();
  const [screen, setScreen] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('matchalize_user') || '{}');
      if (user && user._id) {
        // If they are logged in but haven't onboarded, force them to onboarding
        return user.isOnboarded ? 'home' : 'onboarding';
      }
      return 'splash';
    } catch {
      return 'splash';
    }
  });

  const handleSignOut = () => {
    if (socket) socket.disconnect(); // Disconnect real-time connection
    logout();
    setScreen('splash');
  };

  return (
    <main style={{ 
      maxWidth: '430px', 
      margin: '0 auto', 
      minHeight: '100dvh', // 📱 NATIVE FLEX: Allows Safari to compress cleanly when keyboard slides up
      backgroundColor: '#f4f1ea', 
      boxShadow: '0 0 60px rgba(0,0,0,0.08)', 
      display: 'fl...

(Showing first 1500 chars of 105 total lines)
```

### client/src/utils/AppConfigContext.jsx
**Type:** Client Source: AppConfigContextx
**Size:** 93 lines (83 non-empty)

```
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from './api';
import { theme as design } from './theme';

const AppConfigContext = createContext(null);

export const useAppConfig = () => useContext(AppConfigContext);

export const AppConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.get('/config');
        setConfig(data);
      } catch (err) {
        console.error('Failed to load app config:', err);
        setError(err.message);
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setLoading(false);
      }
    };
    
    fetchConfig();
    
    // Timeout after 10 seconds
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setError('Config load timed out');
        setLoading(false);
      }
    }, 10000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!config && loading) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#000', color: '#fff',
        fontFamily: 'Geist, sans-serif', fontSize: '14px',
      }}>
        Loading...
      </div>
    );
  }

  if (!config && error) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px',
        background: '#000', color: '#fff',
        fontFamily: 'Geist, sans-serif', fontSize: '14px',
        padding: '24px', textAlign: 'center',
      }}>
        <span>Failed to load application config.</span>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px', borderRadius: design.radius.md,
            border: '1px solid rgba(249,115,22,0.3)',
            background: 'rgba(249,115,22,0.1)',
            color: '#f97316', cursor: 'pointer',
            fontWeight: '600', fontFamily: 'Geist, sans-serif',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
};

```

### client/src/utils/AuthContext.jsx
**Type:** Client Source: AuthContextx
**Size:** 45 lines (36 non-empty)

```
import React, { createContext, useContext, useState, useCallback } from 'react';
import { API_BASE } from './api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const USER_KEY = 'matchalize_user';

function loadInitialState() {
  try {
    const userRaw = localStorage.getItem(USER_KEY);
    if (userRaw) {
      return { user: JSON.parse(userRaw) };
    }
  } catch {}
  return { user: null };
}

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(loadInitialState());

  const isAuthenticated = !!state.user;

  const login = useCallback((user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setState({ user: null });
    // Clear httpOnly cookie server-side
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user: state.user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

```

### client/src/utils/haptics.js
**Type:** Client Source: haptics
**Size:** 33 lines (31 non-empty)

```
/**
 * src/utils/haptics.js
 * A safe wrapper for the native Navigator.vibrate API.
 */

export const triggerHaptic = (style = 'light') => {
  // Defensive check: Ensure we are in a browser environment and the API is supported
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
    return;
  }

  try {
    switch (style) {
      case 'light':
        // A subtle, quick tap (e.g., opening a menu, switching tabs)
        window.navigator.vibrate(10);
        break;
      case 'medium':
        // A standard confirmation tap (e.g., sending a message, advancing a step)
        window.navigator.vibrate(30);
        break;
      case 'heavy':
        // A stronger, definitive thud (e.g., destructive actions, errors, successful match)
        window.navigator.vibrate(50);
        break;
      default:
        window.navigator.vibrate(10);
    }
  } catch (error) {
    // Silently catch any permission or hardware constraint errors
    console.warn('Haptics blocked or unsupported by device context.');
  }
};

```

### client/src/utils/dummyProfiles.js
**Type:** Client Source: dummyProfiles
**Size:** 244 lines (243 non-empty)

```
const profiles = [
  {
    id: 1,
    name: "Swastika",
    age: 21,
    branch: "CSE",
    year: "3rd Year",
    city: "Delhi",
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=700&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=700&fit=crop",
    ],
    bio: "A curious soul who believes every conversation is a new chapter. I spend my days in lecture halls and my evenings in bookstores.",
    prompts: [
      { question: "My happy place is a quiet café with a good book and rain outside.", photo: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=100&h=130&fit=crop" },
      { question: "One thing I can't live without — my morning playlist.", photo: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=130&fit=crop" },
      { question: "I'm looking for someone who can match my chaos.", photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=130&fit=crop" },
    ],
    interests: ["Music", "Art", "Travel", "Cooking", "Photography"],
    about: [
      { q: "Best weekend activity?", a: "Hiking in the hills with a camera." },
      { q: "Ideal first date?", a: "A walk through a good bookstore." },
      { q: "Something I'm proud of", a: "Learning to play the ukulele." },
    ],
  },
  {
    id: 2,
    name: "Arjun",
    age: 22,
    branch: "Mechanical",
    year: "4th Year",
    city: "Mumbai",
    photos: [
      "https://images.unsplash.com/photo-...

(Showing first 1500 chars of 244 total lines)
```

### client/src/utils/theme.js
**Type:** Client Source: theme
**Size:** 27 lines (27 non-empty)

```
export const theme = {
  color: {
    bg: '#f4f1ea',
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    ink: '#1a1a1a',
    inkMuted: '#8c8275',
    border: '#e0d8c8',
    borderDark: '#d4c5a9',
    crimson: '#8b1a1a',
    accent: '#8b4513',
  },
  font: {
    heading: "'Playfair Display', serif",
    body: "'Inter', sans-serif",
  },
  texture: {
    grain:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E",
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '24px',
  },
};

```

### client/src/utils/socket.js
**Type:** Client Source: socket
**Size:** 9 lines (7 non-empty)

```
import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket'],
});

export default socket;

```

### client/src/utils/push.js
**Type:** Client Source: push
**Size:** 76 lines (63 non-empty)

```
import { api } from './api';

let registration = null;

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('Service Worker registered');
    return registration;
  } catch (error) {
    console.error('SW registration failed:', error);
    return null;
  }
};

export const subscribeToPush = async () => {
  if (!registration) {
    registration = await registerServiceWorker();
  }
  if (!registration) return null;

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) return subscription;

    // Get VAPID key
    const { publicKey } = await api.get('/notifications/vapid-key');
    if (!publicKey) return null;

    // Convert VAPID key
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Save subscription to server
    await api.post('/notifications/subscribe', { subscription });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
};

export const unsubscribeFromPush = async () => {
  if (!registration) return;

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await api.delete('/notifications/subscribe');
    }
  } catch (error) {
    console.error('Push unsubscribe failed:', error);
  }
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

```

### client/src/utils/useChat.js
**Type:** Client Source: useChat
**Size:** 77 lines (65 non-empty)

```
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from './api';

const getMe = () => {
  try {
    return JSON.parse(localStorage.getItem('matchalize_user'))?._id || null;
  } catch {
    return null;
  }
};

export const useChat = (matchId) => {
  const [messages, setMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Use a ref to track pending messages without triggering socket reconnections
  const pendingRef = useRef(pendingMessages);
  useEffect(() => {
    pendingRef.current = pendingMessages;
  }, [pendingMessages]);

  // Hoisted above the socket effect so the dependency array below can reference it
  // without hitting the temporal-dead-zone (it is a const declared later in the original).
  const sendMessage = useCallback(async (text) => {
    const me = getMe();
    const tempId = Date.now().toString();
    const tempMsg = { _id: tempId, text, deliveryStatus: 'pending', senderId: me };

    if (!isConnected) {
      setPendingMessages(prev => [...prev, tempMsg]);
      return;
    }

    setMessages(prev => [...prev, tempMsg]);
    try {
      const sent = await api.post(`/messages/${matchId}`, { text, clientMsgId: crypto.randomUUID() });
      setMessages(prev => prev.map(m => m._id === tempId ? { ...sent, deliveryStatus: sent.deliveryStatus || 'sent' } : m));
    } catch {
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, deliveryStatus: 'failed' } : m));
    }
  }, [matchId, isConnected]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.get(`/messages/${matchId}`);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('History fetch failed', err);
      }
    };
    fetchHistory();
  }, [matchId]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { withCredentials: true, transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-match', matchId);
      // Flush pending queue using ref to avoid dependency loops
      pendingRef.current.forEach(msg => sendMessage(msg.text));
      setPendingMessages([]);
    });

    socketRef.current.on('new-message', (msg) => {
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
    });

    return () => socketRef.current.disconnect();
  }, [matchId, sendMessage]); // Added sendMessage to deps

  return { messages, sendMessage, isConnected };
};

```

### client/src/utils/api.js
**Type:** Client Source: api
**Size:** 85 lines (75 non-empty)

```
import { toast } from './toast';

const apiHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '5005';
const isLocalhost = apiHostname === 'localhost' || apiHostname === '127.0.0.1';
const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiHostname);
const isDev = isLocalhost || isPrivateIP;
export const API_BASE = import.meta.env.VITE_API_URL || (isDev ? `http://${apiHostname}:${API_PORT}` : window.location.origin);
const BASE_URL = `${API_BASE}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;

const handleResponse = async (response) => {
  // 401 or 403 (suspended): Session expired or account suspended — redirect
  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    localStorage.removeItem('matchalize_user');
    if (errorData.suspended) {
      toast.error('Your account has been suspended. Please contact support.');
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
    throw new Error(errorData.message || 'Unauthorized');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || 'Something went wrong';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }

  return data;
};

export const api = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  put: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  delete: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse(res);
  },

  upload: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};

```

### client/src/utils/toast.js
**Type:** Client Source: toast
**Size:** 17 lines (15 non-empty)

```
let toastCallback = null;

export const setToastHandler = (callback) => {
  toastCallback = callback;
};

export const toast = {
  success: (message, action) => {
    if (toastCallback) toastCallback({ type: 'success', message, action });
  },
  error: (message, action) => {
    if (toastCallback) toastCallback({ type: 'error', message, action });
  },
  info: (message, action) => {
    if (toastCallback) toastCallback({ type: 'info', message, action });
  }
};

```

### client/src/components/Header.jsx
**Type:** Client Components: Header
**Size:** 290 lines (270 non-empty)

```
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import socket from '../utils/socket';
import NotificationDrawer from './NotificationDrawer';
import { theme as design } from '../utils/theme';
import { Bell } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

const Header = ({ onNavigate, onSelectMatch, title }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const queryClient = useQueryClient();

  const { data: unreadData, refetch } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: () => api.get('/notifications/unread-count'),
    refetchInterval: 30000, // Silently refetch every 30s
  });
  const unreadCount = unreadData?.count || 0;

  // Refetch when the drawer closes to update badge
  useEffect(() => {
    if (!drawerOpen) {
      refetch();
    }
  }, [drawerOpen, refetch]);

  // Real-time incoming letter listener
  useEffect(() => {
    const handleNewLetter = (data) => {
      queryClient.setQueryData(['unread-notifications-count'], (old) => ({
        ...(old || {}),
        count: (old?.count || 0) + 1,
      }));
      
      triggerHaptic('heavy');
      setToast(`${data?.senderName || 'An anonymous subject'} sent you a letter.`);
    };

    socket.on('new-letter', handleNewLetter);
    return () => sock...

(Showing first 1500 chars of 290 total lines)
```

### client/src/components/ArchivalToast.jsx
**Type:** Client Components: Archivaltoast
**Size:** 103 lines (97 non-empty)

```
import React, { useState, useEffect } from 'react';
import { setToastHandler } from '../utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { theme as design } from '../utils/theme';

const ArchivalToast = () => {
  const [toast, setToast] = useState(null);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    setToastHandler((newToast) => {
      setToast(newToast);
      if (!newToast.action) {
        const t = setTimeout(() => setToast(null), 4000);
        setTimer(t);
      } else {
        if (timer) clearTimeout(timer);
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
      setToastHandler(null);
    };
  }, [timer]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={20} color={design.color.success || '#2e7d32'} />,
    error: <AlertCircle size={20} color={design.color.crimson} />,
    info: <Info size={20} color={design.color.accent} />,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          backgroundColo...

(Showing first 1500 chars of 103 total lines)
```

### client/src/components/ProfileCard.jsx
**Type:** Client Components: Profilecard
**Size:** 362 lines (321 non-empty)

```
import React, { useState, useEffect, useRef } from 'react';
import PopoutItem from './PopoutItem';
import { theme as design } from '../utils/theme';
import { Sparkle, MapPin, MoreVertical, Award, Calendar } from 'lucide-react';

/* ==================================================================
   MUSEUM-GRADE ARCHIVAL SYSTEM
================================================================== */
const theme = {
  color: {
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    border: '#e0d8c8',
    ink: '#1a1a1a',
    inkSoft: '#4a4a4a',
    accent: '#8b4513',
    crimson: '#8b1a1a',
    shadowWarm: 'rgba(139, 69, 19, 0.12)',
  },
  font: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },
};

// Static, optimized deckle edge
const TORN_EDGE_CLIP = 'polygon(0% 100%, 2% 80%, 4% 95%, 6% 85%, 8% 100%, 10% 80%, 12% 95%, 14% 85%, 16% 100%, 18% 80%, 20% 95%, 22% 85%, 24% 100%, 26% 80%, 28% 95%, 30% 85%, 32% 100%, 34% 80%, 36% 95%, 38% 85%, 40% 100%, 42% 80%, 44% 95%, 46% 85%, 48% 100%, 50% 80%, 52% 95%, 54% 85%, 56% 100%, 58% 80%, 60% 95%, 62% 85%, 64% 100%, 66% 80%, 68% 95%, 70% 85%, 72% 100%, 74% 80%, 76% 95%, 78% 85%, 80% 100%, 82% 80%, 84% 95%, 86% 85%, 88% 100%, 90% 80%, 92% 95%, 94% 85%, 96% 100%, 98% 80%, 100% 100%)';

function matchStatus(score) {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 65) return 'High Compatibilit...

(Showing first 1500 chars of 362 total lines)
```

### client/src/components/ErrorBoundary.jsx
**Type:** Client Components: Errorboundary
**Size:** 182 lines (171 non-empty)

```
import React from 'react';
import * as Sentry from '@sentry/react';
import { theme as design } from '../utils/theme';
import { FileWarning, RotateCw } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME SYSTEM (Localized for crash resilience)
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Matchalize UI Error:', error, errorInfo);
    try {
      Sentry.captureException(error, { extra: errorInfo });
    } catch {
      // Sentry not initialized (no DSN) — safe to ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          backgroundColor: theme.paper,
          position: 'relative',
          overflow: 'hidden',
          contain: 'strict',
        }}>
          {/* G...

(Showing first 1500 chars of 182 total lines)
```

### client/src/components/Skeleton.jsx
**Type:** Client Components: Skeleton
**Size:** 55 lines (51 non-empty)

```
import React from 'react';
import { theme } from '../utils/theme';

export const SkeletonBox = ({ width, height, radius = theme.radius?.sm || '4px' }) => (
  <div 
    className="archival-skeleton"
    aria-hidden="true"
    style={{
      width, 
      height, 
      borderRadius: radius,
      backgroundColor: theme.color?.surfaceAlt || '#f4f1ea',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      contain: 'paint layout', // Isolates DOM calculations
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)', // Subtle depth
    }}
  >
    {/* 
      We attach the animation to a global class. The pseudo-element sweeps a 
      specular highlight across the box using hardware-accelerated transforms. 
    */}
    <style>{`
      .archival-skeleton::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg, 
          transparent 0%, 
          rgba(255, 255, 255, 0.4) 50%, 
          transparent 100%
        );
        animation: skeleton-shimmer 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
        will-change: transform;
      }
      
      @keyframes skeleton-shimmer {
        0% { transform: translate3d(-100%, 0, 0); }
        100% { transform: translate3d(100%, 0, 0); }
      }
      
      @media (prefers-reduced-motion: reduce) {
        .archival-skeleton::after {
          animation: none !important;
          background: rgba(255, 255, 255, 0.2);
          transform: translate3d(0, 0, 0);
        }
      }
    `}</style>
  </div>
);

export default SkeletonBox;
```

### client/src/components/CassettePlayer.jsx
**Type:** Client Components: Cassetteplayer
**Size:** 132 lines (121 non-empty)

```
import React, { useRef, useState } from 'react';

const CassettePlayer = ({ audioUrl }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setCurrentTime(audio.currentTime);
      setProgress(audio.currentTime / audio.duration);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div
      style={{
        backgroundColor: '#fffcf5',
        border: '1.5px solid #d4af37',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '260px',
        boxShadow: '0 4px 10px rgba(212, 175, 55, 0.12)',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes cassetteSpin {
          from { transform: rotate...

(Showing first 1500 chars of 132 total lines)
```

### client/src/components/ProfileCardSkeleton.jsx
**Type:** Client Components: Profilecardskeleton
**Size:** 151 lines (137 non-empty)

```
import React from 'react';
import { theme as design } from '../utils/theme';

const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  borderDark: '#d4c5a9',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

// Deterministic variable-tooth deckle edge (Matches ProfileCard exactly)
function buildTornEdge(teeth = 64) {
  const heights = [0, 18, 4, 22, 8, 16, 2, 24, 6, 14, 10, 20];
  const pts = ['0% 100%'];
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100).toFixed(2);
    const y = heights[i % heights.length];
    pts.push(`${x}% ${y}%`);
  }
  pts.push('100% 100%');
  return `polygon(${pts.join(',')})`;
}
const TORN_EDGE_CLIP = buildTornEdge();

const ProfileCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: theme.paper,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderRadius: '0 16px 16px 0',
        overflow: 'hidden',
        boxShadow: `-15px 0 40px ${theme.shadowWarm}`,
        contain: 'paint layout style', // Isolates DOM calculations
      }}
    >
      {/* GPU Promoted Zero-Lag Shimmer Engine */}
      <style>{`
        .pc-skeleton-shimmer {
          position: relative;
          overflow: hidden;
          background-color: ${theme.surfaceAlt};
        }
        
        .pc-skeleton-shimmer::after {
          content: '';
          position: absolute;
          inse...

(Showing first 1500 chars of 151 total lines)
```

### client/src/components/NotificationDrawer.jsx
**Type:** Client Components: Notificationdrawer
**Size:** 470 lines (429 non-empty)

```
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { ArrowLeft, X, Mail, Send } from 'lucide-react';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';

/* ==================================================================
   ARCHIVAL THEME SYSTEM
================================================================== */
const theme = {
  color: {
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    border: '#e0d8c8',
    borderDark: '#d4c5a9',
    ink: '#1a1a1a',
    inkMuted: '#8c8275',
    accent: '#8b4513',
    crimson: '#8b1a1a',
    telegramTint: 'rgba(212, 175, 55, 0.08)', 
    shadowWarm: 'rgba(139, 69, 19, 0.08)',
    shadowDark: 'rgba(26, 26, 26, 0.20)',
  }
};

const TORN_EDGE_CLIP = 'polygon(0% 100%, 1.56% 18%, 3.12% 4%, 4.69% 22%, 6.25% 8%, 7.81% 16%, 9.38% 2%, 10.94% 24%, 12.50% 6%, 14.06% 14%, 15.62% 10%, 17.19% 20%, 18.75% 0%, 20.31% 18%, 21.88% 4%, 23.44% 22%, 25.00% 8%, 26.56% 16%, 28.12% 2%, 29.69% 24%, 31.25% 6%, 32.81% 14%, 34.38% 10%, 35.94% 20%, 37.50% 0%, 39.06% 18%, 40.62% 4%, 42.19% 22%, 43.75% 8%, 45.31% 16%, 46.88% 2%, 48.44% 24%, 50.00% 6%, 51.56% 14%, 53.12% 10%, 54.69% 20%, 56.25% 0%, 57.81% 18%, 59.38% 4%, 60.94% 22%, 62.50% 8%, 64.06% 16%, 65.62% 2%, 67.19% 24%, 68.75% 6%, 70.31% 14%, 71.88% 10%, 73.44% 20%, 75.00% 0%, 76.56% 18%, 78.12% 4%, 79.69% 22%, 81.25% 8%, 82.81% 16%, 8...

(Showing first 1500 chars of 470 total lines)
```

### client/src/components/Icon.jsx
**Type:** Client Components: Icon
**Size:** 39 lines (36 non-empty)

```
import React, { forwardRef, memo } from 'react';

const Icon = forwardRef(({ 
  path, 
  size = 20, 
  color = 'currentColor', 
  strokeWidth = 1.8, 
  fill = 'none',
  className = '',
  style = {},
  ...props 
}, ref) => (
  <svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true" // Defers screen-reader announcements to parent buttons
    className={className}
    style={{ 
      display: 'block', 
      flexShrink: 0, // Prevents SVG squishing in tight flex layouts
      ...style 
    }}
    {...props}
  >
    {path}
  </svg>
));

// Display name required when using forwardRef + memo
Icon.displayName = 'Icon';

export default memo(Icon);
```

### client/src/components/PopoutItem.jsx
**Type:** Client Components: Popoutitem
**Size:** 299 lines (273 non-empty)

```
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { Flower, Mail, ArrowUp } from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
};

const GRAIN_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E`;

const PopoutItem = ({ children, targetId, onAction, type, style }) => {
  const [isPopped, setIsPopped] = useState(false);
  const [rect, setRect] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [actionSent, setActionSent] = useState(false);
  const [showSeal, setShowSeal] = useState(false);
  const [showInput, setShowInput] = useState(false);
  
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const pressTimer = useRef(null);
  const itemRef = useRef(null);

  const updateRect = useCallback(() => {
    if (itemRef.curr...

(Showing first 1500 chars of 299 total lines)
```

### client/src/components/NavBar.jsx
**Type:** Client Components: Navbar
**Size:** 296 lines (282 non-empty)

```
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { Compass, Heart, User } from 'lucide-react';

/* ==================================================================
   MUSEUM-GRADE ARCHIVAL CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const tabs = [
  { key: 'discover', label: 'Discover', Icon: Compass, subtext: 'Archive' },
  { key: 'matches', label: 'Matches', Icon: Heart, subtext: 'Synergy' },
  { key: 'profile', label: 'Profile', Icon: User, subtext: 'Subject' },
];

/* ==================================================================
   MAIN NAVBAR COMPONENT
================================================================== */
const NavBar = ({ activeTab, onTabChange, matchBadge = 0 }) => {
  
  const handleTabClick = (key) => {
    if (activeTab !== key) {
      triggerHaptic('light');
      onTabChange(key);
    }
  };

  return (
    <div style={styles.navContainer}>
      {/* Physical Archival Cotton-Rag Grain */}
      <div aria-hidden="true" style={styles.paperGrain} />
      
      {/* Dual Archival Binding Seam (Top Border + Stitching...

(Showing first 1500 chars of 296 total lines)
```

### client/src/components/PolaroidCard.jsx
**Type:** Client Components: Polaroidcard
**Size:** 338 lines (296 non-empty)

```
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import PopoutItem from './PopoutItem';
import { useAppConfig } from '../utils/AppConfigContext';
import { theme as design } from '../utils/theme';
import { Sparkle, MapPin, MoreVertical, Award, Calendar } from 'lucide-react';

/* ==================================================================
   MUSEUM-GRADE ARCHIVAL SYSTEM
================================================================== */
const theme = {
  color: {
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    border: '#e0d8c8',
    ink: '#1a1a1a',
    inkSoft: '#4a4a4a',
    accent: '#8b4513',
    crimson: '#8b1a1a',
    shadowWarm: 'rgba(139, 69, 19, 0.12)',
  },
  font: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, sans-serif",
    typewriter: "'Special Elite', 'Courier New', monospace",
  },
};

// Static, optimized deckle edge
const TORN_EDGE_CLIP = 'polygon(0% 100%, 2% 80%, 4% 95%, 6% 85%, 8% 100%, 10% 80%, 12% 95%, 14% 85%, 16% 100%, 18% 80%, 20% 95%, 22% 85%, 24% 100%, 26% 80%, 28% 95%, 30% 85%, 32% 100%, 34% 80%, 36% 95%, 38% 85%, 40% 100%, 42% 80%, 44% 95%, 46% 85%, 48% 100%, 50% 80%, 52% 95%, 54% 85%, 56% 100%, 58% 80%, 60% 95%, 62% 85%, 64% 100%, 66% 80%, 68% 95%, 70% 85%, 72% 100%, 74% 80%, 76% 95%, 78% 85%, 80% 100%, 82% 80%, 84% 95%, 86% 85%, 88% 100%, 90% 80%, 92% 95%, 94% 85%, 96% 100%, 98% 80%, 100% 100%)';...

(Showing first 1500 chars of 338 total lines)
```

### client/src/components/AppShell.jsx
**Type:** Client Components: Appshell
**Size:** 208 lines (192 non-empty)

```
import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from './Header';
import NavBar from './NavBar';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { SkeletonBox } from './Skeleton';
import { theme as design } from '../utils/theme';

// Lazy loaded routes
const Discover = lazy(() => import('../pages/Discover'));
const Matches = lazy(() => import('../pages/Matches'));
const Chat = lazy(() => import('../pages/Chat'));
const Profile = lazy(() => import('../pages/Profile'));

/* ==================================================================
   ARCHIVAL THEME FALLBACK
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  borderDark: '#d4c5a9',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

// Zero-Lag Cinematic Loading State
const ArchivalFallback = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    style={{ 
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper, 
      zIndex: 10, contain: 'strict'
    }}
  >
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url("${design?.texture?.grain || ''}")`, mixBlendMode: 'm...

(Showing first 1500 chars of 208 total lines)
```

### client/src/components/chat/MessageBubble.jsx
**Type:** Client Components: Messagebubble
**Size:** 272 lines (256 non-empty)

```
import React, { useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Check, CheckCheck } from 'lucide-react';
import PolaroidCard from '../PolaroidCard';
import CassettePlayer from '../CassettePlayer';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7', 
  surface: '#ffffff', 
  surfaceAlt: '#f4f1ea', 
  border: '#e0d8c8', 
  borderDark: '#d4c5a9',
  ink: '#1a1a1a', 
  inkMuted: '#8c8275', 
  accent: '#8b4513', 
  crimson: '#8b1a1a', 
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const MessageBubble = ({ 
  message, 
  isMine, 
  time, 
  receipt, 
  onLongPress, 
  onImageClick, 
  replyPreview 
}) => {
  const pressTimer = useRef(null);
  const [isPressed, setIsPressed] = useState(false);

  // Tactile Long Press Engine
  const startPress = (e) => {
    // Prevent menu trigger if user is interacting with media cards directly
    if (e.target.closest('[data-no-longpress]')) return;
    
    pressTimer.current = setTimeout(() => {
      triggerHaptic('medium');
      setIsPressed(true);
      onLongPress(message, e);
      setTimeout(() => setIsPressed(false), 250);
    }, 400); // 400ms aligns with native iOS/Android long-press timing
  };

  const cancelPress = () => {
    if (pressTime...

(Showing first 1500 chars of 272 total lines)
```

### client/src/components/chat/ReplyPreview.jsx
**Type:** Client Components: Replypreview
**Size:** 176 lines (165 non-empty)

```
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { Image, Mic, X } from 'lucide-react';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const ReplyPreview = ({ replyTo, otherName, onCancel }) => {
  if (!replyTo) return null;

  // Truncate text cleanly and assign proper iconography for media
  const previewText = replyTo.text
    ? replyTo.text.slice(0, 60) + (replyTo.text.length > 60 ? '…' : '')
    : replyTo.type === 'image'
    ? <><Image size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Photograph</>
    : replyTo.type === 'audio'
    ? <><Mic size={14} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} /> Voice Note</>
    : 'Letter';

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        backgroundColor: theme.surfaceAlt,
        borderTop: ...

(Showing first 1500 chars of 176 total lines)
```

### client/src/components/chat/PhotoViewer.jsx
**Type:** Client Components: Photoviewer
**Size:** 184 lines (172 non-empty)

```
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { X } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
};

// GPU-Promoted, Memoized Archival Corner Mounts
const CornerMounts = React.memo(() => (
  <>
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(0 0, 100% 0, 0 100%)', zIndex: 3, filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(100% 0, 0 0, 100% 100%)', zIndex: 3, filter: 'drop-shadow(-1px 1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, background: '#fff', clipPath: 'polygon(0 100%, 100% 100%, 0 0)', zIndex: 3, filter: 'drop-shadow(1px -1px 2px rgba(0,0,0,0.15))' }} />
    <span aria-hidden="true" style={{ position: 'absolute', bot...

(Showing first 1500 chars of 184 total lines)
```

### client/src/components/chat/MessageActionMenu.jsx
**Type:** Client Components: Messageactionmenu
**Size:** 197 lines (184 non-empty)

```
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = { 
  paper: '#fdfbf7', 
  surface: '#ffffff', 
  surfaceAlt: '#f4f1ea', 
  border: '#e0d8c8', 
  borderDark: '#d4c5a9', 
  ink: '#1a1a1a', 
  inkMuted: '#8c8275', 
  accent: '#8b4513', 
  crimson: '#8b1a1a', 
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
  shadowDark: 'rgba(26, 26, 26, 0.20)',
};

// Zero-Lag Memoized Icon Component
const Icon = memo(({ path, size = 20, color = theme.ink, strokeWidth = 1.8 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ display: 'block', flexShrink: 0 }}
  >
    {path}
  </svg>
));
Icon.displayName = 'Icon';

const actions = [
  { key: 'reply', label: 'Reply', haptic: 'light', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: false, path: <><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></> },
  { key: 'react', label: 'React', haptic: 'light', hideIfMedia: false, hideIfMine: false, showOnlyIfMine: false, path: <><ci...

(Showing first 1500 chars of 197 total lines)
```

### client/src/components/chat/ReportModal.jsx
**Type:** Client Components: Reportmodal
**Size:** 306 lines (291 non-empty)

```
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE } from '../../utils/api';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { toast } from '../../utils/toast';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};



const Icon = ({ path, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const ReportModal = ({ reportedUserId, onClose, onReported }) => {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadReasons = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/report/reasons`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setReasons(data.reasons || []);
        }
      } catch (err) {
        console.error('Failed to fetch report reason...

(Showing first 1500 chars of 306 total lines)
```

### client/src/components/chat/SearchOverlay.jsx
**Type:** Client Components: Searchoverlay
**Size:** 298 lines (284 non-empty)

```
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';
import { ChevronLeft, Search, XCircle } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const SearchOverlay = ({ messages, myId, onClose, onJumpTo }) => {
  const [query, setQuery] = useState('');

  // Memoized Search Engine
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return messages
      .filter((m) => !m.deleted && m.text && m.text.toLowerCase().includes(q))
      .slice(-50) // Cap at 50 results for optimal render performance
      .reverse(); // Show most recent matches first
  }, [query, messages]);

  // Utility to safely highlight ALL occurrences of the search query
  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? ...

(Showing first 1500 chars of 298 total lines)
```

### client/src/components/chat/EmojiPicker.jsx
**Type:** Client Components: Emojipicker
**Size:** 158 lines (144 non-empty)

```
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';
import { theme as design } from '../../utils/theme';

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👍', '😲', '😢'];

/* ==================================================================
   ARCHIVAL THEME CONSTANTS
================================================================== */
const theme = {
  paper: '#fdfbf7',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
  shadowDark: 'rgba(26, 26, 26, 0.25)',
};

const EmojiPicker = ({ anchorRect, onSelect, onClose }) => {
  if (!anchorRect) return null;

  // Strict 8-Point Grid Geometry
  const pickerWidth = 288; // 36 * 8
  const pickerHeight = 64; // 8 * 8
  const padding = 16;
  const safeAreaTop = 60; // Assumes a standard mobile header clearance

  // Calculate vertical position (default above, flip below if obstructed)
  let top = anchorRect.top - pickerHeight - 16;
  if (top < padding + safeAreaTop) {
    top = anchorRect.bottom + 16;
  }

  // Calculate horizontal position (centered over bubble, clamped to screen edges)
  let left = anchorRect.left + (anchorRect.width / 2) - (pickerWidth / 2);
  if (left < padding) {
    left = padding;
  }
  if (left + pickerWidth > window.innerWidth - padding) {
    left = window.innerWidth - pickerWidth - padding;
  }

  return createPortal(
    <AnimatePr...

(Showing first 1500 chars of 158 total lines)
```

### client/src/assets/hero.png
**Type:** `client/src/assets/hero.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### client/src/assets/vite.svg
**Type:** `client/src/assets/vite.svg`
**Size:** 1 lines (1 non-empty)

```
<svg xmlns="http://www.w3.org/2000/svg" width="77" height="47" fill="none" aria-labelledby="vite-logo-title" viewBox="0 0 77 47"><title id="vite-logo-title">Vite</title><style>.parenthesis{fill:#000}@media (prefers-color-scheme:dark){.parenthesis{fill:#fff}}</style><path fill="#9135ff" d="M40.151 45.71c-.663.844-2.02.374-2.02-.699V34.708a2.26 2.26 0 0 0-2.262-2.262H24.493c-.92 0-1.457-1.04-.92-1.788l7.479-10.471c1.07-1.498 0-3.578-1.842-3.578H15.443c-.92 0-1.456-1.04-.92-1.788l9.696-13.576c.213-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.472c-1.07 1.497 0 3.578 1.842 3.578h11.376c.944 0 1.474 1.087.89 1.83L40.153 45.712z"/><mask id="a" width="48" height="47" x="14" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M40.047 45.71c-.663.843-2.02.374-2.02-.699V34.708a2.26 2.26 0 0 0-2.262-2.262H24.389c-.92 0-1.457-1.04-.92-1.788l7.479-10.472c1.07-1.497 0-3.578-1.842-3.578H15.34c-.92 0-1.456-1.04-.92-1.788l9.696-13.575c.213-.297.556-.474.92-.474H53.93c.92 0 1.456 1.04.92 1.788L47.37 13.03c-1.07 1.498 0 3.578 1.842 3.578h11.376c.944 0 1.474 1.088.89 1.831L40.049 45.712z"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#eee6ff" rx="5.508" ry="14.704" transform="rotate(269.814 20.96 11.29)scale(-1 1)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#eee6ff" rx="10.399" ry="29.851" transform="rotate(89.814 -16.902 -8.275)scale(1 -1)"/></g><g filter="url(#d)"><ellipse cx="5.508" cy="30.4...

(Showing first 1500 chars of 1 total lines)
```

### client/src/assets/react.svg
**Type:** `client/src/assets/react.svg`
**Size:** 1 lines (1 non-empty)

```
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="35.93" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 228"><path fill="#00D8FF" d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621c6.238-30.281 2.16-54.676-11.769-62.708c-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848a155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233C50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165a167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266c13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923a168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586c13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488c29.348-9.723 48.443-25.443 48.443-41.52c0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345c-3.24-10.257-7.612-21.163-12.963-32.432c5.106-11 9.31-21.767 12.459-31.957c2.619.758 5.16 1.557 7.61 2.4c23.69 8.156 38.14 20.213 38.14 29.504c0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787c-1.524 8.219-4.59 13.698-8.382 15.893c-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7....

(Showing first 1500 chars of 1 total lines)
```

### client/src/pages/Matches.jsx
**Type:** Client Pages: Matches
**Size:** 352 lines (326 non-empty)

```
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { useAuth } from '../utils/AuthContext';
import socket from '../utils/socket';
import { theme as design } from '../utils/theme';
import { SkeletonBox } from '../components/Skeleton';
import { Heart, MoreVertical, Search } from 'lucide-react';

const Matches = ({ onOpenChat }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const { user } = useAuth();
  const myId = user?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/matches'),
  });

  const matches = useMemo(() => data?.matches || [], [data]);

  // WhatsApp-style real-time updates: bump the match to the top and refresh its preview
  useEffect(() => {
    const onNew = (msg) => {
      queryClient.setQueryData(['matches'], (old) => {
        if (!old?.matches) return old;
        const list = [...old.matches];
        const idx = list.findIndex((m) => m._id === msg.matchId);
        if (idx === -1) return old;
        const m = list[idx];
        const updated = {
          ...m,
          lastMessage: {
            text: msg.text,
            se...

(Showing first 1500 chars of 352 total lines)
```

### client/src/pages/Onboarding.jsx
**Type:** Client Pages: Onboarding
**Size:** 1051 lines (960 non-empty)

```
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import { useAppConfig } from '../utils/AppConfigContext';
import { useAuth } from '../utils/AuthContext';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { 
  Check, X, Camera, ChevronDown, ChevronRight, Lock, RotateCcw, 
  Fingerprint, MapPin, MessageSquare, Sliders, Layers, PenTool, 
  CheckCircle2, LogOut, Edit3, Sparkle, UserCheck, Award, Calendar 
} from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea', 
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const TYPEWRITER_FONT = "'Special Elite', 'Courier New', monospace";
const HEADER_FONT = design?.font?.heading || "'Playfair Display', serif";
const LABEL_FONT = design?.font?.body || "'Inter', sans-serif";

const CHAPTER_NAMES = [
  "01: Title",
  "02: Vitals",
  "03: Coordinates",
  "04: Portrait",
  "05: Whispers",
  "06: Parameters",
  "07: Alignment",
  "08: Review"
];

const TORN_EDGE_CLIP = 'polygon(0% 100%, 1.56% 18%, 3.12% 4%, 4.69% 22%, 6.25% 8%, 7.81% 16%, 9.38% 2%, 10.94% 24%, 12.50% 6%, 14.06% 14%, 15.62% 10%, 17.19% 20%, 18.75% 0%, 20.31% 18%, ...

(Showing first 1500 chars of 1051 total lines)
```

### client/src/pages/Splash.jsx
**Type:** Client Pages: Splash
**Size:** 316 lines (279 non-empty)

```
import React, { useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Compass, Hourglass, Feather, Key, BookOpen, Sparkles } from 'lucide-react';

const T = {
  paper: '#f4ede0', paperDeep: '#e8dcc0', paperShadow: '#d4c5a9',
  ink: '#1a1410', inkMuted: '#6b5d4f', inkFaint: '#a89880',
  accent: '#8b4513', gold: '#b8860b', goldLight: '#d4a84a',
  crimson: '#7c1f1f', crimsonDeep: '#5a1414',
  wax: '#8b2500', waxHL: '#c04020',
  shadowWarm: 'rgba(139,69,19,0.18)',
};

const F = {
  display: "'Playfair Display', Georgia, serif",
  italic: "'Playfair Display', Georgia, serif",
  typewriter: "'IM Fell English', 'Courier New', serif",
  mono: "'Special Elite', monospace",
  sans: "'Inter', system-ui, sans-serif",
};

const TYPE = {
  title: { fontFamily: F.display, fontSize: 40, color: T.ink, margin: '14px 0 0', lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.02em' },
  body: { fontFamily: F.typewriter, fontSize: 15, color: T.inkMuted, margin: 0, lineHeight: 1.7 },
  hl: { fontFamily: F.italic, fontStyle: 'italic', color: T.crimson, fontWeight: 600, fontSize: '1.05em' },
};

const Divider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 18px', width: '100%' }}>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${T.accent}66, transparent)` }} />
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 ...

(Showing first 1500 chars of 316 total lines)
```

### client/src/pages/Profile.jsx
**Type:** Client Pages: Profile
**Size:** 804 lines (731 non-empty)

```
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAppConfig } from '../utils/AppConfigContext';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { toast } from '../utils/toast';
import { Settings, Sparkle, MapPin, X, Pencil, Camera, Plus, CheckCircle2 } from 'lucide-react';

const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

/* ==================================================================
   MUSEUM-GRADE ARCHIVAL SYSTEM & CINEMATIC LIGHTING ENGINE
================================================================== */
const theme = {
  color: {
    paper: '#fdfbf7',
    surface: '#ffffff',
    surfaceAlt: '#f4f1ea',
    border: '#e0d8c8',
    borderDark: '#d4c5a9',
    ink: '#1a1a1a',
    inkMuted: '#8c8275',
    inkSoft: '#4a4a4a',
    accent: '#8b4513',
    accentSoft: 'rgba(139, 69, 19, 0.18)',
    accentFaint: 'rgba(139, 69, 19, 0.04)',
    crimson: '#8b1a1a',
    shadowWarm: 'rgba(139, 69, 19, 0.12)',
    shadowDark: 'rgba(26, 26, 26, 0.20)',
  },
  font: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, sans-serif",
  },
};

function buildTornEdge(teeth = 64) {
  const heights = [0, 18, 4, 22, 8, 16, 2, 24, 6, 14, 10, 20];
  const pts = ['0% 100%'];
  f...

(Showing first 1500 chars of 804 total lines)
```

### client/src/pages/Chat.jsx
**Type:** Client Pages: Chat
**Size:** 1185 lines (1069 non-empty)

```
import React, { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../utils/socket';
import { API_BASE } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { toast } from '../utils/toast';
import { triggerHaptic } from '../utils/haptics';
import MessageBubble from '../components/chat/MessageBubble';
import MessageActionMenu from '../components/chat/MessageActionMenu';
import EmojiPicker from '../components/chat/EmojiPicker';
import PhotoViewer from '../components/chat/PhotoViewer';
import ReplyPreview from '../components/chat/ReplyPreview';
import SearchOverlay from '../components/chat/SearchOverlay';
import ReportModal from '../components/chat/ReportModal';
import { theme as design } from '../utils/theme';
import { Search, ChevronLeft, Sparkle, MapPin } from 'lucide-react';

/* ==================================================================
   ARCHIVAL THEME & TEXTURES
================================================================== */
const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const Icon = React.memo(({ path, size = 20, color = 'currentColor', strokeWidth = 2 })...

(Showing first 1500 chars of 1185 total lines)
```

### client/src/pages/Discover.jsx
**Type:** Client Pages: Discover
**Size:** 393 lines (359 non-empty)

```
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HTMLFlipBook from 'react-pageflip';
import ProfileCard from '../components/ProfileCard';
import ProfileCardSkeleton from '../components/ProfileCardSkeleton';
import { api } from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import { triggerHaptic } from '../utils/haptics';
import { theme as design } from '../utils/theme';
import { RotateCw, Send, X, Compass, Users } from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surface: '#ffffff',
  surfaceAlt: '#f4f1ea',
  border: '#e0d8c8',
  borderDark: '#d4c5a9',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  crimson: '#8b1a1a',
  shadowWarm: 'rgba(139, 69, 19, 0.15)',
  shadowDark: 'rgba(26, 26, 26, 0.25)',
};

// React-Pageflip requires pages to be wrapped in a forwardRef
const Page = React.forwardRef(({ profile, onAction }, ref) => {
  return (
    <div ref={ref} className="archival-page" data-density="soft">
      <ProfileCard profile={profile} onAction={onAction} />
    </div>
  );
});
Page.displayName = "Page";

const Discover = ({ onOpenChat }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  ...

(Showing first 1500 chars of 393 total lines)
```

### client/src/pages/Auth.jsx
**Type:** Client Pages: Auth
**Size:** 366 lines (324 non-empty)

```
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api'; 
import socket from '../utils/socket';
import { theme as design } from '../utils/theme';
import { triggerHaptic } from '../utils/haptics';
import { Feather, KeySquare, CheckCircle2 } from 'lucide-react';

const theme = {
  paper: '#fdfbf7',
  surfaceAlt: '#f4f1ea',
  ink: '#1a1a1a',
  inkMuted: '#8c8275',
  accent: '#8b4513',
  borderDark: '#d4c5a9',
  crimson: '#8b1a1a',
  success: '#2e7d32',
  shadowWarm: 'rgba(139, 69, 19, 0.12)',
};

const TYPEWRITER_FONT = "'Special Elite', 'Courier New', monospace";
const HEADER_FONT = design?.font?.heading || "'Playfair Display', serif";
const LABEL_FONT = design?.font?.body || "'Inter', sans-serif";

const Auth = ({ onSuccess }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0].focus(), 150);
    }
  }, [step]);

  // THE PHANTOM HITBOX FIX: Forces mobile browsers to recalculate touch targets when keyboard closes
  const handleInputBlur = () => {
    window.scrollTo(0, 0);
  };

  const h...

(Showing first 1500 chars of 366 total lines)
```

---

## Server Files

### server/seedDummies.js
**Type:** Client Source: seedDummies
**Size:** 117 lines (103 non-empty)

```
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { COMPAT_QUESTIONS } from './config/compatQuestions.js';

dotenv.config();

const dummyNames = [
  { name: 'Ananya Sharma', gender: 'Female', age: 20 },
  { name: 'Rohan Mehta', gender: 'Male', age: 21 },
  { name: 'Priya Patel', gender: 'Female', age: 19 },
  { name: 'Aarav Kumar', gender: 'Male', age: 22 },
  { name: 'Kavya Iyer', gender: 'Female', age: 20 },
  { name: 'Kabir Singh', gender: 'Male', age: 21 },
  { name: 'Meera Nair', gender: 'Female', age: 20 },
  { name: 'Arjun Gupta', gender: 'Male', age: 19 },
  { name: 'Zara Khan', gender: 'Female', age: 21 },
  { name: 'Dev Joshi', gender: 'Male', age: 22 },
  { name: 'Sneha Rao', gender: 'Female', age: 20 },
  { name: 'Aditya Verma', gender: 'Male', age: 21 },
  { name: 'Nandini Das', gender: 'Female', age: 19 },
  { name: 'Vihaan Malhotra', gender: 'Male', age: 20 },
  { name: 'Ishita Kapoor', gender: 'Female', age: 21 },
  { name: 'Shaurya Bhatia', gender: 'Male', age: 22 },
  { name: 'Rhea Chakraborty', gender: 'Female', age: 20 },
  { name: 'Pranav Reddy', gender: 'Male', age: 21 },
  { name: 'Tanvi Shah', gender: 'Female', age: 19 },
  { name: 'Dhruv Choudhary', gender: 'Male', age: 20 }
];

const branches = ['Computer Science', 'Electronics', 'Mechanical', 'Economics', 'Design', 'Physics'];
const hostels = ['Hostel 1', 'Hostel 3', 'Hostel 5', 'Hostel 8', 'Hostel 12', 'Hostel 15'];
const interestsList = ['Pho...

(Showing first 1500 chars of 117 total lines)
```

### server/.DS_Store
**Type:** `server/.DS_Store`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xa2 in position 352: invalid start byte
```

### server/index.js
**Type:** Server Application Entry Point
**Size:** 233 lines (203 non-empty)

```
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppError } from './utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
import connectDB from './config/db.js';
import { socketHandler } from './socket/chat.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import discoverRoutes from './routes/discover.js';
import matchRoutes from './routes/matches.js';
import messageRoutes from './routes/messages.js';
import configRoutes from './routes/config.js';
import uploadRoutes from './routes/upload.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/report.js';

dotenv.config();

// Initialize Sentry (must run after dotenv.config so SENTRY_DSN is loaded)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration(), Sentry.expressIntegration()],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
  });
}

// Validate required environment variable...

(Showing first 1500 chars of 233 total lines)
```

### server/.npmrc
**Type:** `server/.npmrc`
**Size:** 1 lines (1 non-empty)

```
legacy-peer-deps=true

```

### server/.gitignore
**Type:** `server/.gitignore`
**Size:** 4 lines (4 non-empty)

```
.env
node_modules/
dist/
build/

```

### server/package.json
**Type:** Package Configuration
**Size:** 34 lines (34 non-empty)

```
{
  "name": "matchalize-server",
  "version": "1.0.0",
  "description": "Backend server for Matchalize campus dating app",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "@sentry/node": "^10.66.0",
    "@sentry/profiling-node": "^10.66.0",
    "cloudinary": "^2.2.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.3.1",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.3",
    "multer": "^1.4.5-lts.1",
    "multer-storage-cloudinary": "^4.0.0",
    "nodemailer": "^6.9.14",
    "socket.io": "^4.7.5",
    "web-push": "^3.6.7"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  }
}

```

### server/middleware/rateLimiters.js
**Type:** Client Source: rateLimiters
**Size:** 45 lines (41 non-empty)

```
import rateLimit from 'express-rate-limit';

// Limit message sending to 30 messages per 10 minutes per user
export const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many messages sent. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit discover actions (likes/passes) to 100 per 10 minutes per user
export const discoverLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many actions. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP verification attempts to prevent brute-force and DoS
// 15 attempts per 15 minutes per IP address.
// This allows a small group on shared Wi-Fi to make typos, but stops automated scripts dead.
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => req.ip,
  message: { 
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limit OTP requests by IP to prevent spamming across multiple emails
export const otpIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: { message: 'Too many verification requests from this network. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

```

### server/middleware/auth.js
**Type:** Client Source: auth
**Size:** 90 lines (76 non-empty)

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const COOKIE_NAME = 'matchalize_jwt';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Extracts the JWT from httpOnly cookie (primary) or Authorization header (fallback).
 */
const extractToken = (req) => {
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

/**
 * Sets the JWT as an httpOnly cookie. Called on login and token refresh.
 */
export const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clears the auth cookie. Called on logout.
 */
export const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // SUSPENDED CHECK: Reject suspended users immediately on every request
    if (req.user.suspended) {
      return res.status(403).json({ message: 'Account suspended. Please contact support.', suspended: true });
    }

    // DELETED CHECK: Reject soft-deleted users on every request
    if (req.user.isDeleted) {
      return res.status(403).json({ message: 'Account has been deleted.', deleted: true });
    }

    // MULTI-DEVICE CHECK: Reject tokens issued before the last global logout
    const issuedAt = decoded.iat * 1000;
    if (req.user.lastLogoutAt && issuedAt < req.user.lastLogoutAt.getTime()) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    // SLIDING EXPIRATION: If token is older than 6 days, issue a new one
    const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
    if (Date.now() - issuedAt > sixDaysMs) {
      const newToken = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      setAuthCookie(res, newToken);
      res.setHeader('x-new-token', newToken);
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

```

### server/middleware/blockFilter.js
**Type:** Client Source: blockFilter
**Size:** 38 lines (34 non-empty)

```
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

```

### server/middleware/validate.js
**Type:** Client Source: validate
**Size:** 9 lines (8 non-empty)

```
import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

```

### server/config/appData.js
**Type:** Server Configuration
**Size:** 263 lines (253 non-empty)

```
export const PROMPT_BANK = [
  "My favorite spot to hide on campus...",
  "Meet me at the canteen if...",
  "My ideal night study session includes...",
  "The hostel rule I break most often...",
  "A hot take I have about our college...",
  "Choose me if you want to survive...",
  "Late night chai or early morning library?",
  "My branch in 3 words...",
  "If I could change one campus rule...",
  "My hidden talent...",
  "My vibe is best described as...",
  "I am looking for a partner to run...",
  "Two truths and a lie about me...",
  "The best way to my heart is...",
  "My go-to comfort food after exams...",
  "A cringe thing I still unironically enjoy...",
  "My most irrational pet peeve...",
  "The song that defines my semester...",
  "My toxic trait is...",
  "I'll fall for you if you...",
  "My 3AM thoughts usually go like...",
  "The quickest way to annoy me...",
  "My favorite procrastination method...",
  "What I'm actually looking for on here...",
  "The most impulsive thing I've done...",
  "My idea of a perfect weekend...",
  "I get overly excited about...",
  "The smallest thing that makes my day...",
  "My favourite memory from college so far...",
  "One thing I absolutely cannot live without...",
  "I'm weirdly good at...",
  "I'd swipe right if you want to teach me...",
  "My biggest flex that no one knows about...",
  "The best compliment I've ever received...",
  "A dealbreaker I didn't know I had...",
  "I'm convinced that I should be famous for...",
  "The...

(Showing first 1500 chars of 263 total lines)
```

### server/config/db.js
**Type:** Server Configuration
**Size:** 13 lines (11 non-empty)

```
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

```

### server/config/cloudinary.js
**Type:** Server Configuration
**Size:** 32 lines (28 non-empty)

```
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🧹 CLOUDINARY CLEANUP HELPER
 * Extracts the public_id from a Cloudinary URL and permanently destroys the file from cloud storage.
 */
export const deleteCloudinaryFile = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return;
  try {
    // Matches path after /upload/(v12345/)? up to the file extension
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    if (match && match[1]) {
      const publicId = match[1];
      const isAudioOrVideo = /\.(webm|mp3|wav|mp4|m4a)$/i.test(url);
      
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isAudioOrVideo ? 'video' : 'image',
      });
      console.log(`[Cloudinary Cleanup] Destroyed orphaned artifact: ${publicId}`);
    }
  } catch (err) {
    console.error('[Cloudinary Cleanup Error]:', err.message || err);
  }
};

export default cloudinary;

```

### server/config/compatQuestions.js
**Type:** Server Configuration
**Size:** 176 lines (167 non-empty)

```
export const COMPAT_QUESTIONS = [
  {
    id: 'group_project',
    question: 'Your group project strategy?',
    options: [
      { key: 'carry', label: 'Carry the team' },
      { key: 'vanish', label: 'Do my part & vanish' },
      { key: 'help', label: 'Ask for help' },
      { key: 'wing', label: 'Wing it' },
    ],
  },
  {
    id: 'weekend',
    question: "What's your ideal weekend?",
    options: [
      { key: 'out', label: 'Going out' },
      { key: 'in', label: 'Staying in' },
      { key: 'study', label: 'Studying' },
      { key: 'adventure', label: 'Adventure' },
    ],
  },
  {
    id: 'conflict',
    question: 'How do you handle conflict?',
    options: [
      { key: 'talk', label: 'Talk it out' },
      { key: 'space', label: 'Need space' },
      { key: 'avoid', label: 'Avoid it' },
      { key: 'loud', label: 'Get loud then apologize' },
    ],
  },
  {
    id: 'first_date',
    question: 'Your ideal first date?',
    options: [
      { key: 'chai', label: 'Chai at canteen' },
      { key: 'walk', label: 'Walk around campus' },
      { key: 'movie', label: 'Movie night' },
      { key: 'trip', label: 'Adventure trip' },
    ],
  },
  {
    id: 'social',
    question: 'How social are you?',
    options: [
      { key: 'very', label: 'Very social' },
      { key: 'small', label: 'Small circles' },
      { key: 'home', label: 'Homebody' },
      { key: 'depends', label: 'Depends' },
    ],
  },
  {
    id: 'comm_style',
    question: "What's your communicatio...

(Showing first 1500 chars of 176 total lines)
```

### server/uploads/6a593c388c736f3acc68af75-1784238162938.jpeg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784238162938.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784643800990.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784643800990.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785081958158.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785081958158.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784290995400.jpg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784290995400.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a65a6739b872e425f207e96-1785046678766.jpeg
**Type:** `server/uploads/6a65a6739b872e425f207e96-1785046678766.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846922397.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846922397.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783723489683.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783723489683.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820313045.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820313045.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646334466.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646334466.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781010645.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781010645.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784290983075.jpg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784290983075.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781020953.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781020953.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4404ecff79f4b6ecd4b132-1782856807233.jpeg
**Type:** `server/uploads/6a4404ecff79f4b6ecd4b132-1782856807233.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4563a4a9468658d2f6e7fe-1782932458980.JPG
**Type:** `server/uploads/6a4563a4a9468658d2f6e7fe-1782932458980.JPG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a1f2356a3b094257aefe1-1784291233211.jpg
**Type:** `server/uploads/6a5a1f2356a3b094257aefe1-1784291233211.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4563a4a9468658d2f6e7fe-1782932467225.JPG
**Type:** `server/uploads/6a4563a4a9468658d2f6e7fe-1782932467225.JPG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646892771.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646892771.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5ed9762ab1b9a20425858b-1784601558481.jpeg
**Type:** `server/uploads/6a5ed9762ab1b9a20425858b-1784601558481.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732877630.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732877630.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a65a6739b872e425f207e96-1785046894753.jpeg
**Type:** `server/uploads/6a65a6739b872e425f207e96-1785046894753.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846597733.mov
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846597733.mov`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xc5 in position 23: invalid continuation byte
```

### server/uploads/6a5d632c0173438f2d01d3bc-1784505175337.jpeg
**Type:** `server/uploads/6a5d632c0173438f2d01d3bc-1784505175337.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a082f3fd7b84692fe19d6-1784288618940.jpeg
**Type:** `server/uploads/6a5a082f3fd7b84692fe19d6-1784288618940.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5b730e803fe247ebb92e19-1784378256036.jpeg
**Type:** `server/uploads/6a5b730e803fe247ebb92e19-1784378256036.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d632c0173438f2d01d3bc-1784505202971.jpeg
**Type:** `server/uploads/6a5d632c0173438f2d01d3bc-1784505202971.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781000062.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782781000062.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a6cfb033b6b24855cf131-1784311073752.jpg
**Type:** `server/uploads/6a5a6cfb033b6b24855cf131-1784311073752.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646343757.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646343757.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783734409488.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783734409488.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820225170.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820225170.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780870794.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780870794.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785081952981.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785081952981.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802260622.PNG
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802260622.PNG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846634456.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846634456.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731192979.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731192979.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4555837bbec0828be32ba4-1782928862934.jpg
**Type:** `server/uploads/6a4555837bbec0828be32ba4-1782928862934.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784238254838.jpeg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784238254838.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820218776.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820218776.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a43c1f6845ecc95f286ba22-1782826100751.jpeg
**Type:** `server/uploads/6a43c1f6845ecc95f286ba22-1782826100751.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a082f3fd7b84692fe19d6-1784288580218.jpeg
**Type:** `server/uploads/6a5a082f3fd7b84692fe19d6-1784288580218.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646322412.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646322412.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731228653.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731228653.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779562145.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779562145.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a1f2356a3b094257aefe1-1784291168966.jpg
**Type:** `server/uploads/6a5a1f2356a3b094257aefe1-1784291168966.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646888474.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646888474.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802411232.jpg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802411232.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a518e4dfc61e77c18e5972b-1783729777642.jpeg
**Type:** `server/uploads/6a518e4dfc61e77c18e5972b-1783729777642.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846618494.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846618494.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784291024460.jpg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784291024460.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820318224.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820318224.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846892084.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846892084.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732769948.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732769948.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4555837bbec0828be32ba4-1782928869644.jpg
**Type:** `server/uploads/6a4555837bbec0828be32ba4-1782928869644.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780719134.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780719134.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784644470899.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784644470899.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a082f3fd7b84692fe19d6-1784288483560.jpeg
**Type:** `server/uploads/6a5a082f3fd7b84692fe19d6-1784288483560.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780993572.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780993572.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779592516.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779592516.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784238221535.jpeg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784238221535.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d39557402520cfa9a5270-1784494544732.jpeg
**Type:** `server/uploads/6a5d39557402520cfa9a5270-1784494544732.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d632c0173438f2d01d3bc-1784505186303.jpeg
**Type:** `server/uploads/6a5d632c0173438f2d01d3bc-1784505186303.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802363161.jpg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802363161.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820208281.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820208281.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784291009905.jpg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784291009905.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a6cfb033b6b24855cf131-1784311080685.jpg
**Type:** `server/uploads/6a5a6cfb033b6b24855cf131-1784311080685.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a4e6c35edb414ff3d468a-1784303356061.png
**Type:** `server/uploads/6a5a4e6c35edb414ff3d468a-1784303356061.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a5a6cfb033b6b24855cf131-1784311087303.jpg
**Type:** `server/uploads/6a5a6cfb033b6b24855cf131-1784311087303.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4555837bbec0828be32ba4-1782928849142.jpg
**Type:** `server/uploads/6a4555837bbec0828be32ba4-1782928849142.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802287623.JPG
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802287623.JPG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5fa42bcd61c104a36aac03-1784653750697.jpeg
**Type:** `server/uploads/6a5fa42bcd61c104a36aac03-1784653750697.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646883649.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646883649.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784238239975.jpeg
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784238239975.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a662fcf3ec6e8b0c371b73e-1785081833923.jpeg
**Type:** `server/uploads/6a662fcf3ec6e8b0c371b73e-1785081833923.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783734418289.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783734418289.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a1f2356a3b094257aefe1-1784291246552.jpg
**Type:** `server/uploads/6a5a1f2356a3b094257aefe1-1784291246552.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a662fcf3ec6e8b0c371b73e-1785081824288.jpeg
**Type:** `server/uploads/6a662fcf3ec6e8b0c371b73e-1785081824288.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4555837bbec0828be32ba4-1782928839332.jpg
**Type:** `server/uploads/6a4555837bbec0828be32ba4-1782928839332.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a43c1f6845ecc95f286ba22-1782826055514.jpeg
**Type:** `server/uploads/6a43c1f6845ecc95f286ba22-1782826055514.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731284275.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731284275.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a65a6739b872e425f207e96-1785046899364.jpeg
**Type:** `server/uploads/6a65a6739b872e425f207e96-1785046899364.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732743713.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732743713.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5b730e803fe247ebb92e19-1784378231476.jpeg
**Type:** `server/uploads/6a5b730e803fe247ebb92e19-1784378231476.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780025183.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780025183.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802396090.jpg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802396090.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846435564.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846435564.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a43c1f6845ecc95f286ba22-1782826018324.jpeg
**Type:** `server/uploads/6a43c1f6845ecc95f286ba22-1782826018324.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846909853.mov
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846909853.mov`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xc5 in position 23: invalid continuation byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646816457.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646816457.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785081962958.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785081962958.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820233853.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820233853.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5fa42bcd61c104a36aac03-1784653743426.jpeg
**Type:** `server/uploads/6a5fa42bcd61c104a36aac03-1784653743426.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d632c0173438f2d01d3bc-1784505194869.jpeg
**Type:** `server/uploads/6a5d632c0173438f2d01d3bc-1784505194869.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5fa42bcd61c104a36aac03-1784653516531.jpeg
**Type:** `server/uploads/6a5fa42bcd61c104a36aac03-1784653516531.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784644458098.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784644458098.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846938265.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846938265.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783802246800.HEIC
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783802246800.HEIC`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xd4 in position 1537: invalid continuation byte
```

### server/uploads/6a5d39557402520cfa9a5270-1784494538169.jpeg
**Type:** `server/uploads/6a5d39557402520cfa9a5270-1784494538169.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780270298.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780270298.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731506046.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731506046.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a43c1f6845ecc95f286ba22-1782826087333.jpeg
**Type:** `server/uploads/6a43c1f6845ecc95f286ba22-1782826087333.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5b730e803fe247ebb92e19-1784378270356.jpeg
**Type:** `server/uploads/6a5b730e803fe247ebb92e19-1784378270356.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785074664528.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785074664528.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a1f2356a3b094257aefe1-1784291227963.jpg
**Type:** `server/uploads/6a5a1f2356a3b094257aefe1-1784291227963.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5d39557402520cfa9a5270-1784494505070.jpeg
**Type:** `server/uploads/6a5d39557402520cfa9a5270-1784494505070.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a593c388c736f3acc68af75-1784290971139.png
**Type:** `server/uploads/6a593c388c736f3acc68af75-1784290971139.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820307648.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820307648.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5fa42bcd61c104a36aac03-1784653736013.jpeg
**Type:** `server/uploads/6a5fa42bcd61c104a36aac03-1784653736013.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779571863.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779571863.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a4e6c35edb414ff3d468a-1784303316618.jpeg
**Type:** `server/uploads/6a5a4e6c35edb414ff3d468a-1784303316618.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785076564182.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785076564182.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a082f3fd7b84692fe19d6-1784288565342.jpeg
**Type:** `server/uploads/6a5a082f3fd7b84692fe19d6-1784288565342.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a48efbca59523e4320af3de-1783731296757.jpeg
**Type:** `server/uploads/6a48efbca59523e4320af3de-1783731296757.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a623183b657d14788283ef2-1784820329156.jpeg
**Type:** `server/uploads/6a623183b657d14788283ef2-1784820329156.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779580806.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779580806.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a6cfb033b6b24855cf131-1784311065922.jpg
**Type:** `server/uploads/6a5a6cfb033b6b24855cf131-1784311065922.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785076581475.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785076581475.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4563a4a9468658d2f6e7fe-1782932439387.PNG
**Type:** `server/uploads/6a4563a4a9468658d2f6e7fe-1782932439387.PNG`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780510179.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782780510179.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a4e6c35edb414ff3d468a-1784303372884.jpeg
**Type:** `server/uploads/6a5a4e6c35edb414ff3d468a-1784303372884.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732811574.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732811574.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5a4e6c35edb414ff3d468a-1784303340268.png
**Type:** `server/uploads/6a5a4e6c35edb414ff3d468a-1784303340268.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a5ed9762ab1b9a20425858b-1784602305906.jpeg
**Type:** `server/uploads/6a5ed9762ab1b9a20425858b-1784602305906.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4411571c2a799a78c25800-1782846650125.jpeg
**Type:** `server/uploads/6a4411571c2a799a78c25800-1782846650125.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779926384.jpeg
**Type:** `server/uploads/6a430e71cc22fa0ba8cd9bf2-1782779926384.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a66112c3ec6e8b0c371b2ee-1785076573172.jpeg
**Type:** `server/uploads/6a66112c3ec6e8b0c371b2ee-1785076573172.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a49106ea59523e4320af42b-1783732763068.jpeg
**Type:** `server/uploads/6a49106ea59523e4320af42b-1783732763068.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a65a6739b872e425f207e96-1785046726987.jpeg
**Type:** `server/uploads/6a65a6739b872e425f207e96-1785046726987.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a4563a4a9468658d2f6e7fe-1782932447850.jpg
**Type:** `server/uploads/6a4563a4a9468658d2f6e7fe-1782932447850.jpg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5b730e803fe247ebb92e19-1784378285441.png
**Type:** `server/uploads/6a5b730e803fe247ebb92e19-1784378285441.png`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0x89 in position 0: invalid start byte
```

### server/uploads/6a5d39557402520cfa9a5270-1784494514811.jpeg
**Type:** `server/uploads/6a5d39557402520cfa9a5270-1784494514811.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784646352488.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784646352488.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/uploads/6a5f7ca89c718d068b19a07b-1784644444992.jpeg
**Type:** `server/uploads/6a5f7ca89c718d068b19a07b-1784644444992.jpeg`
**Size:** 1 lines (1 non-empty)

```
// ERROR reading file: 'utf-8' codec can't decode byte 0xff in position 0: invalid start byte
```

### server/utils/queue.js
**Type:** Client Source: queue
**Size:** 15 lines (14 non-empty)

```
import * as Sentry from '@sentry/node';

// A zero-dependency, free background task runner.
// Detaches async tasks (push notifications, emails) from the Express response cycle.
export const addToQueue = (task) => {
  setImmediate(async () => {
    try {
      await task();
    } catch (error) {
      console.error('[Background Queue Error]', error);
      // Surface background failures in Sentry when initialized (safe no-op if DSN unset)
      Sentry.captureException(error);
    }
  });
};

```

### server/utils/asyncHandler.js
**Type:** Client Source: asyncHandler
**Size:** 7 lines (7 non-empty)

```
/**
 * Wraps an async Express route handler so rejected promises
 * are forwarded to the next() error handler instead of crashing.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

```

### server/utils/push.js
**Type:** Client Source: push
**Size:** 46 lines (40 non-empty)

```
import webPush from 'web-push';
import User from '../models/User.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:admin@matchalize.app',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export const sendPushNotification = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('pushSubscription name');
    if (!user?.pushSubscription) return false;

    const notificationPayload = {
      title: payload.title || 'Matchalize',
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: payload.data || {},
      vibrate: [100, 50, 100],
    };

    await webPush.sendNotification(
      user.pushSubscription,
      JSON.stringify(notificationPayload)
    );
    return true;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired or invalid, remove it
      await User.findByIdAndUpdate(userId, { pushSubscription: null }).catch(() => {});
    }
    console.error('Push notification error:', error.message);
    return false;
  }
};

export const generateVapidKeys = () => {
  return webPush.generateVAPIDKeys();
};

```

### server/utils/AppError.js
**Type:** Client Source: AppError
**Size:** 9 lines (9 non-empty)

```
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

```

### server/utils/email.js
**Type:** Client Source: email
**Size:** 51 lines (45 non-empty)

```
export const sendOTP = async (email, otp) => {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.log(`\n----------------------------------------`);
    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
    return true;
  }

  const htmlContent = `
    <div style="font-family: 'Inter', sans-serif; background-color: #0A0A0C; color: #F5F5F7; padding: 40px 20px; text-align: center; max-width: 500px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
      <h1 style="color: #D4A853; font-size: 28px; margin-bottom: 8px; font-weight: 700; letter-spacing: 2px;">MATCHALIZE</h1>
      <p style="color: #6E6E80; font-size: 14px; margin-bottom: 24px;">Your Campus. Your People.</p>
      <div style="background-color: #141418; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.03);">
        <p style="font-size: 16px; color: #F5F5F7; margin-top: 0;">Here is your verification code:</p>
        <div style="font-size: 36px; font-weight: 700; color: #D4A853; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
        <p style="font-size: 12px; color: #6E6E80; margin-bottom: 0;">This code is valid for 10 minutes and can only be used once.</p>
      </div>
      <p style="font-size: 12px; color: #6E6E80; line-height: 1.5;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: 'adityabhati.iitb@gmail.com', name: 'Matchalize' },
      subject: `Matchalize Verification Code: ${otp}`,
      content: [{ type: 'text/html', value: htmlContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('SendGrid API error:', err);
    throw new Error(`SendGrid API error: ${err}`);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n----------------------------------------`);
    console.log(`[OTP] For ${email}: ${otp}`);
    console.log(`----------------------------------------\n`);
  }

  return true;
};

```

### server/models/OTP.js
**Type:** Server Data Models: OTP
**Size:** 34 lines (31 non-empty)

```
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document will expire at the specified date
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rate limiting queries (find by email within last hour)
otpSchema.index({ email: 1, createdAt: 1 });

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;

```

### server/models/Notification.js
**Type:** Server Data Models: Notification
**Size:** 50 lines (46 non-empty)

```
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['new_letter', 'priority_seal'],
      required: true,
    },
    interactionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interaction',
      required: true,
      // Links to the exact letter and photo they liked
    },
    isCleared: {
      type: Boolean,
      default: false,
      // Flips to true the moment they hit [Accept] or [Archive]
    },
  },
  {
    timestamps: true,
  }
);

// Extremely fast lookup for the active Instagram-style tray
notificationSchema.index({ recipientId: 1, isCleared: 1, createdAt: -1 });

// Auto-delete cleared notifications after 30 days to prevent database bloat
notificationSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { isCleared: true } 
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

```

### server/models/Setting.js
**Type:** Server Data Models: Setting
**Size:** 19 lines (17 non-empty)

```
import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      enum: ['appConfig'], // Can be expanded later
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
```

### server/models/Message.js
**Type:** Server Data Models: Message
**Size:** 80 lines (76 non-empty)

```
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'opening_letter', 'audio'],
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      default: '',
    },
    clientMsgId: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    caption: {
      type: String,
      default: '',
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'read'],
      default: 'sent',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ matchId: 1, createdAt: 1 });
// 🚀 COLLISION-PROOF PAGINATION: Instant ObjectId-based cursor queries
messageSchema.index({ matchId: 1, _id: -1 });

// Speeds up moderation queries and global user cleanup operations
messageSchema.index({ senderId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;

```

### server/models/User.js
**Type:** Server Data Models: User
**Size:** 172 lines (169 non-empty)

```
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    college: {
      type: String,
      default: '',
    },
    collegeCode: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    age: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      default: '',
    },
    pronouns: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      default: '',
    },
    year: {
      type: String,
      default: '',
    },
    hostel: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    bioPhoto: {
      type: String,
      default: '',
    },
    prompts: [
      {
        question: String,
        answer: String,
        photoUrl: String,
      },
    ],
    photos: {
      type: [String],
      default: [],
    },
    intent: {
      type: [String],
      default: [],
    },
    interestedIn: {
      type: [String],
      default: [],
    },
    ageRange: {
      min: {
        type: Number,
        default: 18,
      },
      max: {
        type: Number,
        default: 30,
  ...

(Showing first 1500 chars of 172 total lines)
```

### server/models/Interaction.js
**Type:** Server Data Models: Interaction
**Size:** 51 lines (48 non-empty)

```
import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema(
  {
    actorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    targetId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    actionType: { 
      type: String, 
      enum: ['archive', 'letter', 'seal_stamp', 'accept_letter', 'accept_seal'], 
      required: true 
    },
    targetArtifact: { 
      type: String, 
      default: null 
      // e.g., 'photo_1', 'whisper_0' - stores exactly what they tapped
    },
    letterContent: { 
      type: String, 
      maxlength: 140, 
      default: null 
    },
    cooldownExpiresAt: { 
      type: Date, 
      default: null 
      // Powered by our 7-day re-queue logic for passed profiles (Interaction History)
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for building the Discover deck instantly
interactionSchema.index({ actorId: 1, targetId: 1 });
interactionSchema.index({ actorId: 1, cooldownExpiresAt: 1 });
interactionSchema.index(
  { actorId: 1, actionType: 1, createdAt: -1 },
  { name: 'daily_limit_query_index' }
);
interactionSchema.index({ targetId: 1, actionType: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);
export default Interaction;

```

### server/models/Block.js
**Type:** Server Data Models: Block
**Size:** 12 lines (9 non-empty)

```
import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blocked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

const Block = mongoose.model('Block', blockSchema);
export default Block;

```

### server/models/Analytics.js
**Type:** Server Data Models: Analytics
**Size:** 25 lines (23 non-empty)

```
import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    event: {
      type: String,
      required: true,
      enum: ['ONBOARDING_STEP', 'ONBOARDING_COMPLETE', 'ONBOARDING_ABANDONED'],
    },
    step: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Analytics', analyticsSchema);
```

### server/models/Match.js
**Type:** Server Data Models: Match
**Size:** 37 lines (34 non-empty)

```
import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
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
      // Points back to the exact letter that sparked the match
    },
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ users: 1, isActive: 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;

```

### server/models/Report.js
**Type:** Server Data Models: Report
**Size:** 27 lines (23 non-empty)

```
import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'Inappropriate photos',
  'Harassment or bullying',
  'Fake profile or spam',
  'Underage user',
  'Other',
];

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: REPORT_REASONS, required: true },
  details: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ reporter: 1, reported: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;

```

### server/routes/discover.js
**Type:** API RoutesDiscover
**Size:** 398 lines (349 non-empty)

```
import express from 'express';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { computeCompatibility } from '../config/compatQuestions.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { discoverLimiter } from '../middleware/rateLimiters.js';
import { getBlockExclusionQuery } from '../middleware/blockFilter.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

const router = express.Router();
const DAY_MS = 24 * 60 * 60 * 1000;

// Shared helper for Letters and Telegrams (Superlikes)
const handleLike = async (req, res, { isSuperlike = false } = {}) => {
  const targetId = req.params.id;
  const currentUser = req.user;
  const actionType = isSuperlike ? 'seal_stamp' : 'letter';

  try {
    // 🛡️ BLOCK SELF-INTERACTION
    if (targetId === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot interact with yourself' });
    }

    // 1. INDEPENDENT DAILY LIMITS (7 letters/day, 1 Telegram/day)
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const dailyCount = await Interaction.countDocuments({
      actorId: currentUser._id,
      actionType,
      createdAt: { $gte: startO...

(Showing first 1500 chars of 398 total lines)
```

### server/routes/matches.js
**Type:** API RoutesMatches
**Size:** 239 lines (214 non-empty)

```
import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { protect } from '../middleware/auth.js';
import { areBlocked } from '../middleware/blockFilter.js';

const router = express.Router();

// @route   GET /api/matches
// @desc    Get all active matches for the current user with details (paginated) using Aggregation
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const total = await Match.countDocuments({ users: userId, isActive: true });

    // SINGLE AGGREGATION PIPELINE (Replaces the N+1 Promise.all loop)
    const matches = await Match.aggregate([
      { $match: { users: userId, isActive: true } },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        // 1. Join the matched user's profile
        $lookup: {
          from: 'users',
          let: { userIds: '$users' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$userIds'] } } },
            { $match: { _id: { $ne: userId } } },
            { $project: { ...

(Showing first 1500 chars of 239 total lines)
```

### server/routes/auth.js
**Type:** API RoutesAuth
**Size:** 224 lines (194 non-empty)

```
import express from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { protect, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { sendOTP } from '../utils/email.js';
import { COLLEGE_MAP } from '../config/appData.js';
import { verifyOtpLimiter, otpIpLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Generate 6-digit cryptographically secure code
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Helper to extract college code and name
const extractCollegeDetails = (email) => {
  const parts = email.split('@');
  if (parts.length < 2) return { college: '', collegeCode: '' };
  const domain = parts[1].toLowerCase();
  
  // Example: someone@iitb.ac.in -> domain: iitb.ac.in -> code: iitb
  const domainParts = domain.split('.');
  let collegeCode = domainParts[0];
  
  // Map common college codes to readable names
  let college = COLLEGE_MAP[collegeCode] || domain;
  if (collegeCode === 'gmail') collegeCode = 'iit'; // fallback/dev code

  return { college, collegeCode };
};

// @route   POST /api/auth/send-otp
// @desc    Generate OTP and send it via email
// @access  Public
router.post(
  '/send-otp',
  otpIpLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter ...

(Showing first 1500 chars of 224 total lines)
```

### server/routes/users.js
**Type:** API RoutesUsers
**Size:** 344 lines (299 non-empty)

```
import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import Block from '../models/Block.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import Analytics from '../models/Analytics.js';
import Interaction from '../models/Interaction.js';
import { protect, clearAuthCookie } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// Helper to collect all photo URLs (profile photos, bio photo, prompt attachments) from a user document
const collectUserPhotos = (u) => {
  const urls = new Set();
  if (u.photos && Array.isArray(u.photos)) u.photos.forEach(url => url && urls.add(url));
  if (u.bioPhoto) urls.add(u.bioPhoto);
  if (u.prompts && Array.isArray(u.prompts)) {
    u.prompts.forEach(p => p.photoUrl && urls.add(p.photoUrl));
  }
  return urls;
};

// Helper function to validate image URLs
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);

    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && parsed.protocol !== 'https:') return false;

    const hostname = parsed.hostname;

    if (!isProd && (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ...

(Showing first 1500 chars of 344 total lines)
```

### server/routes/upload.js
**Type:** API RoutesUpload
**Size:** 77 lines (65 non-empty)

```
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let upload;

if (isCloudinaryConfigured) {
  const { v2: cloudinary } = await import('cloudinary');
  const { CloudinaryStorage } = await import('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isAudio = file.mimetype.startsWith('audio/');
      return {
        folder: isAudio ? 'matchalize/audio' : 'matchalize/photos',
        allowed_formats: isAudio
          ? ['mp3', 'mp4', 'm4a', 'webm', 'ogg']
          : ['jpg', 'jpeg', 'png', 'webp'],
        ...(isAudio ? {} : {
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
          moderation: 'aws_rek',
        }),
      };
    },
  });

  upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${req.user._id}-${Date.now()}${ext}`);
    },
  });

  upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
}

const router = express.Router();

router.post('/', protect, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // CHECK: If Cloudinary AI rejected the photo
    if (req.file.moderation && req.file.moderation[0]?.status === 'rejected') {
      return res.status(403).json({ message: 'Photo rejected due to inappropriate content.' });
    }

    const url = isCloudinaryConfigured
      ? req.file.path
      : `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

export default router;

```

### server/routes/config.js
**Type:** API RoutesConfig
**Size:** 45 lines (40 non-empty)

```
import express from 'express';
import Setting from '../models/Setting.js';
import {
  PROMPT_BANK, BRANCHES, YEARS, GENDERS, INTENTS, INTEREST_TAGS,
  PRONOUNS_OPTIONS, INTEREST_ICONS, INTEREST_ICON_FALLBACKS, COLLEGE_MAP, APP_CONSTANTS,
} from '../config/appData.js';
import { COMPAT_QUESTIONS } from '../config/compatQuestions.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Check database for dynamic settings first
    const dbSetting = await Setting.findOne({ key: 'appConfig' });
    
    if (dbSetting) {
      return res.json(dbSetting.value);
    }

    // Fallback to static file if DB is empty
    res.json({
      prompts: PROMPT_BANK,
      branches: BRANCHES,
      years: YEARS,
      genders: GENDERS,
      intents: INTENTS,
      interests: INTEREST_TAGS,
      pronouns: PRONOUNS_OPTIONS,
      interestIcons: INTEREST_ICONS,
      interestIconFallbacks: INTEREST_ICON_FALLBACKS,
      colleges: COLLEGE_MAP,
      constants: APP_CONSTANTS,
      compatQuestions: COMPAT_QUESTIONS,
      splash: {
        videoUrl: process.env.SPLASH_VIDEO_URL || '/lover.mp4',
        tagline: process.env.SPLASH_TAGLINE || 'Your Campus. Your Story.',
      },
    });
  } catch (error) {
    console.error('Config route error:', error);
    res.status(500).json({ message: 'Server error fetching config' });
  }
});

export default router;
```

### server/routes/report.js
**Type:** API RoutesReport
**Size:** 198 lines (173 non-empty)

```
import express from 'express';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { protect } from '../middleware/auth.js';
import { REPORT_REASONS } from '../models/Report.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/report/reasons
// @desc    Get available report reasons
// @access  Private
router.get('/reasons', protect, (req, res) => {
  res.status(200).json({ reasons: REPORT_REASONS });
});

// @route   POST /api/report/:userId
// @desc    Report a user (auto-suspend after 3 unique reporters)
// @access  Private
router.post('/:userId', protect, async (req, res) => {
  const { reason, details } = req.body;
  const reportedId = req.params.userId;

  if (!reason || !REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: 'Valid reason is required' });
  }

  if (reportedId === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot report yourself' });
  }

  try {
    const reported = await User.findById(reportedId);
    if (!reported) return res.status(404).json({ message: 'User not found' });

    const report = await Report.create({
      reporter: req.user._id,
      reported: reportedId,
      reason,
      details: details || '',
    });

 ...

(Showing first 1500 chars of 198 total lines)
```

### server/routes/notifications.js
**Type:** API RoutesNotifications
**Size:** 287 lines (258 non-empty)

```
import express from 'express';
import Notification from '../models/Notification.js';
import Interaction from '../models/Interaction.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';

const router = express.Router();

// @route   GET /api/notifications/vapid-key
// @desc    Get VAPID public key for push subscription
// @access  Private
router.get('/vapid-key', protect, (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return res.status(503).json({ message: 'Push notifications not configured' });
  }
  res.status(200).json({ publicKey: key });
});

// @route   POST /api/notifications/subscribe
// @desc    Save push subscription
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving subscription' });
  }
});

// @route   DELETE /api/notifications/subscribe
// @desc    Remove push subscription
// @access...

(Showing first 1500 chars of 287 total lines)
```

### server/routes/messages.js
**Type:** API RoutesMessages
**Size:** 233 lines (191 non-empty)

```
import express from 'express';
import mongoose from 'mongoose';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { sendPushNotification } from '../utils/push.js';
import { addToQueue } from '../utils/queue.js';
import { messageLimiter } from '../middleware/rateLimiters.js';
import { areBlocked } from '../middleware/blockFilter.js';
import { deleteCloudinaryFile } from '../config/cloudinary.js';

const router = express.Router();

// @route   GET /api/messages/:matchId
// @desc    Get messages using ObjectId-Based Cursor Pagination
router.get('/:matchId', protect, async (req, res) => {
  const { matchId } = req.params;
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const cursor = req.query.cursor;

  try {
    const match = await Match.findOne({
      _id: matchId,
      users: req.user._id,
      isActive: true,
    });

    if (!match) {
      return res.status(403).json({ message: 'Unauthorized or match inactive' });
    }

    const query = { matchId };
    
    // 🚀 COLLISION-PROOF CURSOR: Use ObjectId sequencing instead of timestamps
    if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    } else if (cursor) {
      // Graceful fallback just in case an older timestamp cursor was passed
      query.createdAt = { $lt: new Date(cursor) };
    }

...

(Showing first 1500 chars of 233 total lines)
```

### server/socket/chat.js
**Type:** Client Source: chat
**Size:** 187 lines (162 non-empty)

```
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import { areBlocked } from '../middleware/blockFilter.js';

const onlineUsers = new Map(); // userId -> Set<socketId>

/**
 * Parse a raw cookie header string into a { name: value } map.
 */
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const [name, ...rest] = pair.split('=');
    if (name) cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
};

export const socketHandler = (io) => {
  io.use(async (socket, next) => {
    try {
      // Try httpOnly cookie first, fall back to auth token payload
      let token = null;
      const cookies = parseCookies(socket.handshake.headers.cookie);
      if (cookies.matchalize_jwt) {
        token = cookies.matchalize_jwt;
      } else {
        token = socket.handshake.auth.token || socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(ne...

(Showing first 1500 chars of 187 total lines)
```

---
