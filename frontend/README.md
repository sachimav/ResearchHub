# ResearchHub frontend

React frontend with student and supervisor dashboards, authentication, and the public research showcase.

Install with `npm ci`, then run `npm run dev`. Start the backend separately on port 8000. Requests use `/api` through the Vite development proxy unless `VITE_API_URL` overrides it.

Run `npm test`, `npm run lint`, and `npm run build` for verification. Production hosting must provide frontend history fallback and forward `/api` to the backend, or configure an explicit API URL at build time.

See the [project README](../README.md) for environment setup, supervisor invitations, database checks and workflow verification.
