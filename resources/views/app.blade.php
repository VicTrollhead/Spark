<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia></title>

        <link rel="icon" href="/spark-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: light)">
        <link rel="icon" href="/spark-light.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)">
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        <meta name="csrf-token" content="{{ csrf_token() }}">

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>

