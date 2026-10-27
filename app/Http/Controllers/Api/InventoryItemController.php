<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InventoryItemController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::with(['inventoryLocation', 'supplierCompany']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('item_type')) {
            $query->where('item_type', $request->input('item_type'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('inventory_location_id')) {
            $query->where('inventory_location_id', $request->input('inventory_location_id'));
        }

        if ($request->filled('condition')) {
            $query->where('condition', $request->input('condition'));
        }

        if ($request->filled('low_stock')) {
            $query->whereColumn('quantity_on_hand', '<=', 'reorder_point');
        }

        if ($request->filled('expiring_soon')) {
            $query->whereNotNull('expiry_date')
                  ->whereDate('expiry_date', '<=', now()->addDays(30));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $items = $query->orderByDesc('id')->paginate($size);

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'page' => $items->currentPage(),
                'pageSize' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $item = InventoryItem::with(['inventoryLocation', 'supplierCompany', 'movements.performedBy'])
            ->findOrFail($id);

        return response()->json(['data' => $item]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:100|unique:inventory_items',
            'name' => 'required|string|max:255',
            'item_type' => ['required', Rule::in(['sample', 'equipment', 'supply', 'asset'])],
            'category' => 'required|string|max:255',
            'description' => 'nullable|string',
            'unit' => 'required|string|max:50',
            'min_stock' => 'nullable|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'inventory_location_id' => 'required|exists:inventory_locations,id',
            'supplier_company_id' => 'nullable|exists:companies,id',
            'batch_number' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100|unique:inventory_items',
            'received_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:received_date',
            'condition' => ['required', Rule::in(['new', 'used', 'damaged', 'returned', 'disposed'])],
            'notes' => 'nullable|string',
            'unit_cost' => 'nullable|numeric|min:0',
            'currency' => ['required', Rule::in(['AFN', 'USD', 'EUR'])],
        ]);

        $data['quantity_on_hand'] = 0;

        $item = InventoryItem::create($data);

        return response()->json(['data' => $item], 201);
    }

    public function update(Request $request, int $id)
    {
        $item = InventoryItem::findOrFail($id);

        $data = $request->validate([
            'code' => 'sometimes|string|max:100|unique:inventory_items,code,' . $id,
            'name' => 'sometimes|string|max:255',
            'item_type' => ['sometimes', Rule::in(['sample', 'equipment', 'supply', 'asset'])],
            'category' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'unit' => 'sometimes|string|max:50',
            'min_stock' => 'nullable|numeric|min:0',
            'max_stock' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'inventory_location_id' => 'sometimes|exists:inventory_locations,id',
            'supplier_company_id' => 'nullable|exists:companies,id',
            'batch_number' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100|unique:inventory_items,serial_number,' . $id,
            'received_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:received_date',
            'condition' => ['sometimes', Rule::in(['new', 'used', 'damaged', 'returned', 'disposed'])],
            'notes' => 'nullable|string',
            'unit_cost' => 'nullable|numeric|min:0',
            'currency' => ['sometimes', Rule::in(['AFN', 'USD', 'EUR'])],
        ]);

        $item->update($data);

        return response()->json(['data' => $item->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $item = InventoryItem::findOrFail($id);
        $item->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $id)
    {
        $item = InventoryItem::withTrashed()->findOrFail($id);
        $item->restore();

        return response()->json(['data' => $item]);
    }

    public function adjustQuantity(Request $request, int $id)
    {
        $item = InventoryItem::findOrFail($id);

        $data = $request->validate([
            'quantity' => 'required|numeric',
            'type' => ['required', Rule::in(['stock_in', 'stock_out', 'adjustment', 'transfer'])],
            'reference_no' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        try {
            $newQuantity = $item->adjustQuantity(
                $data['quantity'],
                $data['type'],
                $data['reference_no'] ?? null,
                $data['notes'] ?? null,
                $request->user()->id
            );

            return response()->json(['data' => [
                'item_id' => $item->id,
                'previous_quantity' => $item->quantity_on_hand - $data['quantity'],
                'new_quantity' => $newQuantity,
                'movement_type' => $data['type'],
            ]]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_QUANTITY',
                    'message' => $e->getMessage()
                ]
            ], 422);
        }
    }

    public function movements(Request $request, int $itemId)
    {
        $item = InventoryItem::findOrFail($itemId);
        $movements = $item->movements()
            ->with('performedBy')
            ->orderByDesc('movement_at')
            ->paginate(50);

        return response()->json(['data' => $movements->items()]);
    }

    public function statistics(Request $request)
    {
        $total = InventoryItem::count();
        $samples = InventoryItem::where('item_type', 'sample')->count();
        $lowStock = InventoryItem::whereColumn('quantity_on_hand', '<=', 'reorder_point')->count();
        $outOfStock = InventoryItem::where('quantity_on_hand', 0)->count();

        return response()->json([
            'data' => [
                'total' => $total,
                'samples' => $samples,
                'low_stock' => $lowStock,
                'out_of_stock' => $outOfStock,
            ]
        ]);
    }
}
