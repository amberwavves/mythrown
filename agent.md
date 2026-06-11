# Agent Notes: mythrown Project

This document contains notes about the `mythrown` project to provide context for future development and maintenance.

## Project Overview

- **Project**: A portfolio website for "THROWN", a commercial and residential interior design studio by Amber Foster.
- **URL**: (Assuming local development) `http://localhost:4321` (default for Astro)
- **Framework**: [Astro.js](https.://astro.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom fonts and a theming system using CSS variables.
- **Language**: TypeScript

## Project Structure

The project follows a standard Astro project structure:

- `src/pages`: Contains the website's pages. Each `.astro` file corresponds to a route.
- `src/components`: Contains reusable UI components (e.g., `Nav.astro`, `Footer.astro`).
- `src/layouts`: Contains the main site layout (`Base.astro`).
- `src/lib`: Contains TypeScript utility functions.
  - `gallery.ts`: Manages image galleries, loading image order from `order.json` files.
  - `thrown-settings.ts`: Manages settings for the "THROWN" hero text styling.
- `public`: Contains static assets like images, fonts, and JSON data files.
- `scripts`: Contains utility scripts for managing project assets.

## Key Files and Conventions

- **`package.json`**: Defines project dependencies and scripts. Key dependencies include `astro` and `tailwindcss`.
- **`astro.config.mjs`**: Astro configuration file. It includes the Tailwind CSS integration.
- **`tsconfig.json`**: TypeScript configuration, extending Astro's strict configuration.
- **`src/styles/global.css`**: Contains global styles, including:
  - `@font-face` definitions for custom fonts (`Milova Violatte`, `Aliens And Cows`).
  - CSS variables (`--color-bg`, `--color-ink`, etc.) for theming.
  - Global styles for typography and layout elements.
- **Data Management**:
  - Gallery image order is managed by `order.json` files within each category's image directory (e.g., `public/images/commercial/order.json`). These files are read by the `getGallery` function in `src/lib/gallery.ts`.
  - The "THROWN" hero text settings are managed by `public/thrown-settings.json` and the functions in `src/lib/thrown-settings.ts`.
  - Some pages, like `favves.astro`, have their data hardcoded within the file itself.

## Development Workflow

- To start the development server, run `npm run dev`.
- To build the project for production, run `npm run build`.
- To preview the production build, run `npm run preview`.

## How to Get Help

This is an AI agent. If you need help, just ask.
