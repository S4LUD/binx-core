# SLO Targets

Status: Draft  
Last updated: 2026-02-07

## Scope

These targets apply when Binx is used inside service request paths.

## Reliability Targets

- Decrypt success rate: >= 99.99% for valid inputs.
- Unexpected internal error rate: <= 0.01% of total operations.
- Security failure false-positive rate (valid payload rejected): <= 0.05%.

## Latency Targets (single operation, p95)

- `serializePayload`: <= 2 ms for payloads <= 64 KB.
- `parsePayload`: <= 2 ms for payloads <= 64 KB.
- `encryptPayload`: <= 5 ms for payloads <= 64 KB.
- `decryptPayload`: <= 5 ms for payloads <= 64 KB.

## Throughput Targets

- Sustain >= 1,000 encrypt+decrypt ops/sec on CI baseline hardware for small payload class (<= 2 KB).

## Monitoring Signals

- Operation counts by result (`success`, `error`).
- Error counts by `BinxError.code`.
- Decrypt failure spikes by KID.
- Payload size distributions.

## Burn-Rate Alert Suggestions

- Page if decrypt failure rate exceeds 1% for 5 minutes.
- Page if p95 decrypt latency exceeds target by 2x for 15 minutes.
- Ticket if any SLO breach occurs in two consecutive weekly windows.
