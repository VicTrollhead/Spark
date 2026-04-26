<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Forbidden - Spark</title>
    @vite(['resources/css/app.css'])
</head>
<body class="flex min-h-dvh flex-col items-center justify-center bg-background text-foreground">
    <div class="text-center px-6">
        <h1 class="text-6xl font-bold text-primary">403</h1>
        <p class="mt-4 text-xl font-semibold text-foreground">Access denied</p>
        <p class="mt-2 text-muted-foreground">{{ $exception->getMessage() ?: "You don't have permission to access this page." }}</p>
        <a href="/dashboard" class="mt-8 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Go home
        </a>
    </div>
</body>
</html>
