"use client";
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
      router.push("/vendor");
    } catch (err) {
      alert("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 mt-12 surface rounded-xl animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl display text-gold mb-2">Vendor Application</h1>
        <p className="text-muted">Join our curated marketplace of high-end theatrical wear.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm text-muted mb-2 uppercase tracking-wide">Store Name</label>
          <input 
            type="text" 
            className="field-input text-lg" 
            value={storeName} 
            onChange={e => setStoreName(e.target.value)} 
            placeholder="e.g. Royal Garments"
            required 
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-2 uppercase tracking-wide">Store Description</label>
          <textarea 
            className="field-input min-h-[120px] resize-y" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Tell us about the quality and style of your collection..."
          />
        </div>
        <div className="pt-4 border-t border-white/10">
          <button type="submit" className="btn-crimson w-full justify-center text-lg py-3" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
