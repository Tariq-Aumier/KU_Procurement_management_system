<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        $assignedRoles = $user ? DB::table('user_roles')->join('roles','roles.id','=','user_roles.role_id')->where('user_roles.user_id',$user->id)->pluck('roles.code')->all() : [];
        if (!$user || (!in_array($user->role, $roles, true) && !array_intersect($roles, $assignedRoles))) {
            return response()->json(['error' => ['code' => 'FORBIDDEN', 'message' => 'You do not have permission for this action.']], 403);
        }
        return $next($request);
    }
}
