# NeuraOS: Intelligent Web Operating System

## Project Overview

NeuraOS is a modern, intelligent web-based operating system designed to provide a desktop-like experience in the browser. It features a modular architecture, AI-powered tools, and seamless integration with cloud services and blockchain wallets.

### Key Features
- Desktop environment with draggable windows and taskbar
- Built-in apps: AI Assistant, Code Editor, File Manager, Notes, Calendar, Browser, Terminal, Settings, Wallet Connection
- AI integration for code suggestions, note enhancement, and terminal queries
- Supabase backend for authentication and data storage
- Wallet integration for on-chain actions
- Responsive UI built with React, TypeScript, Tailwind CSS, and shadcn-ui

## How to Run and Edit NeuraOS

You can work locally using your preferred IDE. The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Steps:
```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/Kartikvyas1604/NeuraOS.git

# Step 2: Navigate to the project directory.
cd NeuraOS

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Start the development server with auto-reloading and instant preview.
npm run dev
```

You can also edit files directly in GitHub or use GitHub Codespaces for cloud development.

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## How can I deploy this project?

You can deploy NeuraOS using your preferred static hosting provider (e.g., Vercel, Netlify, GitHub Pages). Build the project with:
```sh
npm run build
```
Then, follow your provider's instructions to deploy the `dist` folder.

## Project Structure

```
NeuraOS/
├── public/                # Static assets (favicon, robots.txt, etc.)
├── src/
│   ├── components/
│   │   ├── apps/          # Built-in apps (AI Assistant, Code Editor, etc.)
│   │   ├── ui/            # UI primitives and reusable components
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # External service clients (Gemini AI, Supabase)
│   ├── lib/               # Utility functions and libraries
│   ├── pages/             # Top-level pages (Index, NotFound)
├── supabase/              # Supabase config and migrations
├── img/                   # Images and screenshots
├── index.html             # Main HTML entry point
├── package.json           # Project metadata and dependencies
├── README.md              # Project documentation
```

## Custom Domain Setup

You can connect a custom domain using your hosting provider's dashboard. Refer to their documentation for step-by-step instructions.
