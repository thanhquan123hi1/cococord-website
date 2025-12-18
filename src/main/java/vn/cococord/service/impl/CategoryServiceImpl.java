package vn.cococord.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.cococord.dto.request.CreateCategoryRequest;
import vn.cococord.dto.response.CategoryResponse;
import vn.cococord.entity.mysql.Category;
import vn.cococord.entity.mysql.Server;
import vn.cococord.exception.BadRequestException;
import vn.cococord.exception.ResourceNotFoundException;
import vn.cococord.exception.UnauthorizedException;
import vn.cococord.repository.ICategoryRepository;
import vn.cococord.repository.IServerRepository;
import vn.cococord.service.ICategoryService;
import vn.cococord.service.IServerService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
@SuppressWarnings("null")
public class CategoryServiceImpl implements ICategoryService {

    private final ICategoryRepository categoryRepository;
    private final IServerRepository serverRepository;
    private final IServerService serverService;

    private static final int MAX_CHANNELS_PER_CATEGORY = 50;

    @Override
    public CategoryResponse createCategory(Long serverId, CreateCategoryRequest request, String username) {
        Server server = serverRepository.findById(serverId)
                .orElseThrow(() -> new ResourceNotFoundException("Server not found with id: " + serverId));

        // Only server owner can create categories
        if (!serverService.isServerOwner(serverId, username)) {
            throw new UnauthorizedException("Only server owner can create categories");
        }

        // Check duplicate name
        if (categoryRepository.existsByServerIdAndName(serverId, request.getName())) {
            throw new BadRequestException("Category with this name already exists");
        }

        // Get next position
        Integer nextPosition = categoryRepository.findMaxPositionByServerId(serverId) + 1;

        Category category = Category.builder()
                .server(server)
                .name(request.getName().toUpperCase()) // Discord categories are uppercase
                .position(request.getPosition() != null ? request.getPosition() : nextPosition)
                .build();

        category = categoryRepository.save(category);
        log.info("Category created: {} in server: {} by user: {}", category.getName(), server.getName(), username);

        return convertToResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long categoryId, String username) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        // Check if user is member of server
        if (!serverService.isServerMember(category.getServer().getId(), username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        return convertToResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getServerCategories(Long serverId, String username) {
        // Check if user is member of server
        if (!serverService.isServerMember(serverId, username)) {
            throw new UnauthorizedException("You are not a member of this server");
        }

        List<Category> categories = categoryRepository.findByServerIdOrderByPosition(serverId);

        return categories.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse updateCategory(Long categoryId, CreateCategoryRequest request, String username) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        // Only server owner can update categories
        if (!serverService.isServerOwner(category.getServer().getId(), username)) {
            throw new UnauthorizedException("Only server owner can update categories");
        }

        // Update fields
        if (request.getName() != null) {
            category.setName(request.getName().toUpperCase());
        }
        if (request.getPosition() != null) {
            category.setPosition(request.getPosition());
        }

        category = categoryRepository.save(category);
        log.info("Category updated: {} by user: {}", category.getName(), username);

        return convertToResponse(category);
    }

    @Override
    public void deleteCategory(Long categoryId, String username) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        // Only server owner can delete categories
        if (!serverService.isServerOwner(category.getServer().getId(), username)) {
            throw new UnauthorizedException("Only server owner can delete categories");
        }

        categoryRepository.delete(category);
        log.info("Category deleted: {} by user: {}", category.getName(), username);
    }

    @Override
    public CategoryResponse updateCategoryPosition(Long categoryId, Integer position, String username) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        // Only server owner can reorder categories
        if (!serverService.isServerOwner(category.getServer().getId(), username)) {
            throw new UnauthorizedException("Only server owner can reorder categories");
        }

        category.setPosition(position);
        category = categoryRepository.save(category);
        log.info("Category position updated: {} to position: {} by user: {}", category.getName(), position, username);

        return convertToResponse(category);
    }

    public boolean canAddChannelToCategory(Long categoryId) {
        Long channelCount = categoryRepository.countChannelsByCategoryId(categoryId);
        return channelCount < MAX_CHANNELS_PER_CATEGORY;
    }

    private CategoryResponse convertToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .serverId(category.getServer().getId())
                .name(category.getName())
                .position(category.getPosition())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
