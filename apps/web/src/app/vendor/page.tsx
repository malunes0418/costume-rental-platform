"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getVendorProfile, listVendorCostumes, VendorProfile } from "@/lib/vendor";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VendorDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [costumes, setCostumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login?next=/vendor");
      return;
    }

    async function fetchData() {
      try {
        const profileRes = await getVendorProfile(token!);
        setProfile(profileRes.data);
        if (profileRes.data?.status === "APPROVED") {
          const costumesRes = await listVendorCostumes(token!);
          setCostumes(costumesRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, router]);

  if (loading) return <div className="p-12 text-center text-muted animate-fade-up">Loading dashboard...</div>;

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-8 mt-12 surface rounded-xl animate-fade-up">
        <h1 className="text-3xl display text-gold mb-4">Become a Vendor</h1>
        <p className="text-muted mb-8 text-lg">Start earning by renting out your luxurious costumes to our exclusive clientele.</p>
        <Link href="/vendor/apply" className="btn-crimson text-lg px-8 py-3">
          Apply Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8 animate-fade-up">
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-4xl display text-gold mb-2">{profile.store_name}</h1>
          <p className="text-muted text-sm uppercase tracking-widest">
            Status: <span className="text-gold-light ml-2">{profile.status}</span>
          </p>
        </div>
        <button className="btn-crimson">Add Costume</button>
      </div>

      <div className="surface p-8 rounded-xl">
        <h2 className="text-2xl display mb-6 border-b border-white/5 pb-4">Your Listings</h2>
        {costumes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-dim text-lg">No costumes listed yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {costumes.map(c => (
              <div key={c.id} className="surface-2 p-5 rounded-lg border border-white/5 hover:border-gold/30 transition-colors">
                <h3 className="font-bold text-lg">{c.name}</h3>
                <p className="text-gold-light mt-2">${c.base_price_per_day}/day</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
