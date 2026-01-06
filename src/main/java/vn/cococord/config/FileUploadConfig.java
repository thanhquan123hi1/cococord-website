package vn.cococord.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve uploaded files
        // Use absolute path for file location to ensure it works across different working directories
        // Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        // String uploadLocation = "file:///" + uploadPath.toString().replace("\\", "/") + "/";
        
        // registry.addResourceHandler("/uploads/**")
        //         .addResourceLocations(uploadLocation);
    }
}
