<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('request_id')->unique();
            $table->string('email')->nullable();
            $table->string('requester')->nullable();
            $table->string('department')->nullable();
            $table->json('items')->nullable();
            $table->string('unit')->nullable();
            $table->date('needed_date')->nullable();
            $table->string('priority')->default('Low');
            $table->string('status')->default('Incoming');
            $table->timestamp('submitted_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('purchase_requests');
    }
};
