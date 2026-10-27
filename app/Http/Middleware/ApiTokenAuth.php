<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $raw = $request->bearerToken();
        if (!$raw) return response()->json(['error' => ['code' => 'UNAUTHENTICATED', 'message' => 'Bearer token is required.']], 401);
        $token = ApiToken::with('user')->where('token_hash', hash('sha256', $raw))->first();
        if (!$token || !$token->user || !$token->user->active || ($token->expires_at && $token->expires_at->isPast())) {
            return response()->json(['error' => ['code' => 'UNAUTHENTICATED', 'message' => 'Invalid or expired token.']], 401);
        }
        if (!$token->last_used_at || $token->last_used_at->lt(now()->subMinutes(5))) $token->forceFill(['last_used_at' => now()])->save();
        $request->setUserResolver(fn () => $token->user);
        return $next($request);
    }
}
