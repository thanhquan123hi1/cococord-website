package vn.cococord.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:upload/");

        // Serve static resources
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/", "/css/");
        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/", "/js/");
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/", "/images/");
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Map decorator paths to JSP views
        registry.addViewController("/decorators/default-decorator.jsp")
                .setViewName("../decorators/default-decorator");
        registry.addViewController("/decorators/admin-decorator.jsp")
                .setViewName("../decorators/admin-decorator");
    }
}
