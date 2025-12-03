import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminFinancePage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Finance and scholarships
                </h1>
                <p className="text-sm text-muted-foreground">
                    Configure fee schedules, reconcile payments, and audit scholarships for {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Ledger oversight
                    </CardTitle>
                    <CardDescription>
                        Fee ledger analytics, disbursement queues, and reconciliation tools will surface here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Expect charts for outstanding balances, configurable export templates, and Razorpay/PayU integration touchpoints. The API slice will be wired after core dashboards stabilize.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
