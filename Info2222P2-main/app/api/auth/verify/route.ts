import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendSecurityNotificationEmail } from "@/lib/email/mailer";

// Validation schema for verification token
const verifySchema = z.object({
  token: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    // Extract token from URL params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Validate token
    const validationResult = verifySchema.safeParse({ token });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date(), // Token must not be expired
        },
        isVerified: false, // User must not be already verified
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 404 }
      );
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, // Clear token after use
        verificationExpires: null, // Clear expiration
      },
    });

    // Log verification success
    await prisma.userSecurityLog.create({
      data: {
        userId: user.id,
        action: "EMAIL_VERIFICATION",
        success: true,
        details: "Email verified successfully",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Send security notification email
    try {
      await sendSecurityNotificationEmail(
        user.email,
        "Email Verified Successfully",
        "Your email has been verified successfully. You can now log in to your account."
      );
    } catch (emailError) {
      console.error("Failed to send verification success email:", emailError);
      // Continue even if notification email fails
    }

    // Redirect to login page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?verified=true`);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Verification failed due to server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = verifySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gt: new Date(), // Token must not be expired
        },
        isVerified: false, // User must not be already verified
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 404 }
      );
    }

    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, // Clear token after use
        verificationExpires: null, // Clear expiration
      },
    });

    // Log verification success
    await prisma.userSecurityLog.create({
      data: {
        userId: user.id,
        action: "EMAIL_VERIFICATION",
        success: true,
        details: "Email verified successfully",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Return success response
    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Verification failed due to server error" },
      { status: 500 }
    );
  }
}
