<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['office']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->filled('office_id')) {
            $query->where('office_id', $request->input('office_id'));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $users = $query->orderByDesc('id')->paginate($size);

        // Hide passwords from response
        $users->getCollection()->transform(function ($user) {
            unset($user->password);
            return $user;
        });

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'page' => $users->currentPage(),
                'pageSize' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $user = User::with(['office'])->findOrFail($id);
        unset($user->password);

        return response()->json(['data' => $user]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string|min:3|max:100|unique:users',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users',
            'password' => ['required', 'string', 'min:8', 'regex:/[A-Z]/', 'regex:/[a-z]/', 'regex:/[0-9]/'],
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_PROCUREMENT_USER])],
            'active' => 'sometimes|boolean',
            'office_id' => 'nullable|exists:offices,id',
        ]);

        $data['password'] = Hash::make($data['password']);
        $data['active'] = $data['active'] ?? true;

        $user = User::create($data);
        unset($user->password);

        // Log audit
        $this->logAudit('user_created', $user->id, [
            'username' => $user->username,
            'role' => $user->role,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $user], 201);
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'username' => 'sometimes|string|min:3|max:100|unique:users,username,' . $id,
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $id,
            'password' => ['sometimes', 'string', 'min:8', 'regex:/[A-Z]/', 'regex:/[a-z]/', 'regex:/[0-9]/'],
            'role' => ['sometimes', Rule::in([User::ROLE_ADMIN, User::ROLE_PROCUREMENT_USER])],
            'active' => 'sometimes|boolean',
            'office_id' => 'nullable|exists:offices,id',
        ]);

        $oldData = $user->only(['role', 'active', 'office_id']);

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);
        unset($user->password);

        // Log audit if role or active status changed
        if (isset($data['role']) && $data['role'] !== $oldData['role']) {
            $this->logAudit('user_role_changed', $user->id, [
                'old_role' => $oldData['role'],
                'new_role' => $data['role'],
                'changed_by' => $request->user()->id,
            ]);
        }

        if (isset($data['active']) && $data['active'] !== $oldData['active']) {
            $this->logAudit('user_status_changed', $user->id, [
                'old_status' => $oldData['active'] ? 'active' : 'inactive',
                'new_status' => $data['active'] ? 'active' : 'inactive',
                'changed_by' => $request->user()->id,
            ]);
        }

        return response()->json(['data' => $user->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'error' => [
                    'code' => 'CANNOT_DELETE_SELF',
                    'message' => 'You cannot delete your own account.'
                ]
            ], 422);
        }

        $user->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();
        unset($user->password);

        return response()->json(['data' => $user]);
    }

    public function activate(Request $request, int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['active' => true]);
        unset($user->password);

        return response()->json(['data' => $user->fresh()]);
    }

    public function deactivate(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'error' => [
                    'code' => 'CANNOT_DEACTIVATE_SELF',
                    'message' => 'You cannot deactivate your own account.'
                ]
            ], 422);
        }

        // Prevent deactivating the last active admin
        if ($user->isAdmin() && $user->isActive()) {
            $activeAdminCount = User::where('role', User::ROLE_ADMIN)
                                  ->where('active', true)
                                  ->where('id', '!=', $user->id)
                                  ->count();

            if ($activeAdminCount === 0) {
                return response()->json([
                    'error' => [
                        'code' => 'CANNOT_DEACTIVATE_LAST_ADMIN',
                        'message' => 'Cannot deactivate the last active System Administrator.'
                    ]
                ], 422);
            }
        }

        $user->update(['active' => false]);
        unset($user->password);

        $this->logAudit('user_deactivated', $user->id, [
            'username' => $user->username,
            'deactivated_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $user->fresh()]);
    }

    public function changePassword(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', 'min:8', 'regex:/[A-Z]/', 'regex:/[a-z]/', 'regex:/[0-9]/'],
            'password_confirmation' => 'required|string|same:password',
        ]);

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_CURRENT_PASSWORD',
                    'message' => 'Current password is incorrect.'
                ]
            ], 422);
        }

        $user->update(['password' => Hash::make($data['password'])]);
        unset($user->password);

        return response()->json(['data' => $user->fresh()]);
    }

    public function statistics(Request $request)
    {
        $total = User::count();
        $active = User::where('active', true)->count();
        $inactive = User::where('active', false)->count();

        $roles = [
            'admin' => User::where('role', User::ROLE_ADMIN)->count(),
            'procurement_user' => User::where('role', User::ROLE_PROCUREMENT_USER)->count(),
        ];

        return response()->json([
            'data' => [
                'total' => $total,
                'active' => $active,
                'inactive' => $inactive,
                'roles' => $roles,
            ]
        ]);
    }

    public function resetPassword(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'regex:/[A-Z]/', 'regex:/[a-z]/', 'regex:/[0-9]/'],
            'force_change' => 'sometimes|boolean',
        ]);

        $user->update([
            'password' => Hash::make($data['password']),
            'password_changed_at' => null, // Force password change on next login if force_change is true
        ]);

        // Revoke all user sessions by deleting their API tokens
        DB::table('api_tokens')->where('user_id', $user->id)->delete();

        unset($user->password);

        $this->logAudit('user_password_reset', $user->id, [
            'username' => $user->username,
            'reset_by' => $request->user()->id,
            'force_change' => $data['force_change'] ?? false,
        ]);

        return response()->json(['data' => $user->fresh()]);
    }

    private function logAudit(string $action, int $targetUserId, array $metadata = [])
    {
        try {
            DB::table('audit_logs')->insert([
                'user_id' => auth()->id(),
                'action' => $action,
                'target_type' => 'user',
                'target_id' => $targetUserId,
                'metadata' => json_encode($metadata),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            \Log::error('Failed to log audit: ' . $e->getMessage());
        }
    }
}
