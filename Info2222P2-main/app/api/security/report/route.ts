import { NextRequest, NextResponse } from 'next/server';
import { withNextAuth } from '@/lib/auth/middleware';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { SecurityEventType, SecurityEventSeverity, logSecurityEventFromRequest } from '@/lib/security/auditLog';
import { RateLimitType, withRateLimit } from '@/lib/security/rateLimiter';
import { formatDistance } from 'date-fns';

const prisma = new PrismaClient();

// Validation schema for report query parameters
const reportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  eventTypes: z.string().optional(),
  severity: z.string().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

/**
 * Check if a user has admin permissions
 *
 * @param userId User ID to check
 * @returns Boolean indicating if user is an admin
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    return !!user?.isAdmin;
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
}

/**
 * Format security audit logs as CSV
 *
 * @param logs Array of security audit logs
 * @returns CSV formatted string
 */
function formatLogsAsCsv(logs: any[]): string {
  // Define CSV headers
  const headers = [
    'Timestamp',
    'Event Type',
    'Severity',
    'User ID',
    'IP Address',
    'User Agent',
    'Details'
  ].join(',');

  // Format each log entry as CSV row
  const rows = logs.map(log => {
    // Parse metadata if it exists
    let metadata = '';
    try {
      if (log.metadata) {
        metadata = JSON.parse(log.metadata);
        metadata = Object.entries(metadata)
          .map(([key, value]) => `${key}:${value}`)
          .join('; ');
      }
    } catch (e) {
      metadata = log.metadata || '';
    }

    // Format and escape CSV values
    return [
      log.timestamp.toISOString(),
      log.eventType,
      log.severity,
      log.userId || '',
      log.ipAddress || '',
      `"${(log.userAgent || '').replace(/"/g, '""')}"`, // Escape quotes in user agent
      `"${metadata.replace(/"/g, '""')}"` // Escape quotes in metadata
    ].join(',');
  });

  // Combine headers and rows
  return [headers, ...rows].join('\n');
}

/**
 * GET handler for security report endpoint
 */
async function getSecurityReport(req: NextRequest, userId: string): Promise<NextResponse> {
  try {
    // Check if user is an admin
    const admin = await isUserAdmin(userId);
    if (!admin) {
      logSecurityEventFromRequest(
        SecurityEventType.ACCESS_DENIED,
        req,
        userId,
        { reason: 'Unauthorized access to security reports' }
      );

      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());

    const validation = reportQuerySchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { startDate, endDate, eventTypes, severity, format } = validation.data;

    // Build query filters
    const filters: any = {};

    if (startDate) {
      filters.timestamp = {
        ...filters.timestamp,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      filters.timestamp = {
        ...filters.timestamp,
        lte: new Date(endDate),
      };
    }

    if (eventTypes) {
      filters.eventType = {
        in: eventTypes.split(','),
      };
    }

    if (severity) {
      filters.severity = severity;
    }

    // Query database for logs
    const logs = await prisma.securityAuditLog.findMany({
      where: filters,
      orderBy: {
        timestamp: 'desc',
      },
      take: 1000, // Limit to prevent excessive results
    });

    // Generate summary statistics
    const totalEvents = logs.length;
    const eventTypeCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    const recentTimestamp = logs.length > 0 ? logs[0].timestamp : new Date();

    logs.forEach(log => {
      // Count by event type
      eventTypeCounts[log.eventType] = (eventTypeCounts[log.eventType] || 0) + 1;

      // Count by severity
      severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
    });

    // Log access to security reports
    logSecurityEventFromRequest(
      SecurityEventType.SENSITIVE_DATA_ACCESS,
      req,
      userId,
      { reportType: 'security', filters, resultCount: logs.length }
    );

    // Return results in requested format
    if (format === 'csv') {
      const csv = formatLogsAsCsv(logs);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="security-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // Format dates relative to now for JSON response
      const formattedLogs = logs.map(log => ({
        ...log,
        relativeTime: formatDistance(log.timestamp, new Date(), { addSuffix: true }),
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      }));

      return NextResponse.json({
        summary: {
          totalEvents,
          byEventType: eventTypeCounts,
          bySeverity: severityCounts,
          timeRange: {
            from: startDate ? new Date(startDate).toISOString() : null,
            to: endDate ? new Date(endDate).toISOString() : null,
          },
          generated: new Date().toISOString(),
        },
        logs: formattedLogs,
      });
    }
  } catch (error) {
    console.error('Error generating security report:', error);

    return NextResponse.json(
      { error: 'Failed to generate security report' },
      { status: 500 }
    );
  }
}

/**
 * GET handler with authentication and rate limiting
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withNextAuth(req, async (req, userId) => {
    return withRateLimit(
      req,
      RateLimitType.API_REQUEST,
      async () => getSecurityReport(req, userId),
      'security-report'
    );
  });
}
