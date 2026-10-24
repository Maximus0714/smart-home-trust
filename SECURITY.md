# Security and simulation boundaries

Smart Home Trust is a local frontend simulation. Its identities, tokens, device messages, grants, witnesses, and policy decisions are demonstrations inside one browser. It provides no real authentication, isolation, device protection, vendor access revocation, or physical-security guarantee.

Do not connect real locks or devices or store real credentials in this prototype. The `sim-*` credential strings are illustrative inputs for the replay/rotation scenarios, not secrets or production keys.

## Reporting

For ordinary UI, authorization-model, or simulator logic problems, use a bug report with reproducible steps and expected/observed outcomes. Remove personal data and real secrets from logs and screenshots.

For a sensitive issue involving actual credentials or private data, contact the repository owner through an existing private channel. If GitHub's private vulnerability reporting is enabled for this repository, use that flow. Do not post live secrets in an issue. This project does not publish a dedicated security mailbox or promise a response-time SLA.
