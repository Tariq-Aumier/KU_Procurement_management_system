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
    public function m2Index()
    {
        $m2Forms = M2Form::with(['requestRows', 'createdBy'])->get();
        return response()->json(['data' => $m2Forms]);
    }

    public function m2Store(Request $request)
    {
        $validated = $request->validate([
            'sequence_number' => 'required|string',
            'date' => 'required|date',
            'requesting_department' => 'required|string',
            'approval_department' => 'required|string',
            'fund_source' => 'required|string',
            'budget_code' => 'required|string',
            'rows' => 'array',
            'rows.*.description' => 'required|string',
            'rows.*.unit' => 'required|string',
            'rows.*.quantity' => 'required|numeric',
            'rows.*.unit_price' => 'required|numeric',
            'rows.*.estimated_amount' => 'required|numeric',
            'rows.*.notes' => 'nullable|string',
            'rows.*.requesting_branch' => 'nullable|string',
            'rows.*.supplier' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $m2Form = M2Form::create([
                'sequence_number' => $validated['sequence_number'],
                'date' => $validated['date'],
                'requesting_department' => $validated['requesting_department'],
                'approval_department' => $validated['approval_department'],
                'fund_source' => $validated['fund_source'],
                'budget_code' => $validated['budget_code'],
                'total_amount' => 0,
                'status' => 'draft',
                'created_by' => $request->user()->id,
            ]);

            $totalAmount = 0;
            foreach ($validated['rows'] as $index => $row) {
                $lineTotal = $row['quantity'] * $row['unit_price'];
                $totalAmount += $lineTotal;

                M2RequestRow::create([
                    'm2_form_id' => $m2Form->id,
                    'line_no' => $index + 1,
                    'description' => $row['description'],
                    'unit' => $row['unit'],
                    'quantity' => $row['quantity'],
                    'unit_price' => $row['unit_price'],
                    'estimated_amount' => $row['estimated_amount'],
                    'notes' => $row['notes'] ?? null,
                    'requesting_branch' => $row['requesting_branch'] ?? null,
                    'supplier' => $row['supplier'] ?? null,
                ]);
            }

            $m2Form->update(['total_amount' => $totalAmount]);

            return response()->json(['data' => $m2Form->load('requestRows')], 201);
        });
    }

    public function m2Show($id)
    {
        $m2Form = M2Form::with(['requestRows', 'createdBy'])->findOrFail($id);
        return response()->json(['data' => $m2Form]);
    }

    public function m2Update(Request $request, $id)
    {
        $m2Form = M2Form::findOrFail($id);
        
        $validated = $request->validate([
            'sequence_number' => 'sometimes|string',
            'date' => 'sometimes|date',
            'requesting_department' => 'sometimes|string',
            'approval_department' => 'sometimes|string',
            'fund_source' => 'sometimes|string',
            'budget_code' => 'sometimes|string',
            'status' => 'sometimes|in:draft,submitted,approved',
            'rows' => 'sometimes|array',
        ]);

        return DB::transaction(function () use ($m2Form, $validated, $request) {
            $m2Form->update($validated);

            if (isset($validated['rows'])) {
                $m2Form->requestRows()->delete();
                $totalAmount = 0;
                
                foreach ($validated['rows'] as $index => $row) {
                    $lineTotal = $row['quantity'] * $row['unit_price'];
                    $totalAmount += $lineTotal;

                    M2RequestRow::create([
                        'm2_form_id' => $m2Form->id,
                        'line_no' => $index + 1,
                        'description' => $row['description'],
                        'unit' => $row['unit'],
                        'quantity' => $row['quantity'],
                        'unit_price' => $row['unit_price'],
                        'estimated_amount' => $row['estimated_amount'],
                        'notes' => $row['notes'] ?? null,
                        'requesting_branch' => $row['requesting_branch'] ?? null,
                        'supplier' => $row['supplier'] ?? null,
                    ]);
                }

                $m2Form->update(['total_amount' => $totalAmount]);
            }

            return response()->json(['data' => $m2Form->load('requestRows')]);
        });
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
}
