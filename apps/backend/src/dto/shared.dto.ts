import type { UserAttributes } from "../models/User";

/** User as returned by the API (never includes password). */
export type UserPublic = Omit<UserAttributes, "password_hash">;

/** Compact user for nested JSON (e.g. reviews). */
export type UserSummary = Pick<UserAttributes, "id" | "email" | "name" | "avatar_url">;
