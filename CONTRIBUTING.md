# Contributing

Use Node.js 24 and the committed npm lockfile. Install dependencies with `npm ci`, then run `npm run dev`.

## Before submitting a change

```text
npm run typecheck
npm test
npm run build
```

For UI changes, also check a desktop viewport and a 390px phone viewport, keyboard focus/activation, reduced motion, and the device controls without WebGL. Keep the approved architectural design and sidebar arrangement unless the proposed change explicitly addresses them.

For simulation changes, add focused tests of the intended outcome and relevant boundaries. Device-control requests must use the shared command adapter. Keep authorization, qualified evidence, and teaching eligibility separate. Do not assign verifier results directly from scenario names or feed simulated physical truth into the verifier.

Preserve the distinction between the visible home and the baseline routine sandbox. Automated routine execution must not retrain the learner. Changes to stored records need an explicit snapshot-validation and migration/recovery decision.

## Pull requests

Use a focused branch and describe the problem, resulting behaviour, checks run, and relevant screenshots. Keep product code, documentation, and the implementation status in README consistent. A proposed design in `docs/superpowers/specs/` does not mean the feature exists.

Do not commit `node_modules/`, `dist/`, `.superpowers/`, local browser state, `.env` files, credentials, or generated review captures. The intentionally selected README preview in `docs/images/` is a documentation asset.

No open-source license has been selected for the application source. Confirm permission with the repository owner before redistributing it.
