declare global {
  namespace Express {
    interface Request {
      tenant_id?: string;
      request_id?: string;
    }
  }
}

export {};
