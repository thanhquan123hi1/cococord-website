package vn.cococord.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {
    private String name;
    private Frontend frontend = new Frontend();

    @Data
    public static class Frontend {
        private String url;
    }
}
