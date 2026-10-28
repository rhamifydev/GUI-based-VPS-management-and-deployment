<?php

use App\Http\Controllers\VpsConnectionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Automated continuous deployment webhook (GitHub / GitLab / Bitbucket / CI-CD)
Route::match(['get', 'post'], '/webhooks/deploy/{id}', [VpsConnectionController::class, 'handleDeployWebhook'])->name('api.webhooks.deploy');
