"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { applyForVendor } from "@/lib/vendor";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeftIcon as ArrowLeft } from "@radix-ui/react-icons";

export default function VendorApply() {
  const { token } = useAuth();
  const router = useRouter();

  const [storeName, setStoreName]     = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Please log in first."); return; }
    setLoading(true);
    try {
      await applyForVendor({ store_name: storeName, store_description: description }, token);
      toast.success("Application submitted! We'll review your request shortly.");
      setTimeout(() => router.push("/vendor"), 1400);
    } catch {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-16">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">

        {/* ── Left: intro copy ── */}
        <div className="lg:col-span-5 flex flex-col gap-10">
          <Link
            href="/vendor"
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back
          </Link>

          <div className="space-y-6 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Vendor Programme
            </p>
            <h1 className="font-playfair text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              Apply to sell.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-sm">
              Join our curated marketplace of high-end theatrical wear. Provide your store details — our team reviews every application personally.
            </p>
          </div>

          <div className="border-t border-border pt-10 space-y-8 animate-fade-up-delay-1">
            {[
              { label: "Review time", value: "Within 24 hours" },
              { label: "Commission",  value: "Zero — keep everything" },
              { label: "Listings",    value: "Unlimited with subscription" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="font-playfair text-xl font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className="lg:col-span-7 animate-fade-up-delay-1">
          <form
            onSubmit={handleSubmit}
            className="border border-border rounded-sm p-8 md:p-12 flex flex-col gap-10"
          >
            <div className="border-b border-border pb-8">
              <p className="font-playfair text-2xl font-semibold text-foreground">
                Store details
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                This information will appear on your public vendor profile.
              </p>
            </div>

            {/* Store name */}
            <div className="space-y-3">
              <Label
                htmlFor="store-name"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Store name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-name"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Royal Garments"
                required
                className="h-12 rounded-sm border-border bg-transparent text-base focus-visible:ring-0 focus-visible:border-foreground/30"
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label
                htmlFor="store-description"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Store description
              </Label>
              <textarea
                id="store-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Tell us about the quality, style, and history of your costume collection…"
                className="w-full resize-y rounded-sm border border-border bg-transparent px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Submit */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border">
              <button
                type="submit"
                disabled={loading || !storeName.trim()}
                className="flex h-12 w-full items-center justify-center rounded-sm bg-foreground text-xs font-semibold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting…" : "Submit application"}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                By applying, you agree to our vendor terms and conditions.
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
