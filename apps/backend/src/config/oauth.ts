import type { Request } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env";
import { AuthService, parseOAuthIntent } from "../services/AuthService";

const authService = new AuthService();

passport.use(
  new GoogleStrategy(
    {
      clientID: env.oauthGoogleClientId,
      clientSecret: env.oauthGoogleClientSecret,
      callbackURL: env.oauthGoogleCallbackUrl,
      passReqToCallback: true
    },
    async (req: Request, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        const name = profile.displayName;
        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : "";
        const intent = parseOAuthIntent(req.query.state);
        const result = await authService.findOrCreateOAuthUser("google", profile.id, email, name, avatarUrl, intent);
        done(null, result.user);
      } catch (e) {
        done(e as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: number, done) => {
  done(null, { id });
});

export default passport;
