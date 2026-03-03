import { api } from "../../utils/axios";

export const productApi = {
    /**
     * Lấy danh sách toàn bộ sản phẩm thuộc một danh mục
     */
    getProductsByCategory: async (categoryId: string) => {
        const response = await api.get(`/products/productDetailsByCategory/${categoryId}`);
        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to fetch products");
        }
        // Trả về trực tiếp mảng dữ liệu sản phẩm
        return response.data.data;
    }
};
