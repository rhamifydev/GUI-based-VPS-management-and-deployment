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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
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
            $table->string('branch')->default('main');
            $table->string('commit')->nullable();
            $table->text('commit_message')->nullable();
            $table->string('last_deploy_time')->nullable();
            $table->string('deploy_duration')->nullable();
            $table->string('domain')->nullable();
            $table->string('path')->nullable();
            $table->string('framework')->nullable();
            $table->text('git_url')->nullable();
            $table->boolean('is_connected')->default(true);
            $table->string('auth_status')->default('authenticated'); // 'authenticated', 'auth_failed', 'unreachable', 'unknown'
            $table->integer('latency_ms')->nullable();
            $table->timestamp('last_auth_check_at')->nullable();
            $table->text('last_auth_message')->nullable();
            $table->bigInteger('last_visited_timestamp')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
