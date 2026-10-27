<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RfqFormNew;
use App\Models\RfqItemNew;
use App\Models\RfqBidder;
use App\Models\RfqBidderPrice;
use App\Models\ComparisonSheet;
use App\Models\ComparisonItem;
use App\Models\ComparisonBidder;
use App\Models\ComparisonBidderPrice;
use App\Models\ComparisonCommitteeMember;
use App\Models\CashPurchaseOrder;
use App\Models\CashPoItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseOrderApproval;
use App\Models\ApprovalStep;
use App\Models\ProcurementAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ProcurementWorkflowController extends Controller
{
    // ==================== RFQ Form Endpoints ====================
    
    public function rfqIndex()
    {
        $rfqForms = RfqFormNew::with(['items.unit', 'bidders', 'department', 'issuingOfficer', 'createdBy'])->get();
        return response()->json(['data' => $rfqForms]);
    }

    public function rfqStore(Request $request)
    {
        $validated = $request->validate([
            'issue_date' => 'required|date',
            'addressed_to' => 'nullable|string',
            'submission_deadline' => 'nullable|datetime',
            'submission_location' => 'nullable|string',
            'validity_period_days' => 'nullable|integer',
            'quantity_variance_pct' => 'nullable|numeric',
            'local_preference_applicable' => 'nullable|boolean',
            'local_preference_pct' => 'nullable|numeric',
            'department_id' => 'nullable|exists:departments,id',
            'requisition_id' => 'nullable|exists:requisitions,id',
            'items' => 'array',
            'items.*.item_name' => 'required|string',
            'items.*.technical_description' => 'nullable|string',
            'items.*.unit_id' => 'nullable|exists:units_of_measure,id',
            'items.*.quantity' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $rfqForm = RfqFormNew::create([
                'issue_date' => $validated['issue_date'],
                'addressed_to' => $validated['addressed_to'] ?? null,
                'submission_deadline' => $validated['submission_deadline'] ?? null,
                'submission_location' => $validated['submission_location'] ?? null,
                'validity_period_days' => $validated['validity_period_days'] ?? 30,
                'quantity_variance_pct' => $validated['quantity_variance_pct'] ?? 25,
                'local_preference_applicable' => $validated['local_preference_applicable'] ?? false,
                'local_preference_pct' => $validated['local_preference_pct'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'issuing_officer_id' => Auth::id(),
                'requisition_id' => $validated['requisition_id'] ?? null,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            if (isset($validated['items'])) {
                foreach ($validated['items'] as $index => $item) {
                    RfqItemNew::create([
                        'rfq_form_id' => $rfqForm->id,
                        'line_no' => $index + 1,
                        'item_name' => $item['item_name'],
                        'technical_description' => $item['technical_description'] ?? null,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            $this->logAudit('rfq', $rfqForm->id, 'created', null, $rfqForm->toArray());

            return response()->json(['data' => $rfqForm->load('items')], 201);
        });
    }

    public function rfqShow($id)
    {
        $rfqForm = RfqFormNew::with(['items.unit', 'bidders.prices', 'department', 'issuingOfficer', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $rfqForm]);
    }

    public function rfqUpdate(Request $request, $id)
    {
        $rfqForm = RfqFormNew::findOrFail($id);
        
        $validated = $request->validate([
            'issue_date' => 'sometimes|date',
            'addressed_to' => 'sometimes|string',
            'submission_deadline' => 'sometimes|datetime',
            'submission_location' => 'sometimes|string',
            'validity_period_days' => 'sometimes|integer',
            'quantity_variance_pct' => 'sometimes|numeric',
            'local_preference_applicable' => 'sometimes|boolean',
            'local_preference_pct' => 'sometimes|numeric',
            'department_id' => 'sometimes|exists:departments,id',
            'requisition_id' => 'sometimes|exists:requisitions,id',
            'status' => 'sometimes|in:draft,submitted,published,closed,cancelled',
            'items' => 'sometimes|array',
        ]);

        return DB::transaction(function () use ($rfqForm, $validated, $request) {
            $oldValues = $rfqForm->toArray();
            $rfqForm->update($validated);

            if (isset($validated['items'])) {
                $rfqForm->items()->delete();
                foreach ($validated['items'] as $index => $item) {
                    RfqItemNew::create([
                        'rfq_form_id' => $rfqForm->id,
                        'line_no' => $index + 1,
                        'item_name' => $item['item_name'],
                        'technical_description' => $item['technical_description'] ?? null,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            $this->logAudit('rfq', $rfqForm->id, 'updated', $oldValues, $rfqForm->toArray());

            return response()->json(['data' => $rfqForm->load('items')]);
        });
    }

    public function rfqDestroy($id)
    {
        $rfqForm = RfqFormNew::findOrFail($id);
        $rfqForm->delete();
        $this->logAudit('rfq', $id, 'deleted', $rfqForm->toArray(), null);
        return response()->noContent();
    }

    public function rfqSubmit($id)
    {
        $rfqForm = RfqFormNew::findOrFail($id);
        $rfqForm->update(['status' => 'submitted', 'submitted_at' => now()]);
        $this->logAudit('rfq', $id, 'submitted', null, $rfqForm->toArray());
        return response()->json(['data' => $rfqForm]);
    }

    public function rfqApprove($id)
    {
        $rfqForm = RfqFormNew::findOrFail($id);
        $rfqForm->update(['status' => 'published']);
        $this->logAudit('rfq', $id, 'approved', null, $rfqForm->toArray());
        return response()->json(['data' => $rfqForm]);
    }

    // ==================== Comparison Sheet Endpoints ====================
    
    public function comparisonIndex()
    {
        $sheets = ComparisonSheet::with(['items.unit', 'bidders', 'committeeMembers', 'requestingDepartment', 'certifier', 'approver1', 'approver2', 'createdBy'])->get();
        return response()->json(['data' => $sheets]);
    }

    public function comparisonStore(Request $request)
    {
        $validated = $request->validate([
            'rfq_document_number' => 'nullable|string',
            'rfq_date' => 'nullable|date',
            'implementing_agency' => 'nullable|string',
            'requesting_department_id' => 'nullable|exists:departments,id',
            'funding_source' => 'nullable|string',
            'funder' => 'nullable|string',
            'budget_code_id' => 'nullable|exists:budget_codes,id',
            'estimated_price' => 'nullable|numeric',
            'requisition_id' => 'nullable|exists:requisitions,id',
            'items' => 'array',
            'items.*.item_name' => 'required|string',
            'items.*.technical_description' => 'nullable|string',
            'items.*.unit_id' => 'nullable|exists:units_of_measure,id',
            'items.*.quantity' => 'required|numeric',
            'bidders' => 'array',
            'bidders.*.name' => 'required|string',
            'committee_members' => 'array',
            'committee_members.*.member_name' => 'required|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $sheet = ComparisonSheet::create([
                'rfq_document_number' => $validated['rfq_document_number'] ?? null,
                'rfq_date' => $validated['rfq_date'] ?? null,
                'implementing_agency' => $validated['implementing_agency'] ?? null,
                'requesting_department_id' => $validated['requesting_department_id'] ?? null,
                'funding_source' => $validated['funding_source'] ?? null,
                'funder' => $validated['funder'] ?? null,
                'budget_code_id' => $validated['budget_code_id'] ?? null,
                'estimated_price' => $validated['estimated_price'] ?? 0,
                'requisition_id' => $validated['requisition_id'] ?? null,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            if (isset($validated['items'])) {
                foreach ($validated['items'] as $index => $item) {
                    ComparisonItem::create([
                        'comparison_sheet_id' => $sheet->id,
                        'line_no' => $index + 1,
                        'item_name' => $item['item_name'],
                        'technical_description' => $item['technical_description'] ?? null,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            if (isset($validated['bidders'])) {
                foreach ($validated['bidders'] as $bidder) {
                    $bidderModel = ComparisonBidder::create([
                        'comparison_sheet_id' => $sheet->id,
                        'name' => $bidder['name'],
                        'address' => $bidder['address'] ?? null,
                    ]);
                }
            }

            if (isset($validated['committee_members'])) {
                foreach ($validated['committee_members'] as $member) {
                    ComparisonCommitteeMember::create([
                        'comparison_sheet_id' => $sheet->id,
                        'member_name' => $member['member_name'],
                        'position' => $member['position'] ?? null,
                    ]);
                }
            }

            $this->logAudit('comparison', $sheet->id, 'created', null, $sheet->toArray());

            return response()->json(['data' => $sheet->load(['items', 'bidders', 'committeeMembers'])], 201);
        });
    }

    public function comparisonShow($id)
    {
        $sheet = ComparisonSheet::with(['items.unit', 'bidders.prices', 'committeeMembers', 'requestingDepartment', 'certifier', 'approver1', 'approver2', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $sheet]);
    }

    public function comparisonUpdate(Request $request, $id)
    {
        $sheet = ComparisonSheet::findOrFail($id);
        
        $validated = $request->validate([
            'rfq_document_number' => 'sometimes|string',
            'rfq_date' => 'sometimes|date',
            'implementing_agency' => 'sometimes|string',
            'requesting_department_id' => 'sometimes|exists:departments,id',
            'funding_source' => 'sometimes|string',
            'funder' => 'sometimes|string',
            'budget_code_id' => 'sometimes|exists:budget_codes,id',
            'estimated_price' => 'sometimes|numeric',
            'award_recommendation' => 'sometimes|string',
            'certifier_id' => 'sometimes|exists:users,id',
            'approver1_id' => 'sometimes|exists:users,id',
            'approver2_id' => 'sometimes|exists:users,id',
            'status' => 'sometimes|in:draft,submitted,under_review,approved,rejected',
            'items' => 'sometimes|array',
            'bidders' => 'sometimes|array',
        ]);

        return DB::transaction(function () use ($sheet, $validated, $request) {
            $oldValues = $sheet->toArray();
            $sheet->update($validated);

            if (isset($validated['items'])) {
                $sheet->items()->delete();
                foreach ($validated['items'] as $index => $item) {
                    ComparisonItem::create([
                        'comparison_sheet_id' => $sheet->id,
                        'line_no' => $index + 1,
                        'item_name' => $item['item_name'],
                        'technical_description' => $item['technical_description'] ?? null,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            $this->logAudit('comparison', $sheet->id, 'updated', $oldValues, $sheet->toArray());

            return response()->json(['data' => $sheet->load(['items', 'bidders', 'committeeMembers'])]);
        });
    }

    public function comparisonDestroy($id)
    {
        $sheet = ComparisonSheet::findOrFail($id);
        $sheet->delete();
        $this->logAudit('comparison', $id, 'deleted', $sheet->toArray(), null);
        return response()->noContent();
    }

    // ==================== Cash Purchase Order (م-2) Endpoints ====================
    
    public function cashPoIndex()
    {
        $orders = CashPurchaseOrder::with(['items.unit', 'requestedByDepartment', 'requestedByPerson', 'approvingOfficer', 'accountingDepartment', 'certifier', 'controlDept', 'finalControl', 'createdBy'])->get();
        return response()->json(['data' => $orders]);
    }

    public function cashPoStore(Request $request)
    {
        $validated = $request->validate([
            'issue_date' => 'required|date',
            'requested_by_department_id' => 'nullable|exists:departments,id',
            'approving_officer_id' => 'nullable|exists:users,id',
            'private_number' => 'nullable|string',
            'allocation_number' => 'nullable|string',
            'accounting_department_id' => 'nullable|exists:departments,id',
            'requisition_id' => 'nullable|exists:requisitions,id',
            'items' => 'array',
            'items.*.description' => 'required|string',
            'items.*.unit_id' => 'nullable|exists:units_of_measure,id',
            'items.*.quantity' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $order = CashPurchaseOrder::create([
                'issue_date' => $validated['issue_date'],
                'requested_by_department_id' => $validated['requested_by_department_id'] ?? null,
                'requested_by_person_id' => Auth::id(),
                'approving_officer_id' => $validated['approving_officer_id'] ?? null,
                'private_number' => $validated['private_number'] ?? null,
                'allocation_number' => $validated['allocation_number'] ?? null,
                'accounting_department_id' => $validated['accounting_department_id'] ?? null,
                'requisition_id' => $validated['requisition_id'] ?? null,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            if (isset($validated['items'])) {
                foreach ($validated['items'] as $index => $item) {
                    CashPoItem::create([
                        'cash_po_id' => $order->id,
                        'line_no' => $index + 1,
                        'description' => $item['description'],
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ]);
                }
            }

            $this->logAudit('cash_po', $order->id, 'created', null, $order->toArray());

            return response()->json(['data' => $order->load('items')], 201);
        });
    }

    public function cashPoShow($id)
    {
        $order = CashPurchaseOrder::with(['items.unit', 'requestedByDepartment', 'requestedByPerson', 'approvingOfficer', 'accountingDepartment', 'certifier', 'controlDept', 'finalControl', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $order]);
    }

    public function cashPoUpdate(Request $request, $id)
    {
        $order = CashPurchaseOrder::findOrFail($id);
        
        $validated = $request->validate([
            'issue_date' => 'sometimes|date',
            'requested_by_department_id' => 'sometimes|exists:departments,id',
            'approving_officer_id' => 'sometimes|exists:users,id',
            'private_number' => 'sometimes|string',
            'allocation_number' => 'sometimes|string',
            'accounting_department_id' => 'sometimes|exists:departments,id',
            'certifier_id' => 'sometimes|exists:users,id',
            'control_dept_id' => 'sometimes|exists:users,id',
            'final_control_id' => 'sometimes|exists:users,id',
            'status' => 'sometimes|in:draft,submitted,approved,rejected,cancelled',
            'items' => 'sometimes|array',
        ]);

        return DB::transaction(function () use ($order, $validated, $request) {
            $oldValues = $order->toArray();
            $order->update($validated);

            if (isset($validated['items'])) {
                $order->items()->delete();
                foreach ($validated['items'] as $index => $item) {
                    CashPoItem::create([
                        'cash_po_id' => $order->id,
                        'line_no' => $index + 1,
                        'description' => $item['description'],
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ]);
                }
            }

            $this->logAudit('cash_po', $order->id, 'updated', $oldValues, $order->toArray());

            return response()->json(['data' => $order->load('items')]);
        });
    }

    public function cashPoDestroy($id)
    {
        $order = CashPurchaseOrder::findOrFail($id);
        $order->delete();
        $this->logAudit('cash_po', $id, 'deleted', $order->toArray(), null);
        return response()->noContent();
    }

    // ==================== Purchase Order (م-3) Endpoints ====================
    
    public function purchaseOrderIndex()
    {
        $orders = PurchaseOrder::with(['items.unit', 'budgetCode', 'financialController', 'approvals', 'createdBy'])->get();
        return response()->json(['data' => $orders]);
    }

    public function purchaseOrderStore(Request $request)
    {
        $validated = $request->validate([
            'contract_type' => 'required|in:absolute_sale,lease',
            'ministry_organ' => 'nullable|string',
            'issue_date' => 'required|date',
            'requisition_id' => 'nullable|exists:requisitions,id',
            'contractor_id_number' => 'nullable|string',
            'budget_code_id' => 'nullable|exists:budget_codes,id',
            'delivery_date' => 'nullable|date',
            'delivery_location' => 'nullable|string',
            'payment_type' => 'required|in:deferred,installment,immediate',
            'installment_details' => 'nullable|string',
            'items' => 'array',
            'items.*.description' => 'required|string',
            'items.*.type_code' => 'nullable|string',
            'items.*.classification_code' => 'nullable|string',
            'items.*.unit_id' => 'nullable|exists:units_of_measure,id',
            'items.*.quantity' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $order = PurchaseOrder::create([
                'contract_type' => $validated['contract_type'],
                'ministry_organ' => $validated['ministry_organ'] ?? null,
                'issue_date' => $validated['issue_date'],
                'requisition_id' => $validated['requisition_id'] ?? null,
                'contractor_id_number' => $validated['contractor_id_number'] ?? null,
                'budget_code_id' => $validated['budget_code_id'] ?? null,
                'delivery_date' => $validated['delivery_date'] ?? null,
                'delivery_location' => $validated['delivery_location'] ?? null,
                'payment_type' => $validated['payment_type'],
                'installment_details' => $validated['installment_details'] ?? null,
                'status' => 'draft',
                'created_by' => Auth::id(),
            ]);

            if (isset($validated['items'])) {
                foreach ($validated['items'] as $index => $item) {
                    PurchaseOrderItem::create([
                        'purchase_order_id' => $order->id,
                        'line_no' => $index + 1,
                        'description' => $item['description'],
                        'type_code' => $item['type_code'] ?? null,
                        'classification_code' => $item['classification_code'] ?? null,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ]);
                }
            }

            // Create default approval steps
            $steps = [
                ['step_order' => 1, 'step_name' => 'procurement'],
                ['step_order' => 2, 'step_name' => 'accounting'],
                ['step_order' => 3, 'step_name' => 'authorized_officer'],
                ['step_order' => 4, 'step_name' => 'contractor'],
            ];
            
            foreach ($steps as $step) {
                PurchaseOrderApproval::create([
                    'purchase_order_id' => $order->id,
                    'step_order' => $step['step_order'],
                    'step_name' => $step['step_name'],
                ]);
            }

            $this->logAudit('purchase_order', $order->id, 'created', null, $order->toArray());

            return response()->json(['data' => $order->load(['items', 'approvals'])], 201);
        });
    }

    public function purchaseOrderShow($id)
    {
        $order = PurchaseOrder::with(['items.unit', 'budgetCode', 'financialController', 'approvals.signer', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $order]);
    }

    public function purchaseOrderUpdate(Request $request, $id)
    {
        $order = PurchaseOrder::findOrFail($id);
        
        $validated = $request->validate([
            'contract_type' => 'sometimes|in:absolute_sale,lease',
            'ministry_organ' => 'sometimes|string',
            'issue_date' => 'sometimes|date',
            'contractor_id_number' => 'sometimes|string',
            'budget_code_id' => 'sometimes|exists:budget_codes,id',
            'delivery_date' => 'sometimes|date',
            'delivery_location' => 'sometimes|string',
            'payment_type' => 'sometimes|in:deferred,installment,immediate',
            'installment_details' => 'sometimes|string',
            'receipt_report_date' => 'sometimes|date',
            'receipt_report_number' => 'sometimes|string',
            'financial_controller_id' => 'sometimes|exists:users,id',
            'remarks' => 'sometimes|string',
            'status' => 'sometimes|in:draft,submitted,under_review,approved,rejected,cancelled',
            'items' => 'sometimes|array',
        ]);

        return DB::transaction(function () use ($order, $validated, $request) {
            $oldValues = $order->toArray();
            $order->update($validated);

            if (isset($validated['items'])) {
                $order->items()->delete();
                foreach ($validated['items'] as $index => $item) {
                    PurchaseOrderItem::create([
                        'purchase_order_id' => $order->id,
                        'line_no' => $index + 1,
                        'description' => $item['description'],
                        'type_code' => $item['type_code'] ?? null,
                        'classification_code' => $item['classification_code'] ?? null,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ]);
                }
            }

            $this->logAudit('purchase_order', $order->id, 'updated', $oldValues, $order->toArray());

            return response()->json(['data' => $order->load(['items', 'approvals'])]);
        });
    }

    public function purchaseOrderDestroy($id)
    {
        $order = PurchaseOrder::findOrFail($id);
        $order->delete();
        $this->logAudit('purchase_order', $id, 'deleted', $order->toArray(), null);
        return response()->noContent();
    }

    // ==================== All Saved Forms Endpoint ====================
    
    public function allSavedForms()
    {
        $forms = collect();
        
        // RFQ Forms
        $rfqForms = RfqFormNew::with(['items', 'createdBy'])
            ->get()
            ->map(function ($form) {
                return [
                    'id' => $form->id,
                    'type' => 'rfq',
                    'type_label' => 'RFQ - Request for Quotation',
                    'number' => $form->rfq_number,
                    'title' => $form->rfq_number,
                    'date' => $form->issue_date,
                    'status' => $form->status,
                    'created_by' => $form->createdBy->name ?? 'Unknown',
                    'created_at' => $form->created_at,
                ];
            });
        $forms = $forms->concat($rfqForms);
        
        // Cash Purchase Orders (م-2)
        $cashPos = CashPurchaseOrder::with(['createdBy'])
            ->get()
            ->map(function ($form) {
                return [
                    'id' => $form->id,
                    'type' => 'cash_po',
                    'type_label' => 'م-2 - Cash Purchase Order',
                    'number' => $form->serial_number,
                    'title' => $form->serial_number,
                    'date' => $form->issue_date,
                    'status' => $form->status,
                    'created_by' => $form->createdBy->name ?? 'Unknown',
                    'created_at' => $form->created_at,
                ];
            });
        $forms = $forms->concat($cashPos);
        
        // Sort by created_at descending
        $forms = $forms->sortByDesc('created_at')->values();
        
        return response()->json(['data' => $forms]);
    }

    // ==================== Custom Form Save Endpoint ====================
    
    public function customFormSave(Request $request)
    {
        $validated = $request->validate([
            'form_type' => 'required|string',
            'form_data' => 'required|array',
            'title' => 'required|string',
        ]);

        try {
            $savedForm = DB::table('custom_saved_forms')->insertGetId([
                'form_type' => $validated['form_type'],
                'form_data' => json_encode($validated['form_data']),
                'title' => $validated['title'],
                'status' => 'draft',
                'created_by' => Auth::id() ?? 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Form saved successfully',
                'data' => ['id' => $savedForm]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save form: ' . $e->getMessage()
            ], 500);
        }
    }

    public function customFormsIndex()
    {
        $customForms = DB::table('custom_saved_forms')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json(['data' => $customForms]);
    }

    public function customFormShow($id)
    {
        $customForm = DB::table('custom_saved_forms')->where('id', $id)->first();
        
        if (!$customForm) {
            return response()->json([
                'success' => false,
                'message' => 'Form not found'
            ], 404);
        }
        
        return response()->json(['data' => $customForm]);
    }

    // ==================== Helper Methods ====================
    
    protected function logAudit($documentType, $documentId, $action, $oldValues = null, $newValues = null)
    {
        ProcurementAuditLog::create([
            'document_type' => $documentType,
            'document_id' => $documentId,
            'user_id' => Auth::id(),
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);
    }
}
