"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminListUsers, adminUpdateUserRole, type AdminUser } from "@/lib/admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon, DotsHorizontalIcon, Pencil2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RoleChip({ role }: { role: string }) {
  const r = role?.toUpperCase();
  const cls =
    r === "ADMIN" ? "border-foreground bg-foreground text-background"
    : r === "VENDOR" ? "border-border text-foreground"
    : r === "SUSPENDED" ? "border-destructive/30 bg-destructive/10 text-destructive"
    : "border-border/50 text-muted-foreground";
  return <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${cls}`}>{role}</span>;
}

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const [all, setAll]       = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return;
    adminListUsers(token)
      .then((v) => setAll(Array.isArray(v) ? v : (v as any)?.data || []))
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoading(false));
  }, [token, user]);

  const q = search.trim().toLowerCase();
  const items = q
    ? all.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    : all;

  const admins  = all.filter(u => u.role === "ADMIN").length;
  const vendors = all.filter(u => u.role === "VENDOR").length;
  const suspended = all.filter(u => u.role === "SUSPENDED").length;
  const regular = all.filter(u => u.role !== "ADMIN" && u.role !== "VENDOR" && u.role !== "SUSPENDED").length;

  async function handleRoleChange(userId: number, newRole: string) {
    if (!token) return;
    try {
      await adminUpdateUserRole(userId, newRole, token);
      setAll((curr) => curr.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`User role updated to ${newRole}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update role.");
    }
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin</p>
          <h1 className="mt-2 font-playfair text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Users
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span><span className="font-semibold text-foreground">{all.length}</span> total</span>
            <span><span className="font-semibold text-foreground">{admins}</span> admin{admins !== 1 ? "s" : ""}</span>
            <span><span className="font-semibold text-foreground">{vendors}</span> vendor{vendors !== 1 ? "s" : ""}</span>
            <span><span className="font-semibold text-foreground">{regular}</span> user{regular !== 1 ? "s" : ""}</span>
            {suspended > 0 && <span className="text-destructive"><span className="font-semibold">{suspended}</span> suspended</span>}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 h-9 text-xs rounded-sm border-border bg-card focus-visible:ring-0 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-sm" />)}
        </div>
      ) : (
        <div className="rounded-sm border border-border divide-y divide-border bg-card">
          {items.length === 0 && (
            <p className="px-6 py-16 text-center text-sm text-muted-foreground">No users found.</p>
          )}
          {items.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-4 px-6 py-4 group transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-4 min-w-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-muted text-[10px] font-bold uppercase text-foreground">
                  {u.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{u.name || `User #${u.id}`}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[10px] text-muted-foreground hidden sm:block">Joined {fmt(u.created_at)}</span>
                <RoleChip role={u.role} />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex size-8 items-center justify-center rounded-sm transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                      <DotsHorizontalIcon className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs">Manage User</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleRoleChange(u.id, "USER")}
                      disabled={u.role === "USER" || u.id === user?.id}
                      className="text-xs cursor-pointer"
                    >
                      <Pencil2Icon className="mr-2 size-3.5" /> Set as User
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleRoleChange(u.id, "VENDOR")}
                      disabled={u.role === "VENDOR" || u.id === user?.id}
                      className="text-xs cursor-pointer"
                    >
                      <Pencil2Icon className="mr-2 size-3.5" /> Set as Vendor
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleRoleChange(u.id, "ADMIN")}
                      disabled={u.role === "ADMIN" || u.id === user?.id}
                      className="text-xs cursor-pointer"
                    >
                      <Pencil2Icon className="mr-2 size-3.5" /> Set as Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleRoleChange(u.id, u.role === "SUSPENDED" ? "USER" : "SUSPENDED")}
                      disabled={u.id === user?.id}
                      className={`text-xs cursor-pointer ${u.role === "SUSPENDED" ? "text-emerald-600 focus:text-emerald-600" : "text-destructive focus:text-destructive"}`}
                    >
                      <ExclamationTriangleIcon className="mr-2 size-3.5" /> 
                      {u.role === "SUSPENDED" ? "Remove Suspension" : "Suspend User"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
