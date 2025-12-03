"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProgramOption = {
    id: string;
    name: string;
};

type Props = {
    tenantSlug: string;
    programs: ProgramOption[];
};

export function CourseCreateForm({ tenantSlug, programs }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; label: string } | null>(null);
    const [programId, setProgramId] = useState("");

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                setMessage(null);
                const formData = new FormData(event.currentTarget);
                const creditsValue = Number(formData.get("credits"));
                const payload = {
                    programId: formData.get("programId")?.toString() ?? "",
                    code: formData.get("code")?.toString().trim() ?? "",
                    title: formData.get("title")?.toString().trim() ?? "",
                    credits: Number.isFinite(creditsValue) ? creditsValue : 0,
                };

                if (!payload.programId || !payload.code || !payload.title || payload.credits <= 0) {
                    setMessage({ type: "error", label: "All fields are required and credits must be greater than zero." });
                    return;
                }

                startTransition(async () => {
                    try {
                        const response = await fetch(`/api/tenants/${tenantSlug}/admin/programs/courses`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        });

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            const errorLabel = typeof data.error === "string" ? data.error : "Unable to create course";
                            setMessage({ type: "error", label: errorLabel });
                            return;
                        }

                        event.currentTarget.reset();
                        setProgramId("");
                        setMessage({ type: "success", label: "Course created successfully." });
                        router.refresh();
                    } catch (error) {
                        console.error(error);
                        setMessage({ type: "error", label: "Unexpected error creating course." });
                    }
                });
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="programId">Program</Label>
                    <Select
                        value={programId === "" ? undefined : programId}
                        onValueChange={setProgramId}
                        disabled={isPending}
                    >
                        <SelectTrigger id="programId" className="h-10 w-full">
                            <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                            {programs.map((program) => (
                                <SelectItem key={program.id} value={program.id}>
                                    {program.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="programId" value={programId} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="code">Course code</Label>
                    <Input id="code" name="code" required disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                        id="credits"
                        name="credits"
                        type="number"
                        min={0.5}
                        step="0.5"
                        required
                        disabled={isPending}
                    />
                </div>
                <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="title">Course title</Label>
                    <Input id="title" name="title" required disabled={isPending} />
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
                {isPending ? "Saving..." : "Create course"}
            </Button>
        </form>
    );
}
