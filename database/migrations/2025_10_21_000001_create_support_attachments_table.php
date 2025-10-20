<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('support_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('support_ticket_id')->constrained('support_tickets')->onDelete('cascade');
            $table->string('filename');
            $table->string('original_name');
            $table->string('mime')->nullable();
            $table->bigInteger('size')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('support_attachments');
    }
};
