<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseRequestPdfGenerationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_generates_a_purchase_request_pdf_from_payload()
    {
        $payload = [
            'entity_name' => 'Camarines Norte State College',
            'pr_no' => 'PR-2025-001',
            'date' => now()->toDateString(),
            'purpose' => 'Test generation of PDF',
            'requested_by' => 'Jane Doe',
            'designation' => 'Instructor',
            'approved_by' => 'John Approver',
            'approved_position' => 'Dept Head',
            'items' => [
                ['item_description' => 'Test item A', 'quantity' => 2, 'unit_cost' => 150.5, 'total_cost' => 301.0],
                ['item_description' => 'Test item B', 'quantity' => 1, 'unit_cost' => 45.0, 'total_cost' => 45.0]
            ],
        ];

        $response = $this->post('/purchase-request/generate', $payload);

        // Controller uses DomPDF to return a download (PDF stream)
        $response->assertStatus(200);
        $this->assertStringContainsString('pdf', $response->headers->get('content-type'));
    }

    /** @test */
    public function it_generates_pdf_when_items_are_received_as_multiline_string()
    {
        $payload = [
            'entity_name' => 'CNSC',
            'pr_no' => 'PR-STR-01',
            'date' => now()->toDateString(),
            'purpose' => 'multiline test',
            'requested_by' => 'Jane Doe',
            'designation' => 'Instructor',
            'items' => "Item A\nItem B\nItem C"
        ];

        $response = $this->post('/purchase-request/generate', $payload);

        $response->assertStatus(200);
        $this->assertStringContainsString('pdf', $response->headers->get('content-type'));

        // Content is binary PDF — asserting delivery is successful (status + content-type).
    }
}
