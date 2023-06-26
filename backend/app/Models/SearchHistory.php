<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchHistory extends Model
{
    protected $table = 'search_history';

    protected $fillable = ['customer_id', 'session_id', 'search_type', 'search_parameters', 'results_count', 'selected_result_id', 'selected_result_type'];
    protected $casts = ['search_parameters' => 'array'];
}
