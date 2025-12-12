import { MetricCard } from "@/app/(tenant)/[tenantSlug]/(dashboard)/_components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { fetchTenantApi } from "@/lib/api/tenant-fetch";
import type { AdminFinanceSummary } from "@/lib/admin/finance";

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDate(value: string | null) {
    if (!value) {
        return "—";
    }
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
    }).format(new Date(value));
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function formatEntryType(type: string) {
    switch (type) {
        case "fee":
            return "Fee";
        case "payment":
            return "Payment";
        case "scholarship":
            return "Scholarship";
        default:
            return type;
    }
}

export default async function AdminFinancePage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;
    const summary = await fetchTenantApi<AdminFinanceSummary>(tenantSlug, "/admin/finance");

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Finance and scholarships
                </h1>
                <p className="text-sm text-muted-foreground">
                    Configure fee schedules, reconcile payments, and audit scholarships for {tenantSlug}.
                </p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Outstanding balance"
                    value={formatCurrency(summary.metrics.outstandingBalance, summary.metrics.outstandingCurrency)}
                    description="Unpaid invoices across cohorts"
                />
                <MetricCard
                    title="Overdue invoices"
                    value={summary.metrics.overdueInvoices.toString()}
                    description="Past-due fee demands"
                />
                <MetricCard
                    title="Payments · 30d"
                    value={formatCurrency(summary.metrics.paymentsLast30, summary.metrics.outstandingCurrency)}
                    description="Cleared receipts last 30 days"
                />
                <MetricCard
                    title="Active scholarships"
                    value={summary.metrics.activeScholarships.toString()}
                    description="Scholarships currently funding"
                />
            </section>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Ledger activity
                    </CardTitle>
                    <CardDescription>
                        Most recent ledger movements across fees, payments, and scholarships
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden rounded-xl border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-48">Entry</TableHead>
                                <TableHead>Scholar</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-center">Type</TableHead>
                                <TableHead className="text-right">Due</TableHead>
                                <TableHead className="text-right">Paid</TableHead>
                                <TableHead className="text-right">Logged</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary.ledger.length ? (
                                summary.ledger.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell>
                                            <div className="text-sm font-medium text-foreground">
                                                {entry.description ?? "Ledger entry"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{entry.referenceNumber ?? entry.id}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{entry.scholarName}</TableCell>
                                        <TableCell className="text-right text-sm text-foreground">
                                            {formatCurrency(entry.amount, entry.currency)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={entry.type === "payment" ? "secondary" : "outline"} className="uppercase tracking-wide">
                                                {formatEntryType(entry.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">{formatDate(entry.dueDate)}</TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">{formatDate(entry.paidAt)}</TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                                        No ledger activity recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Scholarship portfolio
                    </CardTitle>
                    <CardDescription>
                        Snapshot of sanctioned awards and sponsor activity
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {summary.scholarships.length ? (
                        summary.scholarships.map((scholarship) => (
                            <div key={scholarship.id} className="space-y-2 rounded-xl border border-border/60 bg-background/80 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{scholarship.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {scholarship.sponsor ?? "Internal"} • {scholarship.type}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="uppercase tracking-wide">
                                        {scholarship.currency}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Total awards: {scholarship.totalAwards}</span>
                                    <span>Active: {scholarship.activeAwards}</span>
                                    <span>
                                        Sanctioned {formatCurrency(
                                            scholarship.totalSanctioned,
                                            scholarship.currency
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No scholarships tracked yet. Configure sponsorships to see portfolio analytics.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
