"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
    tenantSlug: string;
};

export function ProgramCreateForm({ tenantSlug }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; label: string } | null>(null);
    const [courseworkRequired, setCourseworkRequired] = useState("yes");

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                setMessage(null);
                const formData = new FormData(event.currentTarget);
                const duration = Number(formData.get("durationMonths"));
                const payload = {
                    name: formData.get("name")?.toString().trim() ?? "",
                    code: formData.get("code")?.toString().trim() || undefined,
                    durationMonths: Number.isFinite(duration) ? duration : 0,
                    courseworkRequired: formData.get("courseworkRequired") === "yes",
                    departmentId: formData.get("departmentId")?.toString().trim() || undefined,
                };

                if (!payload.name || payload.durationMonths <= 0) {
                    setMessage({ type: "error", label: "Program name and duration are required." });
                    return;
                }

                startTransition(async () => {
                    try {
                        const response = await fetch(`/api/tenants/${tenantSlug}/admin/programs`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        });

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            const errorLabel = typeof data.error === "string" ? data.error : "Unable to create program";
                            setMessage({ type: "error", label: errorLabel });
                            return;
                        }

                        event.currentTarget.reset();
                        setCourseworkRequired("yes");
                        setMessage({ type: "success", label: "Program created successfully." });
                        router.refresh();
                    } catch (error) {
                        console.error(error);
                        setMessage({ type: "error", label: "Unexpected error creating program." });
                    }
                });
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Program name</Label>
                    <Input id="name" name="name" required disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="code">Program code</Label>
                    <Input id="code" name="code" placeholder="Optional" disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="durationMonths">Duration (months)</Label>
                    <Input
                        id="durationMonths"
                        name="durationMonths"
                        type="number"
                        min={1}
                        required
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="courseworkRequired">Coursework required?</Label>
                    <Select value={courseworkRequired} onValueChange={setCourseworkRequired} disabled={isPending}>
                        <SelectTrigger id="courseworkRequired" className="h-10 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="courseworkRequired" value={courseworkRequired} />
                </div>
                <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="departmentId">Department ID</Label>
                    <Input
                        id="departmentId"
                        name="departmentId"
                        placeholder="Optional"
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
                {isPending ? "Saving..." : "Create program"}
            </Button>
        </form>
    );
}
