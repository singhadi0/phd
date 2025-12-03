import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ScholarFinancePage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Finance overview
                </h1>
                <p className="text-sm text-muted-foreground">
                    Review fee schedules, scholarships, and payment receipts for {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Ledger drill-down
                    </CardTitle>
                    <CardDescription>
                        Payment timelines, downloadable receipts, and scholarship schedules will be available here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Upcoming work includes Razorpay webhook reconciliation, exportable statements, and reminders for scheduled disbursements.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
