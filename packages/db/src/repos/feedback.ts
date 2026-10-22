import type { Db } from '../client';
import { feedback, type Feedback } from '../schema';

export function feedbackRepo(db: Db) {
  return {
    async insert(
      userId: string,
      input: { message: string; screenshotPath?: string | null },
    ): Promise<Feedback> {
      const [row] = await db
        .insert(feedback)
        .values({ ...input, userId })
        .returning();
      return row!;
    },
  };
}
