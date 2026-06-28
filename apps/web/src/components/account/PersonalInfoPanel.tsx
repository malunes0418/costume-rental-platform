"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraIcon } from "@radix-ui/react-icons";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Sparkle } from "@/components/brand/Sparkle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, uploadAvatar } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { resolveApiAsset } from "@/lib/assets";
import { cn } from "@/lib/utils";

export function PersonalInfoPanel() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const isDirty = name.trim() !== (user?.name ?? "").trim();

  const handleAvatarChange = useCallback(
    async (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose a JPG or PNG image.");
        return;
      }

      setIsUploadingAvatar(true);
      try {
        await uploadAvatar(file);
        await refreshUser();
        toast.success("Profile photo updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to upload photo.");
      } finally {
        setIsUploadingAvatar(false);
        setIsDragOver(false);
      }
    },
    [refreshUser]
  );

  async function handleSaveProfile() {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({ name: name.trim() });
      await refreshUser();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    void handleAvatarChange(file);
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkle size="sm" animated />
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            Your profile
          </p>
        </div>
        <h2 className="section-heading mt-3">Personal info</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          The face you show renters and vendors. Keep your name current so handoffs and messages land
          with the right person.
        </p>
      </header>

      <div className="panel-card overflow-hidden">
        {/* Identity spotlight */}
        <div className="relative border-b border-border">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background: `
                radial-gradient(ellipse 80% 120% at 20% 50%, oklch(0.68 0.16 28 / 0.08), transparent 60%),
                radial-gradient(ellipse 60% 80% at 85% 30%, oklch(0.80 0.12 80 / 0.1), transparent 55%)
              `,
            }}
          />

          <div className="relative flex flex-col items-center gap-8 px-6 py-10 sm:flex-row sm:items-center sm:gap-10 md:px-8">
            <button
              type="button"
              aria-label="Change profile photo. Drop an image or click to browse."
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "group relative mx-auto shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:mx-0",
                "size-36 md:size-44",
                "rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "hover:scale-[1.02] active:scale-[0.98]",
                isDragOver && "scale-[1.03]"
              )}
            >
              <div
                className={cn(
                  "absolute -inset-3 rounded-full border-2 border-dashed transition-colors duration-300",
                  isDragOver ? "border-primary bg-primary/5" : "border-transparent"
                )}
              />
              <div className="absolute -inset-2 rounded-full bg-brand-gold/25" aria-hidden="true" />
              <div
                className="absolute -inset-1 rounded-full border border-primary/30"
                aria-hidden="true"
              />

              <Avatar className="relative size-full ring-4 ring-card">
                {user?.avatar_url ? (
                  <AvatarImage
                    src={resolveApiAsset(user.avatar_url)}
                    alt={user.name ?? "Profile"}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-brand-coral-soft text-3xl font-bold text-primary md:text-4xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {isUploadingAvatar ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-brand-ink/50 backdrop-blur-[2px]">
                  <Loader2 className="size-8 animate-spin text-primary-foreground" />
                </div>
              ) : (
                <span className="absolute bottom-1 right-1 flex size-11 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-coral transition-transform duration-300 group-hover:scale-110 md:bottom-2 md:right-2">
                  <CameraIcon className="size-5" />
                </span>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleAvatarChange(file);
                  event.target.value = "";
                }}
              />
            </button>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {user?.name || "Your name"}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {isUploadingAvatar
                  ? "Uploading your new look…"
                  : "Drop a photo here or tap the camera. JPG or PNG, up to 8 MB."}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6 px-6 py-8 md:px-8">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-xs font-semibold uppercase tracking-widest">
              Full name
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="How should we address you?"
              className="h-11 rounded-xl border-border/80 bg-background/60 text-base md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-xs font-semibold uppercase tracking-widest">
              Email
            </Label>
            <div className="detail-chip bg-muted/30 py-3">
              <div className="detail-chip-icon detail-chip-icon--gold">
                <Lock className="size-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  id="profile-email"
                  className="truncate text-sm font-medium text-foreground"
                >
                  {user?.email ?? "—"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Locked for now — email changes need verification, coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save bar — only when dirty */}
        <div
          className={cn(
            "grid border-t border-border bg-muted/20 transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            isDirty ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <p className="text-xs text-muted-foreground">You have unsaved changes.</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => setName(user?.name ?? "")}
                  disabled={isSavingProfile}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-5 shadow-coral"
                  onClick={() => void handleSaveProfile()}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
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
