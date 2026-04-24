// Validation utilities

export const validateProduct = (productData) => {
  const errors = []

  if (!productData.name || productData.name.trim().length === 0) {
    errors.push('Product name is required')
  }

  if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
    errors.push('Valid price is required')
  }

  if (!productData.category || productData.category.trim().length === 0) {
    errors.push('Product category is required')
  }

  if (productData.costPrice && Number(productData.costPrice) > Number(productData.price)) {
    errors.push('Import price cannot be higher than selling price')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

