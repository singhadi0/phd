import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import { LoginForm } from "./_components/login-form";

export const metadata = {
    title: "Login · research and consultancy",
    description: "Access your research and consultancy workspace.",
};

function LoginFormSkeleton() {
    return (
        <Card className="w-full max-w-lg border-border/60 bg-card/60 shadow-lg shadow-primary/5">
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
        <div className="grid gap-10 lg:min-h-[80vh] lg:grid-cols-2 lg:items-stretch">
            <div className="space-y-6 lg:pr-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    research and consultancy
                </span>
                <h1 className="text-balance text-4xl font-semibold text-foreground sm:text-5xl">
                    Log in to continue your research journey
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                    Manage admissions, track milestones, and collaborate with your supervisory team from a single, secure workspace.
                </p>
                <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-sm leading-relaxed text-muted-foreground shadow-inner shadow-primary/5">
                    research and consultancy keeps your data sovereign. Every workspace is siloed per tenant so administrators, supervisors, and scholars collaborate confidently.
                </div>
                <div className="text-sm text-muted-foreground">
                    New here?{" "}
                    <Link className="font-medium text-primary transition-colors hover:text-primary/80" href="/register">
                        Create a tenant
                    </Link>
                    .
                </div>
            </div>
            <div className="relative mt-6 flex items-center justify-center lg:mt-0">
                <div className="relative isolate flex w-full overflow-hidden rounded-[32px] border border-border/60 bg-card/80 shadow-2xl shadow-primary/15">
                    <Image
                        src="/Header.png"
                        alt="research and consultancy welcome hero"
                        fill
                        className="object-cover opacity-35"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/90" />
                    <div className="relative z-10 w-full max-w-lg px-8 py-10">
                        <Suspense fallback={<LoginFormSkeleton />}>
                            <LoginForm />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
