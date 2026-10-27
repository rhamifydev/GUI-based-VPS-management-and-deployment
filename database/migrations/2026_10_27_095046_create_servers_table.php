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
        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('ip');
            $table->integer('port')->default(22);
            $table->string('user')->default('root');
            $table->string('auth_method')->default('auto');
            $table->text('password')->nullable();
            $table->text('key_path')->nullable();
            $table->longText('key_content')->nullable();
            $table->text('key_passphrase')->nullable();
            $table->string('os')->nullable();
            $table->string('type')->default('linux');
            $table->string('status')->default('online'); // 'online', 'offline', 'auth_failed', 'unreachable'
            $table->boolean('is_active')->default(true); // true = active/on, false = deliberately powered off
            $table->integer('latency_ms')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servers');
    }
};
