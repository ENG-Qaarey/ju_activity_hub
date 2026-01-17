import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditLogRow = {
  id: string;
  action: string;
  createdAt: string;
  message: string | null;
  entity: string | null;
  entityId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetEmail: string | null;
  targetRole: string | null;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    q?: string;
    action?: string;
    actorId?: string;
    targetId?: string;
    from?: string;
    to?: string;
    skip?: number;
    take?: number;
  }) {
    const take = Math.min(Math.max(params.take ?? 50, 1), 200);
    const skip = Math.max(params.skip ?? 0, 0);

    const whereParts: Prisma.Sql[] = [];

    if (params.action) {
      whereParts.push(Prisma.sql`al.action::text = ${params.action}`);
    }
    if (params.actorId) {
      whereParts.push(Prisma.sql`al."actorId" = ${params.actorId}`);
    }
    if (params.targetId) {
      whereParts.push(Prisma.sql`al."targetId" = ${params.targetId}`);
    }

    if (params.from) {
      const fromDate = new Date(params.from);
      if (!Number.isNaN(fromDate.getTime())) {
        whereParts.push(Prisma.sql`al."createdAt" >= ${fromDate}`);
      }
    }
    if (params.to) {
      const toDate = new Date(params.to);
      if (!Number.isNaN(toDate.getTime())) {
        whereParts.push(Prisma.sql`al."createdAt" <= ${toDate}`);
      }
    }

    if (params.q) {
      const q = `%${params.q}%`;
      whereParts.push(
        Prisma.sql`(
          al.action::text ILIKE ${q}
          OR COALESCE(al.message, '') ILIKE ${q}
          OR COALESCE(al.entity, '') ILIKE ${q}
          OR COALESCE(al."entityId", '') ILIKE ${q}
          OR COALESCE(actor.email, '') ILIKE ${q}
          OR COALESCE(target.email, '') ILIKE ${q}
        )`,
      );
    }

    let whereClause = Prisma.sql``;
    if (whereParts.length > 0) {
      whereClause = Prisma.sql`WHERE ${whereParts[0]}`;
      for (let i = 1; i < whereParts.length; i += 1) {
        whereClause = Prisma.sql`${whereClause} AND ${whereParts[i]}`;
      }
    }

    const rows = await this.prisma.$queryRaw<AuditLogRow[]>(
      Prisma.sql`
        SELECT
          al.id,
          al.action::text as action,
          al."createdAt"::text as "createdAt",
          al.message,
          al.entity,
          al."entityId",
          al."actorId",
          actor.email as "actorEmail",
          actor.role::text as "actorRole",
          al."targetId",
          target.email as "targetEmail",
          target.role::text as "targetRole"
        FROM audit_logs al
        LEFT JOIN users actor ON actor.id = al."actorId"
        LEFT JOIN users target ON target.id = al."targetId"
        ${whereClause}
        ORDER BY al."createdAt" DESC
        LIMIT ${take}
        OFFSET ${skip}
      `,
    );

    return rows;
  }

  async create(entry: {
    action: string;
    actorId?: string | null;
    targetId?: string | null;
    entity?: string | null;
    entityId?: string | null;
    message?: string | null;
    metadata?: unknown;
  }) {
    // Best-effort: audit logging must never break core flows.
    try {
      const id = randomUUID();
      const metadataJson = entry.metadata === undefined ? null : JSON.stringify(entry.metadata);

      await this.prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO audit_logs (
            id,
            action,
            "actorId",
            "targetId",
            entity,
            "entityId",
            message,
            metadata
          ) VALUES (
            ${id},
            CAST(${entry.action} AS "AuditAction"),
            ${entry.actorId ?? null},
            ${entry.targetId ?? null},
            ${entry.entity ?? null},
            ${entry.entityId ?? null},
            ${entry.message ?? null},
            ${metadataJson}::jsonb
          )
        `,
      );

      return { id };
    } catch (e) {
      return { id: null };
    }
  }
}
