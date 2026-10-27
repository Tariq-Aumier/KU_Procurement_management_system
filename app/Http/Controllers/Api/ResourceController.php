<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\Audits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Whitelisted CRUD API for procurement master and operational records. */
class ResourceController extends Controller
{
    private function resources(): array { return [
        'office-categories' => ['table'=>'office_categories','fields'=>['name'=>'required|string|max:255','code'=>'required|string|max:50'], 'search'=>['name','code'], 'soft'=>true],
        'offices' => ['table'=>'offices','fields'=>['office_category_id'=>'required|exists:office_categories,id','code'=>'required|string|max:50','name'=>'required|string|max:255','name_ps'=>'nullable|string|max:255','name_fa'=>'nullable|string|max:255','description'=>'nullable|string','active'=>'boolean'], 'search'=>['name','code'], 'soft'=>true],
        'companies' => ['table'=>'companies','fields'=>['legal_name'=>'required|string|max:255','company_type'=>['required',Rule::in(['construction','logistics','retail','services','logistics_construction','medical','equipment','other'])],'registration_no'=>'required|string|max:100','contact_person'=>'required|string|max:255','phone'=>'nullable|string|max:50','email'=>'nullable|email|max:255','address'=>'nullable|string','experience'=>'nullable|string','eligibility_status'=>['sometimes',Rule::in(['active','suspended','blacklisted'])]], 'search'=>['legal_name','registration_no','contact_person'], 'soft'=>true],
        'vendors' => ['table'=>'vendors','fields'=>['company_id'=>'required|exists:companies,id','account_no'=>'required|string|max:100','tax_id'=>'nullable|string|max:100','bank_name'=>'nullable|string|max:255','bank_account'=>'nullable|string|max:255','contact_info'=>'nullable|string|max:255','verification_status'=>['sometimes',Rule::in(['pending','verified','rejected'])]], 'search'=>['account_no','tax_id'], 'soft'=>true],
        'orders' => ['table'=>'procurement_orders','fields'=>['order_no'=>'required|string|max:100','title'=>'required|string|max:255','office_id'=>'nullable|exists:offices,id','company_id'=>'nullable|exists:companies,id','category'=>['required',Rule::in(['retail','contract','equipment','supplies'])],'priority'=>['required',Rule::in(['low','medium','high','urgent'])],'status'=>['sometimes',Rule::in(['draft','pending','approved','in_progress','completed','incomplete','cancelled'])],'requested_date'=>'required|date','required_date'=>'required|date|after_or_equal:requested_date','amount'=>'required|numeric|min:0','equipment'=>'required|numeric|min:0','items'=>'required|numeric|min:0','currency'=>['required',Rule::in(['AFN','USD','EUR'])],'description'=>'nullable|string','items_list'=>'nullable|array'], 'search'=>['order_no','title'], 'soft'=>true],
        'office-items' => ['table'=>'office_items','fields'=>['office_id'=>'required|exists:offices,id','procurement_order_id'=>'nullable|exists:procurement_orders,id','item_name'=>'required|string|max:255','category'=>['required',Rule::in(['equipment','supplies'])],'quantity'=>'required|numeric|min:0','unit_price'=>'required|numeric|min:0','currency'=>['required',Rule::in(['AFN','USD','EUR'])],'total_value'=>'required|numeric|min:0','received_date'=>'nullable|date','condition'=>['required',Rule::in(['new','used','damaged'])]], 'search'=>['item_name'], 'soft'=>true],
        'contracts' => ['table'=>'contracts','fields'=>['contract_no'=>'required|string|max:100','award_id'=>'nullable|exists:awards,id','company_id'=>'required|exists:companies,id','title'=>'required|string|max:255','amount'=>'required|numeric|gt:0','currency'=>['required',Rule::in(['AFN','USD','EUR'])],'start_date'=>'required|date','end_date'=>'required|date|after:start_date','status'=>['sometimes',Rule::in(['draft','active','completed','cancelled','expired'])],'progress_percent'=>'sometimes|numeric|between:0,100','description'=>'nullable|string'], 'search'=>['contract_no','title'], 'soft'=>true],
        'inventory-locations' => ['table'=>'inventory_locations','fields'=>['office_id'=>'nullable|exists:offices,id','code'=>'required|string|max:100','name'=>'required|string|max:255','active'=>'boolean'], 'search'=>['code','name'], 'soft'=>true],
        'inventory-items' => ['table'=>'inventory_items','fields'=>['code'=>'required|string|max:100','name'=>'required|string|max:255','item_type'=>['required',Rule::in(['sample','equipment','supply','asset'])],'category'=>'required|string|max:255','description'=>'nullable|string','unit'=>'required|string|max:50','min_stock'=>'numeric|min:0','max_stock'=>'nullable|numeric|min:0','reorder_point'=>'numeric|min:0','inventory_location_id'=>'required|exists:inventory_locations,id','supplier_company_id'=>'nullable|exists:companies,id','batch_number'=>'nullable|string|max:100','serial_number'=>'nullable|string|max:100','received_date'=>'nullable|date','expiry_date'=>'nullable|date|after_or_equal:received_date','condition'=>['required',Rule::in(['new','used','damaged','returned','disposed'])],'notes'=>'nullable|string','unit_cost'=>'nullable|numeric|min:0','currency'=>['required',Rule::in(['AFN','USD','EUR'])]], 'search'=>['code','name','category'], 'soft'=>true],
        'users' => ['table'=>'users','fields'=>['username'=>'required|string|min:3|max:100','name'=>'required|string|max:255','email'=>'nullable|email|max:255','role'=>['required',Rule::in(['admin','manager','officer','requester','evaluator','storekeeper','finance','auditor','user'])],'active'=>'boolean','office_id'=>'nullable|exists:offices,id','password'=>'sometimes|string|min:8'], 'search'=>['username','name','email'], 'soft'=>true],
    ]; }

