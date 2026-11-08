# Runbook: local development

## Setup

1. Use Node.js 20 or newer (`node -v`).
2. Install exactly what the lockfile pins: `npm ci`. This also installs the
   Husky pre-commit hook.
3. Start the dev server: `npm run dev`, then open http://localhost:3000.
4. Confirm the server is healthy:

   ```bash
   curl -i http://localhost:3000/api/health
   # HTTP/1.1 200 OK
   # {"status":"ok"}
   ```

   The server log shows one JSON line per check, for example
   `{"timestamp":"...","level":"info","message":"health check",...}`.

No accounts, credentials, or environment variables are required.

## Common failures

### Port 3000 is already in use

`npm run dev` or `npm run start` fails with `EADDRINUSE`, or Next.js picks
another port.

- Find the process: `lsof -i :3000`.
- Stop it (`kill <pid>`), or run on another port: `npm run dev -- -p 3001`.
- `npm run test:e2e` reuses a server already on port 3000 outside CI. If that
  server is stale, stop it before running the end-to-end tests.

### Stale `.next` build output

Symptoms: old pages after switching branches, `Cannot find module` errors
under `.next`, or type errors in `.next/types` for files that no longer
exist.

```bash
rm -rf .next
npm run build   # or npm run dev
```

### Lockfile drift

`npm ci` fails with "package.json and package-lock.json are not in sync", or
tools behave differently from CI.

- If you changed `package.json`, run `npm install` to update
  `package-lock.json` and commit both files together.
- If you did not, restore the lockfile from `main` and run `npm ci` again.
- Never delete `package-lock.json` to make an install pass.

### Playwright cannot find a browser

`npm run test:e2e` fails with "Executable doesn't exist". Install Chromium
once: `npx playwright install chromium` (add `--with-deps` on Linux).

### The pre-commit hook does not run

Run `npm run prepare` to reinstall the Husky hook. The hook only runs
lint-staged (Prettier and ESLint fixes on staged files); run the test suite
yourself before pushing.

## Checking health

- Locally: `curl http://localhost:3000/api/health` must return `200` with
  `{"status":"ok"}`.
- In CI: the E2E workflow asserts the same response against a production
  build, and the DAST workflow waits for it before scanning.
