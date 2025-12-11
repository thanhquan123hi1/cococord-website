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

        // Cấu hình static resources (CSS, JS, images)
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/");

        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/");

        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");
    }
}