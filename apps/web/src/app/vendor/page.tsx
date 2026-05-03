"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getVendorProfile, listVendorCostumes, VendorProfile, deleteVendorCostume } from "@/lib/vendor";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash } from "lucide-react";
import { AddCostumeModal } from "@/components/AddCostumeModal";
import { EditCostumeModal } from "@/components/EditCostumeModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VendorDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [costumes, setCostumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresSubscription, setRequiresSubscription] = useState(false);
  const [selectedCostume, setSelectedCostume] = useState<any | null>(null);
  const [deleteConfirmCostume, setDeleteConfirmCostume] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteConfirmCostume) return;
    setIsDeleting(true);
    try {
      await deleteVendorCostume(deleteConfirmCostume, token!);
      toast.success("Listing deleted successfully.");
      const res = await listVendorCostumes(token!);
      setCostumes(Array.isArray(res) ? res : ((res as any).data || []));
      setDeleteConfirmCostume(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete listing.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/login?next=/vendor");
      return;
    }

    async function fetchData() {
      try {
        const resData = await getVendorProfile(token!) as any;

        if (resData && (resData.profile || (resData.status && resData.status !== "NONE"))) {
          const profileData = resData.profile || {};
          const normalizedProfile = {
            ...profileData,
            store_name: profileData.business_name || profileData.store_name || "My Store",
            store_description: profileData.bio || profileData.store_description || "",
            status: resData.status || "PENDING",
          };
          setProfile(normalizedProfile as VendorProfile);

          if (resData.status === "APPROVED") {
            try {
              const costumesRes = await listVendorCostumes(token!) as any;
              setCostumes(Array.isArray(costumesRes) ? costumesRes : (costumesRes.data || []));
            } catch (err: any) {
              if (err?.body?.code === "SUBSCRIPTION_REQUIRED" || err?.status === 402 || err?.status === 403) {
                setRequiresSubscription(true);
              } else {
                throw err;
              }
            }
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error(err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, router]);

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-fade-up">
        Loading dashboard...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-24 px-6 animate-fade-up">
        <h1 className="text-4xl display tracking-tight mb-4">Become a Vendor</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Start earning by renting out your luxurious costumes to our exclusive clientele.
        </p>
        <Button asChild size="lg" variant="outline" className="text-base px-8 h-12">
          <Link href="/vendor/apply">Apply Now</Link>
        </Button>
      </div>
    );
  }

  if (profile.status !== "APPROVED") {
    return (
      <div className="max-w-2xl mx-auto mt-24 px-6 animate-fade-up">
        <h1 className="text-4xl display tracking-tight mb-4">
          Application {profile.status === "PENDING" ? "Pending" : profile.status}
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          {profile.status === "PENDING"
            ? "Your vendor application is currently under review. We'll notify you once you're approved."
            : `Your application status is: ${profile.status}.`}
        </p>
        <Button asChild size="lg" variant="outline" className="text-base px-8 h-12">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 mt-8 animate-fade-up">
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-border">
        <div>
          <h1 className="text-4xl display mb-2">{profile.store_name}</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Status: <span className="text-foreground ml-2">{profile.status}</span>
          </p>
        </div>
        <AddCostumeModal 
          onSuccess={() => {
             // Refresh costumes
             listVendorCostumes(token!).then(res => {
               setCostumes(Array.isArray(res) ? res : ((res as any).data || []));
             }).catch(console.error);
          }} 
          disabled={requiresSubscription} 
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl display">Your Listings</h2>
        </div>
        
        {requiresSubscription ? (
          <Card className="py-12 text-center bg-muted/30 border-dashed">
            <CardContent className="pt-6">
              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Active Subscription Required</h3>
                <p className="text-muted-foreground text-base">
                  You need an active vendor subscription to list costumes, manage your inventory, and accept reservations.
                </p>
                <div className="pt-4">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/vendor/subscription">Manage Subscription</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : costumes.length === 0 ? (
          <Card className="py-12 text-center bg-muted/30 border-dashed">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-lg">No costumes listed yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {costumes.map(c => (
              <Card 
                key={c.id} 
                className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group relative"
                onClick={() => setSelectedCostume(c)}
              >
                {c.CostumeImages && c.CostumeImages.length > 0 && (
                   <div className="aspect-[4/3] w-full bg-muted overflow-hidden relative">
                     <img src={c.CostumeImages[0].image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <button
                       type="button"
                       className="absolute top-2 right-2 p-2 bg-background/80 hover:bg-destructive text-foreground hover:text-destructive-foreground backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                       onClick={(e) => {
                         e.stopPropagation();
                         setDeleteConfirmCostume(c.id);
                       }}
                     >
                       <Trash className="size-4" />
                     </button>
                   </div>
                )}
                {(!c.CostumeImages || c.CostumeImages.length === 0) && (
                   <div className="aspect-[4/3] w-full bg-muted overflow-hidden relative">
                     <button
                       type="button"
                       className="absolute top-2 right-2 p-2 bg-background/80 hover:bg-destructive text-foreground hover:text-destructive-foreground backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                       onClick={(e) => {
                         e.stopPropagation();
                         setDeleteConfirmCostume(c.id);
                       }}
                     >
                       <Trash className="size-4" />
                     </button>
                   </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-start">
                    <span>{c.name}</span>
                  </CardTitle>
                  <CardDescription className="flex justify-between items-center mt-2">
                    <span className="font-medium text-foreground">${c.base_price_per_day}/day</span>
                    {c.stock > 0 ? (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">In Stock</span>
                    ) : (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Out of Stock</span>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EditCostumeModal 
        costume={selectedCostume} 
        onClose={() => setSelectedCostume(null)} 
        onSuccess={() => {
           listVendorCostumes(token!).then(res => {
             setCostumes(Array.isArray(res) ? res : ((res as any).data || []));
           }).catch(console.error);
        }} 
      />

      <Dialog open={deleteConfirmCostume !== null} onOpenChange={(open) => !open && setDeleteConfirmCostume(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Costume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone and will permanently remove the costume and its images.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmCostume(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
