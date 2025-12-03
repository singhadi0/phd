"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

type ScholarOption = {
    id: string;
    name: string;
};

type Props = {
    tenantSlug: string;
    scholars: ScholarOption[];
};

export function ScholarFeeForm({ tenantSlug, scholars }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; label: string } | null>(null);
    const [scholarId, setScholarId] = useState("");
    const [entryType, setEntryType] = useState("fee");
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [paidAt, setPaidAt] = useState<Date | undefined>();

    const dueDateValue = dueDate ? format(dueDate, "yyyy-MM-dd") : "";
    const paidAtValue = paidAt ? format(paidAt, "yyyy-MM-dd") : "";

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                setMessage(null);
                const formData = new FormData(event.currentTarget);
                const amountValue = Number(formData.get("amount"));
                const payload: Record<string, unknown> = {
                    scholarId: formData.get("scholarId")?.toString() ?? "",
                    type: formData.get("type")?.toString() ?? "fee",
                    amount: Number.isFinite(amountValue) ? amountValue : 0,
                    currency: formData.get("currency")?.toString().trim() || "INR",
                    description: formData.get("description")?.toString().trim() || undefined,
                    referenceNumber: formData.get("referenceNumber")?.toString().trim() || undefined,
                };

                const dueDateFromForm = formData.get("dueDate")?.toString();
                if (dueDateFromForm) {
                    payload.dueDate = dueDateFromForm;
                }
                const paidAtFromForm = formData.get("paidAt")?.toString();
                if (paidAtFromForm) {
                    payload.paidAt = paidAtFromForm;
                }

                if (!payload.scholarId || (payload.amount as number) <= 0) {
                    setMessage({ type: "error", label: "Scholar and a positive amount are required." });
                    return;
                }

                startTransition(async () => {
                    try {
                        const response = await fetch(`/api/tenants/${tenantSlug}/admin/finance/fees`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        });

                        if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            const errorLabel = typeof data.error === "string" ? data.error : "Unable to create fee entry";
                            setMessage({ type: "error", label: errorLabel });
                            return;
                        }

                        event.currentTarget.reset();
                        setScholarId("");
                        setEntryType("fee");
                        setDueDate(undefined);
                        setPaidAt(undefined);
                        setMessage({ type: "success", label: "Fee entry added successfully." });
                        router.refresh();
                    } catch (error) {
                        console.error(error);
                        setMessage({ type: "error", label: "Unexpected error creating fee entry." });
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
                            {scholars.map((scholar) => (
                                <SelectItem key={scholar.id} value={scholar.id}>
                                    {scholar.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="scholarId" value={scholarId} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Entry type</Label>
                    <Select value={entryType} onValueChange={setEntryType} disabled={isPending}>
                        <SelectTrigger id="type" className="h-10 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fee">Fee</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="type" value={entryType} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                        id="amount"
                        name="amount"
                        type="number"
                        min={0.01}
                        step="0.01"
                        required
                        disabled={isPending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" name="currency" defaultValue="INR" disabled={isPending} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dueDate">Due date</Label>
                    <DatePicker
                        id="dueDate"
                        value={dueDate}
                        onChange={setDueDate}
                        disabled={isPending}
                        placeholder="Select due date"
                    />
                    <input type="hidden" name="dueDate" value={dueDateValue} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paidAt">Paid at</Label>
                    <DatePicker
                        id="paidAt"
                        value={paidAt}
                        onChange={setPaidAt}
                        disabled={isPending}
                        placeholder="Select payment date"
                    />
                    <input type="hidden" name="paidAt" value={paidAtValue} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" placeholder="Optional description" disabled={isPending} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="referenceNumber">Reference number</Label>
                    <Input id="referenceNumber" name="referenceNumber" placeholder="Optional" disabled={isPending} />
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
                {isPending ? "Saving..." : "Add ledger entry"}
            </Button>
        </form>
    );
}
