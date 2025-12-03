import {
  AdmissionPathway,
  AdmissionStatus,
  DocumentStatus,
  DocumentType,
  MeetingStatus,
  NotificationType,
  Prisma,
  PrismaClient,
  ReminderChannel,
  RoleKey,
} from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

const ROLE_SEED: Array<{
  key: RoleKey;
  name: string;
  description: string;
  permissions: string[];
}> = [
  {
    key: RoleKey.SUPER_ADMIN,
    name: "Super Admin",
    description: "Full control over the tenant",
    permissions: ["*"],
  },
  {
    key: RoleKey.ADMIN,
    name: "Admin",
    description: "Manage admissions, finances, and communications",
    permissions: [
      "admissions:manage",
      "finance:manage",
      "communications:manage",
    ],
  },
  {
    key: RoleKey.SUPERVISOR,
    name: "Supervisor",
    description: "Monitor scholars and submit reports",
    permissions: ["scholar:read", "scholar:update", "meeting:manage"],
  },
  {
    key: RoleKey.SCHOLAR,
    name: "Scholar",
    description: "Engage with program requirements",
    permissions: ["self:read", "self:update"],
  },
  {
    key: RoleKey.DEVELOPER,
    name: "Developer",
    description: "Build tenant integrations",
    permissions: ["api:access", "webhook:manage"],
  },
];

