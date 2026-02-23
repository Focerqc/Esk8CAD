# ESK8CAD Project Knowledge Base

This document serves as a reference for AI assistants and future developers working on the ESK8CAD project. It contains a high-level overview of the architecture, tech stack, and the current development roadmap.

## 1. Project Overview & Tech Stack

**ESK8CAD** is a web platform for open-source electric skateboard (ESK8) CAD files.

*   **Frontend Framework:** Gatsby v3 (React 17), running on Node >= 20.
*   **Language:** TypeScript throughout.
*   **Styling:** Bootstrap 5, React Bootstrap, and SCSS (`gatsby-plugin-sass`).
*   **Database & Auth:** Supabase (using `@supabase/supabase-js`).
*   **Serverless Backend:** Cloudflare Pages Functions (`functions/` directory) and Cloudflare KV (`SUBMIT_RATE_LIMIT`).
*   **Hosting:** Cloudflare Pages (`wrangler.toml`).
*   **Environment Variables Note:** Gatsby v3 requires all client-side environment variables to be prefixed with `GATSBY_` and stored as **Plaintext** (not Secrets) in Cloudflare Pages to be visible during the static build phase.

## 2. Directory Structure & Architecture

*   **`src/` (Frontend):**
    *   `pages/`: Gatsby page components mapped to routes.
    *   `components/`: Reusable React components (UI elements, layouts).
    *   `data/parts/`: Static JSON files representing CAD parts, sourced during the Gatsby build process via `gatsby-source-filesystem`.
    *   `utils/` / `lib/`: Shared utilities, including the lazy singleton Supabase client wrapper to prevent Server-Side Rendering (SSR) crashes.
    *   `scss/`: Styling files.
*   **`functions/` (Backend):**
    *   `api/`: Cloudflare Functions acting as the API layer (e.g., handling form submissions, scraping, and admin workflows).
*   **`.agent/rules/project-vibe.md`:** 
    *   Defines the AI persona, dynamic ID generation rules, schema requirements, and next-gen UI guidelines.

## 3. Core Processes & Workflows

*   **Development:** `npm run develop` (or `npm start`) spins up the Gatsby development server. The `gatsby-config.js` sets up a proxy to forward `/api` requests to a local Cloudflare Workers simulator (usually running on port 8788).
*   **Build:** `npm run build` compiles the static Gatsby site into the `public/` directory for Cloudflare Pages deployment.
*   **Data Sourcing:** Originally, the app was entirely statically generated using the JSON files in `src/data/parts`. It is currently transitioning to involve runtime data via Supabase (see Master Plan).
*   **Dynamic ID Generation:** (Defined in rules) When adding a new part statically, logic scans `src/data/parts` for the highest `part-####.json` and increments by 1.

## 4. Current Master Plan & Status (As of Context Creation)

The project is currently actively migrating part submissions to Supabase. This is the master plan outline:

*   ✅ **Step 1: Stabilize the Build (Completed)**
    *   Fixed the Gatsby Server-Side Rendering (SSR) crash by wrapping the Supabase client in a lazy singleton pattern. The app can now successfully build and run without tripping over missing environment variables on the server.
*   ✅ **Step 2: Clean up the UI (Completed)**
    *   Ripped out a broken "Backend Connection Test" button from the homepage to keep the frontend clean and functional.
*   ✅ **Step 3: Database Permissions / RLS (Completed)**
    *   The frontend form is wired up, but Supabase locks down tables by default. If Row Level Security (RLS) isn't configured to allow anonymous inserts, the database will block any new part submissions with a permission denied error.
*   ⏭️ **Step 4: End-to-End Submission Test (Up Next)**
    *   Once the database is ready to accept data, we need to submit a test part through the UI and verify it successfully lands in the Supabase backend.
*   ✅ **Step 5: Fetching and Displaying Parts (Completed)**
    *   The final major step will be writing the queries and UI components to pull those submitted parts back out of the database and display them on the site.

## 5. Infrastructure Gotchas

*   `net::ERR_NAME_NOT_RESOLVED` typically indicates an `undefined` Supabase URL caused by encrypted secrets being inaccessible to the Gatsby build engine.
