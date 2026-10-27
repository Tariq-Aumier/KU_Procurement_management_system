<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProcurementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_company_and_order(): void
    {
        $user = User::factory()->create(['username' => 'api-admin', 'password' => 'Admin@123', 'role' => 'admin', 'active' => true]);
        $token = $this->postJson('/api/v1/auth/login', ['username' => 'api-admin', 'password' => 'Admin@123'])->assertOk()->json('data.accessToken');
        $headers = ['Authorization' => 'Bearer '.$token];
        $company = $this->postJson('/api/v1/companies', ['legal_name'=>'Test Supply Ltd','company_type'=>'services','registration_no'=>'TEST-001','contact_person'=>'Ali','email'=>'ali@example.test'], $headers)->assertCreated()->json('data');
        $this->postJson('/api/v1/orders', ['order_no'=>'PO-TEST-001','title'=>'Office supplies','company_id'=>$company['id'],'category'=>'retail','priority'=>'high','requested_date'=>'2026-07-25','required_date'=>'2026-08-01','amount'=>1000,'currency'=>'AFN'], $headers)->assertCreated()->assertJsonPath('data.status','draft');
    }

    public function test_protected_api_rejects_anonymous_requests_and_sets_security_headers(): void
    {
        $this->getJson('/api/v1/dashboard')->assertUnauthorized()->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY');
    }

    public function test_admin_can_use_governance_reporting_and_backup_endpoints(): void
    {
        $admin = User::factory()->create(['username' => 'governance-admin', 'password' => 'Admin@123', 'role' => 'admin', 'active' => true]);
        $token = $this->postJson('/api/v1/auth/login', ['username' => 'governance-admin', 'password' => 'Admin@123'])->assertOk()->json('data.accessToken');
        $headers = ['Authorization' => 'Bearer '.$token];
        $this->getJson('/api/v1/roles', $headers)->assertOk();
        $this->getJson('/api/v1/reports/contracts', $headers)->assertOk()->assertJsonPath('meta.report', 'contracts');
        $this->postJson('/api/v1/backups', [], $headers)->assertCreated()->assertJsonPath('data.status', 'completed');
    }
}
