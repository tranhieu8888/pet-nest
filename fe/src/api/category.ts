import { api } from "../../utils/axios";

export const categoryApi = {
    /**
     * Lấy danh sách danh mục con và thông tin danh mục cha
     */
    getChildCategories: async (categoryId: string) => {
        const response = await api.get(`/categories/childCategories/${categoryId}`);
        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to fetch categories");
        }
        return response.data;
    },

    /**
     * Lấy danh sách các thuộc tính lọc (attributes) của một danh mục
     */
    getCategoryAttributes: async (categoryId: string) => {
        const response = await api.get(`/categories/attributes/${categoryId}`);
        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to fetch attributes");
        }
        return response.data;
    }
};
