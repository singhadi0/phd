import { Prisma } from "@prisma/client";

import prisma from "@/lib/db";

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (!value) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  return Number(value);
}

function personName(person?: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  if (!person) {
    return "—";
  }
  if (person.displayName && person.displayName.trim().length > 0) {
    return person.displayName.trim();
  }
  const fullName = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return fullName.length ? fullName : "—";
}

export type AdminLedgerEntry = {
  id: string;
  scholarId: string | null;
  scholarName: string;
  type: string;
  amount: number;
  currency: string;
  description: string | null;
  referenceNumber: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type AdminScholarshipSummary = {
  id: string;
  name: string;
  type: string;
  sponsor: string | null;
  currency: string;
  totalAwards: number;
  activeAwards: number;
  totalSanctioned: number;
};

export type AdminFinanceSummary = {
  metrics: {
    outstandingBalance: number;
    outstandingCurrency: string;
    overdueInvoices: number;
    paymentsLast30: number;
    activeScholarships: number;
  };
  ledger: AdminLedgerEntry[];
  scholarships: AdminScholarshipSummary[];
};

export async function getAdminFinanceSummary(params: {
  tenantId: string;
}): Promise<AdminFinanceSummary> {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    outstandingGroup,
    overdueInvoices,
    paymentsAggregate,
    ledgerEntries,
    scholarships,
  ] = await Promise.all([
    prisma.feeLedgerEntry.groupBy({
      by: ["currency"],
      where: {
        tenantId: params.tenantId,
        type: "fee",
        paidAt: null,
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.feeLedgerEntry.count({
      where: {
        tenantId: params.tenantId,
        type: "fee",
        paidAt: null,
        dueDate: {
          lt: new Date(),
        },
      },
    }),
    prisma.feeLedgerEntry.aggregate({
      where: {
        tenantId: params.tenantId,
        type: "payment",
        OR: [
          { paidAt: { gte: thirtyDaysAgo } },
          { createdAt: { gte: thirtyDaysAgo } },
        ],
      },
      _sum: { amount: true },
    }),
    prisma.feeLedgerEntry.findMany({
      where: { tenantId: params.tenantId },
      orderBy: { createdAt: "desc" },
      take: 16,
      include: {
        scholar: {
          include: {
            user: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.scholarship.findMany({
      where: { tenantId: params.tenantId },
      include: {
        awards: {
          select: {
            status: true,
            sanctionedAmount: true,
          },
        },
      },
    }),
  ]);

  let outstandingTop = {
    amount: 0,
    currency: outstandingGroup[0]?.currency ?? "INR",
  };
  for (const group of outstandingGroup) {
    const amount = toNumber(group._sum.amount);
    if (amount > outstandingTop.amount) {
      outstandingTop = { amount, currency: group.currency };
    }
  }

  const paymentsLast30 = toNumber(paymentsAggregate._sum.amount);

  const ledger: AdminLedgerEntry[] = ledgerEntries.map((entry) => ({
    id: entry.id,
    scholarId: entry.scholarId,
    scholarName: personName(entry.scholar?.user),
    type: entry.type,
    amount: toNumber(entry.amount),
    currency: entry.currency,
    description: entry.description ?? null,
    referenceNumber: entry.referenceNumber ?? null,
    dueDate: entry.dueDate ? entry.dueDate.toISOString() : null,
    paidAt: entry.paidAt ? entry.paidAt.toISOString() : null,
    createdAt: entry.createdAt.toISOString(),
  }));

  const scholarshipSummaries: AdminScholarshipSummary[] = scholarships.map(
    (scholarship) => {
      const totalAwards = scholarship.awards.length;
      const activeAwards = scholarship.awards.filter(
        (award) => award.status === "active"
      ).length;
      const totalSanctioned = scholarship.awards.reduce((acc, award) => {
        return acc + toNumber(award.sanctionedAmount);
      }, 0);

      return {
        id: scholarship.id,
        name: scholarship.name,
        type: scholarship.type,
        sponsor: scholarship.sponsor ?? null,
        currency: scholarship.currency,
        totalAwards,
        activeAwards,
        totalSanctioned,
      } satisfies AdminScholarshipSummary;
    }
  );

  return {
    metrics: {
      outstandingBalance: outstandingTop.amount,
      outstandingCurrency: outstandingTop.currency,
      overdueInvoices,
      paymentsLast30,
      activeScholarships: scholarshipSummaries.length,
    },
    ledger,
    scholarships: scholarshipSummaries,
  } satisfies AdminFinanceSummary;
}
