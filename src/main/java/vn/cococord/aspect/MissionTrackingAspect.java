package vn.cococord.aspect;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.entity.mysql.Mission;
import vn.cococord.service.ICocoCreditsService;
import vn.cococord.service.IMissionService;

/**
 * Aspect to track user activities and update mission progress
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class MissionTrackingAspect {

    private final IMissionService missionService;
    private final ICocoCreditsService cocoCreditsService;

    /**
     * Track when user sends a message
     */
    @AfterReturning("execution(* vn.cococord.service.impl.MessageServiceImpl.sendMessage(..))")
    @Async
    public void trackSendMessage(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0 && args[0] instanceof Long userId) {
                missionService.trackMissionProgress(userId, Mission.MissionAction.SEND_MESSAGE, null);
            }
        } catch (Exception e) {
            log.warn("Failed to track SEND_MESSAGE action", e);
        }
    }

    /**
     * Track when user reacts to a message
     */
    @AfterReturning("execution(* vn.cococord.service.impl.MessageServiceImpl.addReaction(..))")
    @Async
    public void trackReactToMessage(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0 && args[0] instanceof Long userId) {
                missionService.trackMissionProgress(userId, Mission.MissionAction.REACT_TO_MESSAGE, null);
            }
        } catch (Exception e) {
            log.warn("Failed to track REACT_TO_MESSAGE action", e);
        }
    }

    /**
     * Track when user joins a voice channel
     */
    @AfterReturning("execution(* vn.cococord.service.impl.VoiceServiceImpl.joinChannel(..))")
    @Async
    public void trackJoinVoiceChannel(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0 && args[0] instanceof Long userId) {
                missionService.trackMissionProgress(userId, Mission.MissionAction.JOIN_VOICE_CHANNEL, null);
            }
        } catch (Exception e) {
            log.warn("Failed to track JOIN_VOICE_CHANNEL action", e);
        }
    }

    /**
     * Track when user creates a server
     */
    @AfterReturning("execution(* vn.cococord.service.impl.ServerServiceImpl.createServer(..))")
    @Async
    public void trackCreateServer(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0 && args[0] instanceof Long userId) {
                missionService.trackMissionProgress(userId, Mission.MissionAction.CREATE_SERVER, null);
            }
        } catch (Exception e) {
            log.warn("Failed to track CREATE_SERVER action", e);
        }
    }

    /**
     * Track when user joins a server
     */
    @AfterReturning("execution(* vn.cococord.service.impl.ServerServiceImpl.joinServer(..))")
    @Async
    public void trackJoinServer(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0 && args[0] instanceof Long userId) {
                missionService.trackMissionProgress(userId, Mission.MissionAction.JOIN_SERVER, null);
            }
        } catch (Exception e) {
            log.warn("Failed to track JOIN_SERVER action", e);
        }
    }

    /**
     * Track when user adds a friend
     */
    @AfterReturning("execution(* vn.cococord.service.impl.FriendServiceImpl.acceptFriendRequest(..))")
    @Async
    public void trackAddFriend(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0 && args[0] instanceof Long userId) {
                missionService.trackMissionProgress(userId, Mission.MissionAction.ADD_FRIEND, null);
            }
        } catch (Exception e) {
            log.warn("Failed to track ADD_FRIEND action", e);
        }
    }

    /**
     * Track daily login - called from AuthService on successful login
     */
    public void trackDailyLogin(Long userId) {
        try {
            // First, initialize daily missions for the user
            missionService.initializeDailyMissions(userId);
            
            // Track the login action
            missionService.trackMissionProgress(userId, Mission.MissionAction.DAILY_LOGIN, null);
            
            // Give daily login bonus credits
            cocoCreditsService.addCredits(userId, new java.math.BigDecimal("5"), 
                    "Thưởng đăng nhập hàng ngày", "DAILY_LOGIN", null);
        } catch (Exception e) {
            log.warn("Failed to track daily login for user {}", userId, e);
        }
    }

    /**
     * Track profile update
     */
    @AfterReturning("execution(* vn.cococord.service.impl.UserServiceImpl.updateProfile(..))")
    @Async
    public void trackProfileUpdate(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            if (args.length > 0 && args[0] instanceof Long userId) {
                missionService.trackMissionProgress(userId, Mission.MissionAction.COMPLETE_PROFILE, null);
            }
        } catch (Exception e) {
            log.warn("Failed to track COMPLETE_PROFILE action", e);
        }
    }

    /**
     * Track invite member
     */
    @AfterReturning("execution(* vn.cococord.service.impl.InviteServiceImpl.useInvite(..))")
    @Async
    public void trackInviteMember(JoinPoint joinPoint) {
        try {
            // Track for the inviter (owner of the invite)
            // This needs the invite owner's user ID from the result
            log.debug("Invite used - tracking for invite owner");
        } catch (Exception e) {
            log.warn("Failed to track INVITE_MEMBER action", e);
        }
    }
}
