<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'VPSDeploy') }} - Manage • Deploy • Scale</title>

        <!-- Primary Meta Tags -->
        <meta name="title" content="VPSDeploy - Manage • Deploy • Scale">
        <meta name="description" content="VPSDeploy - Visual GUI for automated Linux VPS management, GitHub deployments, Nginx configuration, SSL automation, and server monitoring.">
        <meta name="keywords" content="VPSDeploy, VPS Management, Automated Deployment, Git Deploy, Nginx GUI, SSL Automation, Server Monitoring, Devops GUI">
        <meta name="author" content="VPSDeploy">
        <meta name="theme-color" content="#0A0D14">

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="VPSDeploy">
        <meta property="og:title" content="VPSDeploy — Manage • Deploy • Scale">
        <meta property="og:description" content="Modern GUI for automated Linux VPS management, GitHub deployments, Nginx configurations, and SSL certificates.">
        <meta property="og:image" content="{{ asset('images/vpsdeploy-og.jpg') }}">

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="VPSDeploy — Manage • Deploy • Scale">
        <meta name="twitter:description" content="Turn manual VPS deployment into a visual, automated GUI experience.">
        <meta name="twitter:image" content="{{ asset('images/vpsdeploy-og.jpg') }}">

        <!-- Favicons & Touch Icons -->
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}">
        <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('favicon-16x16.png') }}">
        <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('apple-touch-icon.png') }}">
        <link rel="manifest" href="{{ asset('site.webmanifest') }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Lobster&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
