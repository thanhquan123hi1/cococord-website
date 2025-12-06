package vn.cococord.config;

import org.sitemesh.builder.SiteMeshFilterBuilder;
import org.sitemesh.config.ConfigurableSiteMeshFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SiteMeshConfig {

    @Bean
    public FilterRegistrationBean<ConfigurableSiteMeshFilter> siteMeshFilter() {
        FilterRegistrationBean<ConfigurableSiteMeshFilter> filterRegistrationBean = new FilterRegistrationBean<>();
        filterRegistrationBean.setFilter(new ConfigurableSiteMeshFilter() {
            @Override
            protected void applyCustomConfiguration(SiteMeshFilterBuilder builder) {
            	builder.addDecoratorPath("/admin/*", "admin.jsp");
                builder.addDecoratorPath("/*", "web.jsp");
                
                // Các đường dẫn loại trừ
                builder.addExcludedPath("/login");
                builder.addExcludedPath("/register");
                builder.addExcludedPath("/upload/**");
                builder.addExcludedPath("/api/*");
            }
        });
        filterRegistrationBean.addUrlPatterns("/*");
        return filterRegistrationBean;
    }
}
