<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class Audits
{
    public static function write(Request $request, string $action, string $entity, ?int $id, array $after = [], ?array $before = null): void
    {
        DB::table('audit_logs')->insert([
            'actor_user_id' => $request->user()?->id, 'action' => $action, 'entity_type' => $entity,
            'entity_id' => $id, 'details' => $after['title'] ?? $after['name'] ?? null,
            'before_json' => $before ? json_encode($before) : null, 'after_json' => $after ? json_encode($after) : null,
            'ip_address' => $request->ip(), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