    public function index(Request $request, string $resource) {
        $this->authorizeResource($request, $resource, false);
        $c=$this->config($resource); $q=DB::table($c['table']);
        if (($c['soft'] ?? false)) $q->whereNull('deleted_at');
        if ($term=$request->string('q')->trim()->value()) $q->where(function($w) use($c,$term){ foreach($c['search'] as $f) $w->orWhere($f,'like',"%{$term}%"); });
        foreach (['status','priority','company_id','office_id','eligibility_status','item_type'] as $filter) if($request->filled($filter)) $q->where($filter,$request->input($filter));
        $size=min(max((int)$request->input('pageSize',25),1),100); $page=$q->orderByDesc('id')->paginate($size);
        $items=$page->items();
        if($c['table']==='procurement_orders') { foreach($items as &$item) { if(isset($item->items_list) && is_string($item->items_list)) { $item->items_list=json_decode($item->items_list,true); } } }
        return response()->json(['data'=>$items,'meta'=>['page'=>$page->currentPage(),'pageSize'=>$page->perPage(),'total'=>$page->total()]]);
    }
    public function trashed(Request $request, string $resource) {
        $this->authorizeResource($request, $resource, false);
        $c=$this->config($resource); abort_unless($c['soft']??false,404);
        $q=DB::table($c['table'])->whereNotNull('deleted_at');
        if ($term=$request->string('q')->trim()->value()) $q->where(function($w) use($c,$term){ foreach($c['search'] as $f) $w->orWhere($f,'like',"%{$term}%"); });
        $size=min(max((int)$request->input('pageSize',25),1),100); $page=$q->orderByDesc('deleted_at')->paginate($size);
        return response()->json(['data'=>$page->items(),'meta'=>['page'=>$page->currentPage(),'pageSize'=>$page->perPage(),'total'=>$page->total()]]);
    }
    public function show(Request $request, string $resource, int $id) { $this->authorizeResource($request, $resource, false); return response()->json(['data'=>$this->find($this->config($resource),$id)]); }
    public function store(Request $request, string $resource) {
        $this->authorizeResource($request, $resource, true);
        $c=$this->config($resource); $data=$request->validate($c['fields']); $this->ensureUnique($c,$data);
        if ($resource === 'users') $request->validate(['password' => ['required','string','min:8','regex:/[A-Z]/','regex:/[a-z]/','regex:/[0-9]/']]);
        if($resource==='orders') $data['created_by']=$request->user()->id;
        if($resource==='companies') $data['created_by']=$request->user()->id;
        if($resource==='contracts') $data['tier']=$this->tier((float)$data['amount']);
        if($resource==='users' && isset($data['password'])) $data['password']=bcrypt($data['password']);
        if($resource==='orders' && isset($data['items_list'])) $data['items_list']=json_encode($data['items_list']);
        $id=DB::table($c['table'])->insertGetId([...$data,'created_at'=>now(),'updated_at'=>now()]); $row=$this->find($c,$id); Audits::write($request,'create',$c['table'],$id,(array)$row); return response()->json(['data'=>$row],201);
    }
    public function update(Request $request, string $resource, int $id) {
        $this->authorizeResource($request, $resource, true);
        $c=$this->config($resource); $before=(array)$this->find($c,$id); $data=$request->validate(array_map(fn($rules)=>is_array($rules)?array_merge(['sometimes'],$rules):'sometimes|'.$rules,$c['fields'])); $this->ensureUnique($c,$data,$id);
        if($resource==='contracts' && isset($data['amount'])) $data['tier']=$this->tier((float)$data['amount']); if($resource==='users' && isset($data['password'])) $data['password']=bcrypt($data['password']);
        if($resource==='orders' && isset($data['items_list'])) $data['items_list']=json_encode($data['items_list']);
        DB::table($c['table'])->where('id',$id)->update([...$data,'updated_at'=>now()]); $row=$this->find($c,$id); Audits::write($request,'update',$c['table'],$id,(array)$row,$before); return response()->json(['data'=>$row]);
    }
    public function destroy(Request $request, string $resource, int $id) { $this->authorizeResource($request, $resource, true); $c=$this->config($resource); $before=(array)$this->find($c,$id); if($c['soft']??false) DB::table($c['table'])->where('id',$id)->update(['deleted_at'=>now(),'updated_at'=>now()]); else DB::table($c['table'])->where('id',$id)->delete(); Audits::write($request,'archive',$c['table'],$id,[],$before); return response()->noContent(); }
    public function restore(Request $request, string $resource, int $id) { $this->authorizeResource($request, $resource, true); $c=$this->config($resource); abort_unless($c['soft']??false,404); $row=DB::table($c['table'])->where('id',$id)->whereNotNull('deleted_at')->first(); abort_unless($row,404); DB::table($c['table'])->where('id',$id)->update(['deleted_at'=>null,'updated_at'=>now()]); Audits::write($request,'restore',$c['table'],$id,(array)$row); return response()->json(['data'=>$row]); }
    public function forceDelete(Request $request, string $resource, int $id) { $this->authorizeResource($request, $resource, true); $c=$this->config($resource); abort_unless($c['soft']??false,404); $before=(array)DB::table($c['table'])->where('id',$id)->whereNotNull('deleted_at')->first(); abort_unless($before,404); DB::table($c['table'])->where('id',$id)->delete(); Audits::write($request,'force_delete',$c['table'],$id,[],$before); return response()->noContent(); }
    private function config(string $r): array { $resources=$this->resources(); abort_unless(isset($resources[$r]),404); return $resources[$r]; }
    private function find(array $c,int $id): object { $q=DB::table($c['table'])->where('id',$id); if($c['soft']??false)$q->whereNull('deleted_at'); $row=$q->first(); abort_unless($row,404); if($c['table']==='procurement_orders' && isset($row->items_list) && is_string($row->items_list)) { $row->items_list=json_decode($row->items_list,true); } return $row; }
    private function ensureUnique(array $c,array $data,?int $id=null): void { foreach(['username','email','code','registration_no','account_no','tax_id','order_no','rfq_no','contract_no','serial_number'] as $field) if(!empty($data[$field])) { $q=DB::table($c['table'])->where($field,$data[$field]); if($id)$q->where('id','<>',$id); if($q->exists()) abort(response()->json(['error'=>['code'=>'CONFLICT','message'=>"{$field} already exists."]],409)); } }
    private function tier(float $amount): string { return $amount<5000?'tier1':($amount<50000?'tier2':($amount<500000?'tier3':'tier4')); }
    private function authorizeResource(Request $request, string $resource, bool $write): void { $role=$request->user()->role; if(in_array($resource,['users','office-categories'],true) && $role!=='admin') abort(403,'Administrator access is required.'); if($write && !in_array($role,['admin','manager','officer','storekeeper','finance'],true)) abort(403,'Write access is not granted to your role.'); if($resource==='inventory-items' && $write && !in_array($role,['admin','manager','storekeeper'],true)) abort(403,'Storekeeper access is required.'); }
}
