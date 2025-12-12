"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AUDIENCE_OPTIONS = [
    {
        value: "scholars",
        label: "All scholars",
    },
    {
        value: "supervisors",
        label: "All supervisors",
    },
    {
        value: "admins",
        label: "Admin leadership",
    },
] as const;

type AudienceValue = (typeof AUDIENCE_OPTIONS)[number]["value"];

type Props = {
    tenantSlug: string;
};

export function BroadcastComposer({ tenantSlug }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [audiences, setAudiences] = useState<AudienceValue[]>(["scholars"]);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; label: string } | null>(null);

    const toggleAudience = (value: AudienceValue) => {
        setAudiences((current) => {
            const isSelected = current.includes(value);
            if (isSelected) {
                if (current.length === 1) {
                    return current;
                }
                return current.filter((item) => item !== value);
            }
            return [...current, value];
        });
    };

    return (
        <form
            className="space-y-5"
            onSubmit={(event) => {
                event.preventDefault();
                setFeedback(null);

                if (!subject.trim()) {
                    setFeedback({ type: "error", label: "Subject is required." });
                    return;
                }
                if (!message.trim()) {
                    setFeedback({ type: "error", label: "Please add a message body." });
                    return;
                }

                startTransition(async () => {
                    try {
                        const response = await fetch(`/api/tenants/${tenantSlug}/admin/communications`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                subject,
                                body: message,
                                audiences,
                            }),
                        });

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            const errorLabel = typeof data.error === "string" ? data.error : "Unable to send broadcast";
                            setFeedback({ type: "error", label: errorLabel });
                            return;
                        }

                        setSubject("");
                        setMessage("");
                        setAudiences(["scholars"]);
                        setFeedback({ type: "success", label: "Broadcast sent successfully." });
                        router.refresh();
                    } catch (error) {
                        console.error(error);
                        setFeedback({ type: "error", label: "Unexpected error sending broadcast." });
                    }
                });
            }}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="broadcast-subject">Subject</Label>
                    <Input
                        id="broadcast-subject"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder="e.g. Thesis presentation schedule updates"
                        maxLength={140}
                        disabled={isPending}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Audience</Label>
                    <div className="flex flex-wrap gap-2">
                        {AUDIENCE_OPTIONS.map((option) => {
                            const isSelected = audiences.includes(option.value);
                            return (
                                <Button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleAudience(option.value)}
                                    disabled={isPending}
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    className={isSelected ? "shadow-none" : "border-border/70 text-foreground shadow-none"}
                                    aria-pressed={isSelected}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Messages will reach every member in the selected cohorts. At least one cohort must stay active.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="broadcast-body">Message</Label>
                    <Textarea
                        id="broadcast-body"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Share updates, reminders, or next steps for the cohort."
                        rows={6}
                        disabled={isPending}
                        required
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
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    Broadcasts create a new message thread so supervisors and scholars can reply inline.
                </p>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Sending..." : "Send broadcast"}
                </Button>
            </div>
        </form>
    );
}
