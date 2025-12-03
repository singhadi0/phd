import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ScholarCourseworkPage({
    params,
}: {
    params: Promise<{ tenantSlug: string }>;
}) {
    const { tenantSlug } = await params;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Coursework plan
                </h1>
                <p className="text-sm text-muted-foreground">
                    Track enrollments, grades, and credit completion for {tenantSlug}.
                </p>
            </div>
            <Card className="border-border/60 bg-card/70">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                        Coursework timeline
                    </CardTitle>
                    <CardDescription>
                        Detailed transcript views and credit calculators will reside here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        We will expose semester filters, grade trends, and export options once the coursework API slice is ready.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
