# XPSP origin authority

**Status:** cutover checkpoint only. Do not merge this branch until the canonical project Pages origin has promoted and live-verified the approved signed directory.

## Single authority

`ESCANORy/xpmanga-sources` is the sole repository allowed to construct, verify, and deploy the official XPSP publication at:

```text
https://escanory.github.io/xpmanga-sources/
```

The user-site repository must not retain a second `xpmanga-sources/directory.json`, legacy `catalog.json`, or content-addressed target tree. Those files form a shadow authority that can reappear if the project Pages configuration is disabled or changed.

## Cutover gate

Merge this deletion checkpoint only after all of the following evidence exists:

| Gate | Required result |
|---|---|
| Protected promotion | The `xpmanga-sources` workflow deployed the approved immutable artifact through the protected `github-pages` environment. |
| Exact live directory | The canonical URL returns the expected signed sequence and SHA-256 digest. |
| Complete live target set | Every target referenced by the directory returns the declared byte count and SHA-256 digest and passes signature and identity verification. |
| Client parity | The approved directory is byte-identical to the pinned v108 bundled snapshot and its bundled delta targets are complete. |
| Monitoring | The daily live-origin monitor is enabled and has completed successfully. |

After these gates pass, removing the user-site payload is intentionally **fail-closed**: a future loss of the project Pages deployment must produce a visible failure rather than silently resurrect an obsolete signed directory.

## Recovery

Do not restore these deleted files and do not roll back to a lower sequence. Recover the canonical project origin with a newly signed, strictly higher `FORWARD_RECOVERY` sequence built from the last-known-good signed directory, then pass it through the same protected promotion and live-verification workflow.
