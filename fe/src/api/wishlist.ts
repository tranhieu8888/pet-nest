import { api } from "../../utils/axios";

export const wishlistApi = {
    /**
     * Lấy danh sách sản phẩm yêu thích của người dùng
     */
    getWishlist: async () => {
        const response = await api.get("/wishlist");
        if (!response.data.success) {
            throw new Error(response.data.message || "Failed to fetch wishlist");
        }
        return response.data.products;
    },

    /**
     * Thêm một sản phẩm vào danh sách yêu thích
     */
    addToWishlist: async (productId: string) => {
        const response = await api.post("/wishlist/add", { productId });
        return response.data;
    },

    /**
     * Bỏ một sản phẩm khỏi danh sách yêu thích
     */
    removeFromWishlist: async (productId: string) => {
        const response = await api.post("/wishlist/remove", { productId });
        return response.data;
    }
};
