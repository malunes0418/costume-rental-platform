"use client";

import { useMemo, useState } from "react";
import {
  EyeClosedIcon as EyeOff,
  EyeOpenIcon as Eye,
} from "@radix-ui/react-icons";
import { Check, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

import { Sparkle } from "@/components/brand/Sparkle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/account";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-11 rounded-xl border-border/80 bg-background/60 pr-11 text-base md:text-sm"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full transition-colors",
          met ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {met ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
      <span className={cn(met ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </li>
  );
}

export function SecurityPanel() {
  const [usesGoogleSignIn, setUsesGoogleSignIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = Boolean(currentPassword || newPassword || confirmPassword);

  const requirements = useMemo(
    () => ({
      minLength: newPassword.length >= 8,
      matches: newPassword.length > 0 && newPassword === confirmPassword,
    }),
    [confirmPassword, newPassword]
  );

  const canSubmit =
    requirements.minLength &&
    requirements.matches &&
    (usesGoogleSignIn || currentPassword.trim().length > 0);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit() {
    if (!newPassword.trim()) {
      toast.error("Enter a new password.");
      return;
    }
    if (!requirements.minLength) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (!requirements.matches) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!usesGoogleSignIn && !currentPassword.trim()) {
      toast.error("Enter your current password, or check Google sign-in below.");
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({
        ...(usesGoogleSignIn || !currentPassword ? {} : { current_password: currentPassword }),
        new_password: newPassword,
      });
      resetForm();
      toast.success(usesGoogleSignIn ? "Password set. You can now sign in with email too." : "Password updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkle size="sm" animated />
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            Account protection
          </p>
        </div>
        <h2 className="section-heading mt-3">Security</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Guard your reservations and payment history. A strong password keeps your backstage pass
          yours alone.
        </p>
      </header>

      <div className="panel-card overflow-hidden">
        <div className="relative border-b border-border px-6 py-6 md:px-8">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background: `
                radial-gradient(ellipse 70% 100% at 10% 50%, oklch(0.80 0.12 80 / 0.1), transparent 55%),
                radial-gradient(ellipse 50% 80% at 90% 40%, oklch(0.68 0.16 28 / 0.06), transparent 50%)
              `,
            }}
          />

          <div className="relative detail-chip border-border/60 bg-card/80 py-4">
            <div className="detail-chip-icon detail-chip-icon--gold">
              <Shield className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {usesGoogleSignIn ? "Setting your first password" : "Update your password"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {usesGoogleSignIn
                  ? "You signed in with Google and have not set a password yet. Choose one to also log in with email."
                  : "Enter your current password, then choose a new one. Leave Google sign-in checked if you never set a password."}
              </p>
              <label className="mt-4 flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={usesGoogleSignIn}
                  onChange={(event) => {
                    setUsesGoogleSignIn(event.target.checked);
                    if (event.target.checked) setCurrentPassword("");
                  }}
                  className="size-4 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground">I sign in with Google (no password yet)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-8 md:px-8">
          {!usesGoogleSignIn ? (
            <PasswordField
              id="security-current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              placeholder="Your existing password"
            />
          ) : null}

          <PasswordField
            id="security-new-password"
            label={usesGoogleSignIn ? "New password" : "New password"}
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />

          <PasswordField
            id="security-confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            placeholder="Repeat your new password"
          />

          {newPassword || confirmPassword ? (
            <ul className="space-y-2 rounded-xl bg-muted/30 px-4 py-3" aria-live="polite">
              <RequirementRow met={requirements.minLength} label="At least 8 characters" />
              <RequirementRow met={requirements.matches} label="Passwords match" />
            </ul>
          ) : null}
        </div>

        <div
          className={cn(
            "grid border-t border-border bg-muted/20 transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isDirty ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <p className="text-xs text-muted-foreground">Ready to lock in your new password.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-5 shadow-coral"
                  onClick={() => void handleSubmit()}
                  disabled={isSaving || !canSubmit}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : usesGoogleSignIn ? (
                    "Set password"
                  ) : (
                    "Update password"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
