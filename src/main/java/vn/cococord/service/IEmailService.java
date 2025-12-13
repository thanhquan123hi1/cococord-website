package vn.cococord.service;

public interface IEmailService {

    /**
     * Send welcome email to new user
     */
    void sendWelcomeEmail(String toEmail, String displayName);

    /**
     * Send password reset email
     */
    void sendPasswordResetEmail(String toEmail, String displayName, String resetToken);

    /**
     * Send password changed notification email
     */
    void sendPasswordChangedEmail(String toEmail, String displayName);

    /**
     * Send password reset success email
     */
    void sendPasswordResetSuccessEmail(String toEmail, String displayName);
}
