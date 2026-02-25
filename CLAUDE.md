# ComplyRadar Project Rules

## Mobile-First Responsive Design
Every UI component and feature MUST be implemented with mobile responsiveness. All layouts must work on both desktop and mobile viewports. Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) for breakpoint-specific styles. Test with both desktop and mobile layouts. No feature is complete until it works on mobile.

## Git Workflow — PRs Only
NEVER commit or merge directly to `main`. Always work on a feature branch and create a Pull Request via `gh pr create`. Wait for the user to approve before merging. This applies to all changes — features, fixes, and config updates.
