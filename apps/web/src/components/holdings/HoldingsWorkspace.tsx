'use client';

import { FileUp, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { PageHeader, type Crumb } from '@/components/shell/PageHeader';
import { Button } from '@/components/ui/Button';
import { AddHoldingPanel } from './AddHoldingPanel';
import { CsvImportDialog } from './CsvImportDialog';
import { HoldingsTable } from './HoldingsTable';
import type { AddHoldingInput, CsvImportInput, HoldingRow, TickerSuggestion } from './types';

export type HoldingsWorkspaceProps = {
  breadcrumb: Crumb[];
  subtitle: string;
  holdings: HoldingRow[];
  asOf: string | null;
  suggestions: TickerSuggestion[];
  csvSample?: string;
  exportName?: string;
  onAdd?: (data: AddHoldingInput) => void | Promise<void>;
  onImport?: (data: CsvImportInput) => void | Promise<void>;
};

/** Manage-holdings page body: header actions open the add drawer / CSV dialog above the table. */
export function HoldingsWorkspace({
  breadcrumb,
  subtitle,
  holdings,
  asOf,
  suggestions,
  csvSample,
  exportName,
  onAdd,
  onImport,
}: HoldingsWorkspaceProps) {
  const [panel, setPanel] = useState<'add' | 'import' | null>(null);
  const close = useCallback(() => setPanel(null), []);
  return (
    <>
      <PageHeader
        breadcrumb={breadcrumb}
        title="Manage holdings"
        subtitle={subtitle}
        actions={
          <>
            <Button onClick={() => setPanel('import')}>
              <FileUp aria-hidden className="h-4 w-4" /> Import CSV
            </Button>
            <Button variant="primary" onClick={() => setPanel('add')}>
              <Plus aria-hidden className="h-4 w-4" /> Add holding
            </Button>
          </>
        }
      />
      <HoldingsTable holdings={holdings} asOf={asOf} exportName={exportName} />
      <AddHoldingPanel
        open={panel === 'add'}
        onClose={close}
        suggestions={suggestions}
        action={onAdd}
      />
      <CsvImportDialog
        open={panel === 'import'}
        onClose={close}
        sample={csvSample}
        action={onImport}
      />
    </>
  );
}
