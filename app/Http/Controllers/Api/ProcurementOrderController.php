<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\ProcurementOrder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProcurementOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = ProcurementOrder::with(['office', 'company', 'createdBy', 'items']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('order_no', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('office_id')) {
            $query->where('office_id', $request->input('office_id'));
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $orders = $query->orderByDesc('id')->paginate($size);

        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'page' => $orders->currentPage(),
                'pageSize' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function trashed(Request $request)
    {
        $query = ProcurementOrder::onlyTrashed()->with(['office', 'company']);

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $orders = $query->orderByDesc('deleted_at')->paginate($size);

        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'page' => $orders->currentPage(),
                'pageSize' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $order = ProcurementOrder::with(['office', 'company', 'createdBy', 'items', 'rfqs'])
            ->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'order_no' => 'sometimes|string|max:100|unique:procurement_orders',
            'title' => 'required|string|max:255',
            'office_id' => 'nullable|exists:offices,id',
            'company_id' => 'nullable|exists:companies,id',
            'category' => ['required', Rule::in(['retail', 'contract', 'equipment', 'supplies'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['sometimes', Rule::in(['draft', 'pending', 'approved', 'in_progress', 'completed', 'incomplete', 'cancelled'])],
            'requested_date' => 'required|date',
            'required_date' => 'required|date|after_or_equal:requested_date',
            'amount' => 'required|numeric|min:0',
            'equipment' => 'nullable|numeric|min:0',
            'items' => 'nullable|numeric|min:0',
            'currency' => ['required', Rule::in(['AFN', 'USD', 'EUR'])],
            'description' => 'nullable|string',
        ]);

        $data['created_by'] = $request->user()->id;

        $order = ProcurementOrder::create($data);

        return response()->json(['data' => $order], 201);
    }

    public function update(Request $request, int $id)
    {
        $order = ProcurementOrder::findOrFail($id);

        $data = $request->validate([
            'order_no' => 'sometimes|string|max:100|unique:procurement_orders,order_no,' . $id,
            'title' => 'sometimes|string|max:255',
            'office_id' => 'nullable|exists:offices,id',
            'company_id' => 'nullable|exists:companies,id',
            'category' => ['sometimes', Rule::in(['retail', 'contract', 'equipment', 'supplies'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['sometimes', Rule::in(['draft', 'pending', 'approved', 'in_progress', 'completed', 'incomplete', 'cancelled'])],
            'requested_date' => 'sometimes|date',
            'required_date' => 'sometimes|date|after_or_equal:requested_date',
            'amount' => 'sometimes|numeric|min:0',
            'equipment' => 'nullable|numeric|min:0',
            'items' => 'nullable|numeric|min:0',
            'currency' => ['sometimes', Rule::in(['AFN', 'USD', 'EUR'])],
            'description' => 'nullable|string',
        ]);

        $order->update($data);

        return response()->json(['data' => $order->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $order = ProcurementOrder::findOrFail($id);
        $order->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $id)
    {
        $order = ProcurementOrder::withTrashed()->findOrFail($id);
        $order->restore();

        return response()->json(['data' => $order]);
    }

    public function forceDelete(Request $request, int $id)
    {
        $order = ProcurementOrder::withTrashed()->findOrFail($id);
        $order->forceDelete();

        return response()->noContent();
    }

    public function submit(Request $request, int $id)
    {
        $order = ProcurementOrder::findOrFail($id);
        $order->submit();

        return response()->json(['data' => $order->fresh()]);
    }

    public function approve(Request $request, int $id)
    {
        $order = ProcurementOrder::findOrFail($id);
        $order->approve();

        return response()->json(['data' => $order->fresh()]);
    }

    public function complete(Request $request, int $id)
    {
        $order = ProcurementOrder::findOrFail($id);
        $order->complete();

        return response()->json(['data' => $order->fresh()]);
    }

    public function cancel(Request $request, int $id)
    {
        $order = ProcurementOrder::findOrFail($id);
        $order->cancel();

        return response()->json(['data' => $order->fresh()]);
    }

    public function items(Request $request, int $orderId)
    {
        $order = ProcurementOrder::findOrFail($orderId);
        $items = $order->items()->orderBy('line_no')->get();

        return response()->json(['data' => $items]);
    }

    public function addItem(Request $request, int $orderId)
    {
        $order = ProcurementOrder::findOrFail($orderId);

        $data = $request->validate([
            'line_no' => 'required|integer|min:1',
            'description' => 'required|string',
            'unit' => 'required|string|max:50',
            'quantity' => 'required|numeric|min:0',
            'estimated_unit_price' => 'nullable|numeric|min:0',
        ]);

        $item = $order->items()->create($data);

        return response()->json(['data' => $item], 201);
    }

    public function updateItem(Request $request, int $orderId, int $itemId)
    {
        $order = ProcurementOrder::findOrFail($orderId);
        $item = $order->items()->findOrFail($itemId);

        $data = $request->validate([
            'line_no' => 'sometimes|integer|min:1',
            'description' => 'sometimes|string',
            'unit' => 'sometimes|string|max:50',
            'quantity' => 'sometimes|numeric|min:0',
            'estimated_unit_price' => 'nullable|numeric|min:0',
        ]);

        $item->update($data);

        return response()->json(['data' => $item->fresh()]);
    }

    public function deleteItem(Request $request, int $orderId, int $itemId)
    {
        $order = ProcurementOrder::findOrFail($orderId);
        $item = $order->items()->findOrFail($itemId);
        $item->delete();

        return response()->noContent();
    }
}
