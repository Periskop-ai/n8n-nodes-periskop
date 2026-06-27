# n8n-nodes-periskop

An [n8n](https://n8n.io) community node for **Periskop** — product discovery for
AI agents and workflows.

Periskop turns natural-language shopping intent into structured product results:
recommendations, ranked alternatives, merchant product URLs, price/currency when
available, caveats, no-match results, request IDs, and machine-readable errors.

> **Discovery only.** Periskop does not buy products, process payments, create
> merchant carts or checkout, reserve stock, or place orders, and it does not
> guarantee live price or availability. Your users complete the purchase on the
> merchant website. Every response includes an explicit `purchase_boundary`.

## Node

- **Node:** `Periskop`
- **Operation:** `Run Shopping Discovery`
- **Endpoint:** `POST https://mcp.periskop.ai/v1/mcp/shopping/discover`

### Fields

| Field | Required | Notes |
|---|---|---|
| Prompt | yes | Natural-language shopping intent |
| Response Format | no | `simple` (default) or `full` |
| Country | no | ISO country code, e.g. `PT` |
| Currency | no | ISO currency code, e.g. `EUR` |
| Language | no | BCP 47 tag, e.g. `en` |
| Mode | no | `auto` (default), `browse`, `recommend`, `best`, `bundle` |
| Max Results | no | 1–50 (default `3`) |
| Store | no | Store id or natural store hint |
| External User ID | no | Your own analytics id |
| Previous Result ID | no | Optional prior result id for follow-up discovery |
| Constraints (JSON) | no | e.g. `{"max_price": 200, "optimization": "best_quality"}` |

The node returns the Periskop JSON response as-is (one output item per input
item), so you can reference `result_id`, `request_id`, `items`, `caveats`,
`purchase_boundary`, and `errors` directly in downstream nodes.

## Credential

- **Name:** `Periskop API`
- **Field:** `API Key` (your `dp_...` key — create one at
  <https://periskop.ai/developer/keys>)
- The node sends `Authorization: Bearer <API Key>` automatically — do **not**
  type the word `Bearer`.
- **Credential test:** the credential is verified against `GET /v1/mcp/stores`,
  an auth-safe, **non-billable** endpoint — testing credentials never burns
  credits.
- An optional **Base URL** field defaults to `https://mcp.periskop.ai` and only
  needs changing for sandbox/self-hosted environments.

## Installation

### In n8n (GUI)

Install via **Settings → Community Nodes → Install** and enter
`n8n-nodes-periskop`.

### Local development

```bash
# from integrations/n8n-nodes-periskop
npm install
npm run build      # tsc + copies the SVG icon into dist/
npm run lint       # eslint-plugin-n8n-nodes-base checks

# link into a local n8n install for manual testing
npm link
cd ~/.n8n/custom    # create this folder if it does not exist
npm link n8n-nodes-periskop
# restart n8n; the Periskop node now appears in the node panel
```

See the n8n docs on
[running community nodes locally](https://docs.n8n.io/integrations/creating-nodes/test/run-node-locally/)
for the authoritative, version-specific steps.

## Example workflow

1. **Manual Trigger**
2. **Periskop → Run Shopping Discovery**
   - Prompt: `best desk chair under 60€`
   - Response Format: `simple`
3. Inspect the output: `result_id`, `request_id`, `items[]`, `caveats`,
   `purchase_boundary`.

## Pricing

Billed per successful request in EUR. Errors, rate limits, and hard no-match
responses are not billed. See <https://periskop.ai/developer> for current
pricing and any introductory credits.

## Known limitations

- One operation (`Run Shopping Discovery`) in this first version. Additional
  operations may be added later.
- A genuine no-result is a `200` with `answer_type: "no_match"`, not an error;
  infrastructure failures surface in `errors[]` and/or as HTTP `4xx/5xx` with a
  machine-readable `code`.

## License

MIT
