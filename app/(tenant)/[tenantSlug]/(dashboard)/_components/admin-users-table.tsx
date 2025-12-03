"use client";

import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { TenantMemberSummary } from "@/lib/admin/users";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    active: { label: "Active", variant: "default" },
    suspended: { label: "Suspended", variant: "destructive" },
};

type AdminUsersTableProps = {
    initialMembers: TenantMemberSummary[];
    tenantSlug: string;
    actingMembershipId: string;
};

export function AdminUsersTable({
    initialMembers,
    tenantSlug,
    actingMembershipId,
}: AdminUsersTableProps) {
    const [members, setMembers] = useState(initialMembers);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const summary = useMemo(() => {
        const active = members.filter((member) => member.status === "active").length;
        const suspended = members.filter((member) => member.status === "suspended").length;

        return {
            total: members.length,
            active,
            suspended,
        };
    }, [members]);

    const visibleMembers = useMemo(() => {
        const term = search.trim().toLowerCase();
        return members.filter((member) => {
            const matchesTerm = term
                ? [member.name, member.email, member.roleName]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(term))
                : true;
            const matchesStatus =
                statusFilter === "all" ? true : member.status.toLowerCase() === statusFilter;
            return matchesTerm && matchesStatus;
        });
    }, [members, search, statusFilter]);

    async function handleToggleStatus(member: TenantMemberSummary) {
        if (member.membershipId === actingMembershipId) {
            setErrorMessage("You cannot change the status of your own membership.");
            setSuccessMessage(null);
            return;
        }

        const nextStatus = member.status === "active" ? "suspended" : "active";

        try {
            setUpdatingId(member.membershipId);
            setErrorMessage(null);
            setSuccessMessage(null);

            const response = await fetch(`/api/tenants/${tenantSlug}/admin/users`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ membershipId: member.membershipId, status: nextStatus }),
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error ?? "Failed to update membership");
            }

            setMembers((prev) =>
                prev.map((item) => (item.membershipId === member.membershipId ? payload.data : item))
            );
            setSuccessMessage(
                `${member.name} is now ${nextStatus === "active" ? "active" : "suspended"}.`
            );
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Unable to update membership");
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <Card className="border-border/60 bg-card/70">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold text-foreground">Membership roster</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {summary.total} total members • {summary.active} active • {summary.suspended} suspended
                    </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <div className="flex rounded-full border border-border/60 bg-card/60 p-1 text-xs">
                        {["all", "active", "suspended"].map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setStatusFilter(option as typeof statusFilter)}
                                className={`rounded-full px-3 py-1 font-medium transition-colors ${statusFilter === option
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </button>
                        ))}
                    </div>
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, email, or role"
                        className="h-9 w-full sm:w-64"
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {errorMessage ? (
                    <Alert variant="destructive">
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                ) : null}
                {successMessage ? (
                    <Alert>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                ) : null}

                <div className="overflow-hidden rounded-xl border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                                <TableHead className="hidden sm:table-cell">Permissions</TableHead>
                                <TableHead className="w-[120px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleMembers.length ? (
                                visibleMembers.map((member) => {
                                    const statusMeta = STATUS_LABELS[member.status] ?? STATUS_LABELS.active;

                                    return (
                                        <TableRow key={member.membershipId}>
                                            <TableCell>
                                                <div className="font-medium text-foreground">{member.name}</div>
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="uppercase tracking-wide">
                                                    {member.roleName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                {new Date(member.joinedAt).toLocaleDateString("en-IN", {
                                                    dateStyle: "medium",
                                                })}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                                                {member.permissions.length
                                                    ? member.permissions
                                                        .map((permission) => permission.replace(/_/g, " "))
                                                        .join(", ")
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={updatingId === member.membershipId}
                                                    onClick={() => handleToggleStatus(member)}
                                                >
                                                    {member.status === "active" ? "Suspend" : "Activate"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                                        No members match this filter yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
