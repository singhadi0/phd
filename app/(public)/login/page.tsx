import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import { LoginForm } from "./_components/login-form";

export const metadata = {
    title: "Login · Research X",
    description: "Access your Research X workspace.",
};

function LoginFormSkeleton() {
    return (
        <Card className="w-full max-w-md border-border/60 bg-card/60 shadow-lg shadow-primary/5">
            <CardHeader>
                <div className="h-6 w-2/3 animate-pulse rounded bg-muted/70" />
                <CardDescription>
                    <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted/60" />
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
                        <div className="h-10 w-full animate-pulse rounded-md bg-muted/50" />
                    </div>
                ))}
                <div className="h-11 w-full animate-pulse rounded-full bg-muted/60" />
            </CardContent>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
            <div className="space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Research X
                </span>
                <h1 className="text-balance text-4xl font-semibold text-foreground sm:text-5xl">
                    Log in to continue your research journey
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                    Manage admissions, track milestones, and collaborate with your supervisory team from a single, secure workspace.
                </p>
                <div className="text-sm text-muted-foreground">
                    New here?{" "}
                    <Link className="font-medium text-primary transition-colors hover:text-primary/80" href="/register">
                        Create a tenant
                    </Link>
                    .
                </div>
            </div>
            <div className="justify-self-end">
                <Suspense fallback={<LoginFormSkeleton />}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
