# Logging

Server code uses the shared `logger` from `server/logger.ts`. Each call emits one JSON object per line, available in Vercel function logs or local process output. There is no application-configured Loki exporter, log drain, retention policy, or automatic trace enrichment. See the [monitoring signal map](index.md) for the other destinations.

## Record shape and routing

Every record starts with ISO `timestamp`, `level`, and `message`, followed by caller-supplied fields. Extra fields cannot overwrite those three reserved keys. JSON serialization escapes embedded message newlines so each event remains one physical line.

`debug`, `info`, `warn`, and `error` have increasing severity. The shared instance defaults to `info`, suppressing debug calls. Info/debug output goes to stdout; warn/error output goes to stderr. `createLogger({ level, write, now })` supports an explicit threshold, injectable writer, and clock. There is no environment-variable log-level switch.

Existing call sites:

| Message | Level | Fields |
| --- | --- | --- |
| `order placed` | info | `route`, `orderId`, `pickup`, `lineCount`, `totalCents` |
| `order rejected` for invalid JSON | warn | `route`, `reason: "invalid json"` |
| `order rejected` for validation | warn | `route`, `errors` |
| `health check` | info | `route`, rounded `uptimeSeconds` |
| `unhandled error` | error | `route`, request `method`, serialized `error` |
| `profiling unavailable` | warn | serialized `error` |

The logged invalid-JSON reason contains a space; the corresponding metric dimension is `reason="invalid_json"`. Neither should be silently substituted for the other when searching.

## Redaction and limitations

Nested object and array fields are copied and redacted by **key**, replacing sensitive values with `[REDACTED]`. Matching splits camelCase, snake_case, and kebab-case into lowercase words, also checking adjacent pairs and singular forms obtained by removing a trailing `s`.

Sensitive words are `password`, `passwd`, `secret`, `token`, `authorization`, `cookie`, `email`, `card`, `cvv`, `ssn`, and `apikey`. Thus `accessToken`, `set-cookie`, `cardNumber`, and `x-api-key` match; `discard` and `tokenizer` do not.

This is not content inspection. Customer `name`, arbitrary message text, URLs, and secrets hidden under innocuous keys are not scrubbed. Errors become `{ name, message, stack }`; their message and stack strings are not sanitized. The order route avoids logging the customer's name deliberately. The logger also does not sanitize PostHog payloads or operational scripts' console output. Review [security boundaries](../security.md) before adding fields.

Dates become ISO strings, bigints become decimal strings, and circular references become `[Circular]`. Repeated non-circular shared objects remain intact. Error custom properties are not copied.

## Add safe logging

Import `logger` in server code, use a stable message, and provide bounded operational facts such as route, result, counts, and integer cents. Never dump request bodies, headers, customer details, environment variables, or arbitrary exception contents assumed to be safe. Do not introduce I/O into `lib/`.

`tests/logger.test.ts` covers formatting, level filtering, reserved-key protection, redaction examples, circular/shared objects, and Error/Date/bigint serialization using an injected writer. Extend those tests when changing redaction semantics. They do not prove every possible sensitive string is removed.

## Key source files

| Repository path | Responsibility |
| --- | --- |
| `server/logger.ts` | Logger, serialization, and sensitive-key rules. |
| `tests/logger.test.ts` | Isolated writer and redaction tests. |
| `app/api/orders/route.ts`, `app/api/health/route.ts` | Request-boundary logs. |
| `server/telemetry.ts`, `server/instrumentation-node.ts` | Error and profiler-failure logs. |

For symptom-led investigation, see [debugging](../how-to-contribute/debugging.md).
