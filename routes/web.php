<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VpsConnectionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [VpsConnectionController::class, 'dashboard'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/vps/connect', [VpsConnectionController::class, 'connect'])->name('vps.connect');
    Route::post('/vps/create-project', [VpsConnectionController::class, 'createProject'])->name('vps.create-project');
    Route::post('/vps/deploy', [VpsConnectionController::class, 'deployProject'])->name('vps.deploy');

    // Dedicated pages for Servers and Metrics
    Route::get('/servers', [VpsConnectionController::class, 'serversPage'])->name('servers.index');
    Route::get('/servers/{id}', [VpsConnectionController::class, 'serverDetailsPage'])->name('servers.show');
    Route::get('/metrics', [VpsConnectionController::class, 'metricsPage'])->name('servers.metrics');

    // Server management & Power control
    Route::get('/vps/servers', [VpsConnectionController::class, 'getServers'])->name('vps.servers.index');
    Route::post('/vps/servers', [VpsConnectionController::class, 'storeServer'])->name('vps.servers.store');
    Route::patch('/vps/servers/{id}', [VpsConnectionController::class, 'updateServer'])->name('vps.servers.update');
    Route::post('/vps/servers/{id}/toggle-power', [VpsConnectionController::class, 'toggleServerPower'])->name('vps.servers.toggle-power');
    Route::post('/vps/servers/{id}/check', [VpsConnectionController::class, 'checkServerHealth'])->name('vps.servers.check');
    Route::get('/vps/servers/{id}/metrics-data', [VpsConnectionController::class, 'getServerMetricsData'])->name('vps.servers.metrics-data');
    Route::delete('/vps/servers/{id}', [VpsConnectionController::class, 'destroyServer'])->name('vps.servers.destroy');

    // Project persistence & real server authentication monitoring
    Route::get('/vps/projects', [VpsConnectionController::class, 'getProjects'])->name('vps.projects.index');
    Route::post('/vps/projects', [VpsConnectionController::class, 'storeProject'])->name('vps.projects.store');
    Route::delete('/vps/projects/{id}', [VpsConnectionController::class, 'destroyProject'])->name('vps.projects.destroy');
    Route::post('/vps/projects/{id}/check-auth', [VpsConnectionController::class, 'checkProjectAuth'])->name('vps.projects.check-auth');
    Route::post('/vps/projects/check-all-auth', [VpsConnectionController::class, 'checkAllProjectsAuth'])->name('vps.projects.check-all-auth');
    Route::patch('/vps/projects/{id}/credentials', [VpsConnectionController::class, 'updateProjectCredentials'])->name('vps.projects.update-credentials');
    Route::patch('/vps/projects/{id}', [VpsConnectionController::class, 'updateProject'])->name('vps.projects.update');
});

require __DIR__.'/auth.php';
