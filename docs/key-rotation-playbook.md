# Key Rotation Playbook

Status: Draft  
Last updated: 2026-02-07

## Goal

Rotate encryption keys with no data-loss and minimal downtime.

## Preconditions

- New key generated and stored in secret manager.
- New KID assigned (`0-255`).
- Consumers can resolve both old and new KIDs in `keyMap`.

## Procedure

1. Add new key to decrypt map in all consumers.
2. Deploy consumers.
3. Switch producers to encrypt with new KID.
4. Monitor decrypt errors by KID for one full business cycle.
5. Retire old KID from producers.
6. After data TTL/grace window, remove old KID from consumers.

## Example

Before:

```ts
const keyMap = { 1: process.env.BINX_KEY_1! };
```

During rotation:

```ts
const keyMap = {
  1: process.env.BINX_KEY_1!,
  2: process.env.BINX_KEY_2!,
};

// Producers should move to kid: 2
```

After retirement:

```ts
const keyMap = { 2: process.env.BINX_KEY_2! };
```

## Rollback

- If decrypt failures spike after cutover, revert producer `kid` to previous key.
- Keep both keys available until incident is resolved.
