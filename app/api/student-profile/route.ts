import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, studentProfile } from "@/db/schema";
import { auth } from "@/lib/auth";

const studentProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  surname: z.string().trim().min(1, "Surname is required"),
  studentNumber: z.string().trim().min(1, "Student number is required"),
  educationalInstitution: z.enum(["University of Groningen", "Hanze", "Guest"]),
  study: z.string().trim().min(1, "Study is required"),
  ibanNumber: z.string().trim().min(1, "IBAN is required"),
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
