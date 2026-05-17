"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DotsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

import {
  AdminEmptyState,
  AdminResponsiveFilterRail,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin/AdminPrimitives";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminListUsers,
  adminUpdateUserRole,
  type AdminUser,
} from "@/lib/admin";
import { useAuth } from "@/lib/auth";

const FILTERS = ["ALL", "ADMIN", "VENDOR", "USER", "SUSPENDED"] as const;

function formatDate(value?: string) {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function userTone(role: string) {
  const normalized = role.toUpperCase();
  if (normalized === "ADMIN") return "brand" as const;
  if (normalized === "VENDOR") return "success" as const;
  if (normalized === "SUSPENDED") return "danger" as const;
  return "neutral" as const;
}

function rolePriority(role: string) {
  const normalized = role.toUpperCase();
  if (normalized === "SUSPENDED") return 0;
  if (normalized === "ADMIN") return 1;
  if (normalized === "VENDOR") return 2;
  return 3;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminListUsers()
      .then((data) => setUsers(data))
      .catch(() => toast.error("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((entry) => entry.role.toUpperCase() === "ADMIN").length,
      vendors: users.filter((entry) => entry.role.toUpperCase() === "VENDOR").length,
      suspended: users.filter((entry) => entry.role.toUpperCase() === "SUSPENDED").length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...users]
      .filter((entry) => {
        const matchesFilter = filter === "ALL" ? true : entry.role.toUpperCase() === filter;
        const matchesSearch =
          !query ||
          (entry.name || "").toLowerCase().includes(query) ||
          (entry.email || "").toLowerCase().includes(query);

        return matchesFilter && matchesSearch;
      })
      .sort((left, right) => {
        const leftIsCurrent = left.id === user?.id ? 1 : 0;
        const rightIsCurrent = right.id === user?.id ? 1 : 0;
        if (leftIsCurrent !== rightIsCurrent) return rightIsCurrent - leftIsCurrent;

        const roleDelta = rolePriority(left.role) - rolePriority(right.role);
        if (roleDelta !== 0) return roleDelta;

        return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
      });
  }, [filter, search, user?.id, users]);

  async function updateRole(userId: number, role: string) {
    try {
      await adminUpdateUserRole(userId, role);
      setUsers((current) =>
        current.map((entry) => (entry.id === userId ? { ...entry, role } : entry))
      );
      toast.success(`User role updated to ${role.toLowerCase()}.`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Role update failed.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-[560px] rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        eyebrow="Access summary"
        title="Keep account access legible before changing roles"
        description="Suspended accounts and admin accounts surface first, while the main table stays focused on role changes and account access decisions."
        actions={
          <div className="rounded-full border border-border bg-background px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground">
            {metrics.total} account{metrics.total === 1 ? "" : "s"}
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Suspended access
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.suspended}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Accounts currently blocked from normal platform access.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Admin operators
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.admins}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Accounts with the highest level of platform control.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-background/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Vendor accounts
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {metrics.vendors}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Accounts currently configured to operate as marketplace vendors.
            </p>
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        eyebrow="Access control"
        title="Review account roles without extra noise"
        description="Search by name or email, filter by role, and change access from the row menu while your own admin account stays protected from accidental edits."
        actions={
          <>
            <div className="relative min-w-[220px] flex-1 md:min-w-[260px] md:flex-none">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                className="h-9 pl-9"
              />
            </div>
            <AdminResponsiveFilterRail
              label="Role"
              value={filter}
              options={FILTERS.map((status) => ({
                value: status,
                label: status === "ALL" ? "All" : status,
              }))}
              onChange={(value) => setFilter(value as (typeof FILTERS)[number])}
            />
          </>
        }
      >
        {filteredUsers.length === 0 ? (
          <AdminEmptyState
            title="No users match the current view."
            description="Change the role filter or search query to review another group of accounts."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Account</th>
                  <th className="pb-3 font-medium">Access</th>
                  <th className="pb-3 font-medium">Signals</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((entry) => {
                  const initials = entry.name
                    ? entry.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U";

                  return (
                    <tr key={entry.id}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background text-xs font-semibold text-foreground">
                            {initials}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground">
                              {entry.name || `User #${entry.id}`}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {entry.email || "--"}
                            </p>
                            {entry.id === user?.id ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                You are signed in with this account
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-2">
                          <AdminStatusBadge label={entry.role} tone={userTone(entry.role)} />
                          <p className="text-xs text-muted-foreground">
                            {entry.role.toUpperCase() === "ADMIN"
                              ? "Can manage platform-wide administration."
                              : entry.role.toUpperCase() === "VENDOR"
                                ? "Can operate as a marketplace vendor."
                                : entry.role.toUpperCase() === "SUSPENDED"
                                  ? "Blocked from normal account access."
                                  : "Standard marketplace account access."}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-foreground">Joined {formatDate(entry.created_at)}</p>
                          <p className="text-xs text-muted-foreground">Account ID #{entry.id}</p>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Manage ${entry.name || `user ${entry.id}`}`}
                              className="inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <DotsHorizontalIcon className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Manage account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={entry.id === user?.id || entry.role === "USER"}
                              onClick={() => void updateRole(entry.id, "USER")}
                            >
                              Change role to user
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={entry.id === user?.id || entry.role === "VENDOR"}
                              onClick={() => void updateRole(entry.id, "VENDOR")}
                            >
                              Change role to vendor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={entry.id === user?.id || entry.role === "ADMIN"}
                              onClick={() => void updateRole(entry.id, "ADMIN")}
                            >
                              Change role to admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={entry.id === user?.id}
                              onClick={() =>
                                void updateRole(
                                  entry.id,
                                  entry.role === "SUSPENDED" ? "USER" : "SUSPENDED"
                                )
                              }
                            >
                              {entry.role === "SUSPENDED"
                                ? "Restore account access"
                                : "Suspend account access"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminSectionCard>
    </div>
  );
}
