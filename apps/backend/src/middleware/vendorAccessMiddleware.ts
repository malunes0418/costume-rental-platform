import { NextFunction, Request, Response } from "express";

function deny(res: Response, message: string) {
  return res.status(403).json({ message });
}

export function ensureVendorApplicant(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.vendor_status === "PENDING" || req.user.vendor_status === "APPROVED") {
    return next();
  }

  return deny(res, "Vendor application required");
}

export function ensureApprovedVendor(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.vendor_status === "APPROVED") {
    return next();
  }

  return deny(res, "Approved vendor access required");
}
