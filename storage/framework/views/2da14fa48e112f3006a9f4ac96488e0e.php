<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #dc2626;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 5px 5px;
        }
        .user-info {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Password Reset Request</h1>
    </div>
    <div class="content">
        <p>Dear Administrator,</p>

        <p>A user has requested a password reset for their account. Please review the request and take appropriate action.</p>

        <div class="user-info">
            <h3>User Details:</h3>
            <p><strong>Name:</strong> <?php echo e($user->name); ?></p>
            <p><strong>Email:</strong> <?php echo e($user->email); ?></p>
            <p><strong>Role:</strong> <?php echo e($user->role ?? 'N/A'); ?></p>
            <p><strong>Status:</strong> <?php echo e($user->status); ?></p>
            <p><strong>Account Created:</strong> <?php echo e($user->created_at->format('M d, Y')); ?></p>
        </div>

        <p>Please log in to the admin panel to reset the user's password if appropriate.</p>

        <p>Best regards,<br>
        SPMO System</p>
    </div>
    <div class="footer">
        <p>This is an automated message from the Supply and Property Management System.</p>
    </div>
</body>
</html><?php /**PATH C:\xampp\htdocs\SupplySystem\resources\views/emails/password-reset-request.blade.php ENDPATH**/ ?>