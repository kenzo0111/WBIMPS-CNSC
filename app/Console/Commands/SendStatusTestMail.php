<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\StatusChangedMail;

class SendStatusTestMail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:send-status {--to= : Recipient email address}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test status-changed email to a recipient (for testing SMTP)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $to = $this->option('to') ?: $this->ask('Recipient e-mail address');

        $this->info("Sending test status email to: {$to}");

        try {
            Mail::to($to)->send(new StatusChangedMail('Purchase Request', 'REQ-TEST', 'pending', 'approved', 'Test email from artisan command'));
            $this->info('Mail send attempted. Check recipient inbox (and spam).');
            return 0;
        } catch (\Throwable $e) {
            $this->error('Mail send failed: '.$e->getMessage());
            return 1;
        }
    }
}
