<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::with(['company']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('account_no', 'like', "%{$search}%")
                  ->orWhere('tax_id', 'like', "%{$search}%")
                  ->orWhereHas('company', function ($cq) use ($search) {
                      $cq->where('legal_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->input('verification_status'));
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $vendors = $query->orderByDesc('id')->paginate($size);

        return response()->json([
            'data' => $vendors->items(),
            'meta' => [
                'page' => $vendors->currentPage(),
                'pageSize' => $vendors->perPage(),
                'total' => $vendors->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $vendor = Vendor::with(['company', 'bids'])
            ->findOrFail($id);

        return response()->json(['data' => $vendor]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|exists:companies,id|unique:vendors',
            'account_no' => 'required|string|max:100|unique:vendors',
            'tax_id' => 'nullable|string|max:100|unique:vendors',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string',
            'contact_info' => 'nullable|string|max:255',
            'verification_status' => ['sometimes', Rule::in(['pending', 'verified', 'rejected'])],
        ]);

        $data['verification_status'] = $data['verification_status'] ?? 'pending';

        $vendor = Vendor::create($data);

        return response()->json(['data' => $vendor], 201);
    }

    public function update(Request $request, int $id)
    {
        $vendor = Vendor::findOrFail($id);

        $data = $request->validate([
            'company_id' => 'sometimes|exists:companies,id|unique:vendors,company_id,' . $id,
            'account_no' => 'sometimes|string|max:100|unique:vendors,account_no,' . $id,
            'tax_id' => 'nullable|string|max:100|unique:vendors,tax_id,' . $id,
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string',
            'contact_info' => 'nullable|string|max:255',
            'verification_status' => ['sometimes', Rule::in(['pending', 'verified', 'rejected'])],
        ]);

        $vendor->update($data);

        return response()->json(['data' => $vendor->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $vendor = Vendor::findOrFail($id);

        if ($vendor->bids()->count() > 0) {
            return response()->json([
                'error' => [
                    'code' => 'HAS_BIDS',
                    'message' => 'Cannot delete vendor with bids. Please delete bids first.'
                ]
            ], 422);
        }

        $vendor->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $id)
    {
        $vendor = Vendor::withTrashed()->findOrFail($id);
        $vendor->restore();

        return response()->json(['data' => $vendor]);
    }

    public function verify(Request $request, int $id)
    {
        $vendor = Vendor::findOrFail($id);
        $vendor->verify();

        return response()->json(['data' => $vendor->fresh()]);
    }

    public function reject(Request $request, int $id)
    {
        $vendor = Vendor::findOrFail($id);
        $vendor->reject();

        return response()->json(['data' => $vendor->fresh()]);
    }

    public function statistics(Request $request)
    {
        $total = Vendor::count();
        $verified = Vendor::where('verification_status', 'verified')->count();
        $pending = Vendor::where('verification_status', 'pending')->count();
        $rejected = Vendor::where('verification_status', 'rejected')->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'verified' => $verified,
                'pending' => $pending,
                'rejected' => $rejected,
            ]
        ]);
    }
}
