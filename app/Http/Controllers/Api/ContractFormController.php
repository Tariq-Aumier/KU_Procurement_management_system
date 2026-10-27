<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContractForm;
use App\Models\ContractFormItem;
use App\Models\Company;
use App\Models\Office;
use App\Models\UnitOfMeasure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ContractFormController extends Controller
{
    public function index(Request $request)
    {
        $query = ContractForm::with(['items.unit', 'company', 'office', 'createdBy'])
            ->where('created_by', Auth::id());
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('company_id')) {
            $query->where('company_id', $request->company_id);
        }
        
        if ($request->has('office_id')) {
            $query->where('office_id', $request->office_id);
        }
        
        $forms = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $forms
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'form_date' => 'required|date',
            'customer_name' => 'nullable|string|max:255',
            'company_id' => 'nullable|exists:companies,id',
            'office_id' => 'nullable|exists:offices,id',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.specifications' => 'nullable|string',
            'items.*.unit_id' => 'nullable|exists:units_of_measure,id',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();
            
            $form = ContractForm::create([
                'form_date' => $validated['form_date'],
                'customer_name' => $validated['customer_name'] ?? null,
                'company_id' => $validated['company_id'] ?? null,
                'office_id' => $validated['office_id'] ?? null,
                'description' => $validated['description'] ?? null,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['items'] as $index => $item) {
                ContractFormItem::create([
                    'contract_form_id' => $form->id,
                    'line_no' => $index + 1,
                    'item_name' => $item['item_name'],
                    'specifications' => $item['specifications'] ?? null,
                    'unit_id' => $item['unit_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
            }

            // Recalculate grand total
            $form->grand_total = $form->items()->sum('line_total');
            $form->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $form->load('items.unit', 'company', 'office'),
                'message' => 'Contract form created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create contract form: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $form = ContractForm::with(['items.unit', 'company', 'office', 'createdBy', 'updatedBy'])
            ->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $form
        ]);
    }

    public function update(Request $request, $id)
    {
        $form = ContractForm::findOrFail($id);

        $validated = $request->validate([
            'form_date' => 'sometimes|required|date',
            'customer_name' => 'nullable|string|max:255',
            'company_id' => 'nullable|exists:companies,id',
            'office_id' => 'nullable|exists:offices,id',
            'description' => 'nullable|string',
            'items' => 'sometimes|required|array|min:1',
            'items.*.id' => 'nullable|exists:contract_form_items,id',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.specifications' => 'nullable|string',
            'items.*.unit_id' => 'nullable|exists:units_of_measure,id',
            'items.*.quantity' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $form->update([
                'form_date' => $validated['form_date'] ?? $form->form_date,
                'customer_name' => $validated['customer_name'] ?? $form->customer_name,
                'company_id' => $validated['company_id'] ?? $form->company_id,
                'office_id' => $validated['office_id'] ?? $form->office_id,
                'description' => $validated['description'] ?? $form->description,
                'updated_by' => Auth::id(),
            ]);

            if (isset($validated['items'])) {
                // Delete existing items
                $form->items()->delete();

                // Create new items
                foreach ($validated['items'] as $index => $item) {
                    ContractFormItem::create([
                        'contract_form_id' => $form->id,
                        'line_no' => $index + 1,
                        'item_name' => $item['item_name'],
                        'specifications' => $item['specifications'] ?? null,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ]);
                }

                // Recalculate grand total
                $form->grand_total = $form->items()->sum('line_total');
                $form->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $form->load('items.unit', 'company', 'office'),
                'message' => 'Contract form updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update contract form: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $form = ContractForm::findOrFail($id);
        $form->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contract form deleted successfully'
        ]);
    }

    public function submit($id)
    {
        $form = ContractForm::findOrFail($id);
        $form->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $form,
            'message' => 'Contract form submitted successfully'
        ]);
    }

    public function approve($id)
    {
        $form = ContractForm::findOrFail($id);
        $form->update(['status' => 'approved']);

        return response()->json([
            'success' => true,
            'data' => $form,
            'message' => 'Contract form approved successfully'
        ]);
    }

    public function reject($id)
    {
        $form = ContractForm::findOrFail($id);
        $form->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'data' => $form,
            'message' => 'Contract form rejected successfully'
        ]);
    }

    public function getDropdownData()
    {
        $companies = Company::select('id', 'name', 'name_en', 'name_ps', 'name_fa')
            ->where('active', true)
            ->get();
        
        $offices = Office::select('id', 'name', 'name_en', 'name_ps', 'name_fa')
            ->where('active', true)
            ->get();
        
        $units = UnitOfMeasure::select('id', 'name', 'name_en', 'name_ps', 'name_fa', 'abbreviation')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'companies' => $companies,
                'offices' => $offices,
                'units' => $units,
            ]
        ]);
    }
}
