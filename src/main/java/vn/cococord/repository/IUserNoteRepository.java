package vn.cococord.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.cococord.entity.mysql.User;
import vn.cococord.entity.mysql.UserNote;

@Repository
public interface IUserNoteRepository extends JpaRepository<UserNote, Long> {
    
    Optional<UserNote> findByOwnerAndTargetUser(User owner, User targetUser);
    
    void deleteByOwnerAndTargetUser(User owner, User targetUser);
}
