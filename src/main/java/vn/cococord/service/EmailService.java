package vn.cococord.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.name:CoCoCord}")
    private String appName;

    @Async
    @SuppressWarnings("null")
    public void sendWelcomeEmail(String toEmail, String displayName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to " + appName + "!");

            String htmlContent = buildWelcomeEmailTemplate(displayName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Welcome email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to: {}", toEmail, e);
        }
    }

    @Async
    @SuppressWarnings("null")
    public void sendPasswordResetEmail(String toEmail, String displayName, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset Request - " + appName);

            String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
            String htmlContent = buildPasswordResetEmailTemplate(displayName, resetUrl);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Async
    @SuppressWarnings("null")
    public void sendPasswordChangedEmail(String toEmail, String displayName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Password Changed - " + appName);

            String htmlContent = buildPasswordChangedEmailTemplate(displayName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password changed notification sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password changed email to: {}", toEmail, e);
        }
    }

    @Async
    @SuppressWarnings("null")
    public void sendPasswordResetSuccessEmail(String toEmail, String displayName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset Successful - " + appName);

            String htmlContent = buildPasswordResetSuccessEmailTemplate(displayName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset success email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password reset success email to: {}", toEmail, e);
        }
    }

    private String buildWelcomeEmailTemplate(String displayName) {
        return "<!DOCTYPE html>" +
                "<html><head><style>" +
                "body{font-family:Arial,sans-serif;line-height:1.6;color:#333}" +
                ".container{max-width:600px;margin:0 auto;padding:20px}" +
                ".header{background:#5865F2;color:white;padding:20px;text-align:center}" +
                ".content{padding:20px;background:#f9f9f9}" +
                ".button{display:inline-block;padding:10px 20px;background:#5865F2;color:white;text-decoration:none;border-radius:5px}"
                +
                "</style></head><body>" +
                "<div class='container'>" +
                "<div class='header'><h1>Welcome to " + appName + "!</h1></div>" +
                "<div class='content'>" +
                "<p>Hi " + displayName + ",</p>" +
                "<p>Welcome to " + appName + "! We're excited to have you on board.</p>" +
                "<p>You can now start chatting with friends, join servers, and explore all the features we have to offer.</p>"
                +
                "<p style='text-align:center;margin:30px 0'>" +
                "<a href='" + frontendUrl + "' class='button'>Get Started</a></p>" +
                "<p>If you have any questions, feel free to reach out to our support team.</p>" +
                "<p>Best regards,<br>The " + appName + " Team</p>" +
                "</div></div></body></html>";
    }

    private String buildPasswordResetEmailTemplate(String displayName, String resetUrl) {
        return "<!DOCTYPE html>" +
                "<html><head><style>" +
                "body{font-family:Arial,sans-serif;line-height:1.6;color:#333}" +
                ".container{max-width:600px;margin:0 auto;padding:20px}" +
                ".header{background:#5865F2;color:white;padding:20px;text-align:center}" +
                ".content{padding:20px;background:#f9f9f9}" +
                ".button{display:inline-block;padding:10px 20px;background:#5865F2;color:white;text-decoration:none;border-radius:5px}"
                +
                ".warning{background:#fff3cd;padding:10px;border-left:4px solid #ffc107;margin:20px 0}" +
                "</style></head><body>" +
                "<div class='container'>" +
                "<div class='header'><h1>Password Reset Request</h1></div>" +
                "<div class='content'>" +
                "<p>Hi " + displayName + ",</p>" +
                "<p>We received a request to reset your password. Click the button below to create a new password:</p>"
                +
                "<p style='text-align:center;margin:30px 0'>" +
                "<a href='" + resetUrl + "' class='button'>Reset Password</a></p>" +
                "<div class='warning'><strong>Important:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.</div>"
                +
                "<p>If the button doesn't work, copy and paste this link into your browser:</p>" +
                "<p style='word-break:break-all;color:#5865F2'>" + resetUrl + "</p>" +
                "<p>Best regards,<br>The " + appName + " Team</p>" +
                "</div></div></body></html>";
    }

    private String buildPasswordChangedEmailTemplate(String displayName) {
        return "<!DOCTYPE html>" +
                "<html><head><style>" +
                "body{font-family:Arial,sans-serif;line-height:1.6;color:#333}" +
                ".container{max-width:600px;margin:0 auto;padding:20px}" +
                ".header{background:#28a745;color:white;padding:20px;text-align:center}" +
                ".content{padding:20px;background:#f9f9f9}" +
                ".warning{background:#fff3cd;padding:10px;border-left:4px solid #ffc107;margin:20px 0}" +
                "</style></head><body>" +
                "<div class='container'>" +
                "<div class='header'><h1>Password Changed Successfully</h1></div>" +
                "<div class='content'>" +
                "<p>Hi " + displayName + ",</p>" +
                "<p>This is a confirmation that your password has been changed successfully.</p>" +
                "<div class='warning'><strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately.</div>"
                +
                "<p>Best regards,<br>The " + appName + " Team</p>" +
                "</div></div></body></html>";
    }

    private String buildPasswordResetSuccessEmailTemplate(String displayName) {
        return "<!DOCTYPE html>" +
                "<html><head><style>" +
                "body{font-family:Arial,sans-serif;line-height:1.6;color:#333}" +
                ".container{max-width:600px;margin:0 auto;padding:20px}" +
                ".header{background:#28a745;color:white;padding:20px;text-align:center}" +
                ".content{padding:20px;background:#f9f9f9}" +
                ".button{display:inline-block;padding:10px 20px;background:#5865F2;color:white;text-decoration:none;border-radius:5px}"
                +
                "</style></head><body>" +
                "<div class='container'>" +
                "<div class='header'><h1>Password Reset Successful</h1></div>" +
                "<div class='content'>" +
                "<p>Hi " + displayName + ",</p>" +
                "<p>Your password has been reset successfully. You can now login with your new password.</p>" +
                "<p style='text-align:center;margin:30px 0'>" +
                "<a href='" + frontendUrl + "/login' class='button'>Login Now</a></p>" +
                "<p>Best regards,<br>The " + appName + " Team</p>" +
                "</div></div></body></html>";
    }
}
