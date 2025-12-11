package vn.cococord.config;

import org.springframework.context.annotation.Configuration;

/**
 * SiteMesh Configuration - DISABLED
 * Tạm thời vô hiệu hóa SiteMesh để tránh conflict với JSP rendering
 */
@Configuration
public class SiteMeshConfig {
    // SiteMesh filter đã được vô hiệu hóa
    // Login và Register pages sẽ tự quản lý CSS/JS
}
