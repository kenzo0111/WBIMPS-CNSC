<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Activity;

class ActivitySeeder extends Seeder
{
    public function run()
    {
        Activity::create(['action' => 'PO #1234 approved', 'meta' => null]);
        Activity::create(['action' => '50 units of Ballpoint Pen received', 'meta' => null]);
        Activity::create(['action' => 'REQ-2025-006 has been submitted for approval', 'meta' => null]);
    }
}
