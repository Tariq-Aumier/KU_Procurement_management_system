<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OfficeCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OfficeCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = OfficeCategory::with(['offices']);

        if ($request->filled('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $categories = $query->orderByDesc('id')->paginate($size);

        return response()->json([
            'data' => $categories->items(),
            'meta' => [
                'page' => $categories->currentPage(),
                'pageSize' => $categories->perPage(),
                'total' => $categories->total(),
            ],
        ]);
    }

    public function trashed(Request $request)
    {
        $query = OfficeCategory::onlyTrashed();

        $size = min(max((int) $request->input('pageSize', 25), 1), 100);
        $categories = $query->orderByDesc('deleted_at')->paginate($size);

        return response()->json([
            'data' => $categories->items(),
            'meta' => [
                'page' => $categories->currentPage(),
                'pageSize' => $categories->perPage(),
                'total' => $categories->total(),
            ],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $category = OfficeCategory::with(['offices'])->findOrFail($id);

        return response()->json(['data' => $category]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:office_categories',
            'code' => 'required|string|max:50|unique:office_categories',
            'active' => 'sometimes|boolean',
        ]);

        $category = OfficeCategory::create($data);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, int $id)
    {
        $category = OfficeCategory::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255|unique:office_categories,name,' . $id,
            'code' => 'sometimes|string|max:50|unique:office_categories,code,' . $id,
            'active' => 'sometimes|boolean',
        ]);

        $category->update($data);

        return response()->json(['data' => $category->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $category = OfficeCategory::findOrFail($id);

        if ($category->offices()->count() > 0) {
            return response()->json([
                'error' => [
                    'code' => 'HAS_OFFICES',
                    'message' => 'Cannot delete category with offices. Please reassign or delete offices first.'
                ]
            ], 422);
        }

        $category->delete();

        return response()->noContent();
    }

    public function activate(Request $request, int $id)
    {
        $category = OfficeCategory::findOrFail($id);
        $category->activate();

        return response()->json(['data' => $category->fresh()]);
    }

    public function deactivate(Request $request, int $id)
    {
        $category = OfficeCategory::findOrFail($id);
        $category->deactivate();

        return response()->json(['data' => $category->fresh()]);
    }

    public function restore(Request $request, int $id)
    {
        $category = OfficeCategory::withTrashed()->findOrFail($id);
        $category->restore();

        return response()->json(['data' => $category]);
    }

    public function forceDelete(Request $request, int $id)
    {
        $category = OfficeCategory::withTrashed()->findOrFail($id);

        if ($category->offices()->withTrashed()->count() > 0) {
            return response()->json([
                'error' => [
                    'code' => 'HAS_OFFICES',
                    'message' => 'Cannot permanently delete category with offices. Please delete offices first.'
                ]
            ], 422);
        }

        $category->forceDelete();

        return response()->noContent();
    }
}
