import bcrypt from "bcryptjs";
import { JwtHelper } from "../helpers/JwtHelper";
import { User } from "../models/User";
import { OAuthAccount } from "../models/OAuthAccount";
import type { LoginRequest, LogoutRequest, RegisterRequest } from "../dto";

export class AuthService {
  async register({ email, password, name }: RegisterRequest) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error("Email already in use");
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: hash, name });
    const token = JwtHelper.generateToken(user);
    return { user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url }, token };
  }

  async login({ email, password }: LoginRequest) {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password_hash) {
      throw new Error("Invalid credentials");
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new Error("Invalid credentials");
    }
    const token = JwtHelper.generateToken(user);
    return { user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, role: user.role, vendor_status: user.vendor_status }, token };
  }

  async findOrCreateOAuthUser(provider: string, providerUserId: string, email?: string, name?: string, avatarUrl?: string) {
    let oauthAccount = await OAuthAccount.findOne({ where: { provider, provider_user_id: providerUserId } });
    if (oauthAccount) {
      const user = await User.findByPk(oauthAccount.user_id);
      
      if (!user) {
        throw new Error("User not found");
      }
      const token = JwtHelper.generateToken(user);
      return { user, token };
    }
    let user = null;
    if (email) {
      user = await User.findOne({ where: { email } });
    }
    if (!user) {
      user = await User.create({ email: email || "", name, avatar_url: avatarUrl });
    }
    oauthAccount = await OAuthAccount.create({ user_id: user.id, provider, provider_user_id: providerUserId });
    const token = JwtHelper.generateToken(user);
    return { user, token };
  }

  async logout(_body: LogoutRequest) {}
}
