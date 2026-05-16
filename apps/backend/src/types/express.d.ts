declare namespace Express {
  export interface Request {
    user?: {
      id: number;
      email: string;
      name: string | null;
      avatar_url: string | null;
      role: string;
      vendor_status: string;
    };
  }
}
