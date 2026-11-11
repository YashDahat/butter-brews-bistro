package com.webappfoundation.butterbrews.service;

import com.webappfoundation.butterbrews.model.Favourite;
import com.webappfoundation.butterbrews.repo.FavouriteRepository;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

/** A guest's saved dishes (product ids), for the menu heart and the My Brews shelf. */
@Service
public class FavouriteService {

    private final FavouriteRepository favourites;
    private final ProductRepository products;

    public FavouriteService(FavouriteRepository favourites, ProductRepository products) {
        this.favourites = favourites;
        this.products = products;
    }

    public List<Long> mine(Integer userId) {
        requireUser(userId);
        return favourites.findByUserIdOrderByCreatedAtDesc(userId).stream().map(Favourite::getProductId).toList();
    }

    @Transactional
    public List<Long> add(Integer userId, Long productId) {
        requireUser(userId);
        if (!products.existsById(productId)) throw new ResourceNotFoundException("Menu item not found");
        if (favourites.findByUserIdAndProductId(userId, productId).isEmpty()) {
            favourites.save(Favourite.builder().userId(userId).productId(productId).createdAt(Instant.now()).build());
        }
        return mine(userId);
    }

    @Transactional
    public List<Long> remove(Integer userId, Long productId) {
        requireUser(userId);
        favourites.findByUserIdAndProductId(userId, productId).ifPresent(favourites::delete);
        return mine(userId);
    }

    public long count(Integer userId) {
        return userId == null ? 0 : favourites.countByUserId(userId);
    }

    private static void requireUser(Integer userId) {
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in to save favourites");
    }
}
