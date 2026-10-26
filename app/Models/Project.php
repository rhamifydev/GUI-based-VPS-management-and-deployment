<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    /**
     * The attributes that should be hidden for serialization.
     * Keeps sensitive server credentials safe from public JSON payload.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'key_content',
        'key_passphrase',
    ];

    /**
     * Appended accessor attributes.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'has_password',
        'has_key',
        'last_visited',
        'lastVisited',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'key_content' => 'encrypted',
            'key_passphrase' => 'encrypted',
            'is_connected' => 'boolean',
            'latency_ms' => 'integer',
            'last_auth_check_at' => 'datetime',
            'last_visited_timestamp' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getHasPasswordAttribute(): bool
    {
        return !empty($this->attributes['password']);
    }

    public function getHasKeyAttribute(): bool
    {
        return !empty($this->attributes['key_content']) || !empty($this->attributes['key_path']);
    }

    public function getLastVisitedAttribute(): string
    {
        if (!empty($this->last_visited_timestamp)) {
            $diff = time() - (int) ($this->last_visited_timestamp / 1000);
            if ($diff < 60) return 'Just now';
            if ($diff < 3600) return max(1, (int) floor($diff / 60)) . 'm ago';
            if ($diff < 86400) return max(1, (int) floor($diff / 3600)) . 'h ago';
            return max(1, (int) floor($diff / 86400)) . 'd ago';
        }

        if ($this->updated_at) {
            return $this->updated_at->diffForHumans();
        }

        return 'Recently';
    }
}
