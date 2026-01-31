import { Router, Request, Response } from 'express';
import { runSchedulerAuth } from '../orchestrator/schedulerAuth.graph.js';
import { verifyResponse } from '../services/verify.js';
import { logger } from '@agent-platform/shared';
import type { AgentRunRequest, AgentRunResponse } from '../types/agent.js';

const router = Router();

router.post('/run', async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.tenant_id!;
  const body = req.body as Partial<AgentRunRequest>;

  if (!body.case_type || body.case_type !== 'scheduling_auth') {
    res.status(400).json({
      error: 'invalid_case_type',
      message: 'case_type must be scheduling_auth',
    });
    return;
  }

  if (!body.case_id || typeof body.case_id !== 'string') {
    res.status(400).json({
      error: 'invalid_case_id',
      message: 'case_id is required and must be a string',
    });
    return;
  }

  if (!body.payload || typeof body.payload !== 'object') {
    res.status(400).json({
      error: 'invalid_payload',
      message: 'payload is required',
    });
    return;
  }

  const request: AgentRunRequest = {
    case_type: 'scheduling_auth',
    case_id: body.case_id,
    payload: {
      payer: body.payload.payer ?? '',
      plan_type: body.payload.plan_type ?? '',
      cpt_codes: Array.isArray(body.payload.cpt_codes) ? body.payload.cpt_codes : [],
      icd_codes: body.payload.icd_codes,
      place_of_service: body.payload.place_of_service ?? '',
      existing_auth: body.payload.existing_auth ?? null,
      member_id: body.payload.member_id ?? null,
    },
  };

  try {
    const rawResponse = await runSchedulerAuth(tenantId, request);
    const verified = verifyResponse(tenantId, request.case_id, rawResponse);
    res.json(verified);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, tenantId, case_id: request.case_id }, 'Agent run failed');
    res.status(500).json({
      error: 'agent_error',
      message: process.env.NODE_ENV !== 'production' ? message : 'Agent execution failed',
    });
  }
});

export default router;
