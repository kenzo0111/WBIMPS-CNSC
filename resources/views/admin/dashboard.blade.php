<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
    <link rel="icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>CNSC Supply Management Dashboard</title>
    @vite('resources/css/dashboard.css')
    <!-- Lucide Icons CDN -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <!-- Charts are now bundled via npm (imported by Vite). -->
    <script>
        window.APP_ROUTES = window.APP_ROUTES || {};
        window.APP_ROUTES.base = "{{ url('/') }}";
        window.APP_ROUTES.login = "{{ route('login') }}";
        window.APP_ROUTES.logout = "{{ route('logout') }}";
        window.APP_ROUTES.dashboard = "{{ route('admin.dashboard') }}";
        // Patterns for client-side route generation (placeholders: {id} or :id)
        window.APP_ROUTES.purchaseOrderView = "{{ url('/purchase-order/view/{id}') }}";
        window.APP_ROUTES.purchaseRequestView = "{{ url('/purchase-request/view/{id}') }}";
        window.APP_ROUTES.inventoryCustodianSlipView = "{{ url('/inventory-custodian-slip/view/{id}') }}";
        window.APP_ROUTES.requisitionIssueSlipView = "{{ url('/requisition-issue-slip/view/{id}') }}";
        window.APP_ROUTES.propertyAcknowledgementReceiptView = "{{ url('/property-acknowledgement-receipt/view/{id}') }}";
        window.APP_ROUTES.siteContentAboutGet = "{{ url('/api/site-contents/about-us') }}";
        window.APP_ROUTES.siteContentAboutUpdate = "{{ url('/api/site-contents/about-us') }}";
        // Activity APIs
        window.APP_ROUTES.activities = "{{ url('/api/activities') }}";
        window.APP_ROUTES.userLogs = "{{ url('/api/user-logs') }}";
        window.APP_ROUTES.inspectionAcceptanceReportView = "{{ url('/inspection-acceptance-report/view/{id}') }}";
    </script>
    <script>
        window.CURRENT_USER = @json($currentUserData);
    </script>
</head>

