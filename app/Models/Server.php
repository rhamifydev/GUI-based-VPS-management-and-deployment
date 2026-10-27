<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Server extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    /**
     * Attributes hidden from JSON serialization.
     */
    protected $hidden = [
        'password',
        'key_content',
        'key_passphrase',
    ];

    /**
     * Appended dynamic accessors.
     */
    protected $appends = [
        'has_password',
        'has_key',
        'projects_count',
    ];

    /**
     * Attribute casts.
     */
    protected $casts = [
        'password' => 'encrypted',
        'key_content' => 'encrypted',
        'key_passphrase' => 'encrypted',
        'is_active' => 'boolean',
        'latency_ms' => 'integer',
        'last_checked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function getHasPasswordAttribute(): bool
    {
        return !empty($this->attributes['password']);
    }

    public function getHasKeyAttribute(): bool
    {
        return !empty($this->attributes['key_content']) || !empty($this->attributes['key_path']);
    }

    public function getProjectsCountAttribute(): int
    {
        return Project::where(function ($q) {
                if (!empty($this->user_id)) {
                    $q->where('user_id', $this->user_id);
                }
            })
            ->where(function ($q) {
                $q->where('server_id', $this->id)
                  ->orWhere('ip', $this->ip);
            })->count();
    }

    /**
     * Power off the server: marks server offline and cascades offline status to all projects under it.
     */
    public function powerOff(string $reason = 'Server was deliberately turned off'): void
    {
        $this->update([
            'is_active' => false,
            'status' => 'offline',
            'last_error' => $reason,
        ]);

        Project::where('user_id', $this->user_id)
            ->where(function ($q) {
                $q->where('server_id', $this->id)
                  ->orWhere('ip', $this->ip);
            })
            ->update([
                'is_connected' => false,
                'auth_status' => 'offline',
                'last_auth_message' => $reason,
                'latency_ms' => null,
            ]);
    }

    /**
     * Power on the server: marks server active/online and sets projects under it ready for verification.
     */
    public function powerOn(): void
    {
        $this->update([
            'is_active' => true,
            'status' => 'online',
            'last_error' => null,
            'last_checked_at' => now(),
        ]);

        Project::where('user_id', $this->user_id)
            ->where(function ($q) {
                $q->where('server_id', $this->id)
                  ->orWhere('ip', $this->ip);
            })
            ->update([
                'is_connected' => true,
                'auth_status' => 'authenticated',
                'last_auth_message' => 'Server is powered on and ready',
            ]);
    }
}
