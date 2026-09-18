import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, studentProfile } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isValidCountry } from "@/lib/countries";
import { isValidStudy } from "@/lib/studies";

const DELETE_CONFIRMATION_PHRASE = "Remove Me From GEARS";

const studentProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  surname: z.string().trim().min(1, "Surname is required"),
  studentNumber: z.string().trim().min(1, "Student number is required"),
  educationalInstitution: z.enum(["University of Groningen", "Hanze", "Guest"]),
  study: z
    .string()
    .trim()
    .min(1, "Study is required")
    .refine((value) => isValidStudy(value), {
      message: "Select a valid study from the list",
    }),
  ibanNumber: z.string().trim().min(1, "IBAN is required"),
  gender: z
    .enum(["Male", "Female", "Non-Binary", "Other", "Prefer Not To Say"])
    .optional(),
  nationality: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidCountry(value), {
      message: "Select a valid country from the list",
    }),
  informationProcessingConsent: z.boolean().refine((value) => value, {
    message: "You must consent to information processing",
  }),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.query.member.findFirst({
    where: eq(member.userId, session.user.id),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Only organization members can submit this form" },
      { status: 403 }
    );
  }

  const payload = await request.json();
  const parsed = studentProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid form data",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const profileData = {
    firstName: parsed.data.firstName,
    surname: parsed.data.surname,
    studentNumber: parsed.data.studentNumber,
    educationalInstitution: parsed.data.educationalInstitution,
    study: parsed.data.study,
    ibanNumber: parsed.data.ibanNumber,
    gender: parsed.data.gender ?? null,
    nationality: parsed.data.nationality ?? null,
    inormationProcessingConsent: parsed.data.informationProcessingConsent,
    fieldsFilled: true,
    finalisationTime: new Date(),
    updatedAt: new Date(),
  };

  const existingProfile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });

  if (existingProfile) {
    await db
      .update(studentProfile)
      .set(profileData)
      .where(eq(studentProfile.userId, session.user.id));
  } else {
    await db.insert(studentProfile).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      paid: false,
      ...profileData,
    });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.query.member.findFirst({
    where: eq(member.userId, session.user.id),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Only organization members can edit this form" },
      { status: 403 }
    );
  }

  const payload = await request.json();
  const parsed = studentProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid form data",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const existingProfile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });

  if (!existingProfile) {
    return NextResponse.json(
      { error: "Profile not found. Complete the profile form first." },
      { status: 404 }
    );
  }

  await db
    .update(studentProfile)
    .set({
      firstName: parsed.data.firstName,
      surname: parsed.data.surname,
      studentNumber: parsed.data.studentNumber,
      educationalInstitution: parsed.data.educationalInstitution,
      study: parsed.data.study,
      ibanNumber: parsed.data.ibanNumber,
      gender: parsed.data.gender ?? null,
      nationality: parsed.data.nationality ?? null,
      inormationProcessingConsent: parsed.data.informationProcessingConsent,
      fieldsFilled: true,
      updatedAt: new Date(),
    })
    .where(eq(studentProfile.userId, session.user.id));

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const confirmation =
    payload && typeof payload.confirmation === "string"
      ? payload.confirmation
      : "";

  if (confirmation !== DELETE_CONFIRMATION_PHRASE) {
    return NextResponse.json(
      { error: `Type "${DELETE_CONFIRMATION_PHRASE}" to confirm.` },
      { status: 400 }
    );
  }

  const existingProfile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });

  if (!existingProfile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  await db
    .update(studentProfile)
    .set({
      firstName: "Deleted",
      surname: "Member",
      studentNumber: "",
      ibanNumber: "",
      study: "",
      gender: null,
      nationality: null,
      fieldsFilled: false,
      finalisationTime: null,
      updatedAt: new Date(),
    })
    .where(eq(studentProfile.userId, session.user.id));

  return NextResponse.json({ success: true });
}
