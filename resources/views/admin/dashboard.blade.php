<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>CNSC Supply Management Dashboard</title>
    @vite('resources/css/dashboard.css')
    <!-- Lucide Icons CDN -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <!-- Chart.js CDN for report charts -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                        <div class="nav-item" data-page="products">
                            <button class="nav-button">
                                <span>Products</span>
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
                        <!-- Suppliers moved to its own top-level section -->
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
                            <span>Requisition System</span>
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
                    </div>
                </div>

                <!-- Status Management -->
                <div class="nav-group">
                    <button class="nav-button nav-header" data-group="status">
                        <div class="nav-content">
                            <i data-lucide="check-square" class="icon"></i>
                            <span>Status Management</span>
                        </div>
                        <i data-lucide="chevron-right" class="chevron"></i>
                    </button>
                    <div class="nav-submenu">
                        <div class="nav-item" data-page="incoming">
                            <button class="nav-button">
                                <span>Incoming</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="received">
                            <button class="nav-button">
                                <span>Received</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="finished">
                            <button class="nav-button">
                                <span>Finished</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="cancelled">
                            <button class="nav-button">
                                <span>Cancelled</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="rejected">
                            <button class="nav-button">
                                <span>Rejected</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="returned">
                            <button class="nav-button">
                                <span>Returned</span>
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
                        <div class="nav-item" data-page="inventory-reports">
                            <button class="nav-button">
                                <span>Inventory Reports</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="requisition-reports">
                            <button class="nav-button">
                                <span>Requisition Reports</span>
                            </button>
                        </div>
                        <div class="nav-item" data-page="status-report">
                            <button class="nav-button">
                                <span>Status Report</span>
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
                        <div class="nav-item" data-page="login-activity">
                            <button class="nav-button">
                                <span>Login Activity</span>
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

    <!-- Product Modal -->
    <div class="modal-overlay" id="product-modal">
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
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div class="modal-header">
                <h2 class="modal-title" id="confirm-title">Confirm</h2>
                <button class="modal-close" onclick="closeConfirm(false)" aria-label="Close confirmation dialog">
                    <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                </button>
            </div>
            <div class="modal-body">
                <p id="confirm-message">Are you sure?</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" id="confirm-cancel">Cancel</button>
                <button class="btn btn-primary" id="confirm-ok">Confirm</button>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    @vite('resources/js/dashboard.js')
</body>

</html>