import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import { RegisterForm } from "./_components/register-form";

export const metadata = {
    title: "Register · Research X",
    description: "Provision a new Research X tenant for your institution.",
};

function RegisterFormSkeleton() {
    return (
        <Card className="w-full max-w-md border-border/60 bg-card/60">
            <CardHeader className="space-y-4">
                <div className="h-6 w-3/5 animate-pulse rounded bg-muted/60" />
                <CardDescription>
                    <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted/50" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted/50" />
                        <div className="h-10 w-full animate-pulse rounded-md bg-muted/40" />
                    </div>
                ))}
                <div className="h-11 w-full animate-pulse rounded-full bg-muted/50" />
            </CardContent>
        </Card>
    );
}

export default function RegisterPage() {
    return (
        <div className="grid gap-12 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-center">
            <div className="justify-self-start">
                <Suspense fallback={<RegisterFormSkeleton />}>
                    <RegisterForm />
                </Suspense>
            </div>
            <div className="space-y-6 text-right">
                <span className="inline-flex items-center justify-end gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Research X
                </span>
                <h1 className="text-balance text-4xl font-semibold text-foreground sm:text-5xl">
                    Launch a secure PhD management workspace in minutes.
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                    We automatically scaffold role-based access, audit trails, and onboarding workflows so your teams can focus on research—not spreadsheets.
                </p>
                <div className="text-sm text-muted-foreground">
                    Already provisioned?{" "}
                    <Link className="font-medium text-primary transition-colors hover:text-primary/80" href="/login">
                        Sign in instead
                    </Link>
                    .
                </div>
            </div>
        </div>
    );
}
