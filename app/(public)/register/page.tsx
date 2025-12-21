import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import { RegisterForm } from "./_components/register-form";

export const metadata = {
    title: "Register · research and consultancy",
    description: "Provision a new research and consultancy tenant for your institution.",
};

function RegisterFormSkeleton() {
    return (
        <Card className="w-full max-w-2xl border-border/60 bg-card/60">
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
        <div className="grid gap-10 lg:min-h-[80vh] lg:grid-cols-2 lg:items-stretch">
            <div className="space-y-6 lg:pr-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    research and consultancy
                </span>
                <h1 className="text-balance text-4xl font-semibold text-foreground sm:text-5xl">
                    Launch a secure PhD management workspace in minutes.
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                    We automatically scaffold role-based access, audit trails, and onboarding workflows so your teams can focus on research—not spreadsheets.
                </p>
                <div className="rounded-3xl border border-border/60 bg-card/70 p-6 text-sm leading-relaxed text-muted-foreground shadow-inner shadow-primary/5">
                    Your tenant comes with opinionated defaults for roles, audit history, and messaging so you can invite supervisors on day one without wrestling infra.
                </div>
                <div className="text-sm text-muted-foreground">
                    Already provisioned?{" "}
                    <Link className="font-medium text-primary transition-colors hover:text-primary/80" href="/login">
                        Sign in instead
                    </Link>
                    .
                </div>
            </div>
            <div className="relative mt-6 flex items-center justify-center lg:mt-0">
                <div className="relative isolate flex w-full overflow-hidden rounded-[32px] border border-border/60 bg-card/80 shadow-2xl shadow-primary/15">
                    <Image
                        src="/Header.png"
                        alt="research and consultancy onboarding"
                        fill
                        className="object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/90" />
                    <div className="relative z-10 w-full max-w-2xl px-8 py-10">
                        <Suspense fallback={<RegisterFormSkeleton />}>
                            <RegisterForm />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
