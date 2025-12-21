"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TenantSettings } from "@/lib/admin/settings";

type Props = {
    tenantSlug: string;
    initialSettings: TenantSettings;
};

export function TenantSettingsForm({ tenantSlug, initialSettings }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState({
        name: initialSettings.name,
        description: initialSettings.description ?? "",
        contactEmail: initialSettings.contactEmail ?? "",
        contactPhone: initialSettings.contactPhone ?? "",
    });
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; label: string } | null>(null);

    return (
        <form
            className="space-y-5"
            onSubmit={(event) => {
                event.preventDefault();
                setFeedback(null);

                const trimmedName = state.name.trim();
                if (!trimmedName.length) {
                    setFeedback({ type: "error", label: "Tenant name cannot be empty." });
                    return;
                }

                startTransition(async () => {
                    try {
                        const response = await fetch(`/api/tenants/${tenantSlug}/admin/settings`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: state.name,
                                description: state.description,
                                contactEmail: state.contactEmail,
                                contactPhone: state.contactPhone,
                            }),
                        });

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            const errorLabel = typeof data.error === "string" ? data.error : "Unable to update tenant settings";
                            setFeedback({ type: "error", label: errorLabel });
                            return;
                        }

                        setFeedback({ type: "success", label: "Tenant settings saved." });
                        router.refresh();
                    } catch (error) {
                        console.error(error);
                        setFeedback({ type: "error", label: "Unexpected error updating settings." });
                    }
                });
            }}
        >
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tenant-name">Tenant name</Label>
                    <Input
                        id="tenant-name"
                        value={state.name}
                        onChange={(event) => setState((current) => ({ ...current, name: event.target.value }))}
                        placeholder="research and consultancy campus"
                        disabled={isPending}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tenant-email">Contact email</Label>
                    <Input
                        id="tenant-email"
                        type="email"
                        value={state.contactEmail}
                        onChange={(event) => setState((current) => ({ ...current, contactEmail: event.target.value }))}
                        placeholder="hello@researchandconsultancy.test"
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tenant-phone">Contact phone</Label>
                    <Input
                        id="tenant-phone"
                        value={state.contactPhone}
                        onChange={(event) => setState((current) => ({ ...current, contactPhone: event.target.value }))}
                        placeholder="+91-00000-00000"
                        disabled={isPending}
                    />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="tenant-description">Description</Label>
                    <Textarea
                        id="tenant-description"
                        value={state.description}
                        onChange={(event) => setState((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Outline the institute focus areas, branding notes, or communication tone."
                        rows={5}
                        disabled={isPending}
                    />
                </div>
            </div>
            {feedback ? (
                <p
                    className={
                        feedback.type === "success"
                            ? "text-sm font-medium text-emerald-500"
                            : "text-sm font-medium text-rose-500"
                    }
                >
                    {feedback.label}
                </p>
            ) : null}
            <div className="flex items-center justify-end gap-3">
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save changes"}
                </Button>
            </div>
        </form>
    );
}
