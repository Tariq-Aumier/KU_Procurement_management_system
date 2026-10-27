<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Office;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OfficeController extends Controller
{
    public function index(Request $request)
    {
        $query = Office::with(['officeCategory', 'users', 'procurementOrders']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_ps', 'like', "%{$search}%")
                  ->orWhere('name_fa', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('office_category_id')) {
            $query->where('office_category_id', $request->input('office_category_id'));
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $offices = $query->orderByDesc('id')->paginate($size);

        return response()->json([
            'data' => $offices->items(),
            'meta' => [
                'page' => $offices->currentPage(),
                'pageSize' => $offices->perPage(),
                'total' => $offices->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $office = Office::with(['officeCategory', 'users', 'procurementOrders', 'inventoryLocations'])
            ->findOrFail($id);

        return response()->json(['data' => $office]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'office_category_id' => 'required|exists:office_categories,id',
            'code' => 'required|string|max:50|unique:offices',
            'name' => 'required|string|max:255',
            'name_ps' => 'nullable|string|max:255',
            'name_fa' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'active' => 'sometimes|boolean',
        ]);

        $office = Office::create($data);

        return response()->json(['data' => $office], 201);
    }

    public function update(Request $request, int $id)
    {
        $office = Office::findOrFail($id);

        $data = $request->validate([
            'office_category_id' => 'sometimes|exists:office_categories,id',
            'code' => 'sometimes|string|max:50|unique:offices,code,' . $id,
            'name' => 'sometimes|string|max:255',
            'name_ps' => 'nullable|string|max:255',
            'name_fa' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'active' => 'sometimes|boolean',
        ]);

        $office->update($data);

        return response()->json(['data' => $office->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $office = Office::findOrFail($id);

        if ($office->users()->count() > 0) {
            return response()->json([
                'error' => [
                    'code' => 'HAS_USERS',
                    'message' => 'Cannot delete office with users. Please reassign or delete users first.'
                ]
            ], 422);
        }

        if ($office->procurementOrders()->count() > 0) {
            return response()->json([
                'error' => [
                    'code' => 'HAS_ORDERS',
                    'message' => 'Cannot delete office with procurement orders. Please delete orders first.'
                ]
            ], 422);
        }

        $office->delete();

        return response()->noContent();
    }

    public function activate(Request $request, int $id)
    {
        $office = Office::findOrFail($id);
        $office->activate();

        return response()->json(['data' => $office->fresh()]);
    }

    public function deactivate(Request $request, int $id)
    {
        $office = Office::findOrFail($id);
        $office->deactivate();

        return response()->json(['data' => $office->fresh()]);
    }

    public function byCategory(Request $request, int $categoryId)
    {
        $offices = Office::where('office_category_id', $categoryId)
            ->where('active', true)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $offices]);
    }
}
