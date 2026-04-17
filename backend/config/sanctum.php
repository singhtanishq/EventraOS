<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will return an error.
    |
    */

    'guards' => ['web', 'api', 'customer', 'customer-api', 'agent', 'agent-api', 'admin', 'admin-api'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired. If this value is null, the token's expiration is
    | not checked, allowing them to be used indefinitely.
    |
    */

    'expiration' => env('SANCTUM_TOKEN_EXPIRATION', null),

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    |
    | This value is used as a prefix for personal access tokens. This can be
    | useful for easily identifying tokens in logs or databases.
    |
    */

    'prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Personal Access Token Model
    |--------------------------------------------------------------------------
    |
    | This is the model that will be used to represent personal access tokens.
    | You may change this if you have a custom model for personal access tokens.
    |
    */

    'personal_access_token' => Laravel\Sanctum\PersonalAccessToken::class,

];