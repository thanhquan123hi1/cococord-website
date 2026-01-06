package vn.cococord.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import vn.cococord.service.IEmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements IEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.name:CoCoCord}")
    private String appName;

    // --- PUBLIC METHODS ---

    @Async
    @SuppressWarnings("null")
    public void sendWelcomeEmail(String toEmail, String displayName) {
        String subject = "Welcome to the Inner Circle - " + appName;
        String content = buildWelcomeContent(displayName);
        sendEmail(toEmail, subject, content);
    }

    @Async
    @SuppressWarnings("null")
    public void sendPasswordResetEmail(String toEmail, String displayName, String resetToken) {
        String subject = "Security Verification - " + appName;
        String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
        String content = buildPasswordResetContent(displayName, resetUrl);
        sendEmail(toEmail, subject, content);
    }

    @Async
    @SuppressWarnings("null")
    public void sendPasswordChangedEmail(String toEmail, String displayName) {
        String subject = "Credentials Updated - " + appName;
        String content = buildPasswordChangedContent(displayName);
        sendEmail(toEmail, subject, content);
    }

    @Async
    @SuppressWarnings("null")
    public void sendPasswordResetSuccessEmail(String toEmail, String displayName) {
        String subject = "Access Restored - " + appName;
        String content = buildPasswordResetSuccessContent(displayName);
        sendEmail(toEmail, subject, content);
    }

    // --- PRIVATE HELPER METHODS ---

    private void sendEmail(String to, String subject, String bodyContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);

            // Wrap nội dung vào layout sang trọng
            String fullHtml = buildLuxuryLayout(subject, bodyContent);
            helper.setText(fullHtml, true);

            mailSender.send(message);
            log.info("Luxury Email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
            // Tùy chọn: ném exception nếu cần handle ở tầng trên
        }
    }

    // --- TEMPLATE BUILDERS (LUXURY STYLE) ---

    /**
     * Layout tổng thể:
     * - Background: Trắng tinh khôi hoặc Xám rất nhạt.
     * - Font: Serif cho tiêu đề (sang trọng), Sans-serif cho body.
     * - Accent Color: Gold (#D4AF37) và Black (#1A1A1A).
     */
    private String buildLuxuryLayout(String title, String innerContent) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        /* Reset & Base */
                        body { margin: 0; padding: 0; background-color: #F9F9F9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #333333; }
                        a { text-decoration: none; transition: all 0.3s ease; }

                        /* Container - Card sang trọng */
                        .wrapper { width: 100%%; padding: 60px 0; background-color: #F9F9F9; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #EAEAEA; box-shadow: 0 10px 30px rgba(0,0,0,0.02); }

                        /* Header - Tối giản, Serif Font */
                        .header { padding: 40px 0 20px 0; text-align: center; border-bottom: 2px solid #D4AF37; margin: 0 40px; }
                        .brand-name { font-family: 'Times New Roman', Times, serif; font-size: 24px; letter-spacing: 3px; text-transform: uppercase; color: #1A1A1A; font-weight: bold; }

                        /* Content */
                        .content { padding: 40px; line-height: 1.8; font-size: 15px; color: #555555; }
                        .greeting { font-family: 'Times New Roman', Times, serif; font-size: 22px; color: #1A1A1A; margin-bottom: 20px; }

                        /* Button - Đen & Vàng Kim */
                        .btn-container { text-align: center; margin: 40px 0; }
                        .btn { display: inline-block; padding: 16px 36px; background-color: #1A1A1A; color: #D4AF37 !important; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; border: 1px solid #1A1A1A; }
                        .btn:hover { background-color: #FFFFFF; color: #1A1A1A !important; }

                        /* Footer - Tinh tế */
                        .footer { background-color: #FAFAFA; padding: 30px; text-align: center; font-size: 11px; color: #999999; border-top: 1px solid #EAEAEA; letter-spacing: 1px; text-transform: uppercase; }

                        /* Utilities */
                        .divider { height: 1px; background-color: #EAEAEA; margin: 30px 0; border: none; }
                        .accent-text { color: #D4AF37; font-weight: bold; }
                        .warning-box { background-color: #FFFAFA; border-left: 2px solid #D4AF37; padding: 20px; font-size: 13px; color: #666; margin-top: 30px; font-style: italic; }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <span class="brand-name">%s</span>
                            </div>
                            <div class="content">
                                %s
                            </div>
                            <div class="footer">
                                &copy; %s %s. All Rights Reserved.<br>
                                Excellence in Connectivity.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(appName, innerContent, java.time.Year.now().getValue(), appName);
    }

    private String buildWelcomeContent(String displayName) {
        return """
                <h2 class="greeting">Greetings, %s.</h2>
                <p>It is our distinct pleasure to welcome you to <strong>%s</strong>.</p>
                <p>You have joined a community that values quality, connection, and seamless interaction. Your account has been prepared with the utmost care.</p>
                <p>We invite you to step into your new digital experience.</p>

                <div class="btn-container">
                    <a href="%s" class="btn">Begin Experience</a>
                </div>

                <p style="font-size: 13px; color: #888; text-align: center;">
                    <em>"Simplicity is the ultimate sophistication."</em>
                </p>
                """
                .formatted(displayName, appName, frontendUrl);
    }

    private String buildPasswordResetContent(String displayName, String resetUrl) {
        return """
                <h2 class="greeting">Security Verification</h2>
                <p>Dear %s,</p>
                <p>We have received a request to reset the credentials associated with your account. To maintain the integrity and security of your profile, please proceed via the secure link below.</p>

                <div class="btn-container">
                    <a href="%s" class="btn">Secure Reset Link</a>
                </div>

                <div class="warning-box">
                    <strong>Notice:</strong> This authorization is valid for 60 minutes. If you did not initiate this request, please disregard this correspondence. Your account remains secure.
                </div>

                <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                    <p>Alternatively, copy this secure URL:</p>
                    <a href="%s" style="color: #1A1A1A; border-bottom: 1px solid #D4AF37;">%s</a>
                </div>
                """
                .formatted(displayName, resetUrl, resetUrl, resetUrl);
    }

    private String buildPasswordChangedContent(String displayName) {
        String supportEmail = "concierge@" + appName.toLowerCase().replaceAll("\\s+", "") + ".com";
        return """
                <h2 class="greeting">Credentials Updated</h2>
                <p>Dear %s,</p>
                <p>This correspondence serves as a formal confirmation that the password for your <strong>%s</strong> account has been successfully modified.</p>
                <p>No further action is required on your part.</p>

                <hr class="divider">

                <p style="font-size: 13px;">
                    <span style="color: #D4AF37; font-size: 18px; vertical-align: middle;">⚠</span>
                    <strong>Security Alert:</strong> If this modification was not authorized by you, it is imperative that you <a href="mailto:%s" style="color: #1A1A1A; font-weight: bold; border-bottom: 1px solid #1A1A1A;">contact our concierge support</a> immediately.
                </p>
                """
                .formatted(displayName, appName, supportEmail);
    }

    private String buildPasswordResetSuccessContent(String displayName) {
        String loginLink = frontendUrl + "/login";
        return """
                <div style="text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 40px; color: #D4AF37;">&#10003;</span>
                </div>
                <h2 class="greeting" style="text-align: center;">Access Restored</h2>
                <p style="text-align: center;">Dear %s,</p>
                <p style="text-align: center;">Your access credentials have been successfully reset. You may now resume your session with full privileges.</p>

                <div class="btn-container">
                    <a href="%s" class="btn">Return to Portal</a>
                </div>
                """
                .formatted(displayName, loginLink);
    }
}