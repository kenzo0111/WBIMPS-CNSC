<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="shortcut icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
  <link rel="icon" href="{{ asset('images/UCN1.png') }}" type="image/png">
  <title>Supply and Property Management System</title>
  @vite('resources/css/index.css')
</head>

<body>
  <!-- Header -->
  <header>
    <div class="header-container">
      <div class="logo">
  <img src="{{ $imagesPath }}/cnscrefine.png" alt="School Logo">
        <div class="logo-text">
          <h1>Supply and Property Management Office</h1>
          <hr>
          <p>WEB - BASED SUPPLY AND PROPERTY MANAGEMENT SYSTEM</p>
        </div>
      </div>
      <nav class="nav-menu">
        @auth
        <div style="display: flex; align-items: center; gap: 15px; margin-right: 15px;">
            <span style="color: white; font-weight: 500; font-size: 0.9rem;">{{ Auth::user()->email }}</span>
            <form method="POST" action="{{ route('logout') }}" style="margin: 0;">
                @csrf
                <button type="submit" class="support-btn" style="background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.3);">
                    Logout
                </button>
            </form>
        </div>
        <a href="{{ route('contact.support') }}" class="support-btn">
          <span class="btn-icon">📞</span>
          Contact Support
        </a>
        @else
        <a href="{{ route('login') }}" class="support-btn" style="margin-right: 15px;">
          Login
        </a>
        @endauth
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-overlay"></div>
    <div class="hero-container">
      <div class="hero-content">
        <div class="hero-badge">
          <span>One CNSC, One Goal</span>
        </div>
        <h2 class="hero-title">
          <span class="title-line">
            <span class="red">Supply</span> & <span class="yellow">Property</span>
          </span>
          <span class="title-line">Management System</span>
        </h2>
        <p class="hero-description">
          Streamline your institutional operations with our comprehensive supply and property
          management system designed specifically for Camarines Norte State College.
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">100%</span>
            <span class="stat-label">Digital</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">24/7</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">Secure</span>
            <span class="stat-label">Platform</span>
          </div>
        </div>
        <div class="hero-buttons">
          <a href="{{ route('user.request') }}" class="btn primary-btn">
            <span class="btn-icon">🚀</span>
            Procurement Panel
          </a>
          <a href="#learn" class="btn secondary-btn">
            <span class="btn-icon">📖</span>
            Learn More
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features" id="learn">
    <div class="features-container">
      <div class="features-header">
        <h2>Powerful Features for Institutional Management</h2>
        <p>Our system provides comprehensive tools to manage supply, track property,
          and ensure efficient operations across all departments</p>
      </div>
      <div class="feature-grid">
        <article class="feature-card">
          <div class="feature-icon">
            <img src="{{ $imagesPath }}/inventory.png" alt="Inventory Icon">
          </div>
          <h3>Inventory Management</h3>
          <p>Track and manage all institutional assets with real-time monitoring</p>
        </article>
        <article class="feature-card">
          <div class="feature-icon">
            <img src="{{ $imagesPath }}/management.png" alt="Management Icon">
          </div>
          <h3>Resource Management</h3>
          <p>Optimize resource allocation and streamline operational workflows</p>
        </article>
        <article class="feature-card">
          <div class="feature-icon">
            <img src="{{ $imagesPath }}/procurement.png" alt="Procurement Icon">
          </div>
          <h3>Property System</h3>
          <p>Manage property records and custodian management processes</p>
        </article>
        <article class="feature-card">
          <div class="feature-icon">
            <img src="{{ $imagesPath }}/stats.png" alt="Analytics Icon">
          </div>
          <h3>Analytics & Reports</h3>
          <p>Generate insights with comprehensive reporting and data visualization</p>
        </article>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <p>&copy; 2025 Camarines Norte State College. All rights reserved.</p>
  </footer>
</body>

</html>