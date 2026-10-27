package com.tiskish.GMporium.backend.repository;

import com.tiskish.GMporium.backend.model.TrackedResource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository extends JpaRepository<TrackedResource, Long> {
}
