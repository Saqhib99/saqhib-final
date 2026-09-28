SAQHIB — VIDEO EDITOR PORTFOLIO
===============================

Run locally
-----------
1. Open this folder in VS Code.
2. Install/use the Live Server extension.
3. Right-click index.html -> Open with Live Server.

Mobile update
-------------
- Hero name now reflows correctly on phones instead of clipping off-screen.
- Uses dynamic mobile viewport units (dvh/svh) and safe-area padding.
- Intro, About, Tools, Work, Pricing, Contact and footer all have phone-specific layouts.
- Work cards are touch-scrollable in a 9:16 horizontal carousel.
- The frame sequence gets a small portrait-phone zoom while preserving the original 16:9 content.
- Canvas background is sampled from each frame edge so there is no obvious frame rectangle.
- Tested CSS breakpoints include 700px, 390px and 350px widths plus short-height phones.

Portfolio videos
----------------
Instagram and YouTube videos are embedded from their original URLs, so an internet connection is required for playback. Each card also includes a View original link.

Main files
----------
index.html
styles.css
script.js
assets/saqhib.png
frames/frame_0001.jpg ... frame_0134.jpg
