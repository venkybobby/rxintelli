# Deploy and Run — Agent Platform

## Option A: Local Development (Fastest)

From a terminal (PowerShell or CMD) where `npm` works:

```powershell
cd c:\Users\shris\ai-data-science-team\agent-platform

# 1. Build
npm run build

# 2. Run (dev mode with hot reload)
npm run dev
```

Or for production mode:

```powershell
npm run build
npm start
```

**URLs:**
- API: http://localhost:3000
- Health: http://localhost:3000/health/live
- Metrics: http://localhost:3000/metrics

**Test it:**
```powershell
curl http://localhost:3000/health/live
```

---

## Option B: Docker (Full Stack: API + Jaeger + Prometheus)

Requires Docker Desktop installed and running.

```powershell
cd c:\Users\shris\ai-data-science-team\agent-platform
docker-compose -f infra/docker/docker-compose.yaml up --build
```

Or detached (background):

```powershell
npm run docker:up
```

**URLs:**
- API: http://localhost:3000
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

---

## Quick API Test (Scheduling Auth)

Once the API is running:

```powershell
curl -X POST http://localhost:3000/agent/run `
  -H "Content-Type: application/json" `
  -H "x-tenant-id: tenant-001" `
  -d '{\"case_type\":\"scheduling_auth\",\"case_id\":\"c1\",\"payload\":{\"payer\":\"Medicare\",\"plan_type\":\"MA\",\"cpt_codes\":[\"99213\"],\"place_of_service\":\"Office\",\"existing_auth\":null,\"member_id\":\"M1\"}}'
```
