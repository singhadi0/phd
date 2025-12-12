"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
    tenantSlug: string;
};

export function DepartmentCreateForm({ tenantSlug }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; label: string } | null>(null);

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                setMessage(null);
                const formData = new FormData(event.currentTarget);
                const payload = {
                    name: formData.get("name")?.toString().trim() ?? "",
                    code: formData.get("code")?.toString().trim() || undefined,
                    description: formData.get("description")?.toString().trim() || undefined,
                };

                if (!payload.name) {
                    setMessage({ type: "error", label: "Department name is required." });
                    return;
                }

                startTransition(async () => {
                    try {
                        const response = await fetch(`/api/tenants/${tenantSlug}/admin/departments`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        });

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            const errorLabel = typeof data.error === "string" ? data.error : "Unable to create department";
                            setMessage({ type: "error", label: errorLabel });
                            return;
                        }

                        event.currentTarget.reset();
                        setMessage({ type: "success", label: "Department created successfully." });
                        router.refresh();
                    } catch (error) {
                        console.error(error);
                        setMessage({ type: "error", label: "Unexpected error creating department." });
                    }
                });
            }}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="department-name">Department name</Label>
                    <Input id="department-name" name="name" placeholder="e.g. School of Data Science" required disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department-code">Short code</Label>
                    <Input id="department-code" name="code" placeholder="Optional" maxLength={12} disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department-description">Description</Label>
                    <Textarea
                        id="department-description"
                        name="description"
                        placeholder="Summarise research areas or mandate"
                        rows={3}
                        disabled={isPending}
                    />
                </div>
            </div>
            {message ? (
                <p
                    className={
                        message.type === "success"
                            ? "text-sm font-medium text-emerald-500"
                            : "text-sm font-medium text-rose-500"
                    }
                >
                    {message.label}
                </p>
            ) : null}
            <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create department"}
            </Button>
        </form>
    );
}