<body>
    <div class="app" id="app">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <!-- Logo Section -->
            <div class="sidebar-header">
                <div class="logo-container">
                    <div class="logo-icon">
                        <img src="{{ $imagesPath }}/cnscrefine.png" alt="Logo" class="icon-logo" />
                    </div>
                    <div class="logo-text">
                        <h1>CNSC Supply</h1>
                        <p>Management</p>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="sidebar-nav">
                <!-- Dashboard -->
                <div class="nav-item active" data-page="dashboard">
                    <button class="nav-button">
                        <div class="nav-content">
                            <i data-lucide="bar-chart-3" class="icon"></i>
                            <span>Dashboard</span>
                        </div>
                    </button>
                </div>

                <!-- Transactions -->
                <div class="nav-group">
                    <button class="nav-button nav-header" data-group="transactions">
                        <div class="nav-content">
                            <i data-lucide="activity" class="icon"></i>
                            <span>Transactions</span>
                        </div>
                        <i data-lucide="chevron-right" class="chevron"></i>
                    </button>
                    <div class="nav-submenu">
                        <div class="nav-item" data-page="login-activity">
                            <button class="nav-button">
                                <span>User Activities</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Inventory Management -->
                <div class="nav-group">
                    <button class="nav-button nav-header" data-group="inventory">
                        <div class="nav-content">
                            <i data-lucide="package" class="icon"></i>
                            <span>Inventory Management</span>
                        </div>
                        <i data-lucide="chevron-right" class="chevron"></i>
                    </button>
                    <div class="nav-submenu">
                        <div class="nav-item" data-page="categories">
                            <button class="nav-button">
                                <span>Categories</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="items">
                            <button class="nav-button">
                                <span>Items</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="stock-in">
                            <button class="nav-button">
                                <span>Stock In</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="stock-out">
                            <button class="nav-button">
                                <span>Stock Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Supplier Management (top-level) -->
                <div class="nav-group">
                    <button class="nav-button nav-header" data-group="suppliers">
                        <div class="nav-content">
                            <i data-lucide="truck" class="icon"></i>
                            <span>Supplier Management</span>
                        </div>
                        <i data-lucide="chevron-right" class="chevron"></i>
                    </button>
                    <div class="nav-submenu">
                        <div class="nav-item" data-page="suppliers">
                            <button class="nav-button">
                                <span>Suppliers</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Requisition System -->
                <div class="nav-group">
                    <button class="nav-button nav-header" data-group="requisition">
                        <div class="nav-content">
                            <i data-lucide="file-text" class="icon"></i>
                            <span>Requisition</span>
                        </div>
                        <i data-lucide="chevron-right" class="chevron"></i>
                    </button>
                    <div class="nav-submenu">
                        <div class="nav-item" data-page="new-request">
                            <button class="nav-button">
                                <span>New Request</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="pending-approval">
                            <button class="nav-button">
                                <span>Pending Approval</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="completed-request">
                            <button class="nav-button">
                                <span>Completed Request</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="status-management">
                            <button class="nav-button">
                                <span>Status Management</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Reports -->
                <div class="nav-group">
                    <button class="nav-button nav-header" data-group="reports">
                        <div class="nav-content">
                            <i data-lucide="bar-chart-3" class="icon"></i>
                            <span>Reports</span>
                        </div>
                        <i data-lucide="chevron-right" class="chevron"></i>
                    </button>
                    <div class="nav-submenu">
                        <div class="nav-item" data-page="rcpi-reports">
                            <button class="nav-button">
                                <span>RCPI</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="rsmi-reports">
                            <button class="nav-button">
                                <span>RSMI</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="stock-cards">
                            <button class="nav-button">
                                <span>Stock Cards</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="consolidate-monitoring">
                            <button class="nav-button">
                                <span>Consolidate Monitoring</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- User Management -->
                <div class="nav-group">
                    <button class="nav-button nav-header" data-group="user-management">
                        <div class="nav-content">
                            <i data-lucide="users" class="icon"></i>
                            <span>User Management</span>
                        </div>
                        <i data-lucide="chevron-right" class="chevron"></i>
                    </button>
                    <div class="nav-submenu">
                        <div class="nav-item" data-page="users">
                            <button class="nav-button">
                                <span>Users</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="roles">
                            <button class="nav-button">
                                <span>Roles & Management</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- About Us -->
                <div class="nav-item" data-page="about">
                    <button class="nav-button">
                        <div class="nav-content">
                            <i data-lucide="info" class="icon"></i>
                            <span>About Us</span>
                        </div>
                    </button>
                </div>
                <!-- Support -->
                <div class="nav-item" data-page="support">
                    <button class="nav-button">
                        <div class="nav-content">
                            <i data-lucide="life-buoy" class="icon"></i>
                            <span>Support</span>
                        </div>
                    </button>
                </div>
            </nav>

            <!-- Sidebar Footer with Toggle Button -->
            <div class="sidebar-footer">
                <button class="sidebar-toggle" id="sidebar-toggle" onclick="toggleSidebar()"
                    aria-label="Toggle sidebar">
                    <i data-lucide="panel-left-close" class="toggle-icon"></i>
                    <span class="toggle-text">Collapse</span>
                </button>
            </div>
        </aside>

        <!-- Main Content Area -->
        <main class="main-content" id="main-content">
            <!-- Page content will be dynamically loaded here -->
        </main>
    </div>

    <!-- Purchase Order Modal -->
    <div class="modal-overlay" id="purchase-order-modal">
        <div class="modal-content">
            <!-- Modal content will be dynamically loaded here -->
        </div>
    </div>

    <!-- Item Modal -->
    <div class="modal-overlay" id="item-modal">
        <div class="modal-content">
            <!-- Modal content will be dynamically loaded here -->
        </div>
    </div>

    <!-- Category Modal -->
    <div class="modal-overlay" id="category-modal">
        <div class="modal-content">
            <!-- Modal content will be dynamically injected here -->
        </div>
    </div>

    <!-- Stock In Modal -->
    <div class="modal-overlay" id="stockin-modal">
        <div class="modal-content"></div>
    </div>

    <!-- Stock Out Modal -->
    <div class="modal-overlay" id="stockout-modal">
        <div class="modal-content"></div>
    </div>

    <!-- User Modal -->
    <div class="modal-overlay" id="user-modal">
        <div class="modal-content"></div>
    </div>

    <!-- Supplier Modal -->
    <div class="modal-overlay" id="supplier-modal-overlay">
        <div class="modal-content"></div>
    </div>

    <!-- Confirmation Modal (used across the app to replace native confirm) -->
    <div class="modal-overlay" id="confirm-modal">
        <div class="modal-content modern-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div class="confirm-icon-wrapper">
                <svg class="confirm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="modal-header">
                <h2 class="modal-title" id="confirm-title">Confirm Action</h2>
                <button class="modal-close" onclick="closeConfirm(false)" aria-label="Close confirmation dialog" type="button">
                    <i data-lucide="x" style="width: 18px; height: 18px;"></i>
                </button>
            </div>
            <div class="modal-body">
                <p id="confirm-message" class="confirm-message">Are you sure you want to proceed with this action?</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary confirm-btn-cancel" id="confirm-cancel" type="button">
                    <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                    <span>Cancel</span>
                </button>
                <button class="btn btn-primary confirm-btn-confirm" id="confirm-ok" type="button">
                    <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                    <span>Confirm</span>
                </button>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    @vite('resources/js/app.js')
    @vite('resources/js/dashboard.js')
</body>

</html>