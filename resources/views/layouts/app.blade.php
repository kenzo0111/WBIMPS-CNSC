<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'CNSC SPMO Forms' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    @vite('resources/css/app.css')
    <style>
        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: #f6f8fb;
        }

        .app-shell {
            max-width: 900px;
            margin: 48px auto;
            padding: 24px 32px 32px;
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
        }

        .app-shell h1,
        .app-shell h2,
        .app-shell h3 {
            font-weight: 700;
            color: #0f172a;
        }

        .form-divider {
            border-top: 1px dashed rgba(100, 116, 139, 0.35);
            margin: 28px 0;
        }

        .btn-add-row {
            border-style: dashed;
        }

        .app-footer {
            margin-top: 48px;
            text-align: center;
            color: #64748b;
            font-size: 0.85rem;
        }
    </style>
    @stack('styles')
</head>

<body>
    <div class="app-shell">
        <header class="mb-4">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <p class="text-uppercase text-muted mb-1" style="letter-spacing: 0.06em; font-size: 0.75rem;">Camarines Norte State College</p>
                    <h1 class="h3 mb-0">{{ $heading ?? 'Supply & Property Management Digital Forms' }}</h1>
                </div>
                <div class="text-end">
                    <a href="{{ auth()->check() ? route('user.user-home-page') : route('login') }}" class="btn btn-outline-secondary btn-sm">← Back to portal</a>
                </div>
            </div>
        </header>

        @yield('content')
    </div>

    <div class="app-footer">
        <small>Digital Forms Suite • CNSC Supply & Property Management Office</small>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    @vite('resources/js/app.js')
    @stack('scripts')
</body>

</html>