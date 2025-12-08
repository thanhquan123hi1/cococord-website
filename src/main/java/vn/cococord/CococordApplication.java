package vn.cococord;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "vn.cococord.entity")
@EnableJpaRepositories(basePackages = "vn.cococord.repository")
public class CococordApplication {
    public static void main(String[] args) {
        SpringApplication.run(CococordApplication.class, args);
    }
}
