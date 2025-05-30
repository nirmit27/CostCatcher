import { getAmazonData } from "../middleware/getAmazonData";

// Fetch product information ...
export const fetchProductData = async (productId) => {
  try {
    const data = await getAmazonData(productId);
    if (data) {
      return { data, error: null };
    } else {
      return { data: null, error: "Product not found or incomplete data." };
    }
  } catch (error) {
    console.error("Error fetching product data : ", error);
    return {
      data: null,
      error: error?.message || "Failed to fetch product data.",
    };
  }
};

// Save a new product to be tracked ...
export const saveProductTracking = async (productData, hitPrice) => {
  try {
    const token = localStorage.getItem("token");

    const requestBody = {
      productTitle: productData.title,
      productLink: productData.product_url,
      currentPrice: productData.deal_price,
      hitPrice: hitPrice,
      category: productData.category,
      imageLink: productData.image_url || productData.imageLink,
    };

    const response = await fetch(
      `${process.env.REACT_APP_CC_API}/trackProduct`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Error tracking product.");
    }
    return { success: true, result };
  } catch (error) {
    console.error("Error tracking product:", error);
    return {
      success: false,
      error: error.message || "Failed to track product.",
    };
  }
};
