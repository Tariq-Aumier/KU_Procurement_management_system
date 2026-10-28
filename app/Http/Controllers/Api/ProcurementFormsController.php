<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RfqForm;
use App\Models\RfqFormItem;
use App\Models\M2Form;
use App\Models\M2RequestRow;
use App\Models\EvaluationForm;
use App\Models\EvaluationItem;
use App\Models\EvaluationBidder;
use App\Models\EvaluationBidderPrice;
use App\Models\EvaluationCommitteeMember;
use App\Models\FormSubmission;
use App\Models\M3HForm;
use App\Models\M3HItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProcurementFormsController extends Controller
{
    // RFQ Forms
    public function rfqIndex()
    {
        $rfqForms = RfqForm::with(['items', 'createdBy'])->get();
        return response()->json(['data' => $rfqForms]);
    }

    public function rfqStore(Request $request)
    {
        $validated = $request->validate([
            'number' => 'required|string',
            'issue_date' => 'required|date',
            'deadline' => 'required|date',
            'to_company' => 'nullable|string',
            'requesting_department' => 'required|string',
            'submission_office' => 'required|string',
            'purpose' => 'required|string',
            'items' => 'array',
            'items.*.name' => 'required|string',
            'items.*.technical_spec' => 'nullable|string',
            'items.*.unit' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'items.*.unit_price' => 'required|numeric',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $rfqForm = RfqForm::create([
                'number' => $validated['number'],
                'issue_date' => $validated['issue_date'],
                'deadline' => $validated['deadline'],
                'to_company' => $validated['to_company'] ?? null,
                'requesting_department' => $validated['requesting_department'],
                'submission_office' => $validated['submission_office'],
                'purpose' => $validated['purpose'],
                'total_amount' => 0,
                'status' => 'draft',
                'created_by' => $request->user()->id,
            ]);

            $totalAmount = 0;
            foreach ($validated['items'] as $index => $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $totalAmount += $lineTotal;

                RfqFormItem::create([
                    'rfq_form_id' => $rfqForm->id,
                    'line_no' => $index + 1,
                    'name' => $item['name'],
                    'technical_spec' => $item['technical_spec'] ?? null,
                    'unit' => $item['unit'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
            }

            $rfqForm->update(['total_amount' => $totalAmount]);

            return response()->json(['data' => $rfqForm->load('items')], 201);
        });
    }

    public function rfqShow($id)
    {
        $rfqForm = RfqForm::with(['items', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $rfqForm]);
    }

    public function rfqUpdate(Request $request, $id)
    {
        $rfqForm = RfqForm::findOrFail($id);
        
        $validated = $request->validate([
            'number' => 'sometimes|string',
            'issue_date' => 'sometimes|date',
            'deadline' => 'sometimes|date',
            'to_company' => 'nullable|string',
            'requesting_department' => 'sometimes|string',
            'submission_office' => 'sometimes|string',
            'purpose' => 'sometimes|string',
            'status' => 'sometimes|in:draft,submitted,approved',
            'items' => 'sometimes|array',
        ]);

        return DB::transaction(function () use ($rfqForm, $validated, $request) {
            $rfqForm->update($validated);

            if (isset($validated['items'])) {
                $rfqForm->items()->delete();
                $totalAmount = 0;
                
                foreach ($validated['items'] as $index => $item) {
                    $lineTotal = $item['quantity'] * $item['unit_price'];
                    $totalAmount += $lineTotal;

                    RfqFormItem::create([
                        'rfq_form_id' => $rfqForm->id,
                        'line_no' => $index + 1,
                        'name' => $item['name'],
                        'technical_spec' => $item['technical_spec'] ?? null,
                        'unit' => $item['unit'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                    ]);
                }

                $rfqForm->update(['total_amount' => $totalAmount]);
            }

            return response()->json(['data' => $rfqForm->load('items')]);
        });
    }

    public function rfqDestroy($id)
    {
        $rfqForm = RfqForm::findOrFail($id);
        $rfqForm->delete();
        return response()->noContent();
    }

    public function rfqRestore($id)
    {
        $rfqForm = RfqForm::withTrashed()->findOrFail($id);
        $rfqForm->restore();
        return response()->json(['data' => $rfqForm->load('items')]);
    }

    public function rfqForceDelete($id)
    {
        $rfqForm = RfqForm::withTrashed()->findOrFail($id);
        $rfqForm->forceDelete();
        return response()->noContent();
    }

    // M2 Forms
    public function m2Index(Request $request)
    {
        $perPage = $request->input('per_page', 7);
        $page = $request->input('page', 1);

        $m2Forms = M2Form::with(['requestRows', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $m2Forms->items(),
            'pagination' => [
                'current_page' => $m2Forms->currentPage(),
                'last_page' => $m2Forms->lastPage(),
                'per_page' => $m2Forms->perPage(),
                'total' => $m2Forms->total(),
            ]
        ]);
    }

    public function m2Store(Request $request)
    {
        try {
            $validated = $request->validate([
                'serial_number' => 'required|string|unique:m2_forms,serial_number',
                'date' => 'required|date',
                'requester_person' => 'nullable|string',
                'requester_branch' => 'nullable|string',
                'request_number' => 'nullable|string',
                'total_amount' => 'required|numeric',
                'amount_in_words' => 'nullable|string',
                'purchase_from' => 'nullable|string',
                'purchase_committee_location' => 'nullable|string',
                'purchase_committee_date' => 'nullable|date',
                'approval_officer' => 'nullable|string',
                'calculation_branch' => 'nullable|string',
                'allocation_number' => 'nullable|string',
                'private_number' => 'nullable|string',
                'commitment_amount' => 'nullable|numeric',
                'payment_order' => 'nullable|string',
                'description' => 'nullable|string',
                'm16_certifier' => 'nullable|string',
                'm12_certifier' => 'nullable|string',
                'status' => 'sometimes|in:draft,submitted,approved,rejected,cancelled',
                'items' => 'sometimes|array',
            ]);

            return DB::transaction(function () use ($validated, $request) {
                $m2Form = M2Form::create([
                    'serial_number' => $validated['serial_number'],
                    'date' => $validated['date'],
                    'requester_person' => $validated['requester_person'] ?? null,
                    'requester_branch' => $validated['requester_branch'] ?? null,
                    'request_number' => $validated['request_number'] ?? null,
                    'total_amount' => $validated['total_amount'],
                    'amount_in_words' => $validated['amount_in_words'] ?? null,
                    'purchase_from' => $validated['purchase_from'] ?? null,
                    'purchase_committee_location' => $validated['purchase_committee_location'] ?? null,
                    'purchase_committee_date' => $validated['purchase_committee_date'] ?? null,
                    'approval_officer' => $validated['approval_officer'] ?? null,
                    'calculation_branch' => $validated['calculation_branch'] ?? null,
                    'allocation_number' => $validated['allocation_number'] ?? null,
                    'private_number' => $validated['private_number'] ?? null,
                    'commitment_amount' => $validated['commitment_amount'] ?? 0,
                    'payment_order' => $validated['payment_order'] ?? null,
                    'description' => $validated['description'] ?? null,
                    'm16_certifier' => $validated['m16_certifier'] ?? null,
                    'm12_certifier' => $validated['m12_certifier'] ?? null,
                    'status' => $validated['status'] ?? 'draft',
                    'created_by' => $request->user()->id,
                ]);

                if (isset($validated['items']) && is_array($validated['items']) && count($validated['items']) > 0) {
                    foreach ($validated['items'] as $index => $item) {
                        M2RequestRow::create([
                            'm2_form_id' => $m2Form->id,
                            'line_no' => $item['line_no'] ?? ($index + 1),
                            'description' => $item['description'] ?? '',
                            'unit' => $item['unit'] ?? '',
                            'quantity' => $item['quantity'] ?? 0,
                            'unit_price' => $item['rate'] ?? 0,
                            'estimated_price' => $item['estimated_price'] ?? 0,
                            'paid_price' => $item['paid_price'] ?? null,
                        ]);
                    }
                }

                return response()->json(['data' => $m2Form->load('requestRows')], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function m2Show($id)
    {
        $m2Form = M2Form::with(['requestRows', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $m2Form, 'request_rows' => $m2Form->requestRows]);
    }

    public function m2Update(Request $request, $id)
    {
        try {
            $m2Form = M2Form::findOrFail($id);

            $validated = $request->validate([
                'serial_number' => 'sometimes|string|unique:m2_forms,serial_number,' . $id,
                'date' => 'sometimes|date',
                'requester_person' => 'nullable|string',
                'requester_branch' => 'nullable|string',
                'request_number' => 'nullable|string',
                'total_amount' => 'sometimes|numeric',
                'amount_in_words' => 'nullable|string',
                'purchase_from' => 'nullable|string',
                'purchase_committee_location' => 'nullable|string',
                'purchase_committee_date' => 'nullable|date',
                'approval_officer' => 'nullable|string',
                'calculation_branch' => 'nullable|string',
                'allocation_number' => 'nullable|string',
                'private_number' => 'nullable|string',
                'commitment_amount' => 'nullable|numeric',
                'payment_order' => 'nullable|string',
                'description' => 'nullable|string',
                'm16_certifier' => 'nullable|string',
                'm12_certifier' => 'nullable|string',
                'status' => 'sometimes|in:draft,submitted,approved,rejected,cancelled',
                'items' => 'sometimes|array',
            ]);

            return DB::transaction(function () use ($m2Form, $validated) {
                $m2Form->update($validated);

                if (isset($validated['items']) && is_array($validated['items'])) {
                    $m2Form->requestRows()->delete();

                    foreach ($validated['items'] as $index => $item) {
                        M2RequestRow::create([
                            'm2_form_id' => $m2Form->id,
                            'line_no' => $item['line_no'] ?? ($index + 1),
                            'description' => $item['description'] ?? '',
                            'unit' => $item['unit'] ?? '',
                            'quantity' => $item['quantity'] ?? 0,
                            'unit_price' => $item['rate'] ?? 0,
                            'estimated_price' => $item['estimated_price'] ?? 0,
                            'paid_price' => $item['paid_price'] ?? null,
                        ]);
                    }
                }

                return response()->json(['data' => $m2Form->load('requestRows')]);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function m2Destroy($id)
    {
        $m2Form = M2Form::findOrFail($id);
        $m2Form->delete();
        return response()->noContent();
    }

    public function m2Restore($id)
    {
        $m2Form = M2Form::withTrashed()->findOrFail($id);
        $m2Form->restore();
        return response()->json(['data' => $m2Form->load('requestRows')]);
    }

    public function m2ForceDelete($id)
    {
        $m2Form = M2Form::withTrashed()->findOrFail($id);
        $m2Form->forceDelete();
        return response()->noContent();
    }

    // Evaluation Forms
    public function evaluationIndex()
    {
        $evalForms = EvaluationForm::with(['items', 'bidders.prices', 'committeeMembers', 'createdBy'])->get();
        return response()->json(['data' => $evalForms]);
    }

    public function evaluationStore(Request $request)
    {
        $validated = $request->validate([
            'reference_number' => 'required|string',
            'title' => 'required|string',
            'date' => 'required|date',
            'items' => 'array',
            'items.*.name' => 'required|string',
            'items.*.specification' => 'nullable|string',
            'items.*.unit' => 'required|string',
            'items.*.quantity' => 'required|numeric',
            'bidders' => 'array',
            'bidders.*.name' => 'required|string',
            'bidders.*.type' => 'required|string',
            'bidders.*.prices' => 'array',
            'committee_members' => 'array',
            'committee_members.*.member_name' => 'required|string',
            'committee_members.*.position' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $evalForm = EvaluationForm::create([
                'reference_number' => $validated['reference_number'],
                'title' => $validated['title'],
                'date' => $validated['date'],
                'total_amount' => 0,
                'status' => 'draft',
                'created_by' => $request->user()->id,
            ]);

            // Create items
            $items = [];
            foreach ($validated['items'] as $index => $item) {
                $items[] = EvaluationItem::create([
                    'evaluation_form_id' => $evalForm->id,
                    'line_no' => $index + 1,
                    'name' => $item['name'],
                    'specification' => $item['specification'] ?? null,
                    'unit' => $item['unit'],
                    'quantity' => $item['quantity'],
                ]);
            }

            // Create bidders and their prices
            $minTotal = null;
            $winnerId = null;

            foreach ($validated['bidders'] as $bidderData) {
                $bidder = EvaluationBidder::create([
                    'evaluation_form_id' => $evalForm->id,
                    'name' => $bidderData['name'],
                    'type' => $bidderData['type'],
                    'total_price' => 0,
                    'is_winner' => false,
                ]);

                $bidderTotal = 0;
                foreach ($bidderData['prices'] as $index => $price) {
                    if (isset($items[$index])) {
                        $lineTotal = $price * $items[$index]->quantity;
                        $bidderTotal += $lineTotal;

                        EvaluationBidderPrice::create([
                            'evaluation_bidder_id' => $bidder->id,
                            'evaluation_item_id' => $items[$index]->id,
                            'unit_price' => $price,
                            'total_price' => $lineTotal,
                        ]);
                    }
                }

                $bidder->update(['total_price' => $bidderTotal]);

                if ($minTotal === null || $bidderTotal < $minTotal) {
                    $minTotal = $bidderTotal;
                    $winnerId = $bidder->id;
                }
            }

            if ($winnerId) {
                EvaluationBidder::where('id', $winnerId)->update(['is_winner' => true]);
                $evalForm->update(['total_amount' => $minTotal]);
            }

            // Create committee members
            foreach ($validated['committee_members'] as $member) {
                EvaluationCommitteeMember::create([
                    'evaluation_form_id' => $evalForm->id,
                    'member_name' => $member['member_name'],
                    'position' => $member['position'] ?? null,
                ]);
            }

            return response()->json(['data' => $evalForm->load(['items', 'bidders.prices', 'committeeMembers'])], 201);
        });
    }

    public function evaluationShow($id)
    {
        $evalForm = EvaluationForm::with(['items', 'bidders.prices', 'committeeMembers', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $evalForm]);
    }

    public function evaluationUpdate(Request $request, $id)
    {
        $evalForm = EvaluationForm::findOrFail($id);
        
        $validated = $request->validate([
            'reference_number' => 'sometimes|string',
            'title' => 'sometimes|string',
            'date' => 'sometimes|date',
            'status' => 'sometimes|in:draft,submitted,approved',
            'items' => 'sometimes|array',
            'bidders' => 'sometimes|array',
            'committee_members' => 'sometimes|array',
        ]);

        return DB::transaction(function () use ($evalForm, $validated, $request) {
            $evalForm->update($validated);

            if (isset($validated['items'])) {
                $evalForm->items()->delete();
                foreach ($validated['items'] as $index => $item) {
                    EvaluationItem::create([
                        'evaluation_form_id' => $evalForm->id,
                        'line_no' => $index + 1,
                        'name' => $item['name'],
                        'specification' => $item['specification'] ?? null,
                        'unit' => $item['unit'],
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            if (isset($validated['bidders'])) {
                $evalForm->bidders()->delete();
                $items = $evalForm->items()->get();
                $minTotal = null;
                $winnerId = null;

                foreach ($validated['bidders'] as $bidderData) {
                    $bidder = EvaluationBidder::create([
                        'evaluation_form_id' => $evalForm->id,
                        'name' => $bidderData['name'],
                        'type' => $bidderData['type'],
                        'total_price' => 0,
                        'is_winner' => false,
                    ]);

                    $bidderTotal = 0;
                    foreach ($bidderData['prices'] as $index => $price) {
                        if (isset($items[$index])) {
                            $lineTotal = $price * $items[$index]->quantity;
                            $bidderTotal += $lineTotal;

                            EvaluationBidderPrice::create([
                                'evaluation_bidder_id' => $bidder->id,
                                'evaluation_item_id' => $items[$index]->id,
                                'unit_price' => $price,
                                'total_price' => $lineTotal,
                            ]);
                        }
                    }

                    $bidder->update(['total_price' => $bidderTotal]);

                    if ($minTotal === null || $bidderTotal < $minTotal) {
                        $minTotal = $bidderTotal;
                        $winnerId = $bidder->id;
                    }
                }

                if ($winnerId) {
                    EvaluationBidder::where('id', $winnerId)->update(['is_winner' => true]);
                    $evalForm->update(['total_amount' => $minTotal]);
                }
            }

            if (isset($validated['committee_members'])) {
                $evalForm->committeeMembers()->delete();
                foreach ($validated['committee_members'] as $member) {
                    EvaluationCommitteeMember::create([
                        'evaluation_form_id' => $evalForm->id,
                        'member_name' => $member['member_name'],
                        'position' => $member['position'] ?? null,
                    ]);
                }
            }

            return response()->json(['data' => $evalForm->load(['items', 'bidders.prices', 'committeeMembers'])]);
        });
    }

    public function evaluationDestroy($id)
    {
        $evalForm = EvaluationForm::findOrFail($id);
        $evalForm->delete();
        return response()->noContent();
    }

    public function evaluationRestore($id)
    {
        $evalForm = EvaluationForm::withTrashed()->findOrFail($id);
        $evalForm->restore();
        return response()->json(['data' => $evalForm->load(['items', 'bidders.prices', 'committeeMembers'])]);
    }

    public function evaluationForceDelete($id)
    {
        $evalForm = EvaluationForm::withTrashed()->findOrFail($id);
        $evalForm->forceDelete();
        return response()->noContent();
    }

    // Form Submissions (Archive)
    public function submissionsIndex()
    {
        $submissions = FormSubmission::with('createdBy')->get();
        return response()->json(['data' => $submissions]);
    }

    public function submissionStore(Request $request)
    {
        $validated = $request->validate([
            'submission_id' => 'required|string',
            'form_type' => 'required|in:RFQ,M2,EVAL',
            'title' => 'required|string',
            'date' => 'required|date',
            'reference_number' => 'required|string',
            'total_amount' => 'required|numeric',
            'status' => 'required|in:draft,submitted,approved',
        ]);

        $submission = FormSubmission::create([
            'submission_id' => $validated['submission_id'],
            'form_type' => $validated['form_type'],
            'title' => $validated['title'],
            'date' => $validated['date'],
            'reference_number' => $validated['reference_number'],
            'total_amount' => $validated['total_amount'],
            'status' => $validated['status'],
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $submission], 201);
    }

    public function submissionShow($id)
    {
        $submission = FormSubmission::with('createdBy')->findOrFail($id);
        return response()->json(['data' => $submission]);
    }

    public function submissionUpdate(Request $request, $id)
    {
        $submission = FormSubmission::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|in:draft,submitted,approved',
        ]);

        $submission->update($validated);
        return response()->json(['data' => $submission]);
    }

    public function submissionDestroy($id)
    {
        $submission = FormSubmission::findOrFail($id);
        $submission->delete();
        return response()->noContent();
    }

    // M-3 (H) Forms (بیع مطلق)
    public function m3hIndex(Request $request)
    {
        $perPage = $request->input('per_page', 7);
        $page = $request->input('page', 1);

        $m3hForms = M3HForm::with(['items', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $m3hForms->items(),
            'pagination' => [
                'current_page' => $m3hForms->currentPage(),
                'last_page' => $m3hForms->lastPage(),
                'per_page' => $m3hForms->perPage(),
                'total' => $m3hForms->total(),
            ]
        ]);
    }

    public function m3hStore(Request $request)
    {
        try {
            $validated = $request->validate([
                'order_number' => 'required|string|unique:m3h_forms,order_number',
                'issue_date' => 'required|date',
                'purchasing_ministry' => 'nullable|string',
                'purchase_request_number' => 'nullable|string',
                'contract_id_number' => 'nullable|string',
                'org_code' => 'nullable|string',
                'project_code' => 'nullable|string',
                'program_code' => 'nullable|string',
                'fund_code' => 'nullable|string',
                'type_code' => 'nullable|string',
                'classification_code' => 'nullable|string',
                'reason_code' => 'nullable|string',
                'item_type_code' => 'nullable|string',
                'delivery_date' => 'nullable|date',
                'delivery_place' => 'nullable|string',
                'total_price' => 'required|numeric',
                'payment_deferred' => 'sometimes|boolean',
                'payment_installments' => 'nullable|string',
                'payment_immediate' => 'sometimes|boolean',
                'receipt_report_date' => 'nullable|date',
                'receipt_report_number' => 'nullable|string',
                'procurement_dept_signature' => 'nullable|string',
                'procurement_dept_date' => 'nullable|date',
                'registry_dept_signature' => 'nullable|string',
                'registry_dept_date' => 'nullable|date',
                'authorized_officer_signature' => 'nullable|string',
                'authorized_officer_date' => 'nullable|date',
                'contractor_signature' => 'nullable|string',
                'contractor_date' => 'nullable|date',
                'financial_controller_signature' => 'nullable|string',
                'financial_controller_date' => 'nullable|date',
                'remarks' => 'nullable|string',
                'status' => 'sometimes|in:draft,submitted,approved,rejected,cancelled',
                'items' => 'sometimes|array',
            ]);

            return DB::transaction(function () use ($validated, $request) {
                $m3hForm = M3HForm::create([
                    'order_number' => $validated['order_number'],
                    'issue_date' => $validated['issue_date'],
                    'purchasing_ministry' => $validated['purchasing_ministry'] ?? null,
                    'purchase_request_number' => $validated['purchase_request_number'] ?? null,
                    'contract_id_number' => $validated['contract_id_number'] ?? null,
                    'org_code' => $validated['org_code'] ?? null,
                    'project_code' => $validated['project_code'] ?? null,
                    'program_code' => $validated['program_code'] ?? null,
                    'fund_code' => $validated['fund_code'] ?? null,
                    'type_code' => $validated['type_code'] ?? null,
                    'classification_code' => $validated['classification_code'] ?? null,
                    'reason_code' => $validated['reason_code'] ?? null,
                    'item_type_code' => $validated['item_type_code'] ?? null,
                    'delivery_date' => $validated['delivery_date'] ?? null,
                    'delivery_place' => $validated['delivery_place'] ?? null,
                    'total_price' => $validated['total_price'],
                    'payment_deferred' => $validated['payment_deferred'] ?? false,
                    'payment_installments' => $validated['payment_installments'] ?? null,
                    'payment_immediate' => $validated['payment_immediate'] ?? false,
                    'receipt_report_date' => $validated['receipt_report_date'] ?? null,
                    'receipt_report_number' => $validated['receipt_report_number'] ?? null,
                    'procurement_dept_signature' => $validated['procurement_dept_signature'] ?? null,
                    'procurement_dept_date' => $validated['procurement_dept_date'] ?? null,
                    'registry_dept_signature' => $validated['registry_dept_signature'] ?? null,
                    'registry_dept_date' => $validated['registry_dept_date'] ?? null,
                    'authorized_officer_signature' => $validated['authorized_officer_signature'] ?? null,
                    'authorized_officer_date' => $validated['authorized_officer_date'] ?? null,
                    'contractor_signature' => $validated['contractor_signature'] ?? null,
                    'contractor_date' => $validated['contractor_date'] ?? null,
                    'financial_controller_signature' => $validated['financial_controller_signature'] ?? null,
                    'financial_controller_date' => $validated['financial_controller_date'] ?? null,
                    'remarks' => $validated['remarks'] ?? null,
                    'status' => $validated['status'] ?? 'draft',
                    'created_by' => $request->user()->id,
                ]);

                if (isset($validated['items']) && is_array($validated['items']) && count($validated['items']) > 0) {
                    foreach ($validated['items'] as $index => $item) {
                        M3HItem::create([
                            'm3h_form_id' => $m3hForm->id,
                            'line_no' => $item['line_no'] ?? ($index + 1),
                            'description' => $item['description'] ?? '',
                            'type_code' => $item['type_code'] ?? '',
                            'classification_code' => $item['classification_code'] ?? '',
                            'quantity' => $item['quantity'] ?? 0,
                            'unit' => $item['unit'] ?? '',
                            'unit_price' => $item['unit_price'] ?? 0,
                            'total_price' => $item['total_price'] ?? 0,
                        ]);
                    }
                }

                return response()->json(['data' => $m3hForm->load('items')], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function m3hShow($id)
    {
        $m3hForm = M3HForm::with(['items', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $m3hForm, 'items' => $m3hForm->items]);
    }

    public function m3hUpdate(Request $request, $id)
    {
        try {
            $m3hForm = M3HForm::findOrFail($id);

            $validated = $request->validate([
                'order_number' => 'sometimes|string|unique:m3h_forms,order_number,' . $id,
                'issue_date' => 'sometimes|date',
                'purchasing_ministry' => 'nullable|string',
                'purchase_request_number' => 'nullable|string',
                'contract_id_number' => 'nullable|string',
                'org_code' => 'nullable|string',
                'project_code' => 'nullable|string',
                'program_code' => 'nullable|string',
                'fund_code' => 'nullable|string',
                'type_code' => 'nullable|string',
                'classification_code' => 'nullable|string',
                'reason_code' => 'nullable|string',
                'item_type_code' => 'nullable|string',
                'delivery_date' => 'nullable|date',
                'delivery_place' => 'nullable|string',
                'total_price' => 'sometimes|numeric',
                'payment_deferred' => 'sometimes|boolean',
                'payment_installments' => 'nullable|string',
                'payment_immediate' => 'sometimes|boolean',
                'receipt_report_date' => 'nullable|date',
                'receipt_report_number' => 'nullable|string',
                'procurement_dept_signature' => 'nullable|string',
                'procurement_dept_date' => 'nullable|date',
                'registry_dept_signature' => 'nullable|string',
                'registry_dept_date' => 'nullable|date',
                'authorized_officer_signature' => 'nullable|string',
                'authorized_officer_date' => 'nullable|date',
                'contractor_signature' => 'nullable|string',
                'contractor_date' => 'nullable|date',
                'financial_controller_signature' => 'nullable|string',
                'financial_controller_date' => 'nullable|date',
                'remarks' => 'nullable|string',
                'status' => 'sometimes|in:draft,submitted,approved,rejected,cancelled',
                'items' => 'sometimes|array',
            ]);

            return DB::transaction(function () use ($m3hForm, $validated) {
                $m3hForm->update($validated);

                if (isset($validated['items']) && is_array($validated['items'])) {
                    $m3hForm->items()->delete();

                    foreach ($validated['items'] as $index => $item) {
                        M3HItem::create([
                            'm3h_form_id' => $m3hForm->id,
                            'line_no' => $item['line_no'] ?? ($index + 1),
                            'description' => $item['description'] ?? '',
                            'type_code' => $item['type_code'] ?? '',
                            'classification_code' => $item['classification_code'] ?? '',
                            'quantity' => $item['quantity'] ?? 0,
                            'unit' => $item['unit'] ?? '',
                            'unit_price' => $item['unit_price'] ?? 0,
                            'total_price' => $item['total_price'] ?? 0,
                        ]);
                    }
                }

                return response()->json(['data' => $m3hForm->load('items')]);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function m3hDestroy($id)
    {
        $m3hForm = M3HForm::findOrFail($id);
        $m3hForm->delete();
        return response()->noContent();
    }
}
