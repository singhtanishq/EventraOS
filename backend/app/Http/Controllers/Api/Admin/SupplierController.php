<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Provider::query()->orderBy('priority', 'desc');

        if ($search = $request->query('search')) {
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
        }

        if ($type = $request->query('type') && $request->query('type') !== 'all') {
            $query->where('type', $request->query('type'));
        }

        if ($status = $request->query('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        $suppliers = $query->paginate($request->integer('per_page', 20));

        return response()->json(['success' => true, 'data' => ['suppliers' => collect($suppliers->items()), 'total_count' => $suppliers->total()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:providers,code',
            'type' => 'required|in:hotel,flight,train,bus,venue,car,activity,transfer,payment',
            'mode' => 'required|in:demo,live',
            'status' => 'sometimes|in:active,inactive,maintenance,error',
            'base_url' => 'nullable|url',
            'priority' => 'sometimes|integer|min:0',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $provider = Provider::create($validated + ['is_default' => false]);

        return response()->json(['success' => true, 'message' => 'Supplier created.', 'data' => $provider], 201);
    }

    public function show(Request $request, Provider $provider): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $provider]);
    }

    public function update(Request $request, Provider $provider): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'mode' => 'sometimes|in:demo,live',
            'status' => 'sometimes|in:active,inactive,maintenance,error',
            'base_url' => 'sometimes|nullable|url',
            'priority' => 'sometimes|integer|min:0',
            'is_default' => 'sometimes|boolean',
        ]);

        $provider->update($validated);
        return response()->json(['success' => true, 'message' => 'Supplier updated.', 'data' => $provider->fresh()]);
    }

    public function destroy(Request $request, Provider $provider): JsonResponse
    {
        $provider->update(['status' => 'inactive']);
        return response()->json(['success' => true, 'message' => 'Supplier deactivated.']);
    }
}
