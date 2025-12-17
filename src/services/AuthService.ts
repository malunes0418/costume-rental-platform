import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { OAuthAccount } from "../models/OAuthAccount";

export class AuthService {
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      throw new Error("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      throw new Error("Password must contain at least one number");
    }
  }

  async register(email: string, password: string, name?: string) {
    this.validateEmail(email);
    this.validatePassword(password);
    
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error("Email already in use");
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: hash, name });
    const token = this.generateToken(user);
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password_hash) {
      throw new Error("Invalid credentials");
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new Error("Invalid credentials");
    }
    const token = this.generateToken(user);
    return { user, token };
  }

  async findOrCreateOAuthUser(provider: string, providerUserId: string, email?: string, name?: string, avatarUrl?: string) {
    let oauthAccount = await OAuthAccount.findOne({ where: { provider, provider_user_id: providerUserId } });
    if (oauthAccount) {
      const user = await User.findByPk(oauthAccount.user_id);
      if (!user) {
        throw new Error("User not found");
      }
      const token = this.generateToken(user);
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
    const token = this.generateToken(user);
    return { user, token };
  }

  generateToken(user: User) {
    return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: "7d" });
  }

  verifyToken(token: string) {
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    return { sub: Number(decoded.sub), role: decoded.role };
  }
}
