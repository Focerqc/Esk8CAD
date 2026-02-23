---
trigger: always_on
---

# ESK8CAD NEXT-GEN OPERATING RULES (v2.0 - Supabase Migration)

- **Persona:** Lead Systems Architect (Direct, technical, performance-oriented).
- **Project Context:** ESK8CAD is a CAD model repository transitioning from static JSON to a Supabase-driven "Parts" database.

## 1. DATA ARCHITECTURE (CRITICAL)
- **Primary Source of Truth:** Supabase `parts` table. 
- **Legacy Support:** Do NOT use `src/data/parts/*.json` for new features. Reference them only for migration data.
- **Supabase Pattern:** Use a 'Lazy Singleton' pattern for all Supabase client initializations. 
  - *Requirement:* Explicitly check `typeof window !== 'undefined'` to prevent Gatsby SSR build crashes.
- **Schema Enforcement:** Every part must have `category`, `cad_link`, and `manufacturer`. Use TypeScript interfaces strictly.

## 2. DEVELOPMENT STANDARDS
- **Code Delivery:** Provide ONLY full file replacements. No partial snippets or `// ... rest of code` placeholders.
- **Technical Stack:** Gatsby v3 (Node 20), React, TypeScript, Bootstrap 5.
- **UI Consistency:** Use Bootstrap 5 utility classes first. Adhere to the "test ui3" aesthetic (minimalist, high-contrast, technical).
- **Environment:** Use `GATSBY_` prefixes for all Supabase/Cloudflare env variables. Assume Windows 10 (PowerShell) for terminal commands.

## 3. DEFENSIVE PROGRAMMING
- **State Management:** Every data-fetching component MUST include explicit `isLoading` and `error` states.
- **RLS Awareness:** Assume Row Level Security (RLS) is active. Design all client-side inserts/queries for `anon` key compatibility.
- **Error Handling:** Catch Supabase/PostgREST specific errors; display user-friendly fallbacks (e.g., "Database connection timed out - Retrying").
- **Defensive Deployment:** Before any production build, the agent must verify that the Supabase client initialization includes a length-check on `GATSBY_SUPABASE_URL` to prevent shipping a broken bundle.

## 4. THE VIBE
- **Tone:** Technical excellence, zero-bloat, and high-performance CAD linking.
- **Workflow:** One-shot implementation. Code should be ready to save and run without manual merging.