<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Office Categories
        $categories = [
            ['code' => 'VP', 'name' => 'معاونیت‌ها', 'active' => true],
            ['code' => 'FAC', 'name' => 'پوهنحی‌ها', 'active' => true],
            ['code' => 'DIR', 'name' => 'آمریت‌ها', 'active' => true],
        ];

        foreach ($categories as $category) {
            DB::table('office_categories')->updateOrInsert(
                ['code' => $category['code']],
                $category + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        // Get category IDs
        $vpCatId = DB::table('office_categories')->where('code', 'VP')->value('id');
        $facCatId = DB::table('office_categories')->where('code', 'FAC')->value('id');
        $dirCatId = DB::table('office_categories')->where('code', 'DIR')->value('id');

        // Offices
        $offices = [
            // Vice Presidencies
            ['office_category_id' => $vpCatId, 'code' => 'DGG', 'name' => 'معاونیت امور علمی', 'name_ps' => 'معاونیت امور علمی', 'name_fa' => 'معاونیت امور علمی', 'active' => true],
            ['office_category_id' => $vpCatId, 'code' => 'DFA', 'name' => 'معاونیت مالی و اداری', 'name_ps' => 'معاونیت مالی و اداری', 'name_fa' => 'معاونیت مالی و اداری', 'active' => true],
            ['office_category_id' => $vpCatId, 'code' => 'DR', 'name' => 'معاونیت تحقیقات', 'name_ps' => 'معاونیت تحقیقات', 'name_fa' => 'معاونیت تحقیقات', 'active' => true],
            ['office_category_id' => $vpCatId, 'code' => 'DSA', 'name' => 'معاونیت امور محصلان', 'name_ps' => 'معاونیت امور محصلان', 'name_fa' => 'معاونیت امور محصلان', 'active' => true],
            
            // Faculties
            ['office_category_id' => $facCatId, 'code' => 'ENG', 'name' => 'پوهنحی انجنیری', 'name_ps' => 'پوهنحی انجنیری', 'name_fa' => 'پوهنحی انجنیری', 'active' => true],
            ['office_category_id' => $facCatId, 'code' => 'CS', 'name' => 'پوهنحی کمپیوتر ساینس', 'name_ps' => 'پوهنحی کمپیوتر ساینس', 'name_fa' => 'پوهنحی کمپیوتر ساینس', 'active' => true],
            ['office_category_id' => $facCatId, 'code' => 'ECO', 'name' => 'پوهنحی اقتصاد', 'name_ps' => 'پوهنحی اقتصاد', 'name_fa' => 'پوهنحی اقتصاد', 'active' => true],
            ['office_category_id' => $facCatId, 'code' => 'LAW', 'name' => 'پوهنحی حقوق و علوم سیاسی', 'name_ps' => 'پوهنحی حقوق و علوم سیاسی', 'name_fa' => 'پوهنحی حقوق و علوم سیاسی', 'active' => true],
            
            // Directorates
            ['office_category_id' => $dirCatId, 'code' => 'PROC', 'name' => 'آمریت تهیه و تدارکات', 'name_ps' => 'آمریت تهیه و تدارکات', 'name_fa' => 'آمریت تهیه و تدارکات', 'active' => true],
            ['office_category_id' => $dirCatId, 'code' => 'FIN', 'name' => 'آمریت مالی و حسابی', 'name_ps' => 'آمریت مالی و حسابی', 'name_fa' => 'آمریت مالی و حسابی', 'active' => true],
            ['office_category_id' => $dirCatId, 'code' => 'IT', 'name' => 'آمریت تکنالوژی معلوماتی', 'name_ps' => 'آمریت تکنالوژی معلوماتی', 'name_fa' => 'آمریت تکنالوژی معلوماتی', 'active' => true],
        ];

        foreach ($offices as $office) {
            DB::table('offices')->updateOrInsert(
                ['code' => $office['code']],
                $office + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        // Get office IDs
        $dggOfficeId = DB::table('offices')->where('code', 'DGG')->value('id');
        $engOfficeId = DB::table('offices')->where('code', 'ENG')->value('id');
        $procOfficeId = DB::table('offices')->where('code', 'PROC')->value('id');

        // Companies
        $companies = [
            ['legal_name' => 'Afghan Tech Solutions', 'company_type' => 'services', 'registration_no' => 'REG-001', 'contact_person' => 'Ahmad Karimi', 'phone' => '+937005551234', 'email' => 'info@afghantech.af', 'address' => 'Kabul, Afghanistan', 'eligibility_status' => 'eligible'],
            ['legal_name' => 'Kabul Construction Co', 'company_type' => 'construction', 'registration_no' => 'REG-002', 'contact_person' => 'Mohammad Hassan', 'phone' => '+937005555678', 'email' => 'info@kabulconstruction.af', 'address' => 'Kabul, Afghanistan', 'eligibility_status' => 'eligible'],
            ['legal_name' => 'Afghan Medical Supplies', 'company_type' => 'medical', 'registration_no' => 'REG-003', 'contact_person' => 'Dr. Fatima Noori', 'phone' => '+937005559012', 'email' => 'info@afghanmedical.af', 'address' => 'Kabul, Afghanistan', 'eligibility_status' => 'eligible'],
            ['legal_name' => 'Educational Equipment Ltd', 'company_type' => 'equipment', 'registration_no' => 'REG-004', 'contact_person' => 'Abdul Wahid', 'phone' => '+937005553456', 'email' => 'info@eduequip.af', 'address' => 'Kabul, Afghanistan', 'eligibility_status' => 'eligible'],
        ];

        foreach ($companies as $company) {
            DB::table('companies')->updateOrInsert(
                ['registration_no' => $company['registration_no']],
                $company + ['experience' => '5+ years', 'created_at' => $now, 'updated_at' => $now]
            );
        }

        // Get company IDs
        $techCompanyId = DB::table('companies')->where('registration_no', 'REG-001')->value('id');
        $constCompanyId = DB::table('companies')->where('registration_no', 'REG-002')->value('id');
        $medCompanyId = DB::table('companies')->where('registration_no', 'REG-003')->value('id');
        $eduCompanyId = DB::table('companies')->where('registration_no', 'REG-004')->value('id');

        // Vendors
        $vendors = [
            ['company_id' => $techCompanyId, 'account_no' => 'V-001', 'tax_id' => 'TAX-001', 'bank_account' => 'ACC-001', 'contact_info' => 'Available 24/7'],
            ['company_id' => $constCompanyId, 'account_no' => 'V-002', 'tax_id' => 'TAX-002', 'bank_account' => 'ACC-002', 'contact_info' => 'Available Mon-Fri'],
            ['company_id' => $medCompanyId, 'account_no' => 'V-003', 'tax_id' => 'TAX-003', 'bank_account' => 'ACC-003', 'contact_info' => 'Emergency available'],
        ];

        foreach ($vendors as $vendor) {
            DB::table('vendors')->updateOrInsert(
                ['account_no' => $vendor['account_no']],
                $vendor + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        // Procurement Orders
        $orders = [
            [
                'order_no' => 'PO-2026-0001',
                'title' => 'Computer Equipment for Engineering Faculty',
                'office_id' => $engOfficeId,
                'company_id' => $techCompanyId,
                'category' => 'equipment',
                'priority' => 'high',
                'status' => 'completed',
                'requested_date' => '2026-07-01',
                'required_date' => '2026-08-15',
                'amount' => 150000,
                'equipment' => 50,
                'items' => 25,
                'currency' => 'AFN',
                'description' => 'Purchase of computers and lab equipment for engineering faculty',
            ],
            [
                'order_no' => 'PO-2026-0002',
                'title' => 'Office Supplies for Procurement Directorate',
                'office_id' => $procOfficeId,
                'company_id' => $eduCompanyId,
                'category' => 'supplies',
                'priority' => 'medium',
                'status' => 'in_progress',
                'requested_date' => '2026-07-10',
                'required_date' => '2026-07-30',
                'amount' => 45000,
                'equipment' => 0,
                'items' => 100,
                'currency' => 'AFN',
                'description' => 'Office stationery and supplies for procurement directorate',
            ],
            [
                'order_no' => 'PO-2026-0003',
                'title' => 'Medical Supplies for Health Center',
                'office_id' => $dggOfficeId,
                'company_id' => $medCompanyId,
                'category' => 'supplies',
                'priority' => 'urgent',
                'status' => 'pending',
                'requested_date' => '2026-07-20',
                'required_date' => '2026-07-25',
                'amount' => 75000,
                'equipment' => 10,
                'items' => 200,
                'currency' => 'AFN',
                'description' => 'Emergency medical supplies for university health center',
            ],
        ];

        foreach ($orders as $order) {
            DB::table('procurement_orders')->updateOrInsert(
                ['order_no' => $order['order_no']],
                $order + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        // Contracts
        $contracts = [
            [
                'contract_no' => 'CT-2026-001',
                'company_id' => $techCompanyId,
                'title' => 'IT Infrastructure Upgrade',
                'amount' => 500000,
                'currency' => 'AFN',
                'tier' => 'tier2',
                'start_date' => '2026-08-01',
                'end_date' => '2026-12-31',
                'status' => 'active',
                'progress_percent' => 25,
                'description' => 'Complete IT infrastructure upgrade for university campus',
            ],
            [
                'contract_no' => 'CT-2026-002',
                'company_id' => $constCompanyId,
                'title' => 'Building Renovation',
                'amount' => 1200000,
                'currency' => 'AFN',
                'tier' => 'tier3',
                'start_date' => '2026-07-15',
                'end_date' => '2027-01-15',
                'status' => 'active',
                'progress_percent' => 40,
                'description' => 'Renovation of main administrative building',
            ],
        ];

        foreach ($contracts as $contract) {
            DB::table('contracts')->updateOrInsert(
                ['contract_no' => $contract['contract_no']],
                $contract + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        // Inventory Locations
        $inventoryLocations = [
            ['office_id' => $procOfficeId, 'code' => 'MAIN-STORE', 'name' => 'انبار اصلی', 'active' => true],
            ['office_id' => $engOfficeId, 'code' => 'ENG-STORE', 'name' => 'انبار پوهنحی انجنیری', 'active' => true],
        ];

        foreach ($inventoryLocations as $location) {
            DB::table('inventory_locations')->updateOrInsert(
                ['code' => $location['code']],
                $location + ['created_at' => $now, 'updated_at' => $now]
            );
        }

        // Get main store ID
        $mainStoreId = DB::table('inventory_locations')->where('code', 'MAIN-STORE')->value('id');

        // Inventory Items

        $inventoryItems = [
            [
                'code' => 'INV-001',
                'name' => 'Laptop Computer',
                'item_type' => 'equipment',
                'category' => 'IT',
                'description' => 'Dell Latitude 5520 Laptop',
                'unit' => 'piece',
                'quantity_on_hand' => 45,
                'min_stock' => 10,
                'max_stock' => 100,
                'reorder_point' => 15,
                'inventory_location_id' => $mainStoreId,
                'condition' => 'new',
            ],
            [
                'code' => 'INV-002',
                'name' => 'Office Chair',
                'item_type' => 'furniture',
                'category' => 'Office',
                'description' => 'Ergonomic office chair with armrests',
                'unit' => 'piece',
                'quantity_on_hand' => 120,
                'min_stock' => 20,
                'max_stock' => 200,
                'reorder_point' => 30,
                'inventory_location_id' => $mainStoreId,
                'condition' => 'new',
            ],
            [
                'code' => 'INV-003',
                'name' => 'Printer Paper',
                'item_type' => 'supplies',
                'category' => 'Office',
                'description' => 'A4 size printer paper, 500 sheets per ream',
                'unit' => 'ream',
                'quantity_on_hand' => 85,
                'min_stock' => 20,
                'max_stock' => 150,
                'reorder_point' => 25,
                'inventory_location_id' => $mainStoreId,
                'condition' => 'new',
            ],
        ];

        foreach ($inventoryItems as $item) {
            DB::table('inventory_items')->updateOrInsert(
                ['code' => $item['code']],
                $item + ['currency' => 'AFN', 'created_at' => $now, 'updated_at' => $now]
            );
        }
    }
}
