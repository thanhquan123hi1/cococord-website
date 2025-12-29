package vn.cococord.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;
import vn.cococord.entity.mongodb.Message;

/**
 * MongoDB Index Configuration
 * Creates necessary indexes including text index for message search
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class MongoIndexConfig {

    private final MongoTemplate mongoTemplate;

    @PostConstruct
    public void initIndexes() {
        try {
            createMessageIndexes();
            log.info("MongoDB indexes created successfully");
        } catch (Exception e) {
            log.error("Failed to create MongoDB indexes: {}", e.getMessage());
        }
    }

    private void createMessageIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps(Message.class);

        // Create text index on content field for full-text search
        // This supports Vietnamese diacritics and case-insensitive search
        TextIndexDefinition textIndex = TextIndexDefinition.builder()
                .onField("content", 2F)  // Weight of 2 for content field
                .withDefaultLanguage("none")  // Use "none" for better Vietnamese support
                .build();

        try {
            indexOps.ensureIndex(textIndex);
            log.info("Created text index on Message.content");
        } catch (Exception e) {
            log.warn("Text index may already exist or failed to create: {}", e.getMessage());
        }

        // Compound index for channel queries
        try {
            indexOps.ensureIndex(new Index()
                    .on("channelId", Sort.Direction.ASC)
                    .on("createdAt", Sort.Direction.DESC));
            log.info("Created compound index on Message (channelId, createdAt)");
        } catch (Exception e) {
            log.warn("Compound index may already exist: {}", e.getMessage());
        }

        // Compound index for server queries
        try {
            indexOps.ensureIndex(new Index()
                    .on("serverId", Sort.Direction.ASC)
                    .on("createdAt", Sort.Direction.DESC));
            log.info("Created compound index on Message (serverId, createdAt)");
        } catch (Exception e) {
            log.warn("Compound index may already exist: {}", e.getMessage());
        }

        // Index for user queries
        try {
            indexOps.ensureIndex(new Index().on("userId", Sort.Direction.ASC));
            log.info("Created index on Message.userId");
        } catch (Exception e) {
            log.warn("User index may already exist: {}", e.getMessage());
        }
    }
}
