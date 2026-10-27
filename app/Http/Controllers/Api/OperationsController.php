<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contract;
use App\Models\ProcurementOrder;
use App\Support\Audits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OperationsController extends Controller
{
    public function movement(Request $r, int $id) { $d=$r->validate(['type'=>'required|in:stock_in,stock_out,adjustment','quantity'=>'required|numeric|gt:0','reference_no'=>'nullable|string|max:100','notes'=>'nullable|string']); return DB::transaction(function()use($r,$id,$d){$item=DB::table('inventory_items')->where('id',$id)->whereNull('deleted_at')->lockForUpdate()->first();abort_unless($item,404);$next=$d['type']==='stock_in'?$item->quantity_on_hand+$d['quantity']:($d['type']==='stock_out'?$item->quantity_on_hand-$d['quantity']:$d['quantity']);if($next<0)return response()->json(['error'=>['code'=>'INSUFFICIENT_STOCK','message'=>'Stock-out quantity exceeds quantity on hand.']],422);DB::table('inventory_items')->where('id',$id)->update(['quantity_on_hand'=>$next,'updated_at'=>now()]);$mid=DB::table('inventory_movements')->insertGetId(['inventory_item_id'=>$id,'movement_type'=>$d['type'],'quantity'=>$d['quantity'],'previous_quantity'=>$item->quantity_on_hand,'new_quantity'=>$next,'reference_no'=>$d['reference_no']??null,'notes'=>$d['notes']??null,'performed_by'=>$r->user()->id,'movement_at'=>now(),'created_at'=>now(),'updated_at'=>now()]);Audits::write($r,'stock_'.$d['type'],'inventory_items',$id,['movement_id'=>$mid,'quantity'=>$d['quantity']]);return response()->json(['data'=>DB::table('inventory_movements')->where('id',$mid)->first()],201);}); }
    public function movements(Request $r,int $id) { $size=min(max((int)$r->input('pageSize',50),1),100); return response()->json(['data'=>DB::table('inventory_movements')->where('inventory_item_id',$id)->latest('movement_at')->paginate($size)]); }
    public function alerts(Request $r) { $size=min(max((int)$r->input('pageSize',50),1),100); return response()->json(['data'=>DB::table('inventory_items')->whereNull('deleted_at')->where(function($q){$q->whereColumn('quantity_on_hand','<=','reorder_point')->orWhere(function($x){$x->whereNotNull('expiry_date')->whereDate('expiry_date','<=',now()->addDays(30));});})->paginate($size)]); }
    public function dashboard() {
        try {
            $companies = Company::all();
            $contracts = Contract::all();
            $orders = ProcurementOrder::all();

            $tierCounts = [
                'tier1' => $contracts->where('tier', 'tier1')->count(),
                'tier2' => $contracts->where('tier', 'tier2')->count(),
                'tier3' => $contracts->where('tier', 'tier3')->count(),
                'tier4' => $contracts->where('tier', 'tier4')->count(),
            ];

            return response()->json([
                'data' => [
                    'companies' => $companies->map(function($c) {
                        return [
                            'id' => $c->id,
                            'name' => $c->legal_name,
                            'blacklisted' => $c->isBlacklisted()
                        ];
                    })->toArray(),
                    'contracts' => $contracts->map(function($c) {
                        return [
                            'id' => $c->id,
                            'title' => $c->title,
                            'contract_no' => $c->contract_no,
                            'company_id' => $c->company_id,
                            'amount' => (float) $c->amount,
                            'currency' => $c->currency,
                            'status' => $c->status,
                            'tier' => $c->tier,
                            'progressPercent' => $c->progress_percent,
                            'created_at' => $c->created_at
                        ];
                    })->toArray(),
                    'orders' => $orders->map(function($o) {
                        return [
                            'id' => $o->id,
                            'title' => $o->title,
                            'order_no' => $o->order_no,
                            'priority' => $o->priority,
                            'status' => $o->status,
                            'required_date' => $o->required_date
                        ];
                    })->toArray(),
                    'stats' => [
                        'totalCompanies' => $companies->count(),
                        'blacklistedCompanies' => $companies->filter(function($c) { return $c->isBlacklisted(); })->count(),
                        'activeContracts' => $contracts->where('status', 'active')->count(),
                        'totalContractValue' => (float) $contracts->where('status', 'active')->sum('amount'),
                        'pendingOrders' => $orders->whereIn('status', ['pending', 'in_progress'])->count(),
                        'urgentOrders' => $orders->filter(function($o) { return $o->isUrgent() && !$o->isCompleted(); })->count(),
                        'incompleteOrders' => $orders->where('status', 'incomplete')->count(),
                        'tierCounts' => $tierCounts
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function officeStatistics(Request $request, int $officeId) {
        $period = $request->input('period', 'all');
        $query = DB::table('procurement_orders')->where('office_id', $officeId)->whereNull('deleted_at');
        
        // Filter by period
        if ($period === 'week') {
            $query->where('requested_date', '>=', now()->subDays(7)->toDateString());
        } elseif ($period === 'month') {
            $query->where('requested_date', '>=', now()->subDays(30)->toDateString());
        } elseif ($period === 'year') {
            $query->where('requested_date', '>=', now()->subDays(365)->toDateString());
        }
        
        $stats = $query->select(
            DB::raw('COALESCE(CAST(SUM(amount) AS DECIMAL(18,2)), 0) as total_value'),
            DB::raw('COALESCE(CAST(SUM(items) AS DECIMAL(18,2)), 0) as total_items'),
            DB::raw('COALESCE(CAST(SUM(equipment) AS DECIMAL(18,2)), 0) as total_equipment'),
            DB::raw('COUNT(*) as order_count')
        )->first();
        
        return response()->json(['data' => $stats]);
    }
    public function upload(Request $r) { $d=$r->validate(['file'=>'required|file|mimes:pdf,doc,docx,xls,xlsx,csv,jpg,jpeg,png|max:25600','category'=>'required|string|max:100','entity_type'=>'nullable|string|max:100','entity_id'=>'nullable|integer']);$f=$r->file('file');$path=$f->store('procurement-documents','local');$id=DB::table('documents')->insertGetId(['storage_path'=>$path,'original_name'=>$f->getClientOriginalName(),'content_type'=>$f->getMimeType()??'application/octet-stream','size_bytes'=>$f->getSize(),'category'=>$d['category'],'entity_type'=>$d['entity_type']??null,'entity_id'=>$d['entity_id']??null,'uploaded_by'=>$r->user()->id,'created_at'=>now(),'updated_at'=>now()]);Audits::write($r,'upload','documents',$id,['original_name'=>$f->getClientOriginalName()]);return response()->json(['data'=>DB::table('documents')->where('id',$id)->first()],201); }
    public function download(int $id) { $doc=DB::table('documents')->where('id',$id)->whereNull('deleted_at')->first();abort_unless($doc,404);return Storage::disk('local')->download($doc->storage_path,$doc->original_name,['Content-Type'=>$doc->content_type]); }
    public function audit(Request $r) { $q=DB::table('audit_logs')->latest();foreach(['actor_user_id','entity_type','action'] as $f)if($r->filled($f))$q->where($f,$r->input($f));return response()->json(['data'=>$q->paginate(min(max((int)$r->input('pageSize',50),1),100))]); }
    public function notifications(Request $r) { $size=min(max((int)$r->input('pageSize',50),1),100); return response()->json(['data'=>DB::table('notifications')->where('user_id',$r->user()->id)->latest()->paginate($size)]); }
    public function readNotification(Request $r,int $id) { DB::table('notifications')->where('id',$id)->where('user_id',$r->user()->id)->update(['read_at'=>now(),'updated_at'=>now()]);return response()->noContent(); }
}
