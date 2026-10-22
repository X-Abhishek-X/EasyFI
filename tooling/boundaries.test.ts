import { ESLint } from 'eslint';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..');

async function lint(relFile: string, code: string, cwd = repoRoot) {
  const eslint = new ESLint({ cwd });
  const [result] = await eslint.lintText(code, { filePath: path.join(repoRoot, relFile) });
  return (result?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports');
}

describe('dependency boundaries (spec §4)', () => {
  it('core may not import other internal packages', async () => {
    const msgs = await lint(
      'packages/core/src/x.ts',
      "import { db } from '@easyfi/db';\nexport const y = db;\n",
    );
    expect(msgs).toHaveLength(1);
  });

  it('services may import core', async () => {
    const msgs = await lint(
      'packages/services/src/x.ts',
      "import { x } from '@easyfi/core';\nexport const y = x;\n",
    );
    expect(msgs).toHaveLength(0);
  });

  it('web may not import db', async () => {
    const msgs = await lint(
      'apps/web/src/x.ts',
      "import { db } from '@easyfi/db';\nexport const y = db;\n",
      path.join(repoRoot, 'apps/web'),
    );
    expect(msgs).toHaveLength(1);
  });

  it('web may import contracts', async () => {
    const msgs = await lint(
      'apps/web/src/x.ts',
      "import { x } from '@easyfi/contracts';\nexport const y = x;\n",
      path.join(repoRoot, 'apps/web'),
    );
    expect(msgs).toHaveLength(0);
  });
});
