"use client";

import { useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type FormState = {
    email: string;
    password: string;
    tenant: string;
};

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");
    const redirectParam = searchParams.get("redirect");
    const initialRedirectTarget = callbackUrl ?? redirectParam ?? "/";
    const [formState, setFormState] = useState<FormState>({
        email: "",
        password: "",
        tenant: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function normalizeInternalUrl(url: string | null): string | null {
        if (!url) {
            return null;
        }

        try {
            const parsed = new URL(url, window.location.origin);
            if (parsed.origin !== window.location.origin) {
                return null;
            }
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch {
            return url.startsWith("/") ? url : null;
        }
    }

    function preferredDestination(url: string | null): string | null {
        const normalized = normalizeInternalUrl(url);
        if (!normalized) {
            return null;
        }

        if (normalized === "/" || normalized === "" || normalized === "/login") {
            return null;
        }

        return normalized;
    }

    async function resolveDefaultDashboard(): Promise<string> {
        try {
            const response = await fetch("/api/auth/post-login", {
                method: "GET",
                cache: "no-store",
            });

            if (!response.ok) {
                return "/";
            }

            const data: { redirectTo?: string } = await response.json();
            return normalizeInternalUrl(data.redirectTo ?? "/") ?? "/";
        } catch {
            return "/";
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const { email, password, tenant } = formState;

        startTransition(async () => {
            const response = await signIn("credentials", {
                email,
                password,
                tenant: tenant || undefined,
                redirect: false,
            });

            if (!response || response.error) {
                setError(response?.error ?? "Authentication failed. Please verify your credentials.");
                return;
            }

            const destination = preferredDestination(initialRedirectTarget) ?? (await resolveDefaultDashboard());

            router.replace(destination);
            router.refresh();
        });
    }

    function updateField(key: keyof FormState, value: string) {
        setFormState((previous) => ({ ...previous, [key]: value }));
    }

    return (
        <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">Welcome back</CardTitle>
                <CardDescription>
                    Enter your credentials to access your Research X workspace.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="email">Institutional email</Label>
                        <Input
                            id="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="you@university.edu"
                            value={formState.email}
                            onChange={(event) => updateField("email", event.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={formState.password}
                            onChange={(event) => updateField("password", event.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="tenant">Tenant slug</Label>
                            <span className="text-xs text-muted-foreground">Optional</span>
                        </div>
                        <Input
                            id="tenant"
                            placeholder="research-x"
                            value={formState.tenant}
                            onChange={(event) => updateField("tenant", event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Provide the tenant slug if you belong to multiple campuses or programs.
                        </p>
                    </div>

                    {error ? (
                        <Alert variant="destructive">
                            <AlertTitle>Unable to sign in</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : null}

                    <Button
                        type="submit"
                        className="h-11 w-full rounded-full"
                        disabled={isPending}
                    >
                        {isPending ? "Signing you in…" : "Sign in"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
