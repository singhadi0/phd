import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
    title: string;
    value: string;
    description?: string;
    icon?: LucideIcon;
    trend?: {
        value: string;
        label?: string;
        isPositive?: boolean;
    };
    className?: string;
};

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
}: MetricCardProps) {
    return (
        <Card className={cn("border-border/60 bg-card/70 shadow-sm shadow-primary/5", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon ? <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /> : null}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold tracking-tight text-foreground">
                    {value}
                </div>
                {trend ? (
                    <p
                        className={cn(
                            "mt-2 text-xs font-medium",
                            trend.isPositive ? "text-emerald-500" : "text-rose-500"
                        )}
                    >
                        {trend.value}
                        {trend.label ? <span className="text-muted-foreground"> • {trend.label}</span> : null}
                    </p>
                ) : null}
                {description ? (
                    <p className="mt-2 text-xs text-muted-foreground">{description}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}
