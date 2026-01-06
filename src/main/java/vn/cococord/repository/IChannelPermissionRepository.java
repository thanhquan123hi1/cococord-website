package vn.cococord.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
       default Optional<ChannelPermission> findByChannelIdAndUserId(Long channelId, Long userId) {
              return findByChannelIdAndTargetTypeAndTargetId(channelId, TargetType.USER, userId);
       }

       /**
        * Tìm permission override cho một Role cụ thể trong channel
        * 
        * @param channelId ID của channel
        * @param roleId    ID của role
        * @return Optional chứa ChannelPermission nếu tồn tại
        */
       default Optional<ChannelPermission> findByChannelIdAndRoleId(Long channelId, Long roleId) {
              return findByChannelIdAndTargetTypeAndTargetId(channelId, TargetType.ROLE, roleId);
       }

       /**
        * Internal generic finder
        */
       Optional<ChannelPermission> findByChannelIdAndTargetTypeAndTargetId(Long channelId, TargetType targetType,
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
                     "AND ((cp.targetType = vn.cococord.entity.mysql.ChannelPermission.TargetType.USER AND cp.targetId = :userId) "
                     +
                     "OR (cp.targetType = vn.cococord.entity.mysql.ChannelPermission.TargetType.ROLE AND cp.targetId IN :roleIds))")
       List<ChannelPermission> findByChannelIdAndUserIdOrRoleIds(
                     @Param("channelId") Long channelId,
                     @Param("userId") Long userId,
                     @Param("roleIds") List<Long> roleIds);

       /**
        * Tìm tất cả role-based permission overrides trong channel
        * 
        * @param channelId ID của channel
        * @return Danh sách permission overrides cho roles
        */
       default List<ChannelPermission> findRoleOverridesByChannelId(Long channelId) {
              return findByChannelIdAndTargetType(channelId, TargetType.ROLE);
       }

       /**
        * Tìm tất cả user-based permission overrides trong channel
        * 
        * @param channelId ID của channel
        * @return Danh sách permission overrides cho users
        */
       default List<ChannelPermission> findUserOverridesByChannelId(Long channelId) {
              return findByChannelIdAndTargetType(channelId, TargetType.USER);
       }

       /**
        * Internal generic finder by list
        */
       List<ChannelPermission> findByChannelIdAndTargetType(Long channelId, TargetType targetType);

       /**
        * Xóa tất cả permission overrides của một target (User hoặc Role)
        * 
        * @param channelId  ID của channel
        * @param targetType Loại target (USER hoặc ROLE)
        * @param targetId   ID của target
        */
       void deleteByChannelIdAndTargetTypeAndTargetId(
                     Long channelId,
                     TargetType targetType,
                     Long targetId);

       /**
        * Xóa tất cả permission overrides của một channel
        * 
        * @param channelId ID của channel
        */
       void deleteByChannelId(Long channelId);

       /**
        * Kiểm tra xem có permission override cho target không
        * 
        * @param channelId  ID của channel
        * @param targetType Loại target
        * @param targetId   ID của target
        * @return true nếu tồn tại
        */
       boolean existsByChannelIdAndTargetTypeAndTargetId(
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
                     "WHERE cp.targetType = 'ROLE' AND cp.targetId = :roleId")
       List<Long> findChannelIdsByRoleId(@Param("roleId") Long roleId);

       /**
        * Xóa tất cả permission overrides của một role (khi xóa role)
        * 
        * @param roleId ID của role
        */
       @Query("DELETE FROM ChannelPermission cp WHERE cp.targetType = 'ROLE' AND cp.targetId = :roleId")
       void deleteByRoleId(@Param("roleId") Long roleId);

       /**
        * Xóa tất cả permission overrides của một user trong server (khi kick/ban user)
        * 
        * @param userId   ID của user
        * @param serverId ID của server
        */
       @Query("DELETE FROM ChannelPermission cp WHERE cp.targetType = 'USER' " +
                     "AND cp.targetId = :userId AND cp.channel.server.id = :serverId")
       void deleteByUserIdAndServerId(@Param("userId") Long userId, @Param("serverId") Long serverId);
}
