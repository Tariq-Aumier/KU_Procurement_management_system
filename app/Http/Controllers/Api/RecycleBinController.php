<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contract;
use App\Models\InventoryItem;
use App\Models\Office;
use App\Models\ProcurementOrder;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecycleBinController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->input('type', 'all');
        $page = $request->input('page', 1);
        $pageSize = min(max((int) $request->input('pageSize', 25), 1), 100);

        $items = collect();

        if ($type === 'all' || $type === 'companies') {
            $companies = Company::onlyTrashed()
                ->with(['vendor', 'procurementOrders', 'contracts'])
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'company',
                        'name' => $item->legal_name,
                        'deleted_at' => $item->deleted_at,
                        'data' => $item,
                    ];
                });
            $items = $items->merge($companies);
        }

        if ($type === 'all' || $type === 'contracts') {
            $contracts = Contract::onlyTrashed()
                ->with(['company', 'award'])
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'contract',
                        'name' => $item->title,
                        'deleted_at' => $item->deleted_at,
                        'data' => $item,
                    ];
                });
            $items = $items->merge($contracts);
        }

        if ($type === 'all' || $type === 'orders') {
            $orders = ProcurementOrder::onlyTrashed()
                ->with(['office', 'company', 'createdBy'])
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'procurement_order',
                        'name' => $item->title,
                        'deleted_at' => $item->deleted_at,
                        'data' => $item,
                    ];
                });
            $items = $items->merge($orders);
        }

        if ($type === 'all' || $type === 'users') {
            $users = User::onlyTrashed()
                ->with(['office'])
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'user',
                        'name' => $item->name,
                        'deleted_at' => $item->deleted_at,
                        'data' => $item,
                    ];
                });
            $items = $items->merge($users);
        }

        if ($type === 'all' || $type === 'vendors') {
            $vendors = Vendor::onlyTrashed()
                ->with(['company'])
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'vendor',
                        'name' => $item->company->legal_name ?? 'Unknown',
                        'deleted_at' => $item->deleted_at,
                        'data' => $item,
                    ];
                });
            $items = $items->merge($vendors);
        }

        if ($type === 'all' || $type === 'offices') {
            $offices = Office::onlyTrashed()
                ->with(['officeCategory'])
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'office',
                        'name' => $item->name,
                        'deleted_at' => $item->deleted_at,
                        'data' => $item,
                    ];
                });
            $items = $items->merge($offices);
        }

        if ($type === 'all' || $type === 'inventory_items') {
            $inventoryItems = InventoryItem::onlyTrashed()
                ->with(['inventoryLocation', 'supplierCompany'])
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'type' => 'inventory_item',
                        'name' => $item->name,
                        'deleted_at' => $item->deleted_at,
                        'data' => $item,
                    ];
                });
            $items = $items->merge($inventoryItems);
        }

        // Sort by deleted_at descending
        $items = $items->sortByDesc('deleted_at')->values();

        // Paginate
        $total = $items->count();
        $pagedItems = $items->forPage($page, $pageSize)->values();

        return response()->json([
            'data' => $pagedItems,
            'meta' => [
                'page' => (int) $page,
                'pageSize' => $pageSize,
                'total' => $total,
                'totalPages' => ceil($total / $pageSize),
            ],
        ]);
    }

    public function restore(Request $request, string $type, int $id)
    {
        try {
            $model = $this->getModelByType($type);

            if (!$model) {
                return response()->json([
                    'error' => [
                        'code' => 'INVALID_TYPE',
                        'message' => 'Invalid item type'
                    ]
                ], 422);
            }

            $item = $model::withTrashed()->findOrFail($id);
            $item->restore();

            return response()->json([
                'success' => true,
                'message' => 'Item restored successfully',
                'data' => $item
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => [
                    'code' => 'RESTORE_FAILED',
                    'message' => 'Failed to restore item: ' . $e->getMessage()
                ]
            ], 500);
        }
    }

    public function forceDelete(Request $request, string $type, int $id)
    {
        try {
            $model = $this->getModelByType($type);

            if (!$model) {
                return response()->json([
                    'error' => [
                        'code' => 'INVALID_TYPE',
                        'message' => 'Invalid item type'
                    ]
                ], 422);
            }

            $item = $model::withTrashed()->findOrFail($id);
            $item->forceDelete();

            return response()->json([
                'success' => true,
                'message' => 'Item permanently deleted'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => [
                    'code' => 'DELETE_FAILED',
                    'message' => 'Failed to delete item: ' . $e->getMessage()
                ]
            ], 500);
        }
    }

    public function statistics(Request $request)
    {
        return response()->json([
            'data' => [
                'companies' => Company::onlyTrashed()->count(),
                'contracts' => Contract::onlyTrashed()->count(),
                'orders' => ProcurementOrder::onlyTrashed()->count(),
                'users' => User::onlyTrashed()->count(),
                'vendors' => Vendor::onlyTrashed()->count(),
                'offices' => Office::onlyTrashed()->count(),
                'inventory_items' => InventoryItem::onlyTrashed()->count(),
                'total' => Company::onlyTrashed()->count() +
                          Contract::onlyTrashed()->count() +
                          ProcurementOrder::onlyTrashed()->count() +
                          User::onlyTrashed()->count() +
                          Vendor::onlyTrashed()->count() +
                          Office::onlyTrashed()->count() +
                          InventoryItem::onlyTrashed()->count(),
            ]
        ]);
    }

    private function getModelByType(string $type)
    {
        return match($type) {
            'company' => Company::class,
            'contract' => Contract::class,
            'procurement_order' => ProcurementOrder::class,
            'user' => User::class,
            'vendor' => Vendor::class,
            'office' => Office::class,
            'inventory_item' => InventoryItem::class,
            default => null,
        };
    }
}
