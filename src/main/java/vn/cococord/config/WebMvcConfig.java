package vn.cococord.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    @SuppressWarnings("null")
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình đường dẫn: Khi truy cập /upload/** sẽ tìm file trong thư mục
        // 'upload' ở gốc dự án
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:upload/");
    }
}