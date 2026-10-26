package com.tiskish.GMporium.repository;

import com.tiskish.GMporium.model.TrackedResource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository extends JpaRepository<TrackedResource, Long> {
}
