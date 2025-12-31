package vn.cococord.config;

import org.sitemesh.builder.SiteMeshFilterBuilder;
import org.sitemesh.config.ConfigurableSiteMeshFilter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class SiteMeshConfig {

    @Bean
    @ConditionalOnProperty(name = "app.sitemesh.enabled", havingValue = "true", matchIfMissing = true)
    public FilterRegistrationBean<ConfigurableSiteMeshFilter> siteMeshFilter() {
        FilterRegistrationBean<ConfigurableSiteMeshFilter> filter = new FilterRegistrationBean<>();

        ConfigurableSiteMeshFilter siteMeshFilter = new ConfigurableSiteMeshFilter() {
            @Override
            protected void applyCustomConfiguration(SiteMeshFilterBuilder builder) {

                // EXCLUDE paths (QUAN TRỌNG)
                builder
                        .addExcludedPath("/api/**")
                        .addExcludedPath("/graphql/**")
                        .addExcludedPath("/ws/**")
                        .addExcludedPath("/css/**")
                        .addExcludedPath("/js/**")
                        .addExcludedPath("/images/**")
                        .addExcludedPath("/webjars/**")
                        .addExcludedPath("/static/**")
                        .addExcludedPath("/favicon.ico")
                        .addExcludedPath("/h2-console/**")
                        .addExcludedPath("/WEB-INF/**");

                // PUBLIC pages with header/footer
                builder
                        .addDecoratorPath("/", "public.jsp")
                        .addDecoratorPath("/login", "public.jsp")
                        .addDecoratorPath("/register", "public.jsp")
                        .addDecoratorPath("/forgot-password", "public.jsp")
                        .addDecoratorPath("/reset-password", "public.jsp");

                // AUTHENTICATED pages
                builder
                        .addDecoratorPath("/app", "app.jsp")
                        .addDecoratorPath("/app/**", "app.jsp")
                        .addDecoratorPath("/chat", "app.jsp")
                        .addDecoratorPath("/chat/**", "app.jsp")
                        .addDecoratorPath("/friends", "app.jsp")
                        .addDecoratorPath("/friends/**", "app.jsp")
                        .addDecoratorPath("/messages", "app.jsp")
                        .addDecoratorPath("/messages/**", "app.jsp")
                        .addDecoratorPath("/profile", "app.jsp")
                        .addDecoratorPath("/profile/**", "app.jsp")
                        .addDecoratorPath("/dashboard", "app.jsp")
                        .addDecoratorPath("/settings", "app.jsp")
                        .addDecoratorPath("/settings/**", "app.jsp")
                        .addDecoratorPath("/sessions", "app.jsp")
                        .addDecoratorPath("/change-password", "app.jsp")
                        .addDecoratorPath("/admin/**", "app.jsp");
            }
        };

        filter.setFilter(siteMeshFilter);
        filter.addUrlPatterns("/*");
        // Run after Spring Security's filter chain
        filter.setOrder(Ordered.LOWEST_PRECEDENCE);

        return filter;
    }
}
