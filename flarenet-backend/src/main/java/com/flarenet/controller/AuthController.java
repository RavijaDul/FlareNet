package com.flarenet.controller;

import com.flarenet.model.User;
import com.flarenet.model.Role;
import com.flarenet.repository.UserRepository;
import com.flarenet.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthController(UserRepository repo, PasswordEncoder encoder, JwtUtil jwt) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public User register(@RequestBody Map<String, String> body) {
        User user = new User();
        user.setUsername(body.get("username"));
        user.setPassword(encoder.encode(body.get("password")));
        user.setRole(Role.USER);
        return repo.save(user);
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body) {
        User user = repo.findByUsername(body.get("username"))
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!encoder.matches(body.get("password"), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwt.generateToken(user.getUsername(), user.getRole().name());
        return Map.of("token", token,
                      "username", user.getUsername(),
                      "role", user.getRole().name());
    }

    @PostMapping("/promote/{id}")
    public User promoteToAdmin(@PathVariable Long id) {
        User user = repo.findById(id).orElseThrow();
        user.setRole(Role.ADMIN);
        return repo.save(user);
    }
}
