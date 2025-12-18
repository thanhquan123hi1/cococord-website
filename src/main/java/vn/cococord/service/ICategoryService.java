package vn.cococord.service;

import java.util.List;

import vn.cococord.dto.request.CreateCategoryRequest;
import vn.cococord.dto.response.CategoryResponse;

public interface ICategoryService {

    CategoryResponse createCategory(Long serverId, CreateCategoryRequest request, String username);

    CategoryResponse getCategoryById(Long categoryId, String username);

    List<CategoryResponse> getServerCategories(Long serverId, String username);

    CategoryResponse updateCategory(Long categoryId, CreateCategoryRequest request, String username);

    void deleteCategory(Long categoryId, String username);

    CategoryResponse updateCategoryPosition(Long categoryId, Integer position, String username);
}
