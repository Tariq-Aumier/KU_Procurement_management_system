<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\ContractFormController;
use App\Http\Controllers\Api\GovernanceController;
use App\Http\Controllers\Api\InventoryItemController;
use App\Http\Controllers\Api\InventoryLocationController;
use App\Http\Controllers\Api\OfficeCategoryController;
use App\Http\Controllers\Api\OfficeController;
use App\Http\Controllers\Api\OperationsController;
use App\Http\Controllers\Api\ProcurementController;
use App\Http\Controllers\Api\ProcurementFormsController;
use App\Http\Controllers\Api\ProcurementOrderController;
use App\Http\Controllers\Api\ProcurementWorkflowController;
use App\Http\Controllers\Api\RecycleBinController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/login',[AuthController::class,'login']);
    Route::middleware(['api.auth','throttle:120,1'])->group(function () {
        Route::post('auth/logout',[AuthController::class,'logout']); Route::post('auth/refresh',[AuthController::class,'refresh']); Route::get('me',[AuthController::class,'me']); Route::patch('me',[AuthController::class,'updateProfile']); Route::post('me/change-password',[AuthController::class,'changePassword']); Route::get('system-info',[AuthController::class,'systemInfo']);
        Route::get('dashboard',[OperationsController::class,'dashboard']); Route::get('inventory/alerts',[OperationsController::class,'alerts']); Route::get('notifications',[OperationsController::class,'notifications']); Route::post('notifications/{id}/read',[OperationsController::class,'readNotification']); Route::get('offices/{id}/statistics',[OperationsController::class,'officeStatistics']);
        Route::get('audit-logs',[OperationsController::class,'audit'])->middleware('role:admin,auditor'); Route::post('documents',[OperationsController::class,'upload'])->middleware('throttle:uploads'); Route::get('documents/{id}',[OperationsController::class,'download']);
        Route::get('rfq-workspace',[ProcurementController::class,'workspace']); Route::get('orders/{id}/items',[ProcurementController::class,'orderItems']); Route::post('orders/{id}/items',[ProcurementController::class,'createOrderItem']); Route::post('orders/{id}/{action}',[ProcurementController::class,'orderAction'])->whereIn('action',['submit','approve','reject','start','complete','cancel']);
        Route::get('rfqs/{id}/items',[ProcurementController::class,'rfqItems']); Route::post('rfqs/{id}/items',[ProcurementController::class,'createRfqItem']); Route::post('rfqs/{id}/vendors',[ProcurementController::class,'inviteVendor']); Route::post('rfqs/{id}/{action}',[ProcurementController::class,'rfqAction'])->whereIn('action',['publish','close','evaluate','cancel']); Route::get('rfqs/{id}/bids',[ProcurementController::class,'bids']); Route::post('rfqs/{id}/bids',[ProcurementController::class,'createBid']); Route::get('rfqs/{id}/committee',[ProcurementController::class,'committee']); Route::post('rfqs/{id}/committee',[ProcurementController::class,'createCommittee']); Route::post('rfqs/{id}/recommend-award',[ProcurementController::class,'recommendAward']);
        Route::get('bids/{id}/evaluations',[ProcurementController::class,'bidEvaluations']); Route::post('bids/{id}/evaluations',[ProcurementController::class,'evaluateBid']); Route::delete('bids/{bidId}/evaluations/{evaluationId}',[ProcurementController::class,'deleteEvaluation']); Route::post('awards/{id}/approve',[ProcurementController::class,'approveAward'])->middleware('role:admin,manager,finance'); Route::post('contracts/{id}/{action}',[ProcurementController::class,'contractAction'])->whereIn('action',['activate','complete','cancel']); Route::post('contracts/{id}/progress',[ProcurementController::class,'progress']);
        // Procurement Forms Routes
        Route::get('procurement-forms/rfq',[ProcurementFormsController::class,'rfqIndex']); Route::post('procurement-forms/rfq',[ProcurementFormsController::class,'rfqStore']); Route::get('procurement-forms/rfq/{id}',[ProcurementFormsController::class,'rfqShow']); Route::patch('procurement-forms/rfq/{id}',[ProcurementFormsController::class,'rfqUpdate']); Route::delete('procurement-forms/rfq/{id}',[ProcurementFormsController::class,'rfqDestroy']); Route::post('procurement-forms/rfq/{id}/restore',[ProcurementFormsController::class,'rfqRestore']); Route::delete('procurement-forms/rfq/{id}/force',[ProcurementFormsController::class,'rfqForceDelete']);
        Route::get('procurement-forms/m2',[ProcurementFormsController::class,'m2Index']); Route::post('procurement-forms/m2',[ProcurementFormsController::class,'m2Store']); Route::get('procurement-forms/m2/{id}',[ProcurementFormsController::class,'m2Show']); Route::patch('procurement-forms/m2/{id}',[ProcurementFormsController::class,'m2Update']); Route::delete('procurement-forms/m2/{id}',[ProcurementFormsController::class,'m2Destroy']); Route::post('procurement-forms/m2/{id}/restore',[ProcurementFormsController::class,'m2Restore']); Route::delete('procurement-forms/m2/{id}/force',[ProcurementFormsController::class,'m2ForceDelete']);
        Route::get('procurement-forms/evaluation',[ProcurementFormsController::class,'evaluationIndex']); Route::post('procurement-forms/evaluation',[ProcurementFormsController::class,'evaluationStore']); Route::get('procurement-forms/evaluation/{id}',[ProcurementFormsController::class,'evaluationShow']); Route::patch('procurement-forms/evaluation/{id}',[ProcurementFormsController::class,'evaluationUpdate']); Route::delete('procurement-forms/evaluation/{id}',[ProcurementFormsController::class,'evaluationDestroy']); Route::post('procurement-forms/evaluation/{id}/restore',[ProcurementFormsController::class,'evaluationRestore']); Route::delete('procurement-forms/evaluation/{id}/force',[ProcurementFormsController::class,'evaluationForceDelete']);
        Route::get('procurement-forms/submissions',[ProcurementFormsController::class,'submissionsIndex']); Route::post('procurement-forms/submissions',[ProcurementFormsController::class,'submissionStore']); Route::get('procurement-forms/submissions/{id}',[ProcurementFormsController::class,'submissionShow']); Route::patch('procurement-forms/submissions/{id}',[ProcurementFormsController::class,'submissionUpdate']); Route::delete('procurement-forms/submissions/{id}',[ProcurementFormsController::class,'submissionDestroy']);
        // New Procurement Workflow Routes (5 Forms)
        Route::get('procurement-workflow/rfq',[ProcurementWorkflowController::class,'rfqIndex']); Route::post('procurement-workflow/rfq',[ProcurementWorkflowController::class,'rfqStore']); Route::get('procurement-workflow/rfq/{id}',[ProcurementWorkflowController::class,'rfqShow']); Route::patch('procurement-workflow/rfq/{id}',[ProcurementWorkflowController::class,'rfqUpdate']); Route::delete('procurement-workflow/rfq/{id}',[ProcurementWorkflowController::class,'rfqDestroy']); Route::post('procurement-workflow/rfq/{id}/submit',[ProcurementWorkflowController::class,'rfqSubmit']); Route::post('procurement-workflow/rfq/{id}/approve',[ProcurementWorkflowController::class,'rfqApprove']);
        Route::get('procurement-workflow/comparison',[ProcurementWorkflowController::class,'comparisonIndex']); Route::post('procurement-workflow/comparison',[ProcurementWorkflowController::class,'comparisonStore']); Route::get('procurement-workflow/comparison/{id}',[ProcurementWorkflowController::class,'comparisonShow']); Route::patch('procurement-workflow/comparison/{id}',[ProcurementWorkflowController::class,'comparisonUpdate']); Route::delete('procurement-workflow/comparison/{id}',[ProcurementWorkflowController::class,'comparisonDestroy']);
        Route::get('procurement-workflow/cash-po',[ProcurementWorkflowController::class,'cashPoIndex']); Route::post('procurement-workflow/cash-po',[ProcurementWorkflowController::class,'cashPoStore']); Route::get('procurement-workflow/cash-po/{id}',[ProcurementWorkflowController::class,'cashPoShow']); Route::patch('procurement-workflow/cash-po/{id}',[ProcurementWorkflowController::class,'cashPoUpdate']); Route::delete('procurement-workflow/cash-po/{id}',[ProcurementWorkflowController::class,'cashPoDestroy']);
        Route::get('procurement-workflow/purchase-order',[ProcurementWorkflowController::class,'purchaseOrderIndex']); Route::post('procurement-workflow/purchase-order',[ProcurementWorkflowController::class,'purchaseOrderStore']); Route::get('procurement-workflow/purchase-order/{id}',[ProcurementWorkflowController::class,'purchaseOrderShow']); Route::patch('procurement-workflow/purchase-order/{id}',[ProcurementWorkflowController::class,'purchaseOrderUpdate']); Route::delete('procurement-workflow/purchase-order/{id}',[ProcurementWorkflowController::class,'purchaseOrderDestroy']);
        Route::get('procurement-workflow/all-saved-forms',[ProcurementWorkflowController::class,'allSavedForms']);
        Route::get('procurement-workflow/custom-forms',[ProcurementWorkflowController::class,'customFormsIndex']);
        Route::get('procurement-workflow/custom-forms/{id}',[ProcurementWorkflowController::class,'customFormShow']);
        Route::post('procurement-workflow/custom-form-save',[ProcurementWorkflowController::class,'customFormSave']);
        // Contract Form Routes
        Route::get('contract-forms',[ContractFormController::class,'index']); Route::post('contract-forms',[ContractFormController::class,'store']); Route::get('contract-forms/dropdown-data',[ContractFormController::class,'getDropdownData']); Route::get('contract-forms/{id}',[ContractFormController::class,'show']); Route::patch('contract-forms/{id}',[ContractFormController::class,'update']); Route::delete('contract-forms/{id}',[ContractFormController::class,'destroy']); Route::post('contract-forms/{id}/submit',[ContractFormController::class,'submit']); Route::post('contract-forms/{id}/approve',[ContractFormController::class,'approve']); Route::post('contract-forms/{id}/reject',[ContractFormController::class,'reject']);
        Route::post('inventory-items/{id}/movements',[OperationsController::class,'movement']); Route::get('inventory-items/{id}/movements',[OperationsController::class,'movements']);
        Route::get('roles',[GovernanceController::class,'roles'])->middleware('role:admin'); Route::get('permissions',[GovernanceController::class,'permissions'])->middleware('role:admin'); Route::put('users/{id}/roles',[GovernanceController::class,'assignRoles'])->middleware('role:admin');
        Route::get('settings',[GovernanceController::class,'settings'])->middleware('role:admin'); Route::put('settings/{key}',[GovernanceController::class,'updateSetting'])->middleware('role:admin'); Route::put('notification-preferences',[GovernanceController::class,'preference']);
        Route::get('contracts/{id}/amendments',[GovernanceController::class,'amendments']); Route::post('contracts/{id}/amendments',[GovernanceController::class,'createAmendment'])->middleware('role:admin,manager'); Route::post('contract-amendments/{id}/approve',[GovernanceController::class,'approveAmendment'])->middleware('role:admin,manager,finance');
        Route::get('reports/{code}',[GovernanceController::class,'report']); Route::get('exports/{id}/download',[GovernanceController::class,'downloadExport']);
        // Backup Routes
        Route::get('backups',[BackupController::class,'index'])->middleware('role:admin');
        Route::post('backups',[BackupController::class,'store'])->middleware('role:admin');
        Route::post('backups/restore',[BackupController::class,'restore'])->middleware('role:admin');
        Route::get('backups/{id}/download',[BackupController::class,'downloadJson'])->middleware('role:admin');
        Route::get('backups/{id}/download-excel',[BackupController::class,'downloadExcel'])->middleware('role:admin');
        Route::delete('backups/{id}',[BackupController::class,'destroy'])->middleware('role:admin');
        // Office Categories & Offices Routes
        Route::prefix('office-categories')->group(function () {
            Route::get('/',[OfficeCategoryController::class,'index']);
            Route::post('/',[OfficeCategoryController::class,'store']);
            Route::get('{id}',[OfficeCategoryController::class,'show']);
            Route::patch('{id}',[OfficeCategoryController::class,'update']);
            Route::delete('{id}',[OfficeCategoryController::class,'destroy']);
            Route::post('{id}/activate',[OfficeCategoryController::class,'activate']);
            Route::post('{id}/deactivate',[OfficeCategoryController::class,'deactivate']);
        });
        Route::prefix('offices-model')->group(function () {
            Route::get('/',[OfficeController::class,'index']);
            Route::post('/',[OfficeController::class,'store']);
            Route::get('{id}',[OfficeController::class,'show']);
            Route::patch('{id}',[OfficeController::class,'update']);
            Route::delete('{id}',[OfficeController::class,'destroy']);
            Route::post('{id}/activate',[OfficeController::class,'activate']);
            Route::post('{id}/deactivate',[OfficeController::class,'deactivate']);
            Route::get('category/{categoryId}',[OfficeController::class,'byCategory']);
        });
        // Inventory Locations & Items Routes
        Route::prefix('inventory-locations-model')->group(function () {
            Route::get('/',[InventoryLocationController::class,'index']);
            Route::post('/',[InventoryLocationController::class,'store']);
            Route::get('{id}',[InventoryLocationController::class,'show']);
            Route::patch('{id}',[InventoryLocationController::class,'update']);
            Route::delete('{id}',[InventoryLocationController::class,'destroy']);
            Route::post('{id}/activate',[InventoryLocationController::class,'activate']);
            Route::post('{id}/deactivate',[InventoryLocationController::class,'deactivate']);
            Route::get('office/{officeId}',[InventoryLocationController::class,'byOffice']);
        });
        Route::prefix('inventory-items-model')->group(function () {
            Route::get('/',[InventoryItemController::class,'index']);
            Route::post('/',[InventoryItemController::class,'store']);
            Route::get('{id}',[InventoryItemController::class,'show']);
            Route::patch('{id}',[InventoryItemController::class,'update']);
            Route::delete('{id}',[InventoryItemController::class,'destroy']);
            Route::post('{id}/restore',[InventoryItemController::class,'restore']);
            Route::post('{id}/adjust-quantity',[InventoryItemController::class,'adjustQuantity']);
            Route::get('{id}/movements',[InventoryItemController::class,'movements']);
            Route::get('statistics',[InventoryItemController::class,'statistics']);
        });
        // Vendors Routes
        Route::prefix('vendors-model')->group(function () {
            Route::get('/',[VendorController::class,'index']);
            Route::post('/',[VendorController::class,'store']);
            Route::get('{id}',[VendorController::class,'show']);
            Route::patch('{id}',[VendorController::class,'update']);
            Route::delete('{id}',[VendorController::class,'destroy']);
            Route::post('{id}/restore',[VendorController::class,'restore']);
            Route::post('{id}/verify',[VendorController::class,'verify']);
            Route::post('{id}/reject',[VendorController::class,'reject']);
            Route::get('statistics',[VendorController::class,'statistics']);
        });
        // Users Routes
        Route::prefix('users-model')->group(function () {
            Route::get('/',[UserController::class,'index']);
            Route::post('/',[UserController::class,'store']);
            Route::get('{id}',[UserController::class,'show']);
            Route::patch('{id}',[UserController::class,'update']);
            Route::delete('{id}',[UserController::class,'destroy']);
            Route::post('{id}/restore',[UserController::class,'restore']);
            Route::post('{id}/activate',[UserController::class,'activate']);
            Route::post('{id}/deactivate',[UserController::class,'deactivate']);
            Route::post('{id}/change-password',[UserController::class,'changePassword']);
            Route::get('statistics',[UserController::class,'statistics']);
        });
        // Reports Routes
        Route::get('reports-model',[ReportsController::class,'index']);
        // Recycle Bin Routes
        Route::prefix('recycle-bin')->group(function () {
            Route::get('/',[RecycleBinController::class,'index']);
            Route::get('statistics',[RecycleBinController::class,'statistics']);
            Route::post('restore/{type}/{id}',[RecycleBinController::class,'restore']);
            Route::delete('force-delete/{type}/{id}',[RecycleBinController::class,'forceDelete']);
        });
        // Dedicated Model-based Routes (new)
        Route::prefix('companies')->group(function () {
            Route::get('/',[CompanyController::class,'index']);
            Route::post('/',[CompanyController::class,'store']);
            Route::get('{id}',[CompanyController::class,'show']);
            Route::patch('{id}',[CompanyController::class,'update']);
            Route::delete('{id}',[CompanyController::class,'destroy']);
            Route::post('{id}/restore',[CompanyController::class,'restore']);
            Route::post('{id}/blacklist',[CompanyController::class,'blacklist']);
            Route::post('{id}/reinstate',[CompanyController::class,'reinstate']);
            Route::get('{id}/violations',[CompanyController::class,'violations']);
            Route::post('{id}/violations',[CompanyController::class,'addViolation']);
        });
        Route::prefix('contracts-model')->group(function () {
            Route::get('/',[ContractController::class,'index']);
            Route::post('/',[ContractController::class,'store']);
            Route::get('{id}',[ContractController::class,'show']);
            Route::patch('{id}',[ContractController::class,'update']);
            Route::delete('{id}',[ContractController::class,'destroy']);
            Route::post('{id}/restore',[ContractController::class,'restore']);
            Route::post('{id}/progress',[ContractController::class,'updateProgress']);
            Route::get('{id}/progress-updates',[ContractController::class,'progressUpdates']);
            Route::post('{id}/progress-updates',[ContractController::class,'addProgressUpdate']);
            Route::post('{id}/activate',[ContractController::class,'activate']);
            Route::post('{id}/complete',[ContractController::class,'complete']);
            Route::post('{id}/cancel',[ContractController::class,'cancel']);
        });
        Route::prefix('procurement-orders-model')->group(function () {
            Route::get('/',[ProcurementOrderController::class,'index']);
            Route::post('/',[ProcurementOrderController::class,'store']);
            Route::get('{id}',[ProcurementOrderController::class,'show']);
            Route::patch('{id}',[ProcurementOrderController::class,'update']);
            Route::delete('{id}',[ProcurementOrderController::class,'destroy']);
            Route::post('{id}/restore',[ProcurementOrderController::class,'restore']);
            Route::post('{id}/submit',[ProcurementOrderController::class,'submit']);
            Route::post('{id}/approve',[ProcurementOrderController::class,'approve']);
            Route::post('{id}/complete',[ProcurementOrderController::class,'complete']);
            Route::post('{id}/cancel',[ProcurementOrderController::class,'cancel']);
            Route::get('{id}/items',[ProcurementOrderController::class,'items']);
            Route::post('{id}/items',[ProcurementOrderController::class,'addItem']);
            Route::patch('{id}/items/{itemId}',[ProcurementOrderController::class,'updateItem']);
            Route::delete('{id}/items/{itemId}',[ProcurementOrderController::class,'deleteItem']);
        });
        Route::get('{resource}/trashed',[ResourceController::class,'trashed']); Route::get('{resource}',[ResourceController::class,'index']); Route::post('{resource}',[ResourceController::class,'store']); Route::get('{resource}/{id}',[ResourceController::class,'show']); Route::patch('{resource}/{id}',[ResourceController::class,'update']); Route::delete('{resource}/{id}',[ResourceController::class,'destroy']); Route::post('{resource}/{id}/restore',[ResourceController::class,'restore']); Route::delete('{resource}/{id}/force',[ResourceController::class,'forceDelete']);
    });
});
