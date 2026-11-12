# Reference

Use these pages for exact names and contracts rather than walkthroughs:

| Page | Look up |
| --- | --- |
| [Configuration](configuration.md) | Optional runtime telemetry, release defaults, and separate workflow credentials. |
| [Data models](data-models.md) | Catalog, cart, order, analytics, and browser-storage shapes. |
| [Dependencies](dependencies.md) | Direct declarations, resolved lockfile versions, and compatibility constraints. |

For generated symbol documentation, run `npm run docs:generate` from the repository root. `package.json` invokes TypeDoc; `typedoc.json` expands `lib/` entry points into `docs/api/`, excludes private members, and does not incorporate a README. This is a local generated artifact, not an order-service schema or an additional deployed API.

See also the [HTTP API](../api.md), [security boundaries](../security.md), [deployment](../deployment.md), and [tooling](../how-to-contribute/tooling.md).
