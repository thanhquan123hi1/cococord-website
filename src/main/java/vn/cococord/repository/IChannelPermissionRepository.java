package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


import vn.cococord.entity.mysql.ChannelPermission;
import vn.cococord.entity.mysql.ChannelPermission.TargetType;

/**
 * Repository cho Channel Permission Overrides
 */
@Repository
public interface IChannelPermissionRepository extends JpaRepository<ChannelPermission, Long> {

       /**
        * Tìm tất cả permission overrides của một channel
        * 
        * @param channelId ID của channel
        * @return Danh sách permission overrides
        */
       List<ChannelPermission> findByChannelId(Long channelId);

       /**
        * Tìm permission override cho một User cụ thể trong channel
        * 
        * @param channelId ID của channel
        * @param userId    ID của user
        * @return Optional chứa ChannelPermission nếu tồn tại
        */
       default Optional<ChannelPermission> findByChannelIdAndRoleId(Long channelId, Long roleId) {
              return findByChannel_IdAndTargetTypeAndTargetId(channelId, TargetType.ROLE, roleId);
       }

       default Optional<ChannelPermission> findByChannelIdAndUserId(Long channelId, Long userId) {
              return findByChannel_IdAndTargetTypeAndTargetId(channelId, TargetType.USER, userId);
       }

       /**
        * Internal generic finder
        */
       Optional<ChannelPermission> findByChannel_IdAndTargetTypeAndTargetId(Long channelId, TargetType targetType,
                     Long targetId);

       /**
        * Tìm tất cả permission overrides của một User trong channel (bao gồm cả
        * role-based)
        * 
        * @param channelId ID của channel
        * @param userId    ID của user
        * @param roleIds   Danh sách Role IDs của user
        * @return Danh sách permission overrides
        */
       @Query("SELECT cp FROM ChannelPermission cp WHERE cp.channel.id = :channelId " +
                     "AND ((cp.targetType = :userType AND cp.targetId = :userId) "
                     +
                     "OR (cp.targetType = :roleType AND cp.targetId IN :roleIds))")
       List<ChannelPermission> findByChannelIdAndUserIdOrRoleIds(
                     @Param("channelId") Long channelId,
                     @Param("userId") Long userId,
                     @Param("roleIds") List<Long> roleIds,
                     @Param("userType") TargetType userType,
                     @Param("roleType") TargetType roleType);

       // Default method to inject enum types
       default List<ChannelPermission> findByChannelIdAndUserIdOrRoleIds(Long channelId, Long userId,
                     List<Long> roleIds) {
              return findByChannelIdAndUserIdOrRoleIds(channelId, userId, roleIds, TargetType.USER, TargetType.ROLE);
       }

       /**
        * Tìm tất cả role-based permission overrides trong channel
        * 
        * @param channelId ID của channel
        * @return Danh sách permission overrides cho roles
        */
       default List<ChannelPermission> findRoleOverridesByChannelId(Long channelId) {
              return findByChannel_IdAndTargetType(channelId, TargetType.ROLE);
       }

       /**
        * Tìm tất cả user-based permission overrides trong channel
        * 
        * @param channelId ID của channel
        * @return Danh sách permission overrides cho users
        */
       default List<ChannelPermission> findUserOverridesByChannelId(Long channelId) {
              return findByChannel_IdAndTargetType(channelId, TargetType.USER);
       }

       /**
        * Internal generic finder by list - uses underscore for nested property
        */
       List<ChannelPermission> findByChannel_IdAndTargetType(Long channelId, TargetType targetType);

       /**
        * Also provide underscore version for Channel.id lookup
        */
       List<ChannelPermission> findByChannel_Id(Long channelId);

       /**
        * Xóa tất cả permission overrides của một target (User hoặc Role)
        * 
        * @param channelId  ID của channel
        * @param targetType Loại target (USER hoặc ROLE)
        * @param targetId   ID của target
        */
       void deleteByChannel_IdAndTargetTypeAndTargetId(
                     Long channelId,
                     TargetType targetType,
                     Long targetId);

       /**
        * Xóa tất cả permission overrides của một channel
        * 
        * @param channelId ID của channel
        */
       void deleteByChannel_Id(Long channelId);

       /**
        * Kiểm tra xem có permission override cho target không
        * 
        * @param channelId  ID của channel
        * @param targetType Loại target
        * @param targetId   ID của target
        * @return true nếu tồn tại
        */
       boolean existsByChannel_IdAndTargetTypeAndTargetId(
                     Long channelId,
                     TargetType targetType,
                     Long targetId);

       /**
        * Tìm tất cả channels mà một role có permission overrides
        * Hữu ích khi xóa role để cleanup permissions
        * 
        * @param roleId ID của role
        * @return Danh sách channel IDs
        */
       @Query("SELECT DISTINCT cp.channel.id FROM ChannelPermission cp " +
                     "WHERE cp.targetType = :targetType AND cp.targetId = :roleId")
       List<Long> findChannelIdsByRoleId(@Param("roleId") Long roleId, @Param("targetType") TargetType targetType);

       default List<Long> findChannelIdsByRoleId(Long roleId) {
              return findChannelIdsByRoleId(roleId, TargetType.ROLE);
       }

       /**
        * Xóa tất cả permission overrides của một role (khi xóa role)
        * 
        * @param roleId ID của role
        */
       @Modifying // Bắt buộc phải có cho lệnh DELETE/UPDATE
       @Transactional
       @Query("DELETE FROM ChannelPermission cp WHERE cp.targetType = :targetType AND cp.targetId = :roleId")
       void deleteByRoleId(@Param("roleId") Long roleId, @Param("targetType") TargetType targetType);

       default void deleteByRoleId(Long roleId) {
              deleteByRoleId(roleId, TargetType.ROLE);
       }

       /**
        * Xóa tất cả permission overrides của một user trong server (khi kick/ban user)
        * 
        * @param userId   ID của user
        * @param serverId ID của server
        */
       @Modifying // Bắt buộc phải có cho lệnh DELETE/UPDATE
    @Transactional
       @Query("DELETE FROM ChannelPermission cp WHERE cp.targetType = :userType " +
                     "AND cp.targetId = :userId AND cp.channel.server.id = :serverId")
       void deleteByUserIdAndServerId(@Param("userId") Long userId, @Param("serverId") Long serverId,
                     @Param("userType") TargetType userType);

       default void deleteByUserIdAndServerId(Long userId, Long serverId) {
              deleteByUserIdAndServerId(userId, serverId, TargetType.USER);
       }
}
