# TambayanSLU Conversation Creator — standalone website

This is a **complete, independent Next.js project**. It does not need the TambayanSLU app, Firebase, or environment variables.

## Windows setup

1. Extract this ZIP into a directory, e.g. `C:\Users\ADMIN\Documents\tambayanslu-conversation-creator`.
2. Open Command Prompt in the folder containing **package.json**.
3. Run:

   ```bat
   npm install
   npm run dev
   ```
4. Visit **http://localhost:3000/**.

The creator lives at `/` (the root). You do **not** need to visit `/conversation-creator`.

## Deploy to its own domain using Vercel

1. Push **this project directory** to its own GitHub repository.
2. In Vercel, import the repository, choose Framework Preset **Next.js**, and deploy.
3. Under **Project > Settings > Domains**, add your separate domain (or subdomain).
4. Follow the DNS records Vercel shows for that domain, and wait for verification/SSL.

No Firebase/R2 credentials or database setup are required. If the repo includes another parent folder, adjust Vercel's **Root Directory** so the folder with `package.json` is the project root.

## Build commands

- `npm run dev` — local development
- `npm run build` — production build
- `npm start` — run production server after build
- `npm run typecheck` — TypeScript check

## Features

- Both chat sides editable; reactions, images, replies, edit/delete.
- Light and dark UI inspired by TambayanSLU; no sender names above bubbles.
- Local PNG export for social-media formats, including a `tambayanslu.com` watermark and **Sample Conversation** disclosure.
- No database/API/backend integrations; content disappears on refresh.

Note: This is a sample-conversation composer, not a real encrypted/matched chat.
