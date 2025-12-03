"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { icons, LogOut, Settings, UserRound } from "lucide-react";

import type { NavigationItem } from "@/lib/navigation/types";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

export type DashboardNavItem = NavigationItem;

type DashboardShellProps = {
    navItems: DashboardNavItem[];
    tenant: {
        name: string;
        slug: string;
    };
    user: {
        name: string;
        roleName: string;
        email?: string | null;
    };
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    maxContentWidthClassName?: string;
    settingsHref?: string;
};

export function DashboardShell({
    navItems,
    tenant,
    user,
    children,
    headerActions,
    maxContentWidthClassName = "max-w-6xl",
    settingsHref,
}: DashboardShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const resolvedSettingsHref = settingsHref ?? `/${tenant.slug}`;

    const handleSettings = () => {
        router.push(resolvedSettingsHref);
    };

    const handleSwitchAccount = () => {
        const target = `/login?redirect=${encodeURIComponent(pathname ?? "/")}`;
        startTransition(() => {
            void signOut({ callbackUrl: target });
        });
    };

    const handleSignOut = () => {
        startTransition(() => {
            void signOut({ callbackUrl: "/login" });
        });
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-dvh w-full">
                <Sidebar collapsible="icon" className="border-border/40">
                    <SidebarHeader>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground/80">
                                Workspace
                            </p>
                            <p className="mt-2 text-lg font-semibold text-foreground">{tenant.name}</p>
                            <p className="text-xs text-muted-foreground">{user.roleName}</p>
                        </div>
                    </SidebarHeader>
                    <SidebarSeparator />
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Navigate</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navItems.map((item) => {
                                        const Icon = item.icon ? icons[item.icon] : undefined;
                                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                                        return (
                                            <SidebarMenuItem key={item.href}>
                                                <SidebarMenuButton asChild isActive={isActive}>
                                                    <Link href={item.href}>
                                                        {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                                {item.badge ? (
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                                                        <Badge variant="secondary" className="px-1.5 py-0 text-[0.65rem]">
                                                            {item.badge}
                                                        </Badge>
                                                    </span>
                                                ) : null}
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarSeparator />
                    <SidebarFooter>
                        <div className="space-y-3 rounded-lg border border-border/60 bg-card/60 p-3">
                            <div>
                                <p className="text-xs text-muted-foreground">Signed in as</p>
                                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                                {user.email ? (
                                    <p className="text-xs text-muted-foreground/90">{user.email}</p>
                                ) : null}
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2"
                                    onClick={handleSettings}
                                    disabled={isPending}
                                >
                                    <Settings className="h-4 w-4" aria-hidden="true" />
                                    Workspace settings
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2"
                                    onClick={handleSwitchAccount}
                                    disabled={isPending}
                                >
                                    <UserRound className="h-4 w-4" aria-hidden="true" />
                                    Switch account
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start gap-2 text-rose-500 hover:text-rose-500"
                                    onClick={handleSignOut}
                                    disabled={isPending}
                                >
                                    <LogOut className="h-4 w-4" aria-hidden="true" />
                                    Log out
                                </Button>
                            </div>
                        </div>
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>
                <SidebarInset>
                    <header className="flex h-16 items-center justify-between border-b border-border/40 bg-card/70 px-4 md:px-6">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="md:hidden" />
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
                                    {tenant.slug}
                                </p>
                                <p className="text-sm font-semibold text-foreground">{tenant.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="inline-flex text-xs text-muted-foreground md:hidden">
                                {user.roleName}
                            </span>
                            {headerActions ? (
                                <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
                                    <span>{user.roleName}</span>
                                    {headerActions}
                                </div>
                            ) : (
                                <span className="hidden text-xs text-muted-foreground md:inline-flex">
                                    {user.roleName}
                                </span>
                            )}
                            <ThemeToggle />
                        </div>
                    </header>
                    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-muted/10">
                        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
                            <div className={`mx-auto w-full ${maxContentWidthClassName} space-y-6`}>
                                {children}
                            </div>
                        </main>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
