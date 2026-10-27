<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-site');

        // Adjust CSP for development with Vite
        if (app()->environment('local')) {
            $csp = "default-src 'self'; "
                  . "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://127.0.0.1:*; "
                  . "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                  . "font-src 'self' https://fonts.gstatic.com; "
                  . "img-src 'self' data: https:; "
                  . "connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; "
                  . "frame-ancestors 'none'; "
                  . "base-uri 'self';";
        } else {
            $csp = "default-src 'self'; frame-ancestors 'none'; base-uri 'self';";
        }

        $response->headers->set('Content-Security-Policy', $csp);
        if ($request->isSecure()) $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        return $response;
    }
}
