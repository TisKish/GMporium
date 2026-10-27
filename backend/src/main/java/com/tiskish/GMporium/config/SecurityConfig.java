package com.tiskish.GMporium.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Square-one auth: HTTP Basic with in-memory users, DM vs player roles.
 * Good enough to demo role-based access (@PreAuthorize("hasRole('DM')")).
 * A production version would use a login form + sessions (or tokens) and a
 * real users table — that's on the "next steps" list in SETUP.md.
 */
@Configuration
@EnableMethodSecurity // turns on @PreAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // The React dev server runs on another origin; CSRF tokens would
                // block it. Disabled for local dev only — re-enable before deploying.
                .csrf(csrf -> csrf.disable())
                // Lets the H2 console render inside a browser frame.
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    public UserDetailsService users(PasswordEncoder encoder) {
        UserDetails dm = User.withUsername("dm")
                .password(encoder.encode("dm"))
                .roles("DM")
                .build();
        // One login per player at your table (dev passwords — change these).
        UserDetails uri = User.withUsername("uri").password(encoder.encode("password")).roles("PLAYER").build();
        UserDetails etsuko = User.withUsername("etsuko").password(encoder.encode("password")).roles("PLAYER").build();
        UserDetails jelly = User.withUsername("jelly").password(encoder.encode("password")).roles("PLAYER").build();
        UserDetails odessa = User.withUsername("odessa").password(encoder.encode("password")).roles("PLAYER").build();
        return new InMemoryUserDetailsManager(dm, uri, etsuko, jelly, odessa);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
