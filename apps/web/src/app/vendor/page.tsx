"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getVendorProfile, listVendorCostumes, type VendorProfile } from "@/lib/vendor";
import { Skeleton } from "@/components/ui/skeleton";
import { ArchiveIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function VendorOverviewPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [costumes, setCostumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      try {
        const resData = await getVendorProfile() as any;
        if (resData && resData.profile) {
          setProfile(resData.profile);
        }
        const costumesRes = await listVendorCostumes() as any;
        setCostumes(Array.isArray(costumesRes) ? costumesRes : (costumesRes.data || []));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full max-w-sm rounded-sm" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-10">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Welcome back
        </p>
        <h1 className="mt-2 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Overview
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Inventory KPI */}
        <div className="flex flex-col gap-5 rounded-sm border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight">
              Costume Listings
            </p>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border">
              <ArchiveIcon className="size-3.5 text-muted-foreground" />
            </div>
          </div>
          <p className="font-playfair text-4xl font-semibold tracking-tight text-foreground leading-none">
            {costumes.length}
          </p>
          <div className="mt-auto pt-2">
            <Link href="/vendor/inventory" className="text-[10px] font-semibold uppercase tracking-widest text-foreground underline decoration-border hover:decoration-foreground underline-offset-4 transition-colors">
              Manage inventory →
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card p-6">
        <h2 className="font-playfair text-2xl font-semibold text-foreground">More insights coming soon</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg">
          We are currently building out the full vendor dashboard. Soon you'll be able to see reservations, earnings, and detailed analytics here.
        </p>
      </div>
    </div>
  );
}
