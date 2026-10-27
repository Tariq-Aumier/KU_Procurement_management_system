<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contract;
use App\Models\ProcurementOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'data' => [
                'contractDistributionByValue' => $this->contractDistributionByValue(),
                'contractStatusBreakdown' => $this->contractStatusBreakdown(),
                'orderPriorityDistribution' => $this->orderPriorityDistribution(),
                'companyDistributionByType' => $this->companyDistributionByType(),
                'topCompaniesByContractValue' => $this->topCompaniesByContractValue(),
            ]
        ]);
    }

    private function contractDistributionByValue()
    {
        $contracts = Contract::all();

        $tiers = [
            'tier1' => [
                'label' => '0 – 5,000',
                'range' => 'Small (0 – 5K)',
                'count' => $contracts->where('tier', 'tier1')->count(),
                'value' => (float) $contracts->where('tier', 'tier1')->sum('amount'),
            ],
            'tier2' => [
                'label' => '5,000 – 50,000',
                'range' => 'Medium (5K – 50K)',
                'count' => $contracts->where('tier', 'tier2')->count(),
                'value' => (float) $contracts->where('tier', 'tier2')->sum('amount'),
            ],
            'tier3' => [
                'label' => '50,000 – 500,000',
                'range' => 'Large (50K – 500K)',
                'count' => $contracts->where('tier', 'tier3')->count(),
                'value' => (float) $contracts->where('tier', 'tier3')->sum('amount'),
            ],
            'tier4' => [
                'label' => '500,000+',
                'range' => 'Enterprise (500K+)',
                'count' => $contracts->where('tier', 'tier4')->count(),
                'value' => (float) $contracts->where('tier', 'tier4')->sum('amount'),
            ],
        ];

        $totalValue = (float) $contracts->sum('amount');

        return [
            'tiers' => $tiers,
            'total_value' => $totalValue,
            'total_contracts' => $contracts->count(),
        ];
    }

    private function contractStatusBreakdown()
    {
        $contracts = Contract::all();
        $total = $contracts->count();

        $statuses = [
            'draft' => [
                'count' => $contracts->where('status', 'draft')->count(),
                'percentage' => $total > 0 ? round(($contracts->where('status', 'draft')->count() / $total) * 100, 2) : 0,
            ],
            'active' => [
                'count' => $contracts->where('status', 'active')->count(),
                'percentage' => $total > 0 ? round(($contracts->where('status', 'active')->count() / $total) * 100, 2) : 0,
            ],
            'completed' => [
                'count' => $contracts->where('status', 'completed')->count(),
                'percentage' => $total > 0 ? round(($contracts->where('status', 'completed')->count() / $total) * 100, 2) : 0,
            ],
            'cancelled' => [
                'count' => $contracts->where('status', 'cancelled')->count(),
                'percentage' => $total > 0 ? round(($contracts->where('status', 'cancelled')->count() / $total) * 100, 2) : 0,
            ],
        ];

        return [
            'total' => $total,
            'statuses' => $statuses,
        ];
    }

    private function orderPriorityDistribution()
    {
        $orders = ProcurementOrder::all();

        $priorities = [
            'urgent' => $orders->where('priority', 'urgent')->count(),
            'high' => $orders->where('priority', 'high')->count(),
            'medium' => $orders->where('priority', 'medium')->count(),
            'low' => $orders->where('priority', 'low')->count(),
        ];

        return [
            'priorities' => $priorities,
            'total' => $orders->count(),
        ];
    }

    private function companyDistributionByType()
    {
        $companies = Company::all();
        $total = $companies->count();

        $types = [
            'construction' => [
                'count' => $companies->where('company_type', 'construction')->count(),
                'percentage' => $total > 0 ? round(($companies->where('company_type', 'construction')->count() / $total) * 100, 2) : 0,
            ],
            'logistics' => [
                'count' => $companies->where('company_type', 'logistics')->count(),
                'percentage' => $total > 0 ? round(($companies->where('company_type', 'logistics')->count() / $total) * 100, 2) : 0,
            ],
            'retail' => [
                'count' => $companies->where('company_type', 'retail')->count(),
                'percentage' => $total > 0 ? round(($companies->where('company_type', 'retail')->count() / $total) * 100, 2) : 0,
            ],
            'services' => [
                'count' => $companies->where('company_type', 'services')->count(),
                'percentage' => $total > 0 ? round(($companies->where('company_type', 'services')->count() / $total) * 100, 2) : 0,
            ],
            'medical' => [
                'count' => $companies->where('company_type', 'medical')->count(),
                'percentage' => $total > 0 ? round(($companies->where('company_type', 'medical')->count() / $total) * 100, 2) : 0,
            ],
            'equipment' => [
                'count' => $companies->where('company_type', 'equipment')->count(),
                'percentage' => $total > 0 ? round(($companies->where('company_type', 'equipment')->count() / $total) * 100, 2) : 0,
            ],
            'logistics_construction' => [
                'count' => $companies->where('company_type', 'logistics_construction')->count(),
                'percentage' => $total > 0 ? round(($companies->where('company_type', 'logistics_construction')->count() / $total) * 100, 2) : 0,
            ],
            'other' => [
                'count' => $companies->where('company_type', 'other')->count(),
                'percentage' => $total > 0 ? round(($companies->where('company_type', 'other')->count() / $total) * 100, 2) : 0,
            ],
        ];

        return [
            'total' => $total,
            'types' => $types,
        ];
    }

    private function topCompaniesByContractValue()
    {
        $companies = Company::with(['contracts'])
            ->get()
            ->map(function ($company) {
                $totalContractValue = $company->contracts->sum('amount');
                return [
                    'id' => $company->id,
                    'name' => $company->legal_name,
                    'contract_count' => $company->contracts->count(),
                    'total_value' => (float) $totalContractValue,
                ];
            })
            ->sortByDesc('total_value')
            ->take(5)
            ->values();

        return [
            'companies' => $companies,
        ];
    }
}
