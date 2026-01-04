package vn.cococord.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.cococord.entity.mysql.SystemSettings;

import java.util.List;
import java.util.Optional;

@Repository
public interface ISystemSettingsRepository extends JpaRepository<SystemSettings, Long> {

    Optional<SystemSettings> findByKey(String key);

    @Query("SELECT s FROM SystemSettings s WHERE s.key IN :keys")
    List<SystemSettings> findByKeys(@Param("keys") List<String> keys);

    boolean existsByKey(String key);

    @Modifying
    @Query("UPDATE SystemSettings s SET s.value = :value WHERE s.key = :key")
    int updateValueByKey(@Param("key") String key, @Param("value") String value);
}
