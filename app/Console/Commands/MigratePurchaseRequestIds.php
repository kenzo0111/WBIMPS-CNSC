<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\PurchaseRequestIdGenerator;

class MigratePurchaseRequestIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pr:migrate-ids {--dry-run : Do not persist changes, only show what would be changed} {--batch-size=200 : Number of rows to update per DB query}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing purchase request IDs to the new YYYY-MM-XXXX format (monthly 4-digit sequence)';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $batchSize = (int) $this->option('batch-size');

        $this->info('Scanning purchase requests table...');

        // Fetch all records ordered by submitted_at, then created_at, then id to ensure stable ordering
        $rows = DB::table('purchase_requests')
            ->orderBy('submitted_at')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $this->info('Found ' . $rows->count() . ' records');

        // Maps
        $oldBaseToNewBase = [];
        $periodCounters = [];
        $updates = [];

        $idGenerator = new PurchaseRequestIdGenerator();

        foreach ($rows as $row) {
            $old = $row->request_id ?? '';
            if ($old === '') {
                // Skip rows without request id
                continue;
            }

            // Determine if this request id has a per-item suffix like -01
            $suffix = '';
            $baseOld = $old;
            if (preg_match('/-(\d{2})$/', $old, $m)) {
                $suffix = '-' . $m[1];
                $baseOld = substr($old, 0, -strlen($suffix));
            }

            // If the base is already in new format (YYYY-MM-XXXX) leave as-is, but reserve its sequence
            if (preg_match('/^(\d{4}-\d{2})-(\d{4})$/', $baseOld, $m2)) {
                $period = $m2[1];
                $seq = (int) $m2[2];
                $periodCounters[$period] = max($periodCounters[$period] ?? 0, $seq);
                $oldBaseToNewBase[$baseOld] = $baseOld; // identity mapping
                $newBase = $baseOld;
            } else {
                // Determine period: prefer submitted_at, then created_at, else current month
                if (!empty($row->submitted_at)) {
                    $period = date('Y-m', strtotime($row->submitted_at));
                } elseif (!empty($row->created_at)) {
                    $period = date('Y-m', strtotime($row->created_at));
                } else {
                    $period = date('Y-m');
                }

                // If we already mapped this old base, reuse assigned new base
                if (isset($oldBaseToNewBase[$baseOld])) {
                    $newBase = $oldBaseToNewBase[$baseOld];
                } else {
                    // Initialize counter for this period using generator's next available base
                    if (!isset($periodCounters[$period])) {
                        $base = $idGenerator->nextBaseForPeriod($period);
                        if (preg_match('/\d{4}-\d{2}-(\d+)$/', $base, $m3)) {
                            $periodCounters[$period] = (int) $m3[1];
                            $newBase = $base;
                        } else {
                            $periodCounters[$period] = 0;
                            $periodCounters[$period]++;
                            $newBase = sprintf('%s-%04d', $period, $periodCounters[$period]);
                        }
                    } else {
                        $periodCounters[$period]++;
                        $newBase = sprintf('%s-%04d', $period, $periodCounters[$period]);
                    }

                    $oldBaseToNewBase[$baseOld] = $newBase;
                }
            }

            $newRequestId = $newBase . $suffix;
            if ($newRequestId !== $old) {
                $updates[] = ['id' => $row->id, 'old' => $old, 'new' => $newRequestId];
            }
        }

        if (empty($updates)) {
            $this->info('No request IDs needed migration.');
            return 0;
        }

        $this->info('Planned updates: ' . count($updates));
        foreach (array_slice($updates, 0, 50) as $u) {
            $this->line("{$u['old']} -> {$u['new']}");
        }
        if (count($updates) > 50) {
            $this->line('... and ' . (count($updates) - 50) . ' more');
        }

        if ($dryRun) {
            $this->info('Dry-run enabled; no changes were written.');
            return 0;
        }

        $this->info('Applying updates...');
        $bar = $this->output->createProgressBar(count($updates));
        $bar->start();

        DB::beginTransaction();
        try {
            $chunks = array_chunk($updates, $batchSize);
            foreach ($chunks as $chunk) {
                foreach ($chunk as $u) {
                    // ensure we don't accidentally create a duplicate (double-check current value)
                    $current = DB::table('purchase_requests')->where('id', $u['id'])->value('request_id');
                    if ($current !== $u['old']) {
                        // somebody changed it in the meantime, skip
                        $bar->advance();
                        continue;
                    }

                    DB::table('purchase_requests')->where('id', $u['id'])->update(['request_id' => $u['new']]);
                    $bar->advance();
                }
            }

            DB::commit();
            $bar->finish();
            $this->newLine(2);
            $this->info('Migration applied successfully.');
            $this->info('Please verify email templates, notifications and any external integrations that depend on the request_id format.');
            return 0;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Migration failed: ' . $e->getMessage());
            return 1;
        }
    }
}
