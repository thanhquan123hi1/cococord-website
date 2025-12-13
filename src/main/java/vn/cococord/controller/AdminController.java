package vn.cococord.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Admin Dashboard Controller
 * Handles admin panel views at /admin
 */
@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("pageTitle", "Admin Dashboard");
        return "admin/dashboard";
    }

    @GetMapping("/users")
    public String users(Model model) {
        model.addAttribute("pageTitle", "User Management");
        return "admin/users";
    }

    @GetMapping("/servers")
    public String servers(Model model) {
        model.addAttribute("pageTitle", "Server Management");
        return "admin/servers";
    }

    @GetMapping("/stats")
    public String stats(Model model) {
        model.addAttribute("pageTitle", "Statistics");
        return "admin/stats";
    }

    @GetMapping("/audit")
    public String auditLogs(Model model) {
        model.addAttribute("pageTitle", "Audit Logs");
        return "admin/audit";
    }
}