async function main() {
  const tenantSlug = "research-x";
  const tenantName = "Research X Demo University";

  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (existingTenant) {
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: tenantSlug,
      contactEmail: "admin@researchx.test",
      contactPhone: "+91-00000-00000",
    },
  });

  const roles = await Promise.all(
    ROLE_SEED.map((role) =>
      prisma.role.create({
        data: {
          tenantId: tenant.id,
          key: role.key,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        },
      })
    )
  );

  const rolesByKey = new Map(roles.map((role) => [role.key, role]));

  const defaultPassword = await hash("Password123!");

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@researchx.test",
      hashedPassword: defaultPassword,
      firstName: "Asha",
      lastName: "Patel",
      displayName: "Asha Patel",
      emailVerified: new Date(),
      defaultTenantId: tenant.id,
      activeTenantId: tenant.id,
    },
  });

  const supervisorUser = await prisma.user.create({
    data: {
      email: "supervisor@researchx.test",
      hashedPassword: defaultPassword,
      firstName: "Ravi",
      lastName: "Iyer",
      displayName: "Dr. Ravi Iyer",
      emailVerified: new Date(),
      defaultTenantId: tenant.id,
      activeTenantId: tenant.id,
    },
  });

  const scholarUser = await prisma.user.create({
    data: {
      email: "scholar@researchx.test",
      hashedPassword: defaultPassword,
      firstName: "Meera",
      lastName: "Joshi",
      displayName: "Meera Joshi",
      emailVerified: new Date(),
      defaultTenantId: tenant.id,
      activeTenantId: tenant.id,
    },
  });

  const developerUser = await prisma.user.create({
    data: {
      email: "developer@researchx.test",
      hashedPassword: defaultPassword,
      firstName: "Nikhil",
      lastName: "Verma",
      displayName: "Nikhil Verma",
      emailVerified: new Date(),
      defaultTenantId: tenant.id,
      activeTenantId: tenant.id,
    },
  });

  const createMembership = async (
    userId: string,
    roleKey: RoleKey,
    options: { primary?: boolean; title?: string } = {}
  ) => {
    const role = rolesByKey.get(roleKey);
    if (!role) {
      throw new Error(`Role ${roleKey} is not seeded`);
    }

    return prisma.tenantMembership.create({
      data: {
        userId,
        tenantId: tenant.id,
        roleId: role.id,
        status: "active",
        primary: options.primary ?? false,
        title: options.title,
        permissions: role.permissions,
      },
    });
  };

  await createMembership(adminUser.id, RoleKey.SUPER_ADMIN, {
    primary: true,
    title: "Chief Administrator",
  });

  const supervisorMembership = await createMembership(
    supervisorUser.id,
    RoleKey.SUPERVISOR,
    {
      primary: true,
      title: "Faculty Supervisor",
    }
  );

  const scholarMembership = await createMembership(
    scholarUser.id,
    RoleKey.SCHOLAR,
    {
      primary: true,
      title: "PhD Scholar",
    }
  );

  await createMembership(developerUser.id, RoleKey.DEVELOPER, {
    primary: true,
    title: "Solutions Engineer",
  });

  const department = await prisma.department.create({
    data: {
      tenantId: tenant.id,
      name: "School of Advanced Computing",
      code: "SAC",
      description: "Focus on AI-driven research and intelligent systems.",
    },
  });

  const program = await prisma.program.create({
    data: {
      tenantId: tenant.id,
      departmentId: department.id,
      name: "PhD in Artificial Intelligence",
      code: "AI-PHD",
      durationMonths: 48,
      courseworkRequired: true,
      metadata: {
        mode: "Full-time",
      },
    },
  });

  const [researchMethods, machineLearning] = await Promise.all([
    prisma.course.create({
      data: {
        programId: program.id,
        code: "AI700",
        title: "Advanced Research Methods",
        credits: 4,
      },
    }),
    prisma.course.create({
      data: {
        programId: program.id,
        code: "AI730",
        title: "Applied Machine Learning",
        credits: 5,
      },
    }),
  ]);

  const [proposalMilestone, synopsisMilestone, thesisMilestone] =
    await Promise.all([
      prisma.programMilestone.create({
        data: {
          programId: program.id,
          name: "Proposal Defense",
          order: 1,
          dueInMonths: 6,
        },
      }),
      prisma.programMilestone.create({
        data: {
          programId: program.id,
          name: "Synopsis Submission",
          order: 2,
          dueInMonths: 18,
        },
      }),
      prisma.programMilestone.create({
        data: {
          programId: program.id,
          name: "Thesis Submission",
          order: 3,
          dueInMonths: 42,
        },
      }),
    ]);

  const admission = await prisma.admission.create({
    data: {
      tenantId: tenant.id,
      programId: program.id,
      userId: scholarUser.id,
      status: AdmissionStatus.INTERVIEW_SCHEDULED,
      pathway: AdmissionPathway.NET_JRF,
      applicationData: {
        statementOfPurpose: "Focus on ethical AI for healthcare.",
        expectedStart: "2026-01-10",
      },
      evaluationNotes: {
        panel: ["Dr. Rao", "Dr. Sen"],
      },
    },
  });

  const scholarship = await prisma.scholarship.create({
    data: {
      tenantId: tenant.id,
      name: "AI Centre Fellowship",
      type: "University",
      sponsor: "Research X Foundation",
      currency: "INR",
    },
  });

  const scholarProfile = await prisma.scholarProfile.create({
    data: {
      membershipId: scholarMembership.id,
      userId: scholarUser.id,
      tenantId: tenant.id,
      admissionId: admission.id,
      enrollmentNumber: "RX-AI-2026-001",
      researchTitle: "Responsible AI Pipelines for Critical Care",
      specialization: "Explainable AI",
      status: "active",
      currentProgramId: program.id,
    },
  });

  const supervisorProfile = await prisma.supervisorProfile.create({
    data: {
      membershipId: supervisorMembership.id,
      userId: supervisorUser.id,
      tenantId: tenant.id,
      departmentId: department.id,
      designation: "Associate Professor",
      workloadTarget: 6,
      bio: "Works on machine learning for healthcare and interpretability.",
    },
  });

  await prisma.scholarSupervisor.create({
    data: {
      scholarId: scholarProfile.id,
      supervisorId: supervisorProfile.id,
      role: "primary",
    },
  });

  await Promise.all([
    prisma.scholarMilestone.create({
      data: {
        scholarId: scholarProfile.id,
        milestoneId: proposalMilestone.id,
        status: "completed",
        expectedBy: new Date("2026-07-01"),
        completedAt: new Date("2026-06-15"),
      },
    }),
    prisma.scholarMilestone.create({
      data: {
        scholarId: scholarProfile.id,
        milestoneId: synopsisMilestone.id,
        status: "in_progress",
        expectedBy: new Date("2027-06-01"),
      },
    }),
    prisma.scholarMilestone.create({
      data: {
        scholarId: scholarProfile.id,
        milestoneId: thesisMilestone.id,
        status: "pending",
        expectedBy: new Date("2029-12-01"),
      },
    }),
  ]);

  await Promise.all([
    prisma.scholarCourseEnrollment.create({
      data: {
        scholarId: scholarProfile.id,
        courseId: researchMethods.id,
        academicYear: "2026-2027",
        semester: "Autumn",
        status: "completed",
        grade: "A",
      },
    }),
    prisma.scholarCourseEnrollment.create({
      data: {
        scholarId: scholarProfile.id,
        courseId: machineLearning.id,
        academicYear: "2026-2027",
        semester: "Spring",
        status: "in_progress",
      },
    }),
  ]);

  const scholarshipAward = await prisma.scholarshipAward.create({
    data: {
      scholarshipId: scholarship.id,
      scholarId: scholarProfile.id,
      sanctionedAmount: new Prisma.Decimal("180000.00"),
      status: "active",
    },
  });

  await prisma.feeLedgerEntry.create({
    data: {
      tenantId: tenant.id,
      scholarId: scholarProfile.id,
      scholarshipAwardId: scholarshipAward.id,
      type: "fee",
      description: "Semester tuition fee",
      amount: new Prisma.Decimal("75000.00"),
      currency: "INR",
      dueDate: new Date("2026-08-15"),
      referenceNumber: "INV-2026-08-001",
    },
  });

  const clearedFee = await prisma.feeLedgerEntry.create({
    data: {
      tenantId: tenant.id,
      scholarId: scholarProfile.id,
      type: "payment",
      description: "Scholarship disbursement",
      amount: new Prisma.Decimal("45000.00"),
      currency: "INR",
      referenceNumber: "PAY-2026-06-010",
      paidAt: new Date("2026-06-30"),
    },
  });

  const synopsisDocument = await prisma.document.create({
    data: {
      tenantId: tenant.id,
      ownerUserId: scholarUser.id,
      scholarId: scholarProfile.id,
      type: DocumentType.SYNOPSIS,
      status: DocumentStatus.UNDER_REVIEW,
      title: "Synopsis: Responsible AI in Critical Care",
      description: "Initial synopsis submitted for review",
      tags: ["synopsis", "ai", "healthcare"],
    },
  });

  const synopsisVersion = await prisma.documentVersion.create({
    data: {
      documentId: synopsisDocument.id,
      uploadedById: scholarUser.id,
      storageKey: `documents/${synopsisDocument.id}/v1.pdf`,
      fileName: "synopsis.pdf",
      mimeType: "application/pdf",
      checksum: "demo-checksum-synopsis",
      sizeBytes: 235678,
    },
  });

  await prisma.document.update({
    where: { id: synopsisDocument.id },
    data: { currentVersionId: synopsisVersion.id },
  });

  const feeReceiptDocument = await prisma.document.create({
    data: {
      tenantId: tenant.id,
      ownerUserId: adminUser.id,
      scholarId: scholarProfile.id,
      feeLedgerEntryId: clearedFee.id,
      type: DocumentType.RECEIPT,
      status: DocumentStatus.APPROVED,
      title: "Receipt: Scholarship Disbursement",
    },
  });

  const feeReceiptVersion = await prisma.documentVersion.create({
    data: {
      documentId: feeReceiptDocument.id,
      uploadedById: adminUser.id,
      storageKey: `documents/${feeReceiptDocument.id}/v1.pdf`,
      fileName: "receipt.pdf",
      mimeType: "application/pdf",
      checksum: "demo-checksum-receipt",
      sizeBytes: 128944,
    },
  });

  await prisma.document.update({
    where: { id: feeReceiptDocument.id },
    data: { currentVersionId: feeReceiptVersion.id },
  });

  const meeting = await prisma.meeting.create({
    data: {
      tenantId: tenant.id,
      organizerId: supervisorMembership.id,
      title: "Monthly research check-in",
      agenda: "Discuss experiment progress and upcoming deadlines",
      scheduledFor: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: MeetingStatus.CONFIRMED,
      location: "Innovation Lab 3A",
    },
  });

  await prisma.meetingParticipant.createMany({
    data: [
      {
        meetingId: meeting.id,
        membershipId: scholarMembership.id,
        attendance: null,
      },
      {
        meetingId: meeting.id,
        membershipId: supervisorMembership.id,
        attendance: "organizer",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        tenantId: tenant.id,
        recipientId: scholarMembership.id,
        type: NotificationType.DOCUMENT,
        title: "Synopsis submitted",
        body: "Your synopsis has been received and assigned to reviewers.",
        channels: [ReminderChannel.IN_APP, ReminderChannel.EMAIL],
        deliveredAt: new Date(),
      },
      {
        tenantId: tenant.id,
        recipientId: scholarMembership.id,
        type: NotificationType.MESSAGE,
        title: "Meeting confirmed",
        body: "Monthly research check-in is scheduled for next week.",
        channels: [ReminderChannel.IN_APP],
        deliveredAt: new Date(),
      },
    ],
  });

  const thread = await prisma.messageThread.create({
    data: {
      tenantId: tenant.id,
      subject: "Synopsis feedback loop",
      createdById: supervisorMembership.id,
    },
  });

  await prisma.messageThreadParticipant.createMany({
    data: [
      {
        threadId: thread.id,
        membershipId: supervisorMembership.id,
        role: "owner",
      },
      {
        threadId: thread.id,
        membershipId: scholarMembership.id,
        role: "participant",
      },
    ],
  });

  await prisma.message.create({
    data: {
      threadId: thread.id,
      authorId: supervisorUser.id,
      body: "Please incorporate the reviewer comments on section 2 by Friday.",
    },
  });

  await prisma.message.create({
    data: {
      threadId: thread.id,
      authorId: scholarUser.id,
      body: "Acknowledged. Updated draft will be shared tomorrow.",
    },
  });

  const researchProject = await prisma.researchProject.create({
    data: {
      tenantId: tenant.id,
      scholarId: scholarProfile.id,
      title: "ICU Vital Signs Monitoring",
      objective: "Design explainable models for ICU risk prediction.",
      startDate: new Date("2026-02-01"),
    },
  });

  await prisma.researchObservation.create({
    data: {
      projectId: researchProject.id,
      recordedById: scholarUser.id,
      recordedAt: new Date(),
      metrics: {
        auc: 0.91,
        calibrationError: 0.07,
      },
      actions: {
        note: "Updated dataset with latest ICU shift logs.",
      },
      notes: "Model trending well; need to investigate outliers.",
      status: "pending_review",
      metadata: {
        sampleSize: 1200,
      },
    },
  });

  const featureFlag = await prisma.featureFlag.create({
    data: {
      key: "doc-versioning",
      description: "Enable advanced document version workflows",
      defaultOn: true,
    },
  });

  await prisma.tenantFeatureFlag.create({
    data: {
      tenantId: tenant.id,
      flagId: featureFlag.id,
      enabled: true,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: adminUser.id,
        action: "TENANT_BOOTSTRAP",
        context: { message: "Seed data provisioned." },
      },
      {
        tenantId: tenant.id,
        userId: scholarUser.id,
        action: "DOCUMENT_SUBMITTED",
        documentId: synopsisDocument.id,
        context: { title: synopsisDocument.title },
      },
      {
        tenantId: tenant.id,
        userId: supervisorUser.id,
        action: "MEETING_SCHEDULED",
        context: { meetingTitle: meeting.title },
      },
    ],
  });

  await prisma.reminderRule.create({
    data: {
      tenantId: tenant.id,
      name: "Synopsis review nudges",
      description: "Weekly reminder for pending synopsis reviews",
      targetType: "document",
      targetId: synopsisDocument.id,
      schedule: { cadence: "weekly", dayOfWeek: "monday" },
      channels: [ReminderChannel.IN_APP, ReminderChannel.EMAIL],
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: developerUser.id,
      action: "FEATURE_FLAG_CHECK",
      context: { flagKey: featureFlag.key },
    },
  });

  console.log("✅ Seed data created for tenant:", tenantSlug);
  console.log("Users:");
  console.log("  Admin:", adminUser.email);
  console.log("  Supervisor:", supervisorUser.email);
  console.log("  Scholar:", scholarUser.email);
  console.log("  Developer:", developerUser.email);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
