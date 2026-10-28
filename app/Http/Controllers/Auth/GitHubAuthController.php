<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GitHubAuthController extends Controller
{
    /**
     * Redirect the user to the GitHub OAuth authentication page.
     */
    public function redirect(Request $request): RedirectResponse
    {
        // Check GitHub OAuth configuration
        if (empty(config('services.github.client_id')) || empty(config('services.github.client_secret'))) {
            if (app()->isLocal() && config('app.debug') && $request->has('bypass')) {
                return $this->devBypass();
            }

            return redirect()->route('login')->with(
                'error',
                'GitHub OAuth is not configured on this server. Please define GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
            );
        }

        try {
            return Socialite::driver('github')
                ->scopes(['read:user', 'user:email', 'repo'])
                ->redirect();
        } catch (Exception $e) {
            return redirect()->route('login')->with(
                'error',
                'Failed to initiate GitHub OAuth: ' . $e->getMessage()
            );
        }
    }

    /**
     * Obtain user information from GitHub callback and authenticate.
     */
    public function callback(): RedirectResponse
    {
        try {
            $githubUser = Socialite::driver('github')->user();

            $email = $githubUser->getEmail() ?: ($githubUser->getNickname() . '@users.noreply.github.com');
            $name = $githubUser->getName() ?: $githubUser->getNickname() ?: 'GitHub User';

            $user = User::updateOrCreate(
                ['github_id' => (string) $githubUser->getId()],
                [
                    'name' => $name,
                    'github_username' => $githubUser->getNickname(),
                    'email' => $email,
                    'avatar' => $githubUser->getAvatar(),
                    'github_token' => $githubUser->token,
                    'github_refresh_token' => $githubUser->refreshToken,
                    'email_verified_at' => now(),
                ]
            );

            Auth::login($user, true);

            return redirect()->intended(route('dashboard'));
        } catch (Exception $e) {
            return redirect()->route('login')->with(
                'error',
                'GitHub authentication failed: ' . $e->getMessage()
            );
        }
    }

    /**
     * Development authentication bypass (strictly restricted to local development).
     */
    public function devBypass(): RedirectResponse
    {
        if (!app()->isLocal() || !config('app.debug')) {
            abort(403, 'Development authentication bypass is strictly disabled in production.');
        }

        $user = User::firstOrCreate(
            ['email' => 'dev@rhamify.com'],
            [
                'name' => 'Rhamify Developer',
                'github_id' => '10293847',
                'github_username' => 'rhamifydev',
                'avatar' => 'https://avatars.githubusercontent.com/u/9919?v=4',
                'email_verified_at' => now(),
            ]
        );

        Auth::login($user, true);

        return redirect()->intended(route('dashboard'));
    }
}
