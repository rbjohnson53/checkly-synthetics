# Checkly Synthetics

Synthetic monitoring as code with the [Checkly CLI](https://www.checklyhq.com/docs/cli/): your Playwright tests and your user API checks, defined in this repository and deployed to Checkly with one command.

## What this sets up

| You asked for | How it works here |
|---|---|
| One folder for all Playwright tests; new ones picked up on deploy | Every `*.spec.ts` in [`__checks__/tests/`](__checks__/tests/) becomes a browser check automatically |
| Your 2 existing Playwright tests, passing | Fixed and passing from the US and the EU ([what was wrong](#what-was-wrong-with-the-two-tests)) |
| API checks created from a JSON file by a reusable function | One API check per user in [`users.json`](__checks__/data/users.json), built by [`createUserApiCheck()`](__checks__/utils/create-user-api-check.ts) |
| Assertions: status 200, names and ids match | Each check asserts status `200`, and that the response's `id` and `name` equal that user's entry in the JSON ([see note](#a-note-on-names-and-ids-should-match)) |
| The auth token treated as sensitive | Stored only in Checkly as a **secret** variable; never in this repo |
| 2 check groups | **Playwright checks** (your 2 tests) and **User API checks** (the generated checks) |
| Email alerts on failure | Both groups alert `raccoon@checklyhq.com` on failure and on recovery |
| Everything in git | This repo, plus a GitHub Actions workflow that tests every PR and deploys `main` |

## Quick start

Requires Node.js 20+ and a Checkly account.

```bash
npm ci
npx checkly login
npx checkly env add USER_API_TOKEN --secret   # paste the token when prompted, without "Bearer "
npx checkly test                              # run every check once on Checkly, changes nothing
npx checkly deploy                            # create/update the checks in your account
```

`npx checkly test` is safe to run any time: it doesn't save anything or send alerts. `npx checkly deploy` makes your Checkly account match this repo, including **removing** checks whose files you deleted.

## Project layout

```
checkly.config.ts                     project settings: name, default locations, runtime
__checks__/
  tests/                              ← your Playwright tests: one file = one check
    shop-checkout.spec.ts
    pokemon-type.spec.ts
  data/users.json                     ← users to monitor: one entry = one API check
  utils/create-user-api-check.ts      the reusable function: one user → one API check
  api-checks.check.ts                 reads users.json and calls the function per user
  groups.check.ts                     the 2 check groups (schedule, locations, retries, alerts)
  alerts.check.ts                     the email alert channel
.github/workflows/checkly.yml         CI: test on pull requests, deploy on main
```

## Day-to-day

### Add a Playwright test

Save it in `__checks__/tests/` and deploy. That's all: no other file to edit.

- **The file name must end in `.spec.ts`**, or it won't be picked up.
- **The file name is the check name** in Checkly (e.g. `tests/shop-checkout.spec.ts`), so name files clearly.
- **Renaming or moving a spec creates a new check** and deletes the old one, along with its history. Rename only when you mean to.
- Check before deploying: `npx checkly test --list` shows what would run without running it.

### Add an API check

Add an entry to [`__checks__/data/users.json`](__checks__/data/users.json) and deploy:

```json
{ "id": 77, "name": "New Person", "profile_url": "https://jsonmap-faiy.onrender.com/api/v1/items/user77" }
```

Remove an entry to remove its check. Each check's ID is based on the user's `id` (`user-api-77`), so you can reorder the file freely without losing history. An incomplete entry (missing `id`, `name` or a valid `profile_url`) stops the deploy with a clear error instead of creating a broken check.

**Reusing the function:** `createUserApiCheck(user, { group, tokenVariable })` works for any list with the same shape. To monitor a second list with a different schedule or alerts, create another group in `groups.check.ts` and call the function with it.

#### A note on "names and ids should match"

I read this as: **the `id` and `name` in each API response must equal that user's entry in `users.json`.** If you meant something else (for example, comparing values across endpoints), the assertions are three lines in [`create-user-api-check.ts`](__checks__/utils/create-user-api-check.ts) and easy to change.

### Change schedules, locations or alerts

All in [`groups.check.ts`](__checks__/groups.check.ts) and [`alerts.check.ts`](__checks__/alerts.check.ts):

| Setting | Playwright checks | User API checks |
|---|---|---|
| Runs every | 10 minutes | 5 minutes |
| Locations | N. Virginia (`us-east-1`), Frankfurt (`eu-central-1`) | same |
| Retries | 1, after 30 s | 1, after 30 s |
| Alert | email after a failed run (retry included), and on recovery | same |

The single retry means a one-off blip doesn't email you; only a failure that repeats does.

## The auth token

- It lives in Checkly as a **secret** environment variable, `USER_API_TOKEN`. Secret values are hidden in the Checkly UI, logs and results.
- The checks send `Authorization: Bearer {{USER_API_TOKEN}}`; Checkly fills it in at run time.
- **Please rotate the token you shared in the support chat** (it has been sent in plain text), then update it in Checkly:

  ```bash
  npx checkly env update USER_API_TOKEN --secret
  ```

- If `npx checkly env add` doesn't prompt for the value, this reads it without showing it or saving it to your shell history:

  ```bash
  read -rs T && npx checkly env add USER_API_TOKEN "$T" --secret; unset T
  ```

## CI with GitHub Actions

[`.github/workflows/checkly.yml`](.github/workflows/checkly.yml) runs on every pull request and every push to `main`:

1. Type-check and lint
2. `npx checkly test --record`: every check runs once on Checkly; a failure fails the PR
3. On `main` only: `npx checkly deploy`

So merging to `main` *is* the deploy, and your Checkly account always matches `main`.

**Setup:** in your repository's *Settings → Secrets and variables → Actions*, add:

| Secret | Where to find it |
|---|---|
| `CHECKLY_API_KEY` | Checkly → User settings → API keys → create key |
| `CHECKLY_ACCOUNT_ID` | Run `npx checkly whoami`; it's the ID in brackets. It's also in the Checkly app's URL: `app.checklyhq.com/accounts/<id>/…` |

## What was wrong with the two tests

Full before/after: [the fix commit](https://github.com/rbjohnson53/checkly-synthetics/commit/6eced66) (your original files are in the commit before it).

**Shop checkout** (`shop-checkout.spec.ts`), stopped at the first of these, so fixing one revealed the next:

1. **The "Add to cart" selector matched two buttons**, so Playwright refused to click (strict mode). This was the first failure. Now scoped to the Blue Top product card.
2. **"Continue Shopping" is a button, not a link.**
3. **The checkout pop-up's link is "Register / Login"**, not "Register / Signup".
4. **The three `expect(…).toBeVisible` lines were never called** (no `()` and no `await`), so they checked nothing. The test had no working assertions at all.
5. **The cookie consent banner was checked once, before it appears.** It now gets clicked whenever it shows up (it only appears in some regions, such as Checkly's EU locations).
6. **The "Products" link name included an invisible icon character.** Now matched on the word.

Also: ad networks are blocked, because the site's full-screen ads can cover the page, and the test checks that Blue Top is actually in the cart.

**PokeAPI** (`pokemon-type.spec.ts`):

1. **`forms` is a list**, so `forms.url` was `undefined` and the next request failed with "Invalid URL". Now `forms[0].url`.
2. **`types[0].type` is an object** (`{ name, url }`), so comparing it to `'electric'` would still fail. Now `types[0].type.name`.
3. **`expect(response).toBeOK()` wasn't awaited**, so a failed request wouldn't fail the test.

### Catching these automatically

```bash
npm run lint
```

ESLint is set up with Playwright rules that flag uncalled and unawaited assertions. Run against the original two tests, it reports 13 errors, including all six of the assertion bugs above and *"Test has no assertions"* for the shop test. It also runs in CI.

## Running tests locally

```bash
npx playwright install chromium
npm run test:local
```

This runs the specs on your machine with Playwright. `@playwright/test` is pinned to the version in Checkly's runtime (`2026.04`: Playwright 1.58.2, Node.js 24), so local runs behave like Checkly. If you change `runtimeId` in `checkly.config.ts`, update the version in `package.json` to match (`npx checkly runtimes` lists them).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| API checks fail with `401` | `USER_API_TOKEN` is missing, wrong, or was rotated without updating Checkly |
| API check slow or failing after a quiet period | The API is hosted on Render, which can take a while to wake up (cold start). The retry and 20 s limit usually absorb this |
| Shop test passes locally but fails in the EU | Cookie consent banner. Run `npx checkly test --location eu-central-1` and open the trace from the result link |
| A new spec doesn't show up | File name doesn't end in `.spec.ts`, or it's outside `__checks__/tests/`. Check with `npx checkly test --list` |
| A check's history disappeared | Its spec file was renamed or moved, or its user `id` changed |

## Possible next steps

- **Playwright Check Suites**: if your test suite grows into a larger Playwright project with shared setup or several browsers, Checkly can run it as-is as one check. Each test here is its own check, so each has its own result and alert.
- **More assertions**: e.g. also check `profile_url`, or a response time budget per user.
- **More alert channels**: Slack, PagerDuty, Opsgenie and others work the same way as the email channel.
