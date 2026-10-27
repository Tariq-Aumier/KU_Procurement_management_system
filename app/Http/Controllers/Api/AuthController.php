<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\User;
use App\Support\Audits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request) {
        $data = $request->validate(['username' => ['required','string'], 'password' => ['required','string']]);
        $user = User::whereRaw('lower(username) = ?', [strtolower($data['username'])])->orWhereRaw('lower(email) = ?', [strtolower($data['username'])])->first();
        if (!$user || !$user->active || !Hash::check($data['password'], $user->password)) return response()->json(['error'=>['code'=>'INVALID_CREDENTIALS','message'=>'Invalid username or password.']], 422);
        $raw = Str::random(80); ApiToken::where('user_id', $user->id)->where('expires_at','<',now())->delete();
        ApiToken::create(['user_id'=>$user->id,'token_hash'=>hash('sha256',$raw),'name'=>'frontend','expires_at'=>now()->addHours(12)]);
        $user->forceFill(['last_login_at'=>now()])->save(); Audits::write($request, 'login', 'auth', $user->id, ['username'=>$user->username]);
        return response()->json(['data'=>['accessToken'=>$raw, 'tokenType'=>'Bearer', 'expiresIn'=>43200, 'user'=>$this->user($user)]]);
    }
    public function logout(Request $request) { ApiToken::where('token_hash', hash('sha256', $request->bearerToken()))->delete(); Audits::write($request,'logout','auth',$request->user()->id); return response()->noContent(); }
    public function refresh(Request $request) { $u=$request->user(); ApiToken::where('token_hash', hash('sha256', $request->bearerToken()))->delete(); $raw=Str::random(80); ApiToken::create(['user_id'=>$u->id,'token_hash'=>hash('sha256',$raw),'name'=>'frontend','expires_at'=>now()->addHours(12)]); Audits::write($request,'refresh_token','auth',$u->id); return response()->json(['data'=>['accessToken'=>$raw,'tokenType'=>'Bearer','expiresIn'=>43200]]); }
    public function me(Request $request) { return response()->json(['data'=>$this->user($request->user())]); }
    public function updateProfile(Request $request) { $u=$request->user(); $data=$request->validate(['name'=>['required','string','max:255'], 'email'=>['nullable','email','max:255','unique:users,email,'.$u->id]]); $u->update($data); Audits::write($request,'update','user',$u->id,$data); return response()->json(['data'=>$this->user($u->fresh())]); }
    public function changePassword(Request $request) { $data=$request->validate(['currentPassword'=>['required','string'], 'newPassword'=>['required','string','min:8','confirmed', 'regex:/[A-Z]/','regex:/[a-z]/','regex:/[0-9]/']]); $u=$request->user(); if(!Hash::check($data['currentPassword'],$u->password)) return response()->json(['error'=>['code'=>'INVALID_PASSWORD','message'=>'Current password is incorrect.']],422); $u->update(['password'=>$data['newPassword']]); ApiToken::where('user_id',$u->id)->delete(); Audits::write($request,'change_password','user',$u->id); return response()->noContent(); }
    public function systemInfo() { return response()->json(['data'=>['name'=>config('app.name'),'version'=>'1.0.0','environment'=>config('app.env'),'timezone'=>config('app.timezone'),'locale'=>config('app.locale'),'database'=>config('database.default'),'cache'=>config('cache.default'),'session'=>config('session.driver'),'queue'=>config('queue.default'),'storage'=>config('filesystem.default'),'token_expiry_hours'=>12,'password_hashing'=>'bcrypt_rounds_'.config('hashing.bcrypt.rounds'),'max_pagination_records'=>100]]); }
    private function user(User $u): array { return ['id'=>$u->id,'username'=>$u->username,'fullName'=>$u->name,'email'=>$u->email,'role'=>$u->role,'officeId'=>$u->office_id,'active'=>$u->active,'lastLoginAt'=>$u->last_login_at]; }
}
