<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('api_tokens', fn (Blueprint $t) => $t->index(['user_id','expires_at'], 'api_tokens_user_expiry_idx'));
        Schema::table('companies', fn (Blueprint $t) => $t->index(['eligibility_status','deleted_at'], 'companies_status_deleted_idx'));
        Schema::table('procurement_orders', fn (Blueprint $t) => $t->index(['status','priority','deleted_at'], 'orders_status_priority_deleted_idx'));
        Schema::table('rfqs', fn (Blueprint $t) => $t->index(['status','closing_at','deleted_at'], 'rfqs_status_closing_deleted_idx'));
        Schema::table('bids', fn (Blueprint $t) => $t->index(['rfq_id','status','total_price'], 'bids_rfq_status_price_idx'));
        Schema::table('contracts', fn (Blueprint $t) => $t->index(['status','end_date','deleted_at'], 'contracts_status_end_deleted_idx'));
        Schema::table('inventory_items', fn (Blueprint $t) => $t->index(['inventory_location_id','deleted_at'], 'inventory_location_deleted_idx'));
        Schema::table('inventory_movements', fn (Blueprint $t) => $t->index(['inventory_item_id','movement_at'], 'inventory_movements_item_date_idx'));
        Schema::table('documents', fn (Blueprint $t) => $t->index(['entity_type','entity_id','deleted_at'], 'documents_entity_deleted_idx'));
        Schema::table('audit_logs', fn (Blueprint $t) => $t->index(['actor_user_id','created_at'], 'audit_actor_date_idx'));
        Schema::table('audit_logs', fn (Blueprint $t) => $t->index(['entity_type','action','created_at'], 'audit_entity_action_date_idx'));
        Schema::table('notifications', fn (Blueprint $t) => $t->index(['user_id','read_at','created_at'], 'notifications_user_read_date_idx'));
    }
    public function down(): void {
        foreach ([['api_tokens','api_tokens_user_expiry_idx'],['companies','companies_status_deleted_idx'],['procurement_orders','orders_status_priority_deleted_idx'],['rfqs','rfqs_status_closing_deleted_idx'],['bids','bids_rfq_status_price_idx'],['contracts','contracts_status_end_deleted_idx'],['inventory_items','inventory_location_deleted_idx'],['inventory_movements','inventory_movements_item_date_idx'],['documents','documents_entity_deleted_idx'],['audit_logs','audit_actor_date_idx'],['audit_logs','audit_entity_action_date_idx'],['notifications','notifications_user_read_date_idx']] as [$table,$index]) Schema::table($table, fn (Blueprint $t) => $t->dropIndex($index));
    }
};
