<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('requisition_issue_slips', function (Blueprint $table) {
            $table->id();
            $table->string('ris_no')->unique();
            $table->string('entity_name')->nullable();
            $table->string('fund_cluster')->nullable();
            $table->string('division')->nullable();
            $table->string('responsibility_center_code')->nullable();
            $table->string('office')->nullable();
            $table->text('purpose')->nullable();
            $table->json('items')->nullable();
            $table->string('requested_by_signature')->nullable();
            $table->string('requested_by_name')->nullable();
            $table->string('requested_by_designation')->nullable();
            $table->date('requested_by_date')->nullable();
            $table->string('approved_by_signature')->nullable();
            $table->string('approved_by_name')->nullable();
            $table->string('approved_by_designation')->nullable();
            $table->date('approved_by_date')->nullable();
            $table->string('issued_by_signature')->nullable();
            $table->string('issued_by_name')->nullable();
            $table->string('issued_by_designation')->nullable();
            $table->date('issued_by_date')->nullable();
            $table->string('received_by_signature')->nullable();
            $table->string('received_by_name')->nullable();
            $table->string('received_by_designation')->nullable();
            $table->date('received_by_date')->nullable();
            $table->string('status')->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('requisition_issue_slips');
    }
};
