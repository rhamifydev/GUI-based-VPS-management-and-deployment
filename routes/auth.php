<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\GitHubAuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    // GitHub OAuth routes
    Route::get('auth/github', [GitHubAuthController::class, 'redirect'])
        ->name('auth.github');

    Route::get('auth/github/callback', [GitHubAuthController::class, 'callback'])
        ->name('auth.github.callback');

    // Instant development bypass (skips HTTPS/OAuth for local testing)
    Route::get('auth/dev-bypass', [GitHubAuthController::class, 'devBypass'])
        ->name('auth.dev-bypass');

    // Display GitHub login screen
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    // Registration redirects to GitHub login
    Route::get('register', function () {
        return redirect()->route('login');
    })->name('register');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
