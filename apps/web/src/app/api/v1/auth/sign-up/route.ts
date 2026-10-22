import { SignUpRequest } from '@easyfi/contracts';
import { appContext, ServiceError, signUp } from '@easyfi/services';

export const runtime = 'nodejs';

const fail = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

export async function POST(req: Request) {
  const parsed = SignUpRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return fail(400, 'bad_request', parsed.error.issues[0]?.message ?? 'Invalid body');
  try {
    const ctx = await appContext();
    const result = await signUp(ctx, parsed.data);
    return Response.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof ServiceError) return fail(e.status, e.code, e.message);
    console.error('sign-up failed', e);
    return fail(500, 'internal', 'Something went wrong.');
  }
}
