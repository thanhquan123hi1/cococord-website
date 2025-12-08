package vn.cococord.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Value("${spring.mail.username:noreply@cococord.vn}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:8080}")
    private String frontendUrl;

    private final JavaMailSender mailSender;

    @Autowired(required = false)
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public EmailService() {
        this.mailSender = null;
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String token) {
        if (mailSender == null) {
            System.out.println("[EMAIL] Password reset token for " + toEmail + ": " + token);
            System.out.println("[EMAIL] Reset URL: " + frontendUrl + "/reset-password?token=" + token);
            return;
        }

        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("CoCoCord - Password Reset Request");
        message.setText("Hello,\n\n" +
                "You have requested to reset your password.\n\n" +
                "Click the link below to reset your password:\n" +
                resetUrl + "\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "CoCoCord Team");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't throw - email failure shouldn't break the flow
            System.err.println("Failed to send password reset email: " + e.getMessage());
        }
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String username) {
        if (mailSender == null) {
            System.out.println("[EMAIL] Welcome email for " + username + " (" + toEmail + ")");
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Welcome to CoCoCord!");
        message.setText("Hello " + username + ",\n\n" +
                "Welcome to CoCoCord! Your account has been successfully created.\n\n" +
                "Start chatting with your friends now!\n\n" +
                "Best regards,\n" +
                "CoCoCord Team");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }

    @Async
    public void sendServerInviteEmail(String toEmail, String inviterName, String serverName, String inviteCode) {
        if (mailSender == null) {
            System.out.println("[EMAIL] Server invite for " + toEmail + " to " + serverName + ", code: " + inviteCode);
            return;
        }

        String inviteUrl = frontendUrl + "/invite/" + inviteCode;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("You've been invited to join " + serverName + " on CoCoCord!");
        message.setText("Hello,\n\n" +
                inviterName + " has invited you to join the server \"" + serverName + "\" on CoCoCord.\n\n" +
                "Click the link below to join:\n" +
                inviteUrl + "\n\n" +
                "Best regards,\n" +
                "CoCoCord Team");

        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send invite email: " + e.getMessage());
        }
    }
}
