"use client";

import { useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface RegisterFormState {
    tenantName: string;
    tenantSlug: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export function RegisterForm() {
    const router = useRouter();
    const defaultErrorMessage = "Registration failed. Please try again.";
    const [formState, setFormState] = useState<RegisterFormState>({
        tenantName: "",
        tenantSlug: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function updateField(key: keyof RegisterFormState, value: string) {
        setFormState((previous) => ({ ...previous, [key]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (formState.password !== formState.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        startTransition(async () => {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenantName: formState.tenantName,
                    tenantSlug: formState.tenantSlug,
                    firstName: formState.firstName,
                    lastName: formState.lastName,
                    email: formState.email,
                    password: formState.password,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                const rawError = (payload as { error?: unknown } | null)?.error;

                const formattedError = (() => {
                    if (!rawError) {
                        return defaultErrorMessage;
                    }

                    if (typeof rawError === "string") {
                        return rawError;
                    }

                    if (typeof rawError === "object") {
                        const { formErrors, fieldErrors } = rawError as {
                            formErrors?: string[];
                            fieldErrors?: Record<string, string[]>;
                        };

                        const collected = [
                            ...(Array.isArray(formErrors) ? formErrors : []),
                            ...
                            (fieldErrors
                                ? Object.values(fieldErrors).flat()
                                : []),
                        ].filter(Boolean);

                        if (collected.length > 0) {
                            return collected.join(" ");
                        }
                    }

                    return defaultErrorMessage;
                })();

                setError(formattedError);
                return;
            }

            setSuccess("Tenant created successfully. You can now sign in.");
            setFormState({
                tenantName: "",
                tenantSlug: "",
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                confirmPassword: "",
            });

            setTimeout(() => {
                router.push("/login");
            }, 1600);
        });
    }

    return (
        <Card className="w-full max-w-md border-border/60 bg-card/80 text-foreground shadow-2xl shadow-primary/10 backdrop-blur">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">Create a new tenant</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Provision a fresh workspace for your program. You will be the primary administrator.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="tenantName">Tenant name</Label>
                            <Input
                                id="tenantName"
                                value={formState.tenantName}
                                onChange={(event) => updateField("tenantName", event.target.value)}
                                placeholder="School of Advanced Research"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tenantSlug">Tenant slug</Label>
                            <Input
                                id="tenantSlug"
                                value={formState.tenantSlug}
                                onChange={(event) => updateField("tenantSlug", event.target.value.toLowerCase())}
                                placeholder="advanced-research"
                                pattern="[a-z0-9-]+"
                                title="Use only lowercase letters, numbers, and hyphen"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input
                                id="firstName"
                                value={formState.firstName}
                                onChange={(event) => updateField("firstName", event.target.value)}
                                placeholder="Aarav"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input
                                id="lastName"
                                value={formState.lastName}
                                onChange={(event) => updateField("lastName", event.target.value)}
                                placeholder="Patel"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Institutional email</Label>
                        <Input
                            id="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={formState.email}
                            onChange={(event) => updateField("email", event.target.value)}
                            placeholder="administrator@university.edu"
                            required
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={formState.password}
                                onChange={(event) => updateField("password", event.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={formState.confirmPassword}
                                onChange={(event) => updateField("confirmPassword", event.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error ? (
                        <Alert variant="destructive">
                            <AlertTitle>Unable to register</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : null}

                    {success ? (
                        <Alert className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                            <AlertTitle>Tenant created</AlertTitle>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    ) : null}

                    <Button type="submit" className="h-11 w-full rounded-full" disabled={isPending}>
                        {isPending ? "Provisioning…" : "Create tenant"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
