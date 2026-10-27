<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyViolation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = Company::with(['vendor', 'violations']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('legal_name', 'like', "%{$search}%")
                  ->orWhere('registration_no', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%");
            });
        }

        if ($request->filled('eligibility_status')) {
            $query->where('eligibility_status', $request->input('eligibility_status'));
        }

        if ($request->filled('company_type')) {
            $query->where('company_type', $request->input('company_type'));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $companies = $query->orderByDesc('id')->paginate($size);

        return response()->json([
            'data' => $companies->items(),
            'meta' => [
                'page' => $companies->currentPage(),
                'pageSize' => $companies->perPage(),
                'total' => $companies->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $company = Company::with(['vendor', 'violations', 'procurementOrders', 'contracts'])
            ->findOrFail($id);

        return response()->json(['data' => $company]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'legal_name' => 'required|string|max:255',
            'company_type' => ['required', Rule::in(['construction', 'logistics', 'retail', 'services', 'logistics_construction', 'medical', 'equipment', 'other'])],
            'registration_no' => 'required|string|max:100|unique:companies',
            'contact_person' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'experience' => 'nullable|string',
            'eligibility_status' => ['sometimes', Rule::in(['active', 'suspended', 'blacklisted'])],
        ]);

        $data['created_by'] = $request->user()->id;

        $company = Company::create($data);

        return response()->json(['data' => $company], 201);
    }

    public function update(Request $request, int $id)
    {
        $company = Company::findOrFail($id);

        $data = $request->validate([
            'legal_name' => 'sometimes|string|max:255',
            'company_type' => ['sometimes', Rule::in(['construction', 'logistics', 'retail', 'services', 'logistics_construction', 'medical', 'equipment', 'other'])],
            'registration_no' => 'sometimes|string|max:100|unique:companies,registration_no,' . $id,
            'contact_person' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'experience' => 'nullable|string',
            'eligibility_status' => ['sometimes', Rule::in(['active', 'suspended', 'blacklisted'])],
        ]);

        $company->update($data);

        return response()->json(['data' => $company->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $company = Company::findOrFail($id);
        $company->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $id)
    {
        $company = Company::withTrashed()->findOrFail($id);
        $company->restore();

        return response()->json(['data' => $company]);
    }

    public function blacklist(Request $request, int $id)
    {
        $data = $request->validate([
            'reason' => 'required|string',
        ]);

        $company = Company::findOrFail($id);
        $company->blacklist($data['reason']);

        return response()->json(['data' => $company->fresh()]);
    }

    public function reinstate(Request $request, int $id)
    {
        $company = Company::findOrFail($id);
        $company->reinstate();

        return response()->json(['data' => $company->fresh()]);
    }

    public function violations(Request $request, int $companyId)
    {
        $company = Company::findOrFail($companyId);
        $violations = $company->violations()->orderByDesc('violation_date')->paginate(50);

        return response()->json(['data' => $violations->items()]);
    }

    public function addViolation(Request $request, int $companyId)
    {
        $company = Company::findOrFail($companyId);

        $data = $request->validate([
            'violation_date' => 'required|date',
            'description' => 'required|string',
            'severity' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'status' => ['sometimes', Rule::in(['open', 'resolved', 'closed'])],
        ]);

        $violation = $company->violations()->create($data);

        return response()->json(['data' => $violation], 201);
    }
}
