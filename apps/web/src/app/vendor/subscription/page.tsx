"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getMySubscription, subscribeToPlan, type Subscription } from "@/lib/vendor";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckIcon } from "@radix-ui/react-icons";

export default function SubscriptionPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login?next=/vendor/subscription");
      return;
    }

    async function fetchSub() {
      try {
        const sub = await getMySubscription(token!);
        // The API might return an empty string or 204 if no subscription exists
        setSubscription(sub || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSub();
  }, [token, router]);

  const handleSubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await subscribeToPlan("Pro Vendor", token);
      setSubscription(res);
      toast.success("Successfully subscribed to Pro Vendor plan!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to subscribe");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading subscription...</div>
      </div>
    );
  }

  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";

  return (
    <div className="w-full max-w-4xl mx-auto p-6 mt-8 animate-fade-up">
      <div className="mb-10">
        <Link href="/vendor" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-4xl display mb-2">Vendor Subscription</h1>
        <p className="text-muted-foreground text-lg">
          Manage your plan to list costumes and accept reservations without commission fees.
        </p>
      </div>

      {isActive ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl display mb-1">{subscription.plan_name}</CardTitle>
                <CardDescription>Your current active plan</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-xs px-3 py-1">
                {subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Start Date</p>
                <p className="text-foreground">{new Date(subscription.start_date).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Renewal Date</p>
                <p className="text-foreground">{new Date(subscription.end_date).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" className="text-muted-foreground" disabled>
              Cancel Subscription
            </Button>
            <p className="text-xs text-muted-foreground ml-4">
              Contact support to modify or cancel your billing cycle.
            </p>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <h2 className="text-2xl display">Why subscribe?</h2>
            <ul className="space-y-4">
              {[
                "0% Commission on rentals",
                "Unlimited costume listings",
                "Priority placement in search results",
                "Direct communication with renters",
                "Advanced analytics and dashboard"
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                    <CheckIcon className="size-3.5" />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl display mb-2">Pro Vendor</CardTitle>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold tracking-tight text-foreground">$29</span>
                <span className="text-muted-foreground font-medium">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                className="w-full h-14 text-base font-medium"
                onClick={handleSubscribe}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Subscribe Now"}
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-xs text-muted-foreground text-center">
                Cancel anytime. Billing handled securely via Stripe.
              </p>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
