<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryLocation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryLocationController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryLocation::with(['office', 'inventoryItems']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('office_id')) {
            $query->where('office_id', $request->input('office_id'));
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $locations = $query->orderByDesc('id')->paginate($size);

        return response()->json([
            'data' => $locations->items(),
            'meta' => [
                'page' => $locations->currentPage(),
                'pageSize' => $locations->perPage(),
                'total' => $locations->total(),
            ],
        ]);
    }

    public function trashed(Request $request)
    {
        $query = InventoryLocation::onlyTrashed()->with(['office']);

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $locations = $query->orderByDesc('deleted_at')->paginate($size);

        return response()->json([
            'data' => $locations->items(),
            'meta' => [
                'page' => $locations->currentPage(),
                'pageSize' => $locations->perPage(),
                'total' => $locations->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $location = InventoryLocation::with(['office', 'inventoryItems'])
            ->findOrFail($id);

        return response()->json(['data' => $location]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'office_id' => 'nullable|exists:offices,id',
            'code' => 'required|string|max:100|unique:inventory_locations',
            'name' => 'required|string|max:255',
            'active' => 'sometimes|boolean',
        ]);

        $location = InventoryLocation::create($data);

        return response()->json(['data' => $location], 201);
    }

    public function update(Request $request, int $id)
    {
        $location = InventoryLocation::findOrFail($id);

        $data = $request->validate([
            'office_id' => 'nullable|exists:offices,id',
            'code' => 'sometimes|string|max:100|unique:inventory_locations,code,' . $id,
            'name' => 'sometimes|string|max:255',
            'active' => 'sometimes|boolean',
        ]);

        $location->update($data);

        return response()->json(['data' => $location->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $location = InventoryLocation::findOrFail($id);

        if ($location->inventoryItems()->count() > 0) {
            return response()->json([
                'error' => [
                    'code' => 'HAS_ITEMS',
                    'message' => 'Cannot delete location with inventory items. Please reassign or delete items first.'
                ]
            ], 422);
        }

        $location->delete();

        return response()->noContent();
    }

    public function activate(Request $request, int $id)
    {
        $location = InventoryLocation::findOrFail($id);
        $location->activate();

        return response()->json(['data' => $location->fresh()]);
    }

    public function deactivate(Request $request, int $id)
    {
        $location = InventoryLocation::findOrFail($id);
        $location->deactivate();

        return response()->json(['data' => $location->fresh()]);
    }

    public function byOffice(Request $request, int $officeId)
    {
        $locations = InventoryLocation::where('office_id', $officeId)
            ->where('active', true)
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $locations]);
    }

    public function restore(Request $request, int $id)
    {
        $location = InventoryLocation::withTrashed()->findOrFail($id);
        $location->restore();

        return response()->json(['data' => $location]);
    }

    public function forceDelete(Request $request, int $id)
    {
        $location = InventoryLocation::withTrashed()->findOrFail($id);

        if ($location->inventoryItems()->withTrashed()->count() > 0) {
            return response()->json([
                'error' => [
                    'code' => 'HAS_ITEMS',
                    'message' => 'Cannot permanently delete location with inventory items. Please delete items first.'
                ]
            ], 422);
        }

        $location->forceDelete();

        return response()->noContent();
    }
}
