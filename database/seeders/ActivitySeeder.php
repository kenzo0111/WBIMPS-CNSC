<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ActivitySeeder extends Seeder
{
    public function run()
    {
        activity()->withProperties(['info' => null])->log('PO #1234 approved');
        activity()->withProperties(['info' => null])->log('50 units of Ballpoint Pen received');
        activity()->withProperties(['info' => null])->log('REQ-2025-006 has been submitted for approval');
    }
}
