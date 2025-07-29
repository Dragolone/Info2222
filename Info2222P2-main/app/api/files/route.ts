import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createReadStream, createWriteStream, statSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { pipeline } from "stream/promises";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";
import { aesEncrypt } from "@/lib/encryption/crypto";
import { getCurrentKey } from "@/lib/encryption/keyManager";

// Configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "104857600", 10); // 100MB default
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  // Video
  "video/mp4",
  "video/mpeg",
  "video/webm",
];

// Validation schema for listing files
const listFilesSchema = z.object({
  groupId: z.string().uuid("Invalid group ID").optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
  isArchived: z.boolean().optional().default(false),
});

// Helper function to ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(path.join(UPLOAD_DIR, "thumbnails"), { recursive: true });
  } catch (error) {
    console.error("Error creating upload directories:", error);
    throw new Error("Failed to create upload directories");
  }
}

// Helper function to calculate file checksum
async function calculateChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

// Get files with pagination and filtering
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Get and validate query parameters
      const { searchParams } = new URL(req.url);

      const groupId = searchParams.get("groupId") || undefined;
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const cursor = searchParams.get("cursor");
      const isArchived = searchParams.get("isArchived") === "true";

      const validationResult = listFilesSchema.safeParse({
        groupId,
        limit,
        cursor,
        isArchived,
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      // Build the where condition
      const where: any = {
        isArchived,
      };

      // If groupId is provided, check group membership and add to filter
      if (groupId) {
        // Check if user is a member of the group
        const membership = await prisma.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You do not have access to this group" },
            { status: 403 }
          );
        }

        where.groupId = groupId;
      } else {
        // For personal files
        where.uploaderId = userId;
        where.groupId = null;
      }

      // Fetch files with pagination
      const files = await prisma.file.findMany({
        where,
        take: limit,
        ...(cursor
          ? {
              skip: 1, // Skip the cursor
              cursor: {
                id: cursor,
              },
            }
          : {}),
        orderBy: {
          createdAt: "desc",
        },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
      });

      // Get the next cursor
      const nextCursor = files.length > 0 ? files[files.length - 1].id : null;

      return NextResponse.json({
        files,
        nextCursor,
        hasMore: files.length === limit,
      });
    } catch (error) {
      console.error("Error fetching files:", error);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }
  });
}

// Upload a new file
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Ensure the upload directory exists
      await ensureUploadDir();

      // Get form data from the request
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const groupId = formData.get("groupId") as string | null;
      const encrypt = formData.get("encrypt") === "true";

      // Validate file
      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "File type not allowed" },
          { status: 400 }
        );
      }

      // If groupId is provided, check group membership
      if (groupId) {
        const membership = await prisma.groupMember.findUnique({
          where: {
            userId_groupId: {
              userId,
              groupId,
            },
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You do not have access to this group" },
            { status: 403 }
          );
        }
      }

      // Generate a unique filename
      const fileExtension = path.extname(file.name);
      const safeFileName = `${crypto.randomUUID()}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, safeFileName);

      // Process file encryption if requested
      let keyId;
      let encryptionIv;

      if (encrypt && groupId) {
        // Get the group's encryption key
        const { keyValue, keyId: groupKeyId } = await getCurrentKey("AES", groupId);
        keyId = groupKeyId;

        // For this example, we'll just create a placeholder for encryption
        // In a real implementation, you would encrypt the file content
        const buffer = Buffer.from(await file.arrayBuffer());
        const { encryptedData, iv } = aesEncrypt(buffer.toString("base64"), keyValue);
        encryptionIv = iv;

        // Write the encrypted content to file
        await writeFile(filePath, encryptedData);
      } else {
        // For unencrypted files, write the file directly
        const fileArrayBuffer = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(fileArrayBuffer));
      }

      // Calculate checksum for integrity verification
      const checksum = await calculateChecksum(filePath);

      // Get file stats
      const stats = statSync(filePath);

      // Create a database record for the file
      const fileRecord = await prisma.file.create({
        data: {
          filename: safeFileName,
          originalName: file.name,
          mimeType: file.type,
          size: stats.size,
          path: filePath,
          isEncrypted: encrypt,
          encryptionKeyId: keyId,
          encryptionIv,
          checksum,
          uploaderId: userId,
          groupId,
          metadata: JSON.stringify({
            uploadedAt: new Date().toISOString(),
            uploadedFrom: req.headers.get("user-agent") || "unknown",
          }),
        },
      });

      // Log the action
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "FILE_UPLOAD",
          success: true,
          details: `Uploaded file ${fileRecord.id} ${groupId ? `to group ${groupId}` : "(private)"}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(fileRecord, { status: 201 });
    } catch (error) {
      console.error("Error uploading file:", error);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }
  });
}
