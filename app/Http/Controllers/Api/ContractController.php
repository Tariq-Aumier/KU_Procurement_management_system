<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\ContractProgressUpdate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ContractController extends Controller
{
    public function index(Request $request)
    {
        $query = Contract::with(['company', 'award', 'progressUpdates']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('contract_no', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->input('company_id'));
        }

        if ($request->filled('tier')) {
            $query->where('tier', $request->input('tier'));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $contracts = $query->orderByDesc('id')->paginate($size);

        return response()->json([
            'data' => $contracts->items(),
            'meta' => [
                'page' => $contracts->currentPage(),
                'pageSize' => $contracts->perPage(),
                'total' => $contracts->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $contract = Contract::with(['company', 'award', 'progressUpdates.submittedBy'])
            ->findOrFail($id);

        return response()->json(['data' => $contract]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'contract_no' => 'required|string|max:100|unique:contracts',
            'award_id' => 'nullable|exists:awards,id',
            'company_id' => 'required|exists:companies,id',
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|gt:0',
            'currency' => ['required', Rule::in(['AFN', 'USD', 'EUR'])],
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => ['sometimes', Rule::in(['draft', 'active', 'completed', 'cancelled', 'expired'])],
            'progress_percent' => 'sometimes|numeric|between:0,100',
            'description' => 'nullable|string',
        ]);

        $contract = Contract::create($data);

        return response()->json(['data' => $contract], 201);
    }

    public function update(Request $request, int $id)
    {
        $contract = Contract::findOrFail($id);

        $data = $request->validate([
            'contract_no' => 'sometimes|string|max:100|unique:contracts,contract_no,' . $id,
            'award_id' => 'nullable|exists:awards,id',
            'company_id' => 'sometimes|exists:companies,id',
            'title' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|gt:0',
            'currency' => ['sometimes', Rule::in(['AFN', 'USD', 'EUR'])],
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
            'status' => ['sometimes', Rule::in(['draft', 'active', 'completed', 'cancelled', 'expired'])],
            'progress_percent' => 'sometimes|numeric|between:0,100',
            'description' => 'nullable|string',
        ]);

        $contract->update($data);

        return response()->json(['data' => $contract->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $contract = Contract::findOrFail($id);
        $contract->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $id)
    {
        $contract = Contract::withTrashed()->findOrFail($id);
        $contract->restore();

        return response()->json(['data' => $contract]);
    }

    public function updateProgress(Request $request, int $id)
    {
        $data = $request->validate([
            'progress_percent' => 'required|numeric|between:0,100',
            'notes' => 'nullable|string',
        ]);

        $contract = Contract::findOrFail($id);
        $contract->updateProgress($data['progress_percent'], $data['notes'] ?? null);

        return response()->json(['data' => $contract->fresh()]);
    }

    public function progressUpdates(Request $request, int $contractId)
    {
        $contract = Contract::findOrFail($contractId);
        $updates = $contract->progressUpdates()
            ->with('submittedBy')
            ->orderByDesc('update_date')
            ->paginate(50);

        return response()->json(['data' => $updates->items()]);
    }

    public function addProgressUpdate(Request $request, int $contractId)
    {
        $contract = Contract::findOrFail($contractId);

        $data = $request->validate([
            'progress_percent' => 'required|numeric|between:0,100',
            'update_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $data['submitted_by'] = $request->user()->id;

        $update = $contract->progressUpdates()->create($data);

        $contract->update(['progress_percent' => $data['progress_percent']]);

        if ($data['progress_percent'] >= 100) {
            $contract->update(['status' => 'completed']);
        }

        return response()->json(['data' => $update], 201);
    }

    public function activate(Request $request, int $id)
    {
        $contract = Contract::findOrFail($id);
        $contract->update(['status' => 'active']);

        return response()->json(['data' => $contract->fresh()]);
    }

    public function complete(Request $request, int $id)
    {
        $contract = Contract::findOrFail($id);
        $contract->update(['status' => 'completed', 'progress_percent' => 100]);

        return response()->json(['data' => $contract->fresh()]);
    }

    public function cancel(Request $request, int $id)
    {
        $contract = Contract::findOrFail($id);
        $contract->update(['status' => 'cancelled']);

        return response()->json(['data' => $contract->fresh()]);
    }
}
