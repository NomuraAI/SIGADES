# AI Development Rules - SIGADES LOBAR

## Tech Stack Overview
- **Core Framework**: React 19 with TypeScript for type safety and modern component patterns.
- **Build Tooling**: Vite for fast development and optimized production builds.
- **Styling**: Tailwind CSS for utility-first styling, using the custom "Lobar" color palette defined in `tailwind.config.js`.
- **UI Components**: Shadcn/UI (Radix UI primitives) for accessible, consistent, and beautiful interface elements.
- **Icons**: Lucide React for a comprehensive and consistent iconography system.
- **Maps & Geospatial**: Leaflet and React Leaflet for interactive map rendering and spatial data visualization.
- **Backend & Database**: Supabase for real-time database needs, authentication, and cloud storage.
- **Animations**: Framer Motion for smooth, high-performance UI transitions and interactions.
- **Data Processing**: SheetJS (XLSX) for handling Excel-based data imports and exports.

## Library & Implementation Rules

### 1. UI & Components
- **Shadcn UI**: Always check for existing Shadcn components before building custom ones.
- **Icons**: Exclusively use `lucide-react`. Do not import from other icon libraries.
- **Responsiveness**: All new components MUST be responsive (mobile-first approach using Tailwind's `md:`, `lg:`, etc.).

### 2. State & Data
- **Supabase**: Use the `supabase` client from `src/lib/supabase.ts` for all database interactions. Use snake_case for database columns and camelCase for frontend interfaces.
- **Types**: Define all data interfaces in `src/types.ts` to maintain a single source of truth for data structures.

### 3. Mapping
- **Leaflet**: Use `react-leaflet` for map components. Ensure marker icons are properly fixed using the pattern in `MapContainer.tsx` to avoid broken assets.
- **Geocoding**: Use `leaflet-geosearch` or OpenStreetMap (Nominatim) APIs for location searching.

### 4. File Structure
- **Components**: Small, focused components in `src/components/`. One file per component.
- **Pages**: Main view containers in `src/pages/`.
- **Logic**: Keep business logic or complex calculations in separate utility files or custom hooks.

### 5. Styling Conventions
- **Glassmorphism**: Use the `.glass-panel` and `.glass-button` classes defined in `index.css` for the signature app look.
- **Colors**: Strictly use the `lobar-*` color variables (e.g., `bg-lobar-blue`, `text-lobar-red`) for branding consistency.