"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { applyForVendor } from "@/lib/vendor";
import { useRouter } from "next/navigation";

export default function VendorApply() {
  const { token } = useAuth();
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await applyForVendor({ store_name: storeName, store_description: description }, token);
      toast.success("Application submitted! We'll review your request shortly.");
      setTimeout(() => router.push("/vendor"), 1500);
    } catch (err) {
      toast.error("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 md:py-24 animate-fade-up">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl display font-medium tracking-tight mb-4">Vendor Application</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Join our curated marketplace of high-end theatrical wear. Provide your details below, and our team will review your application.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <div className="space-y-4">
          <Label className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Store Name</Label>
          <Input 
            type="text" 
            value={storeName} 
            onChange={e => setStoreName(e.target.value)} 
            placeholder="e.g. Royal Garments"
            className="h-14 text-lg rounded-md bg-transparent border-border"
            required 
          />
        </div>
        <div className="space-y-4">
          <Label className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Store Description</Label>
          <textarea 
            className="flex min-h-[160px] w-full rounded-md border border-border bg-transparent px-4 py-4 text-lg shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Tell us about the quality and style of your collection..."
          />
        </div>
        
        <div className="pt-6">
          <Button type="submit" size="lg" className="w-full text-base font-medium h-14" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
