# Silverton Board Game Tracker

Silverton is a modern, high-performance web application designed to track sessions of the classic board game *Silverton*. It manages player accounts, real-time game state, turn history, and complex calculations for a smooth gaming experience.

## ✨ Features

- **Real-time Game State**: Polls the server periodically to keep all players in sync.
- **Session Persistence**: Seamless hydration from `localStorage` ensures you stay logged in and keep your progress on page refresh.
- **Advanced State Management**: Powered by Svelte 5 Runes for ultra-responsive UI updates.
- **Transaction Tracking**: Detailed inputs for debits (tracks, contracts, claims) and credits (revenue, resource sales).
- **History & Rollback**: Full turn history for every player, with administrative capabilities to rollback to any previous state.
- **Custom Modals**: Elegant, promise-based confirm dialogs built with the native HTML `<dialog>` element.
- **Premium Aesthetics**: A "Gold Rush" themed UI with custom typography, glassmorphism, and responsive design.

## 🛠️ Technology Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **UI Engine**: [Svelte 5](https://svelte.dev/) (using Runes)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Database**: SQLite (managed via local.db)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (comes with Node.js)

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd silverton
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

### Developing

Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building

To create a production version of your app:
```sh
npm run build
```

You can preview the production build with `npm run preview`.

## 📂 Architecture

- **`src/lib/state/`**: Contains the core logic and Svelte $state based stores (`gameStore.svelte.ts`, `confirmStore.svelte.ts`).
- **`src/lib/components/`**: Reusable UI components like the `ConfirmModal`.
- **`src/routes/`**: Application pages and API endpoints for state persistence.
- **`src/app.css`**: Global styles using CSS variables for a consistent theme.

## ⚖️ License

This project is for personal use as a board game utility.
