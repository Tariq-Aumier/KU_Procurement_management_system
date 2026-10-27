<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SampleDataSeeder::class,
        ]);

        $now = now();
        foreach ([
            ['code'=>'admin','name'=>'System Administrator'], ['code'=>'manager','name'=>'Procurement Manager'], ['code'=>'officer','name'=>'Procurement Officer'], ['code'=>'requester','name'=>'Requesting Office'], ['code'=>'evaluator','name'=>'Evaluation Committee Member'], ['code'=>'storekeeper','name'=>'Storekeeper'], ['code'=>'finance','name'=>'Finance Officer'], ['code'=>'auditor','name'=>'Auditor'],
        ] as $role) \Illuminate\Support\Facades\DB::table('roles')->updateOrInsert(['code'=>$role['code']], $role + ['is_system'=>true,'created_at'=>$now,'updated_at'=>$now]);
        foreach (['users.manage','roles.manage','settings.manage','offices.manage','vendors.manage','orders.manage','rfqs.manage','bids.evaluate','awards.approve','contracts.manage','inventory.manage','documents.manage','reports.view','backups.manage','audit.view'] as $permission) { $parts=explode('.', $permission, 2); \Illuminate\Support\Facades\DB::table('permissions')->updateOrInsert(['code'=>$permission], ['module'=>$parts[0],'action'=>$parts[1],'description'=>str_replace('.',' ',ucwords($permission,'.')),'created_at'=>$now,'updated_at'=>$now]); }
        $allPermissionIds = \Illuminate\Support\Facades\DB::table('permissions')->pluck('id');
        $adminRoleId = \Illuminate\Support\Facades\DB::table('roles')->where('code','admin')->value('id');
        foreach ($allPermissionIds as $permissionId) \Illuminate\Support\Facades\DB::table('role_permissions')->updateOrInsert(['role_id'=>$adminRoleId,'permission_id'=>$permissionId]);
        User::updateOrCreate(['username' => 'admin'], [
            'name' => 'System Administrator', 'email' => 'admin@kabuluniversity.edu.af',
            'password' => 'Admin@123', 'role' => 'admin', 'active' => true,
        ]);
        User::updateOrCreate(['username' => 'manager'], [
            'name' => 'Procurement Manager', 'email' => 'manager@kabuluniversity.edu.af',
            'password' => 'Manager@123', 'role' => 'manager', 'active' => true,
        ]);
        $adminRole = \Illuminate\Support\Facades\DB::table('roles')->where('code','admin')->value('id');
        $managerRole = \Illuminate\Support\Facades\DB::table('roles')->where('code','manager')->value('id');
        $adminUser = User::where('username','admin')->first(); $managerUser = User::where('username','manager')->first();
        \Illuminate\Support\Facades\DB::table('user_roles')->updateOrInsert(['user_id'=>$adminUser->id,'role_id'=>$adminRole,'office_id'=>null], ['created_at'=>$now,'updated_at'=>$now]);
        \Illuminate\Support\Facades\DB::table('user_roles')->updateOrInsert(['user_id'=>$managerUser->id,'role_id'=>$managerRole,'office_id'=>null], ['created_at'=>$now,'updated_at'=>$now]);
        \Illuminate\Support\Facades\DB::table('system_settings')->updateOrInsert(['setting_key'=>'procurement.default_currency'], ['value_json'=>json_encode('AFN'),'is_secret'=>false,'updated_by'=>$adminUser->id,'created_at'=>$now,'updated_at'=>$now]);
        \Illuminate\Support\Facades\DB::table('office_categories')->updateOrInsert(['code'=>'ADMIN'],['name'=>'Administration','active'=>true,'created_at'=>now(),'updated_at'=>now()]);
        $category = \Illuminate\Support\Facades\DB::table('office_categories')->where('code','ADMIN')->value('id');
        \Illuminate\Support\Facades\DB::table('offices')->updateOrInsert(['code'=>'PROC'],['office_category_id'=>$category,'name'=>'Procurement Office','active'=>true,'created_at'=>now(),'updated_at'=>now()]);
        $office = \Illuminate\Support\Facades\DB::table('offices')->where('code','PROC')->value('id');
        \Illuminate\Support\Facades\DB::table('inventory_locations')->updateOrInsert(['code'=>'MAIN-STORE'],['office_id'=>$office,'name'=>'Main Store','active'=>true,'created_at'=>now(),'updated_at'=>now()]);
    }
}
