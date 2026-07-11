import bcrypt from "bcryptjs";
import { JwtHelper } from "../helpers/JwtHelper";
import { User } from "../models/User";
import { OAuthAccount } from "../models/OAuthAccount";
import type { LoginRequest, RegisterRequest } from "../dto";
import { assertPasswordPolicy, normalizeEmail } from "../utils/passwordPolicy";

export type OAuthIntent = "login" | "register";

export function parseOAuthIntent(value: unknown): OAuthIntent {
  return value === "register" ? "register" : "login";
}

function presentAuthUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    role: user.role,
    vendor_status: user.vendor_status
  };
}

export class AuthService {
  async register({ email, password, name }: RegisterRequest) {
    const normalizedEmail = normalizeEmail(email);
    assertPasswordPolicy(password);

    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new Error("Email already in use");
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: normalizedEmail, password_hash: hash, name });
    const token = JwtHelper.generateToken(user);
    return {
      user: presentAuthUser(user),
      token
    };
  }

  async login({ email, password }: LoginRequest) {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.scope("withPassword").findOne({ where: { email: normalizedEmail } });
    if (!user || !user.password_hash) {
      throw new Error("Invalid credentials");
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new Error("Invalid credentials");
    }
    const token = JwtHelper.generateToken(user);
    return {
      user: presentAuthUser(user),
      token
    };
  }

  async findOrCreateOAuthUser(
    provider: string,
    providerUserId: string,
    email: string | undefined,
    name: string | undefined,
    avatarUrl: string | undefined,
    intent: OAuthIntent
  ) {
    let oauthAccount = await OAuthAccount.findOne({ where: { provider, provider_user_id: providerUserId } });

    if (oauthAccount) {
      const user = await User.findByPk(oauthAccount.user_id);
      if (!user) {
        throw new Error("User not found");
      }
      if (intent === "register") {
        throw new Error("This Google account is already registered. Please log in instead.");
      }
      const token = JwtHelper.generateToken(user);
      return { user, token };
    }

    if (!email) {
      throw new Error("Google did not provide an email address for this account.");
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.scope("withPassword").findOne({ where: { email: normalizedEmail } });

    if (intent === "login") {
      if (!user) {
        throw new Error("No account found for this Google email. Please register first.");
      }

      // Never auto-link Google to an existing password account — that enables takeover
      // if someone registered first with the victim's email.
      throw new Error(
        "This email already has a password account. Sign in with your password, then link Google from account settings."
      );
    }

    if (user) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }

    const created = await User.create({ email: normalizedEmail, name, avatar_url: avatarUrl });
    oauthAccount = await OAuthAccount.create({
      user_id: created.id,
      provider,
      provider_user_id: providerUserId
    });

    const token = JwtHelper.generateToken(created);
    return { user: created, token };
  }

  async logout() {}
}
