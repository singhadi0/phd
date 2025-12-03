import type { ReactNode } from "react";

export default function PublicLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-dvh flex-col bg-linear-to-br from-primary/5 via-background to-background text-foreground dark:from-primary/10">
            <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-8 lg:px-12">
                {children}
            </div>
        </div>
    );
}
