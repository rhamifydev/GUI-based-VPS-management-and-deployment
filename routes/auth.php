<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\GitHubAuthController;
use App\Http\Controllers\Auth\PasswordController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    // GitHub OAuth routes
    Route::get('auth/github', [GitHubAuthController::class, 'redirect'])
        ->name('auth.github');

    Route::get('auth/github/callback', [GitHubAuthController::class, 'callback'])
        ->name('auth.github.callback');

    // Development bypass (only registered in local development)
    if (app()->isLocal() && config('app.debug')) {
        Route::get('auth/dev-bypass', [GitHubAuthController::class, 'devBypass'])
            ->name('auth.dev-bypass');
    }

    // Display GitHub login screen
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    // Registration redirects to GitHub login
    Route::get('register', function () {
        return redirect()->route('login');
    })->name('register');
});

Route::middleware('auth')->group(function () {
    Route::put('password', [PasswordController::class, 'update'])
        ->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
