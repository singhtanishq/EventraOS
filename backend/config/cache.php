<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Cache Store
    |--------------------------------------------------------------------------
    |
    | This option controls the default cache connection that gets used while
    | using this caching library. This connection is used when another is
    | not explicitly specified when executing a given caching function.
    |
    */

    'default' => env('CACHE_DRIVER', 'redis'),

    /*
    |--------------------------------------------------------------------------
    | Cache Stores
    |--------------------------------------------------------------------------
    |
    | Here you may define all of the cache "stores" for your application as
    | well as their drivers. You may even define multiple stores for the
    | same driver to group types of items stored in your caches.
    |
    | Supported drivers: "apc", "array", "database", "file",
    |            "memcached", "redis", "dynamodb", "octane", "null"
    |
    */

    'stores' => [

        'apc' => [
            'driver' => 'apc',
        ],

        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],

        'database' => [
            'driver' => 'database',
            'table' => 'cache',
            'connection' => null,
            'lock_connection' => null,
        ],

        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
            'lock_path' => storage_path('framework/cache/data'),
        ],

        'memcached' => [
            'driver' => 'memcached',
            'persistent_id' => env('MEMCACHED_PERSISTENT_ID'),
            'sasl' => [
                env('MEMCACHED_USERNAME'),
                env('MEMCACHED_PASSWORD'),
            ],
            'options' => [
                // Memcached::OPT_CONNECT_TIMEOUT => 2000,
                // Memcached::OPT_RETRY_TIMEOUT => 2,
            ],
            'servers' => [
                [
                    'host' => env('MEMCACHED_HOST', '127.0.0.1'),
                    'port' => env('MEMCACHED_PORT', 11211),
                    'weight' => 100,
                ],
            ],
        },

        'redis' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'lock_connection' => 'default',
            'compression' => 'zlib',
            'serialization' => 'php',
            'prefix' => 'eventraos:',
        ],

        'redis-cluster' => [
            'driver' => 'redis',
            'connection' => 'cache-cluster',
        ],

        'dynamodb' => [
            'driver' => 'dynamodb',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            'table' => env('DYNAMODB_CACHE_TABLE', 'cache'),
            'endpoint' => env('DYNAMODB_ENDPOINT'),
        ],

        'octane' => [
            'driver' => 'octane',
        ],

        // Custom cache stores for EventraOS
        'search' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'eventraos:search:',
            'compression' => 'zlib',
            'serialization' => 'json',
            'ttl' => 300, // 5 minutes
        ],

        'availability' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'eventraos:availability:',
            'compression' => 'zlib',
            'serialization' => 'json',
            'ttl' => 60, // 1 minute
        ],

        'booking' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'eventraos:booking:',
            'compression' => 'zlib',
            'serialization' => 'json',
            'ttl' => 900, // 15 minutes
        ],

        'session' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'eventraos:session:',
            'compression' => 'zlib',
            'serialization' => 'php',
            'ttl' => 7200, // 2 hours
        ],

        'api-response' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'eventraos:api:',
            'compression' => 'zlib',
            'serialization' => 'json',
            'ttl' => 60, // 1 minute
        ],

        'static-content' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'eventraos:static:',
            'compression' => 'zlib',
            'serialization' => 'json',
            'ttl' => 86400, // 24 hours
        ],

        'rate-limit' => [
            'driver' => 'redis',
            'connection' => 'cache',
            'prefix' => 'eventraos:ratelimit:',
            'serialization' => 'php',
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Key Prefix
    |--------------------------------------------------------------------------
    |
    | When utilizing a RAM based store such as Redis or Memcached, there might
    | be other applications utilizing the same cache. So, we'll specify a
    | value to get prefixed to all our keys so we do not have collisions.
    |
    */

    'prefix' => env('CACHE_PREFIX', 'eventraos'),

]