"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SelectOption = {
    id: string;
    name: string;
};

type CourseOption = SelectOption & {
    programName: string;
};

type Props = {
    tenantSlug: string;
    scholars: SelectOption[];
    courses: CourseOption[];
};

export function ScholarEnrollmentForm({ tenantSlug, scholars, courses }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; label: string } | null>(null);
    const [scholarId, setScholarId] = useState("");
    const [courseId, setCourseId] = useState("");
    const [status, setStatus] = useState("in_progress");

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                setMessage(null);
                const formData = new FormData(event.currentTarget);
                const payload = {
                    scholarId: formData.get("scholarId")?.toString() ?? "",
                    courseId: formData.get("courseId")?.toString() ?? "",
                    academicYear: formData.get("academicYear")?.toString() ?? "",
                    semester: formData.get("semester")?.toString() ?? "",
                    status: formData.get("status")?.toString() ?? "in_progress",
                    grade: formData.get("grade")?.toString() || undefined,
                };

                if (!payload.scholarId || !payload.courseId || !payload.academicYear || !payload.semester) {
                    setMessage({ type: "error", label: "Scholar, course, academic year, and semester are required." });
                    return;
                }

                startTransition(async () => {
                    try {
                        const response = await fetch(`/api/tenants/${tenantSlug}/admin/scholars/enrollments`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        });

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            const errorLabel = typeof data.error === "string" ? data.error : "Unable to create enrollment";
                            setMessage({ type: "error", label: errorLabel });
                            return;
                        }

                        event.currentTarget.reset();
                        setScholarId("");
                        setCourseId("");
                        setStatus("in_progress");
                        setMessage({ type: "success", label: "Enrollment recorded successfully." });
                        router.refresh();
                    } catch (error) {
                        console.error(error);
                        setMessage({ type: "error", label: "Unexpected error creating enrollment." });
                    }
                });
            }}
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="scholarId">Scholar</Label>
                    <Select
                        value={scholarId === "" ? undefined : scholarId}
                        onValueChange={setScholarId}
                        disabled={isPending}
                    >
                        <SelectTrigger id="scholarId" className="h-10 w-full">
                            <SelectValue placeholder="Select scholar" />
                        </SelectTrigger>
                        <SelectContent>
                            {scholars.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="scholarId" value={scholarId} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="courseId">Course</Label>
                    <Select
                        value={courseId === "" ? undefined : courseId}
                        onValueChange={setCourseId}
                        disabled={isPending}
                    >
                        <SelectTrigger id="courseId" className="h-10 w-full">
                            <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.name} - {option.programName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="courseId" value={courseId} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus} disabled={isPending}>
                        <SelectTrigger id="status" className="h-10 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                            <SelectItem value="deferred">Deferred</SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="status" value={status} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic year</Label>
                    <Input
                        id="academicYear"
                        name="academicYear"
                        placeholder="2024-2025"
                        required
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Input id="semester" name="semester" placeholder="Semester 1" required disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Input id="grade" name="grade" placeholder="Optional" disabled={isPending} />
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
                {isPending ? "Saving..." : "Record enrollment"}
            </Button>
        </form>
    );
}
