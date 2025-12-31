package vn.cococord.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis configuration for distributed presence management and Pub/Sub messaging.
 * Enables multi-instance server deployments with shared presence state.
 * 
 * This configuration is OPTIONAL - the application will fall back to
 * in-memory ConcurrentHashMap if Redis is not available.
 * 
 * To enable Redis, set: spring.data.redis.enabled=true in application.properties
 */
@Configuration
@ConditionalOnProperty(name = "spring.data.redis.enabled", havingValue = "true", matchIfMissing = false)
@SuppressWarnings("null")
public class RedisConfig {

    /**
     * Redis channel for presence status changes broadcast
     */
    public static final String PRESENCE_CHANNEL = "cococord:presence:channel";

    /**
     * Redis key prefix for user sessions
     * Format: presence:sessions:{userId} -> Set of sessionIds
     */
    public static final String PRESENCE_SESSIONS_PREFIX = "presence:sessions:";

    /**
     * Redis key prefix for user last activity
     * Format: presence:activity:{userId} -> timestamp
     */
    public static final String PRESENCE_ACTIVITY_PREFIX = "presence:activity:";

    /**
     * Redis key for tracking all online users
     * Format: presence:online -> Set of userIds
     */
    public static final String PRESENCE_ONLINE_SET = "presence:online";

    /**
     * TTL for presence data (in seconds) - 5 minutes without heartbeat
     */
    public static final long PRESENCE_TTL_SECONDS = 300;

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Use String serializer for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Use JSON serializer for values
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    @Bean
    public ChannelTopic presenceTopic() {
        return new ChannelTopic(PRESENCE_CHANNEL);
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            MessageListenerAdapter presenceMessageListener,
            ChannelTopic presenceTopic) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(presenceMessageListener, presenceTopic);
        return container;
    }

    @Bean
    public MessageListenerAdapter presenceMessageListener(PresenceRedisMessageSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "onMessage");
    }
}
