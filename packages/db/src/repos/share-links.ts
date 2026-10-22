import { randomBytes } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '../client';
import { portfolios, shareLinks, type ShareLink } from '../schema';
import { isUuid } from '../util';

export function shareLinksRepo(db: Db) {
  return {
    /** Null when the portfolio is not the user's. Token: 32 random bytes, base64url. */
    async create(userId: string, portfolioId: string): Promise<ShareLink | null> {
      if (!isUuid(portfolioId)) return null;
      const [owner] = await db
        .select({ id: portfolios.id })
        .from(portfolios)
        .where(and(eq(portfolios.userId, userId), eq(portfolios.id, portfolioId)));
      if (!owner) return null;
      const [row] = await db
        .insert(shareLinks)
        .values({ token: randomBytes(32).toString('base64url'), userId, portfolioId })
        .returning();
      return row!;
    },

    list(userId: string, portfolioId?: string): Promise<ShareLink[]> {
      const where =
        portfolioId && isUuid(portfolioId)
          ? and(eq(shareLinks.userId, userId), eq(shareLinks.portfolioId, portfolioId))
          : eq(shareLinks.userId, userId);
      return db.select().from(shareLinks).where(where).orderBy(desc(shareLinks.createdAt));
    },

    async revoke(userId: string, token: string): Promise<boolean> {
      const rows = await db
        .update(shareLinks)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(shareLinks.userId, userId),
            eq(shareLinks.token, token),
            isNull(shareLinks.revokedAt),
          ),
        )
        .returning({ token: shareLinks.token });
      return rows.length > 0;
    },

    /** Public, unauthenticated lookup → read-only access target, or null if unknown/revoked. */
    async resolve(token: string): Promise<{ portfolioId: string; userId: string } | null> {
      const [row] = await db
        .select({ portfolioId: shareLinks.portfolioId, userId: shareLinks.userId })
        .from(shareLinks)
        .where(and(eq(shareLinks.token, token), isNull(shareLinks.revokedAt)));
      return row ?? null;
    },
  };
}
