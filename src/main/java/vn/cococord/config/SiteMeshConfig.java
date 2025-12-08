package vn.cococord.config;

import org.sitemesh.builder.SiteMeshFilterBuilder;
import org.sitemesh.config.ConfigurableSiteMeshFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SiteMeshConfig {
    // SiteMesh disabled - using JSP includes for layout instead
    // This is more stable with Spring Boot embedded Tomcat
    // @Bean
    public FilterRegistrationBean<ConfigurableSiteMeshFilter> siteMeshFilter() {
        FilterRegistrationBean<ConfigurableSiteMeshFilter> filterRegistrationBean = new FilterRegistrationBean<>();
        filterRegistrationBean.setFilter(new ConfigurableSiteMeshFilter() {
            @Override
            protected void applyCustomConfiguration(SiteMeshFilterBuilder builder) {
                builder.addDecoratorPath("/admin/*", "/decorators/admin-decorator.jsp");
                builder.addDecoratorPath("/*", "/decorators/default-decorator.jsp");
                builder.addExcludedPath("/api/*");
                builder.addExcludedPath("/ws/*");
            }
        });
        filterRegistrationBean.addUrlPatterns("/*");
        filterRegistrationBean.setOrder(1);
        return filterRegistrationBean;
    }
}
