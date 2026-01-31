# Agent Platform

Multi-tenant AI agent system with scheduling authorization, monitoring, OpenTelemetry tracing, Prometheus metrics, and A/B testing.

## Quick Start

```bash
cd agent-platform
npm install
npm run build
npm run dev
```

The API listens on `http://localhost:3000`.

### Troubleshooting: "This site can't be reached"

If `http://localhost:3000` shows "This site can't be reached":

1. **Start the server** – The API must be running. From `agent-platform/` run:
   ```bash
   npm run dev
   ```
   You should see: `Agent platform API listening on port 3000`

2. **Install dependencies first** – If you haven't yet:
   ```bash
   npm install
   npm run build
   npm run dev
   ```

3. **Verify Node.js** – Ensure Node.js 18+ is installed:
   ```bash
   node --version
   ```

4. **Check the port** – If 3000 is in use, set `PORT=3001` (or `$env:PORT=3001` in PowerShell) before running.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agent/run` | POST | Run scheduling auth agent |
| `/feedback` | POST | Submit feedback |
| `/events` | GET | Inspect telemetry events (query: `tenant_id`, `limit`) |
| `/metrics` | GET | Prometheus metrics |
| `/health/live` | GET | Liveness probe |
| `/health/ready` | GET | Readiness probe (config + OTel) |

All agent/feedback requests require `x-tenant-id` header (or `tenant_id` in body/query for GET /events).

## curl Examples

### Scheduling Auth Request

```bash
curl -X POST http://localhost:3000/agent/run \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-001" \
  -d '{
    "case_type": "scheduling_auth",
    "case_id": "case-123",
    "payload": {
      "payer": "Medicare",
      "plan_type": "MA",
      "cpt_codes": ["99213"],
      "place_of_service": "Office",
      "existing_auth": null,
      "member_id": "M12345"
    }
  }'
```

**Example response (schedule_ok):**
```json
{
  "decision": "schedule_ok",
  "confidence": 0.95,
  "missing_fields": [],
  "evidence_refs": ["rule:R3"],
  "scheduler_message": "Proceed with scheduling. No prior authorization required.",
  "experiment": { "experiment_id": "EXP-A2", "variant": "control" },
  "latency_ms": 102
}
```

### Auth Required (R1 rule)

```bash
curl -X POST http://localhost:3000/agent/run \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-001" \
  -d '{
    "case_type": "scheduling_auth",
    "case_id": "case-124",
    "payload": {
      "payer": "Aetna",
      "plan_type": "HMO",
      "cpt_codes": ["70553"],
      "place_of_service": "Outpatient Clinic",
      "existing_auth": null,
      "member_id": "M67890"
    }
  }'
```

### Feedback Submission

```bash
curl -X POST http://localhost:3000/feedback \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-001" \
  -d '{"case_id": "case-123", "feedback_type": "approved"}'
```

### Inspect Events

```bash
curl "http://localhost:3000/events?tenant_id=tenant-001&limit=10" \
  -H "x-tenant-id: tenant-001"
```

## Docker Compose (Full Stack)

Run API, OpenTelemetry Collector, Prometheus, and Jaeger:

```bash
cd agent-platform
npm run docker:up
```

Or with build: `docker-compose -f infra/docker/docker-compose.yaml up --build -d`

- **API**: http://localhost:3000
- **Health**: http://localhost:3000/health/live
- **Metrics**: http://localhost:3000/metrics
- **Prometheus UI**: http://localhost:9090
- **Jaeger UI**: http://localhost:16686

Stop:

```bash
npm run docker:down
```

## Rules Engine (Deterministic)

| Rule | Payer | Plan | CPT | POS | Decision |
|------|-------|------|-----|-----|----------|
| R1 | Aetna | HMO | 70553 | contains "Outpatient" | auth_required |
| R2 | United | PPO | 93306 | any | auth_required |
| R3 | Medicare | any | 99213 | any | schedule_ok |
| default | - | - | - | - | human_review |

## A/B Testing (EXP-A2)

- **Control**: Wait for all tool results before decision
- **Treatment**: If policy_kb_lookup returns decisive rule (confidence ≥ 0.9), proceed without waiting on eligibility/auth lookup

Assignment uses SHA256 sticky bucketing; experiment metadata is included in responses and OTel spans.

## Project Structure

```
agent-platform/
├── apps/api/src/
│   ├── index.ts
│   ├── routes/         # agent, feedback, metrics, health, events
│   ├── middleware/     # tenant, requestId, errorHandler
│   ├── orchestrator/   # schedulerAuth.graph.ts
│   ├── services/       # cache, rulesEngine, toolBroker, experiments, etc.
│   ├── prompts/        # promptRegistry.json, promptManager.ts
│   ├── types/
│   └── config/         # monitoring, speed, tools, experiments
├── packages/shared/
│   └── src/            # logger, otel, metrics, hash, redaction
├── infra/
│   ├── docker/         # docker-compose.yaml, prometheus.yml
│   └── otel/           # otel-collector.yaml
├── Dockerfile
└── package.json
```
