package com.flarenet.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key key;
    private final long expiration;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expiration = expiration;
    }

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractRole(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }
}




// package com.flarenet.security;

// import io.jsonwebtoken.*;
// import io.jsonwebtoken.security.Keys;
// import org.springframework.stereotype.Component;

// import java.security.Key;
// import java.util.Date;

// @Component
// public class JwtUtil {
//     private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
//     private final long expiration = 86400000; // 24h

//     public String generateToken(String username, String role) {
//         return Jwts.builder()
//                 .setSubject(username)
//                 .claim("role", role)
//                 .setExpiration(new Date(System.currentTimeMillis() + expiration))
//                 .signWith(key)
//                 .compact();
//     }

//     public String extractUsername(String token) {
//         return Jwts.parserBuilder().setSigningKey(key).build()
//                 .parseClaimsJws(token).getBody().getSubject();
//     }

//     public String extractRole(String token) {
//         return Jwts.parserBuilder().setSigningKey(key).build()
//                 .parseClaimsJws(token).getBody().get("role", String.class);
//     }
// }
