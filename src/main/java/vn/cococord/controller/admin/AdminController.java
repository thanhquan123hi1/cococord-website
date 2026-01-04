package vn.cococord.controller.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Admin Dashboard Controller
 * Handles admin panel views at /admin
 * 
 * Phase 2: SPA-like architecture
 * - Main page renders the shell (sidebar, topbar)
 * - Fragment endpoints serve content loaded via fetch()
 */
@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    // ========================================
    // Main Admin Page (SPA Shell)
    // ========================================

    @GetMapping({ "", "/", "/dashboard" })
    public String adminIndex() {
        // Returns the SPA shell - content loaded via JS
        return "admin/index";
    }

    // ========================================
    // Fragment Endpoints (loaded via fetch)
    // ========================================

    @GetMapping("/fragment/dashboard")
    public String fragmentDashboard() {
        return "admin/fragments/dashboard";
    }

    @GetMapping("/fragment/users")
    public String fragmentUsers() {
        return "admin/fragments/users";
    }

    @GetMapping("/fragment/servers")
    public String fragmentServers() {
        return "admin/fragments/servers";
    }

    @GetMapping("/fragment/reports")
    public String fragmentReports() {
        return "admin/fragments/reports";
    }

    @GetMapping("/fragment/messages")
    public String fragmentMessages() {
        return "admin/fragments/messages";
    }

    @GetMapping("/fragment/roles")
    public String fragmentRoles() {
        return "admin/fragments/roles";
    }

    @GetMapping("/fragment/stats")
    public String fragmentStats() {
        return "admin/fragments/stats";
    }

    @GetMapping("/fragment/audit")
    public String fragmentAudit() {
        return "admin/fragments/audit";
    }

    @GetMapping("/fragment/settings")
    public String fragmentSettings() {
        return "admin/fragments/settings";
    }

    // ========================================
    // Legacy Full Page Routes (for direct access)
    // These redirect to the SPA shell with hash
    // ========================================

    @GetMapping("/servers")
    public String servers() {
        return "redirect:/admin#servers";
    }

    @GetMapping("/stats")
    public String stats() {
        return "redirect:/admin#stats";
    }

    @GetMapping("/audit")
    public String auditLogs() {
        return "redirect:/admin#audit";
    }

    @GetMapping("/settings")
    public String settings() {
        return "redirect:/admin#settings";
    }

    @GetMapping("/users")
    public String users() {
        return "redirect:/admin#users";
    }

    @GetMapping("/reports")
    public String reports() {
        return "redirect:/admin#reports";
    }

    @GetMapping("/messages")
    public String messages() {
        return "redirect:/admin#messages";
    }

    @GetMapping("/roles")
    public String roles() {
        return "redirect:/admin#roles";
    }
}
