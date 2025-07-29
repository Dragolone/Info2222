import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { withNextAuth } from "@/lib/auth/middleware";

// Validation schema for creating a task
const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "ARCHIVED"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
  groupId: z.string().uuid("Invalid group ID"),
  assignees: z.array(z.string().uuid("Invalid user ID")).optional(),
});

// Validation schema for listing tasks
const listTasksSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
  assignedToMe: z.boolean().optional(),
  createdByMe: z.boolean().optional(),
});

// Get tasks with pagination and filtering
export async function GET(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Get and validate query parameters
      const { searchParams } = new URL(req.url);

      const groupId = searchParams.get("groupId");
      if (!groupId) {
        return NextResponse.json(
          { error: "Group ID is required" },
          { status: 400 }
        );
      }

      const status = searchParams.get("status") as any || undefined;
      const priority = searchParams.get("priority") as any || undefined;
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const cursor = searchParams.get("cursor");
      const assignedToMe = searchParams.get("assignedToMe") === "true";
      const createdByMe = searchParams.get("createdByMe") === "true";

      const validationResult = listTasksSchema.safeParse({
        groupId,
        status,
        priority,
        limit,
        cursor,
        assignedToMe,
        createdByMe,
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

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

      // Build the where condition
      const where: any = {
        groupId,
      };

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      // Additional filters for assigned to me or created by me
      if (assignedToMe) {
        where.assignments = {
          some: {
            userId,
          },
        };
      }

      if (createdByMe) {
        where.creatorId = userId;
      }

      // Fetch tasks with pagination
      const tasks = await prisma.task.findMany({
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
        orderBy: [
          { priority: "desc" }, // Higher priority first
          { dueDate: "asc" }, // Earlier due date first
          { createdAt: "desc" }, // Recently created first
        ],
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Get the next cursor
      const nextCursor = tasks.length > 0 ? tasks[tasks.length - 1].id : null;

      return NextResponse.json({
        tasks,
        nextCursor,
        hasMore: tasks.length === limit,
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }
  });
}

// Create a new task
export async function POST(request: NextRequest) {
  return withNextAuth(request, async (req, userId) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validationResult = createTaskSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const {
        title, description, status, priority, dueDate, groupId, assignees
      } = validationResult.data;

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

      // Parse due date if provided
      const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

      // Create task with a transaction to ensure all operations succeed or fail together
      const result = await prisma.$transaction(async (tx) => {
        // Create the task
        const task = await tx.task.create({
          data: {
            title,
            description,
            status,
            priority,
            dueDate: parsedDueDate,
            creatorId: userId,
            groupId,
          },
        });

        // Create task assignments if provided
        if (assignees && assignees.length > 0) {
          // Verify all assignees are members of the group
          const groupMembers = await tx.groupMember.findMany({
            where: {
              groupId,
              userId: {
                in: assignees,
              },
            },
            select: {
              userId: true,
            },
          });

          const validAssigneeIds = groupMembers.map(member => member.userId);

          // Create assignments for valid assignees
          const assignmentPromises = validAssigneeIds.map(assigneeId =>
            tx.taskAssignment.create({
              data: {
                taskId: task.id,
                userId: assigneeId,
              },
            })
          );

          await Promise.all(assignmentPromises);
        }

        // Return the task with full details
        return tx.task.findUnique({
          where: { id: task.id },
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        });
      });

      // Log the action
      await prisma.userSecurityLog.create({
        data: {
          userId,
          action: "TASK_CREATE",
          success: true,
          details: `Created task ${result?.id} in group ${groupId}`,
          ipAddress: req.headers.get("x-forwarded-for") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      console.error("Error creating task:", error);
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 }
      );
    }
  });
}
