<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Support - SPMO System</title>
    <?php echo app('Illuminate\Foundation\Vite')('resources/css/ContactSupport.css'); ?>
</head>

<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <img src="<?php echo e($imagesPath); ?>/cnscrefine.png" alt="CNSC Logo" />
                <div class="logo-text">
                    <h1>Supply and Property Management</h1>
                    <hr />
                    <p>WEB-BASED INVENTORY AND PROCUREMENT MANAGEMENT SYSTEM</p>
                </div>
            </div>
            <div class="nav-menu">
                <a href="<?php echo e(url('user/home')); ?>" class="back-btn">
                    <span class="btn-icon">←</span>
                    <span class="btn-text">Back to Home</span>
                </a>
            </div>
        </div>
    </header>

    <main class="support-main">
        <div class="support-container">
            <div class="support-content">
                <div class="support-badge">
                    <span>One CNSC, One Goal</span>
                </div>

                <div class="support-header">
                    <h2>Contact Support</h2>
                    <div class="support-subtitle">
                        We're here to help—share your thoughts or inquiries with us,
                        and we'll get back to you soon!
                    </div>
                </div>

                <?php if(session('support_success')): ?>
                    <div class="support-success"><?php echo e(session('support_success')); ?></div>
                <?php endif; ?>

                <form class="support-form" method="POST" action="<?php echo e(route('support.submit')); ?>" enctype="multipart/form-data">
                    <?php echo csrf_field(); ?>
                    <div class="form-section">
                        <div class="form-left">
                            <div class="form-group">
                                <label class="form-label" for="name">Full Name</label>
                                <input class="form-input" type="text" id="name" placeholder="Enter your full name"
                                    required>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="email">Email Address</label>
                                <input class="form-input" type="email" id="email" placeholder="your.email@example.com"
                                    required>
                            </div>

                            <div class="contact-info">
                                <div class="contact-card">
                                    <div class="contact-icon">📞</div>
                                    <div class="contact-details">
                                        <div class="contact-title">Phone Support</div>
                                        <div class="contact-value">0934 567 3312</div>
                                    </div>
                                </div>

                                <div class="social-card">
                                    <div class="social-title">Follow Us</div>
                                    <div class="social-links">
                                        <a href="#" class="social-link">
                                            <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
                                                alt="Facebook">
                                        </a>
                                        <a href="#" class="social-link">
                                            <img src="https://cdn-icons-png.flaticon.com/512/733/733558.png"
                                                alt="Instagram">
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-right">
                            <div class="form-group">
                                <label class="form-label" for="message">Your Message</label>
                                <textarea class="form-textarea" id="message"
                                    placeholder="Please describe your issue or inquiry in detail..."
                                    required></textarea>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="screenshot">Screenshots (Optional)</label>
                                <div class="upload-area" id="uploadArea">
                                    <div class="upload-icon">📎</div>
                                    <div class="upload-text">
                                        <span class="upload-primary">Drop files here or click to browse</span>
                                        <span class="upload-secondary">Supports: JPG, PNG, PDF (Max 10MB)</span>
                                    </div>
                                    <input type="file" id="screenshot" name="attachments[]" multiple accept=".jpg,.jpeg,.png,.pdf"
                                        style="display: none;">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="submit-btn">
                            <span class="btn-text">Send Message</span>
                            <span class="btn-icon">✉️</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </main>

    <script>
        // File upload functionality
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('screenshot');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        function handleFiles(files) {
            if (files.length > 0) {
                const uploadText = uploadArea.querySelector('.upload-primary');
                uploadText.textContent = `${files.length} file(s) selected`;
            }
        }

        // Form submission -> persist ticket so it appears in Dashboard Support page
        const supportForm = document.querySelector('.support-form');
            supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameEl = document.getElementById('name');
            const emailEl = document.getElementById('email');
            const msgEl = document.getElementById('message');
            const filesEl = document.getElementById('screenshot');

            const name = (nameEl.value || '').trim();
            const email = (emailEl.value || '').trim();
            const message = (msgEl.value || '').trim();
            if (!name || !email || !message) {
                alert('Please fill in all required fields.');
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('message', message);
            if (filesEl && filesEl.files && filesEl.files.length) {
                for (let i = 0; i < filesEl.files.length; i++) {
                    formData.append('attachments[]', filesEl.files[i]);
                }
            }

            const submitBtn = document.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="btn-text">Sending...</span>';
            submitBtn.disabled = true;

            try {
                const token = document.querySelector('input[name="_token"]').value;
                const res = await fetch('<?php echo e(route('support.submit')); ?>', {
                    method: 'POST',
                    headers: { 'X-CSRF-TOKEN': token },
                    body: formData,
                });
                if (!res.ok) throw new Error('Failed to submit');
                submitBtn.innerHTML = '<span class="btn-text">Ticket Submitted!</span><span class="btn-icon">✅</span>';
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    supportForm.reset();
                    document.querySelector('.upload-primary').textContent = 'Drop files here or click to browse';
                }, 1500);
            } catch (err) {
                alert('Unable to submit ticket. Please try again or contact support.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        // Pre-fill name/email from session if available
        try {
            const sessionRaw = localStorage.getItem('userSession');
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                if (session.name) document.getElementById('name').value = session.name;
                if (session.email) document.getElementById('email').value = session.email;
            }
        } catch (_) { }
    </script>
</body>

</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/contact-support.blade.php ENDPATH**/ ?>