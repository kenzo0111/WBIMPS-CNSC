<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SiteContent;

class SiteContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SiteContent::updateOrCreate(
            ['key' => 'about-us'],
            [
                'value' => [
                    'heroTitle' => 'SPMO System',
                    'heroSubtitle' => 'Revolutionizing Supply & Property Management for Camarines Norte State College',
                    'mission' => 'To provide a comprehensive, user-friendly platform that streamlines supply management, property processes, and ensures transparency in resource allocation across all departments of CNSC.',
                    'vision' => 'To be the leading digital solution for educational institutions, setting the standard for efficient resource management, data-driven decision making, and operational excellence.',
                    'institution' => 'Camarines Norte State College - Supply and Property Management Office',
                    'email' => 'cnsc.spmo@.edu.ph',
                    'phone' => '(054) 440-1134',
                    'gallery' => [],
                    'committeeMembers' => [],
                ]
            ]
        );
    }
}
