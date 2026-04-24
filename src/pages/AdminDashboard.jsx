import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [activeMenu, setActiveMenu] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // States cho Overview
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0, chartData: [] })
  const [statsLoading, setStatsLoading] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())

  // States cho Products
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '', price: '', costPrice: '', category: '', stock: '', description: '', image: '', variations: []
  })
  const [uploading, setUploading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiDescTone, setAiDescTone] = useState('warm')
  const [aiDescLength, setAiDescLength] = useState('medium')
  const [aiDescKeywords, setAiDescKeywords] = useState('')

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('image', file)

    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setProductForm(prev => ({ ...prev, image: data.imageUrl }))
      } else {
        addToast(data.message || 'Lỗi tải ảnh', 'error')
      }
    } catch (err) {
      console.error(err)
      addToast('Đã xảy ra lỗi khi tải ảnh.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleColorImageUpload = async (e, vIdx, cIdx) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('image', file)

    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        const newList = [...productForm.variations]
        newList[vIdx].colors[cIdx].image = data.imageUrl
        setProductForm({ ...productForm, variations: newList })
      } else {
        addToast(data.message || 'Lỗi tải ảnh', 'error')
      }
    } catch (err) {
      console.error(err)
      addToast('Đã xảy ra lỗi khi tải ảnh màu.', 'error')
    } finally {
      setUploading(false)
    }
  }

  // States cho Orders
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [viewingOrder, setViewingOrder] = useState(null)

  // States cho Users
  const [usersList, setUsersList] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [viewingUser, setViewingUser] = useState(null)

  // States cho Reviews
  const [reviewsList, setReviewsList] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  // States cho Contacts
  const [contactsList, setContactsList] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [viewingContact, setViewingContact] = useState(null)

  // States cho Coupons
  const [couponsList, setCouponsList] = useState([])
  const [couponsLoading, setCouponsLoading] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [couponForm, setCouponForm] = useState({
    code: '', type: 'fixed', value: '', minAmount: '', startDate: '', endDate: '', usageLimit: ''
  })

  // Luôn reset về Tổng quan khi vào lại trang Admin
  useEffect(() => {
    setActiveMenu('overview')
  }, [])

  // Tách loadStats ra useEffect riêng để trigger khi đổi filter bộ lọc tháng
  useEffect(() => {
    if (activeMenu === 'overview') {
      const loadStats = async () => {
        setStatsLoading(true)
        try {
          const token = localStorage.getItem('token')
          let url = '/api/stats'
          if (filterMonth && filterYear) {
            url += `?month=${filterMonth}&year=${filterYear}`
          }
          const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
          const result = await res.json()
          if (result.success) setStats(result.data)
        } catch (err) { console.error(err) }
        finally { setStatsLoading(false) }
      }
      loadStats()
    }
  }, [activeMenu, filterMonth, filterYear])

  // Gọi API tương ứng khi đổi Menu
  useEffect(() => {
    const token = localStorage.getItem('token')

    const loadProducts = async () => {
      setProductsLoading(true)
      try {
        const res = await fetch('/api/products')
        const result = await res.json()
        if (result.success) setProducts(result.data || [])
      } catch (err) { console.error(err) }
      finally { setProductsLoading(false) }
    }

    const loadOrders = async () => {
      setOrdersLoading(true)
      try {
        const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
        const result = await res.json()
        if (result.success) setOrders(result.data || [])
      } catch (err) { console.error(err) }
      finally { setOrdersLoading(false) }
    }

    const loadUsers = async () => {
      setUsersLoading(true)
      try {
        const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
        const result = await res.json()
        if (result.success) setUsersList(result.data || [])
      } catch (err) { console.error(err) }
      finally { setUsersLoading(false) }
    }

    const loadReviews = async () => {
      setReviewsLoading(true)
      try {
        const res = await fetch('/api/reviews', { headers: { Authorization: `Bearer ${token}` } })
        const result = await res.json()
        if (result.success) setReviewsList(result.data || [])
      } catch (err) { console.error(err) }
      finally { setReviewsLoading(false) }
    }

    const loadContacts = async () => {
      setContactsLoading(true)
      try {
        const res = await fetch('/api/contacts', { headers: { Authorization: `Bearer ${token}` } })
        const result = await res.json()
        if (result.success) setContactsList(result.data || [])
      } catch (err) { console.error(err) }
      finally { setContactsLoading(false) }
    }

    const loadCoupons = async () => {
      setCouponsLoading(true)
      try {
        const res = await fetch('/api/coupons', { headers: { Authorization: `Bearer ${token}` } })
        const result = await res.json()
        if (result.success) setCouponsList(result.data || [])
      } catch (err) { console.error(err) }
      finally { setCouponsLoading(false) }
    }

    if (activeMenu === 'products') loadProducts()
    if (activeMenu === 'orders') loadOrders()
    if (activeMenu === 'users') loadUsers()
    if (activeMenu === 'reviews') loadReviews()
    if (activeMenu === 'contacts') loadContacts()
    if (activeMenu === 'coupons') loadCoupons()
  }, [activeMenu])

  // --- Handlers Products ---
  const handleProductDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setProducts(products.filter(p => p.id !== id))
        addToast('Xóa sản phẩm thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi khi xóa sản phẩm', 'error')
      }
    } catch (error) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleEditClick = (product) => {
    setEditingProduct(product)

    // Parse variations previously saved in `sizes` if it's the new format
    let parsedVariations = []

    // Nếu product.sizes có cấu trúc chứa colors (format mới)
    if (Array.isArray(product.sizes) && product.sizes.length > 0 && product.sizes[0].colors) {
      parsedVariations = product.sizes;
    } else {
      // Migrate dữ liệu cũ (format rời rạc) thành format mới
      const oldColors = Array.isArray(product.colors) ? product.colors.map(c => typeof c === 'string' ? { name: c, stock: 0 } : { name: c.name || '', stock: c.stock || 0 }) : [];
      const oldSizes = Array.isArray(product.sizes) ? product.sizes.map(s => typeof s === 'string' ? s : s.name) : [];

      if (oldSizes.length > 0) {
        parsedVariations = oldSizes.map(s => ({
          size: s,
          colors: oldColors.length > 0 ? [...oldColors] : [{ name: 'Mặc định', stock: product.stock || 0 }]
        }))
      } else if (oldColors.length > 0) {
        parsedVariations = [{
          size: 'Free Size',
          colors: [...oldColors]
        }]
      } else {
        parsedVariations = [{ size: '', colors: [{ name: '', stock: 0 }] }]
      }
    }

    setProductForm({
      name: product.name || '',
      price: product.price || '',
      costPrice: product.costPrice || '',
      category: product.category || '',
      stock: product.stock || '',
      description: product.description || '',
      image: product.image || '',
      variations: parsedVariations.map(v => ({
        ...v,
        colors: v.colors.map(c => ({
          ...c,
          colorCode: c.colorCode || '#ffffff'
        }))
      }))
    })
    setShowProductModal(true)
  }

  const handleAddClick = () => {
    setEditingProduct(null)
    setProductForm({
      name: '', price: '', costPrice: '', category: '', stock: '', description: '', image: '', variations: [{ size: '', colors: [{ name: '', stock: 0, colorCode: '#ffffff', image: null }] }]
    })
    setShowProductModal(true)
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const isEdit = !!editingProduct
      const url = isEdit ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = isEdit ? 'PUT' : 'POST'

      // Tính tổng stock từ các biến thể
      const validVariations = (productForm.variations || []).map(v => ({
        size: v.size.trim() || 'Free Size',
        colors: v.colors.filter(c => c.name.trim() !== '').map(c => ({
          name: c.name.trim(),
          stock: Number(c.stock || 0),
          colorCode: c.colorCode || '#ffffff',
          image: c.image || null
        }))
      })).filter(v => v.colors.length > 0)

      const totalStock = validVariations.reduce((totalSum, v) => totalSum + v.colors.reduce((sum, c) => sum + c.stock, 0), 0)

      // Xuất danh sách màu list flat để database lọc nhanh nếu cần
      const flatColors = [];
      const colorSet = new Set();
      validVariations.forEach(v => {
        v.colors.forEach(c => {
          if (!colorSet.has(c.name)) {
            colorSet.add(c.name);
            flatColors.push(c.name);
          }
        });
      });

      const payload = {
        ...productForm,
        price: Number(productForm.price),
        costPrice: productForm.costPrice ? Number(productForm.costPrice) : null,
        stock: totalStock > 0 ? totalStock : Number(productForm.stock),
        sizes: validVariations,
        colors: flatColors
      }
      delete payload.variations

      // Validation: Giá nhập không được cao hơn giá bán
      if (payload.costPrice && payload.costPrice > payload.price) {
        addToast('Giá nhập không được cao hơn giá bán!', 'error')
        return
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (result.success) {
        addToast(isEdit ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!', 'success')
        setShowProductModal(false)
        // Reload products locally
        setProductsLoading(true)
        const reloadRes = await fetch('/api/products')
        const reloadResult = await reloadRes.json()
        if (reloadResult.success) setProducts(reloadResult.data || [])
        setProductsLoading(false)
      } else {
        addToast(result.message || 'Lỗi lưu sản phẩm', 'error')
      }
    } catch (err) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const buildSizesHintForAI = () => {
    const vars = productForm.variations || []
    const parts = vars
      .filter(v => v.size && String(v.size).trim())
      .map(v => {
        const colors = (v.colors || []).filter(c => c.name && String(c.name).trim()).map(c => c.name.trim())
        const cStr = colors.length ? ` (${colors.join(', ')})` : ''
        return `${v.size}${cStr}`
      })
    return parts.length ? parts.join(' | ') : ''
  }

  const handleAIGenerate = async () => {
    if (!productForm.name || !productForm.category) {
      return addToast('Vui lòng nhập tên và danh mục sản phẩm trước!', 'warning')
    }

    setGeneratingAI(true)
    const controller = new AbortController()
    const abortTimer = setTimeout(() => controller.abort(), 55000)
    try {
      const token = localStorage.getItem('token')
      const priceStr =
        productForm.price !== '' && productForm.price != null
          ? `${Number(productForm.price).toLocaleString('vi-VN')}₫`
          : ''

      const res = await fetch('/api/ai/suggest-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          name: String(productForm.name || '').trim(),
          productName: String(productForm.name || '').trim(),
          category: String(productForm.category || '').trim(),
          price: priceStr || undefined,
          keywords: aiDescKeywords.trim() || undefined,
          tone: aiDescTone,
          length: aiDescLength,
          existingDescription: productForm.description?.trim() || undefined,
          sizesHint: buildSizesHintForAI() || undefined
        })
      })

      const data = await res.json()
      if (data.success) {
        setProductForm(prev => ({ ...prev, description: data.data }))
        addToast('Đã tạo mô tả bằng AI!', 'success')
      } else {
        addToast(data.message || 'Lỗi khi gọi AI', 'error')
      }
    } catch (err) {
      console.error(err)
      if (err?.name === 'AbortError') {
        addToast('Hết thời gian chờ phản hồi AI. Thử lại sau hoặc kiểm tra quota Gemini.', 'error')
      } else {
        addToast('Đã xảy ra lỗi khi kết nối với AI.', 'error')
      }
    } finally {
      clearTimeout(abortTimer)
      setGeneratingAI(false)
    }
  }

  // --- Handlers Users ---
  const handleViewUser = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        const userOrders = orders.filter(o => o.userId === id)
        setViewingUser({ ...result.data, orders: userOrders })
        setShowUserModal(true)
      } else {
        addToast(result.message || 'Lỗi lấy thông tin tài khoản', 'error')
      }
    } catch (e) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleUserDelete = async (id) => {
    if (!window.confirm('CẢNH BÁO: Xóa tài khoản này sẽ tự động XÓA TOÀN BỘ Lịch sử Đơn hàng và Đánh giá liên quan. Bạn có chắc chắn muốn Xóa Vĩnh Viễn?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setUsersList(usersList.filter(u => u.id !== id))
        addToast('Xóa tài khoản thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi xóa tài khoản', 'error')
      }
    } catch (e) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleUserPasswordChange = async (id) => {
    const newPassword = window.prompt('Nhập mật khẩu mới cho tài khoản này (Để trống để hủy):')
    if (!newPassword) return
    if (newPassword.length < 6) {
      return addToast('Mật khẩu phải có ít nhất 6 ký tự.', 'warning')
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/${id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      })
      const result = await res.json()
      if (result.success) {
        addToast('Đổi mật khẩu thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi đổi mật khẩu', 'error')
      }
    } catch (err) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleToggleUserStatus = async (id, currentStatus) => {
    const willActivate = !currentStatus
    const confirmMsg = willActivate
      ? 'Bạn có chắc muốn mở khóa tài khoản này?'
      : 'Bạn có chắc muốn khóa tài khoản này?'

    if (!window.confirm(confirmMsg)) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: willActivate })
      })
      const result = await res.json()
      if (result.success) {
        setUsersList(usersList.map(u => u.id === id ? { ...u, ...result.data } : u))
        addToast(result.message || 'Cập nhật trạng thái tài khoản thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi cập nhật trạng thái tài khoản', 'error')
      }
    } catch (err) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleChangeUserRole = async (id, currentRole, nextRole) => {
    const selectedRole = String(nextRole || '').trim().toLowerCase()
    if (!['admin', 'user'].includes(selectedRole)) {
      addToast('Quyền không hợp lệ.', 'warning')
      return
    }

    if (selectedRole === currentRole) {
      return
    }

    const confirmMsg = selectedRole === 'admin'
      ? 'Xác nhận cấp quyền Quản trị viên cho tài khoản này?'
      : 'Xác nhận chuyển tài khoản này về quyền Người dùng?'

    if (!window.confirm(confirmMsg)) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: selectedRole })
      })
      const result = await res.json()
      if (result.success) {
        setUsersList(usersList.map(u => u.id === id ? { ...u, ...result.data } : u))
        addToast(result.message || 'Cập nhật phân quyền thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi cập nhật phân quyền', 'error')
      }
    } catch (err) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  // --- Handlers Reviews ---
  const handleReviewDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setReviewsList(reviewsList.filter(r => r.id !== id))
        addToast('Xóa đánh giá thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi xóa đánh giá', 'error')
      }
    } catch (e) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleViewContact = (contact) => {
    setViewingContact(contact)
    setShowContactModal(true)
    // Nếu status là pending, tự động cập nhật sang read khi xem
    if (contact.status === 'pending') {
      handleContactStatusUpdate(contact.id, 'read')
    }
  }

  // --- Handlers Contacts ---
  const handleContactStatusUpdate = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      const result = await res.json()
      if (result.success) {
        setContactsList(contactsList.map(c => c.id === id ? { ...c, status: newStatus } : c))
        addToast('Cập nhật trạng thái thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi cập nhật', 'error')
      }
    } catch (err) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleContactDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa liên hệ này?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setContactsList(contactsList.filter(c => c.id !== id))
        addToast('Xóa liên hệ thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi xóa liên hệ', 'error')
      }
    } catch (e) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  // --- Handlers Orders ---
  const handleViewOrder = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setViewingOrder(result.data)
        setShowOrderModal(true)
      } else {
        addToast(result.message || 'Lỗi lấy chi tiết đơn hàng', 'error')
      }
    } catch (e) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleOrderDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa vĩnh viễn đơn hàng này?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setOrders(orders.filter(o => o.id !== id))
        addToast('Xóa đơn hàng thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi xóa đơn hàng', 'error')
      }
    } catch (e) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleOrderStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      const result = await res.json()
      if (result.success) {
        setOrders(orders.map(o => o.id === id ? { ...o, ...result.data } : o))
        addToast('Cập nhật trạng thái thành công!', 'success')
      } else {
        addToast(result.message || 'Cập nhật thất bại', 'error')
      }
    } catch (error) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleApprovePayment = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/orders/${id}/approve-payment`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const result = await res.json()
      if (result.success) {
        setOrders(orders.map(o => o.id === id ? { ...o, ...result.data } : o))
        addToast('Đã xác nhận thanh toán!', 'success')
      } else {
        addToast(result.message || 'Xác nhận thanh toán thất bại', 'error')
      }
    } catch (error) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  // --- Handlers Coupons ---
  const handleAddCouponClick = () => {
    setEditingCoupon(null)
    setCouponForm({
      code: '', type: 'fixed', value: '', minAmount: '', startDate: '', endDate: '', usageLimit: ''
    })
    setShowCouponModal(true)
  }

  const handleEditCouponClick = (coupon) => {
    setEditingCoupon(coupon)
    setCouponForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : '',
      usageLimit: coupon.usageLimit || ''
    })
    setShowCouponModal(true)
  }

  const handleCouponDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await res.json()
      if (result.success) {
        setCouponsList(couponsList.filter(c => c.id !== id))
        addToast('Xóa mã giảm giá thành công!', 'success')
      } else {
        addToast(result.message || 'Lỗi xóa mã', 'error')
      }
    } catch (e) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  const handleCouponSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : '/api/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(couponForm)
      })
      const result = await res.json()

      if (result.success) {
        if (editingCoupon) {
          setCouponsList(couponsList.map(c => c.id === editingCoupon.id ? result.data : c))
          addToast('Cập nhật mã giảm giá thành công!', 'success')
        } else {
          setCouponsList([result.data, ...couponsList])
          addToast('Thêm mã giảm giá thành công!', 'success')
        }
        setShowCouponModal(false)
      } else {
        addToast(result.message || 'Lỗi lưu mã', 'error')
      }
    } catch (err) {
      addToast('Đã xảy ra lỗi.', 'error')
    }
  }

  // --- Render Components ---
  const renderOverview = () => {
    if (statsLoading) return <p className="text-gray-500">Đang tải thống kê...</p>
    if (!stats) return <div className="p-4 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
    return (
      <div>
        <h2 className="text-3xl font-extrabold mb-8 text-gray-800">Tổng quan hệ thống</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg border border-blue-400 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <h3 className="text-blue-100 text-sm font-medium tracking-wide">TỔNG NGƯỜI DÙNG</h3>
            <p className="text-3xl font-extrabold mt-2 tracking-tight">{stats.users || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg border border-emerald-400 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <h3 className="text-emerald-100 text-sm font-medium tracking-wide">TỔNG SẢN PHẨM</h3>
            <p className="text-3xl font-extrabold mt-2 tracking-tight">{stats.products || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl shadow-lg border border-amber-400 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <h3 className="text-amber-100 text-sm font-medium tracking-wide">TỔNG ĐƠN HÀNG</h3>
            <p className="text-3xl font-extrabold mt-2 tracking-tight">{stats.orders || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 rounded-2xl shadow-lg border border-violet-400 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <h3 className="text-violet-100 text-sm font-medium tracking-wide">DOANH THU</h3>
            <p className="text-3xl font-extrabold mt-2 tracking-tight">{Number(stats.revenue || 0).toLocaleString('vi-VN')}₫</p>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-2xl shadow-lg border border-pink-400 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <h3 className="text-pink-100 text-sm font-medium tracking-wide">LỢI NHUẬN</h3>
            <p className="text-3xl font-extrabold mt-2 tracking-tight">{Number(stats.profit || 0).toLocaleString('vi-VN')}₫</p>
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h3 className="text-xl font-bold text-gray-800">Biểu đồ Tăng trưởng</h3>
            <div className="flex gap-3">
              <div className="flex items-center">
                <label className="text-sm text-gray-500 font-medium mr-2">Tháng:</label>
                <select
                  className="border-2 border-gray-100 rounded-lg px-3 py-1.5 font-semibold text-gray-700 focus:border-primary-500 transition-colors outline-none cursor-pointer"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option value="">Cả năm</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <label className="text-sm text-gray-500 font-medium mr-2">Năm:</label>
                <select
                  className="border-2 border-gray-100 rounded-lg px-3 py-1.5 font-semibold text-gray-700 focus:border-primary-500 transition-colors outline-none cursor-pointer"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  {[2023, 2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="h-80 w-full text-sm">
            {stats.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => (name === 'revenue' || name === 'profit') ? `${Number(value).toLocaleString('vi-VN')}₫` : value} />
                  <Legend payload={[
                    { value: 'Doanh thu', type: 'line', id: 'ID01', color: '#3b82f6' },
                    { value: 'Lợi nhuận', type: 'line', id: 'ID03', color: '#ec4899' },
                    { value: 'Đơn hàng', type: 'line', id: 'ID02', color: '#10b981' }
                  ]} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#3b82f6" activeDot={{ r: 8 }} />
                  <Line yAxisId="left" type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#ec4899" strokeDasharray="5 5" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Đơn hàng" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 flex items-center justify-center h-full">Không có dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderProducts = () => {
    if (productsLoading) return <p className="text-gray-500">Đang tải sản phẩm...</p>

    const productCategories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
    const filteredProducts = products.filter((product) => {
      const matchesCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter
      const keyword = productSearchTerm.trim().toLowerCase()
      const matchesSearch =
        !keyword ||
        String(product.name || '').toLowerCase().includes(keyword) ||
        String(product.category || '').toLowerCase().includes(keyword)
      return matchesCategory && matchesSearch
    })

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
          <h2 className="text-2xl font-semibold">Quản lý sản phẩm</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo tên hoặc danh mục..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {productCategories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'Tất cả danh mục' : c}
                </option>
              ))}
            </select>
            <button onClick={handleAddClick} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700">
              + Thêm sản phẩm
            </button>
          </div>
        </div>
        <div className="space-y-3 md:hidden">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white shadow rounded-lg p-3 border border-gray-100">
              <div className="flex gap-3">
                <img src={product.image} alt={product.name} className="w-14 h-14 object-cover rounded shadow-sm border border-gray-200" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category || '---'}</p>
                  <p className="text-sm text-primary-600 font-semibold mt-1">{Number(product.price).toLocaleString('vi-VN')}₫</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p><span className="font-medium">Giá nhập:</span> {product.costPrice ? `${Number(product.costPrice).toLocaleString('vi-VN')}₫` : '---'}</p>
                <p><span className="font-medium">Tồn kho:</span> {product.stock}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => handleEditClick(product)} className="text-blue-500 hover:text-blue-700 text-xs border border-blue-500 px-2 py-1 rounded">
                  Sửa
                </button>
                <button
                  onClick={() => handleProductDelete(product.id)}
                  className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Ảnh</th>
                <th className="px-4 py-2 text-left">Tên sản phẩm</th>
                <th className="px-4 py-2 text-left">Danh mục</th>
                <th className="px-4 py-2 text-left">Giá bán</th>
                <th className="px-4 py-2 text-left text-green-600">Giá nhập</th>
                <th className="px-4 py-2 text-left">Tồn kho</th>
                <th className="px-4 py-2 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-t items-center">
                  <td className="px-4 py-2">{product.id}</td>
                  <td className="px-4 py-2">
                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded shadow-sm border border-gray-200" />
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate" title={product.name}>{product.name}</td>
                  <td className="px-4 py-2">{product.category}</td>
                  <td className="px-4 py-2 font-semibold text-primary-600">
                    {Number(product.price).toLocaleString('vi-VN')}₫
                  </td>
                  <td className="px-4 py-2 font-medium text-green-600">
                    {product.costPrice ? `${Number(product.costPrice).toLocaleString('vi-VN')}₫` : '---'}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {(product.sizes || []).some(s => s.colors) ? (
                      <div className="space-y-1">
                        {product.sizes.map((v, i) => (
                          <div key={i} className="text-gray-600">
                            <strong>{v.size}</strong>: {v.colors.map(c => `${c.name} (${c.stock})`).join(', ')}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>{product.stock}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => handleEditClick(product)} className="text-blue-500 hover:text-blue-700 mr-3 text-xs border border-blue-500 px-2 py-1 rounded">
                      Sửa
                    </button>
                    <button
                      onClick={() => handleProductDelete(product.id)}
                      className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <p className="text-sm text-gray-500">Không có sản phẩm phù hợp bộ lọc.</p>
        )}

        {/* Modal Thêm/Sửa */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
                  <input required type="text" className="w-full border rounded px-3 py-2" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Giá bán</label>
                    <input required type="number" className="w-full border rounded px-3 py-2" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-600">Giá nhập</label>
                    <input type="number" className="w-full border rounded px-3 py-2 border-green-200 focus:border-green-500 outline-none" value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tồn kho tổng (Tự động tính)</label>
                    <input type="number" disabled className="w-full border rounded px-3 py-2 bg-gray-50 text-gray-500" value={(productForm.variations || []).reduce((sum, v) => sum + v.colors.reduce((s, c) => s + Number(c.stock || 0), 0), 0)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Danh mục</label>
                    <input required type="text" className="w-full border rounded px-3 py-2" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} />
                  </div>
                </div>
                <div className="border border-gray-200 rounded p-4 bg-gray-50">
                  <label className="block text-base font-semibold mb-3 text-primary-700">Phân loại Biến thể (Size & Màu)</label>
                  {(productForm.variations || []).map((vField, vIdx) => (
                    <div key={vIdx} className="mb-4 p-3 bg-white border border-gray-300 rounded shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm font-bold">Size:</span>
                          <input
                            type="text"
                            placeholder="Nhập Size (VD: 1-2T, S, M)"
                            className="border rounded px-3 py-1.5 text-sm w-48 focus:border-primary-500 outline-none"
                            value={vField.size}
                            onChange={e => {
                              const newList = [...productForm.variations]
                              newList[vIdx].size = e.target.value
                              setProductForm({ ...productForm, variations: newList })
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newList = productForm.variations.filter((_, i) => i !== vIdx)
                            setProductForm({ ...productForm, variations: newList })
                          }}
                          className="text-red-500 text-sm hover:underline font-medium"
                        >
                          Xóa Size này
                        </button>
                      </div>

                      {/* Danh sách màu của size này */}
                      <div className="ml-4 pl-4 border-l-2 border-gray-100">
                        {vField.colors.map((cField, cIdx) => (
                          <div key={cIdx} className="mb-4">
                            <div className="flex gap-2 items-center mb-2">
                              <span className="text-sm text-gray-500 w-10">Màu:</span>
                              <input
                                type="text"
                                placeholder="Tên màu (VD: Đỏ)"
                                className="border rounded px-3 py-1 text-sm flex-1"
                                value={cField.name}
                                onChange={e => {
                                  const newList = [...productForm.variations]
                                  newList[vIdx].colors[cIdx].name = e.target.value
                                  setProductForm({ ...productForm, variations: newList })
                                }}
                              />
                              <input
                                type="color"
                                title="Chọn màu hiển thị"
                                className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                value={cField.colorCode || '#ffffff'}
                                onChange={e => {
                                  const newList = [...productForm.variations]
                                  newList[vIdx].colors[cIdx].colorCode = e.target.value
                                  setProductForm({ ...productForm, variations: newList })
                                }}
                              />
                              <span className="text-sm text-gray-500">Kho:</span>
                              <input
                                type="number"
                                placeholder="SL"
                                className="w-14 border rounded px-3 py-1 text-sm"
                                value={cField.stock}
                                onChange={e => {
                                  const newList = [...productForm.variations]
                                  newList[vIdx].colors[cIdx].stock = Number(e.target.value)
                                  setProductForm({ ...productForm, variations: newList })
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newList = [...productForm.variations]
                                  newList[vIdx].colors = newList[vIdx].colors.filter((_, i) => i !== cIdx)
                                  setProductForm({ ...productForm, variations: newList })
                                }}
                                className="text-gray-400 hover:text-red-500 px-2 text-lg font-bold"
                              >
                                &times;
                              </button>
                            </div>
                            <div className="flex gap-2 items-center ml-10">
                              {cField.image ? (
                                <div className="relative w-10 h-10 group">
                                  <img src={cField.image} alt="Color" className="w-full h-full object-cover rounded border" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newList = [...productForm.variations]
                                      newList[vIdx].colors[cIdx].image = null
                                      setProductForm({ ...productForm, variations: newList })
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hidden group-hover:flex"
                                  >
                                    &times;
                                  </button>
                                </div>
                              ) : (
                                <div className="w-10 h-10 border border-dashed rounded flex items-center justify-center bg-gray-50">
                                  <span className="text-[10px] text-gray-400">No img</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                id={`color-img-${vIdx}-${cIdx}`}
                                className="hidden"
                                onChange={(e) => handleColorImageUpload(e, vIdx, cIdx)}
                              />
                              <label
                                htmlFor={`color-img-${vIdx}-${cIdx}`}
                                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer border border-gray-300"
                              >
                                {cField.image ? 'Đổi ảnh' : 'Tải lên ảnh màu'}
                              </label>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newList = [...productForm.variations]
                            newList[vIdx].colors.push({ name: '', stock: 0 })
                            setProductForm({ ...productForm, variations: newList })
                          }}
                          className="text-primary-600 text-xs hover:underline mt-1 border border-primary-200 px-2 py-1 rounded bg-primary-50"
                        >
                          + Thêm màu cho Size này
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setProductForm({
                        ...productForm,
                        variations: [...(productForm.variations || []), { size: '', colors: [{ name: '', stock: 0 }] }]
                      })
                    }}
                    className="w-full py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-200 transition"
                  >
                    + Thêm Size Mới
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ảnh sản phẩm</label>
                  <input type="file" accept="image/*" className="w-full border rounded px-3 py-2" onChange={handleImageUpload} />
                  {uploading && <p className="text-sm text-blue-500 mt-1">Đang tải ảnh lên...</p>}
                  {productForm.image && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Ảnh hiện tại:</p>
                      <img src={productForm.image} alt="Preview" className="w-20 h-20 mt-1 object-cover rounded shadow-sm border" />
                    </div>
                  )}
                </div>
                <div className="relative space-y-2">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <label className="block text-sm font-medium">Mô tả</label>
                    <button
                      type="button"
                      onClick={handleAIGenerate}
                      disabled={generatingAI}
                      className="text-xs flex items-center gap-1.5 bg-purple-50 text-purple-600 px-2 py-1 rounded-md border border-purple-100 hover:bg-purple-100 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {generatingAI ? (
                        <>
                          <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          ✨ AI tạo mô tả
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Gemini sẽ dùng tên, danh mục, giá, biến thể size/màu (nếu có) và tùy chọn bên dưới. Nếu ô mô tả đã có chữ, AI có thể viết lại mượt hơn thay vì bỏ hết.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Giọng văn</label>
                      <select
                        value={aiDescTone}
                        onChange={e => setAiDescTone(e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      >
                        <option value="warm">Thân thiện, ấm áp</option>
                        <option value="professional">Chuyên nghiệp</option>
                        <option value="playful">Vui tươi (trẻ em)</option>
                        <option value="concise">Ngắn gọn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-0.5">Độ dài</label>
                      <select
                        value={aiDescLength}
                        onChange={e => setAiDescLength(e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      >
                        <option value="short">Ngắn (2–3 câu)</option>
                        <option value="medium">Vừa (4–6 câu)</option>
                        <option value="long">Dài + gạch đầu dòng</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-0.5">Từ khóa / điểm nhấn (tùy chọn)</label>
                    <input
                      type="text"
                      value={aiDescKeywords}
                      onChange={e => setAiDescKeywords(e.target.value)}
                      placeholder="vd: cotton organic, in hình gấu, đi học..."
                      className="w-full border rounded px-2 py-1.5 text-sm"
                    />
                  </div>
                  <textarea
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    rows="5"
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Nhấn «AI tạo mô tả» hoặc tự nhập..."
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Hủy</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderOrders = () => {
    if (ordersLoading) return <p className="text-gray-500">Đang tải đơn hàng...</p>
    const statusOptions = [
      { value: 'pending', label: 'Chờ xử lý' },
      { value: 'processing', label: 'Đang gửi' },
      { value: 'shipped', label: 'Đã gửi' },
      { value: 'completed', label: 'Hoàn thành' },
      { value: 'cancelled', label: 'Đã hủy' }
    ]

    const filteredOrders = orders.filter((order) => {
      if (orderPaymentFilter === 'all') return true
      return String(order.paymentStatus || 'unpaid').toLowerCase() === orderPaymentFilter
    })

    const waitingApproveCount = orders.filter((o) => String(o.paymentStatus || '').toLowerCase() === 'pending').length

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Quản lý đơn hàng</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
              Chờ duyệt thanh toán: {waitingApproveCount}
            </span>
            <select
              value={orderPaymentFilter}
              onChange={(e) => setOrderPaymentFilter(e.target.value)}
              className="border rounded text-sm px-2 py-1 outline-none cursor-pointer"
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="pending">Chờ duyệt thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="unpaid">Chưa thanh toán</option>
            </select>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <p className="text-gray-500">Chưa có đơn hàng nào.</p>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white shadow rounded-lg p-3 border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">Đơn #{order.id}</p>
                    <p className="text-xs text-gray-500">{order.customerName} - {order.customerPhone}</p>
                  </div>
                  <span className={`px-2 py-1 text-[11px] rounded-full font-semibold ${String(order.paymentStatus || 'unpaid').toLowerCase() === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : String(order.paymentStatus || 'unpaid').toLowerCase() === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                    }`}>
                    {String(order.paymentStatus || 'unpaid').toLowerCase() === 'paid'
                      ? 'Đã thanh toán'
                      : String(order.paymentStatus || 'unpaid').toLowerCase() === 'pending'
                        ? 'Chờ duyệt'
                        : 'Chưa thanh toán'}
                  </span>
                </div>
                <p className="text-sm text-primary-600 font-semibold mt-2">{Number(order.totalAmount).toLocaleString('vi-VN')}₫</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                <div className="mt-2">
                  <select
                    value={order.status}
                    onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                    className="w-full border rounded text-sm px-2 py-1 outline-none cursor-pointer"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => handleViewOrder(order.id)} className="text-blue-500 hover:text-blue-700 text-xs border border-blue-500 px-2 py-1 rounded">Xem</button>
                  <button onClick={() => handleOrderDelete(order.id)} className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded">Xóa</button>
                  {String(order.paymentStatus || '').toLowerCase() === 'pending' && (
                    <button onClick={() => handleApprovePayment(order.id)} className="text-green-600 hover:text-green-700 text-xs border border-green-500 px-2 py-1 rounded">Xác nhận TT</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Mã đơn</th>
                  <th className="px-4 py-2 text-left">Khách hàng</th>
                  <th className="px-4 py-2 text-left">Tổng tiền</th>
                  <th className="px-4 py-2 text-left">Ngày tạo</th>
                  <th className="px-4 py-2 text-left">Trạng thái</th>
                  <th className="px-4 py-2 text-left">Thanh toán</th>
                  <th className="px-4 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-2">#{order.id}</td>
                    <td className="px-4 py-2">
                      <div className="font-semibold">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-4 py-2 text-primary-600 font-semibold">
                      {Number(order.totalAmount).toLocaleString('vi-VN')}₫
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                        className="border rounded text-sm px-2 py-1 outline-none cursor-pointer"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${String(order.paymentStatus || 'unpaid').toLowerCase() === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : String(order.paymentStatus || 'unpaid').toLowerCase() === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                        {String(order.paymentStatus || 'unpaid').toLowerCase() === 'paid'
                          ? 'Đã thanh toán'
                          : String(order.paymentStatus || 'unpaid').toLowerCase() === 'pending'
                            ? 'Chờ duyệt thanh toán'
                            : 'Chưa thanh toán'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleViewOrder(order.id)} className="text-blue-500 hover:text-blue-700 text-xs border border-blue-500 px-2 py-1 rounded mr-2">
                        Xem
                      </button>
                      <button onClick={() => handleOrderDelete(order.id)} className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded mr-2">
                        Xóa
                      </button>
                      {String(order.paymentStatus || '').toLowerCase() === 'pending' && (
                        <button
                          onClick={() => handleApprovePayment(order.id)}
                          className="text-green-600 hover:text-green-700 text-xs border border-green-500 px-2 py-1 rounded"
                        >
                          Xác nhận đã thanh toán
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* Modal chi tiết đơn hàng */}
        {showOrderModal && viewingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Chi tiết đơn hàng #{viewingOrder.id}</h3>
                <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Khách hàng</p>
                  <p className="font-semibold">{viewingOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Số điện thoại</p>
                  <p className="font-semibold">{viewingOrder.customerPhone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Địa chỉ giao hàng</p>
                  <p className="font-semibold">{viewingOrder.customerAddress}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Ngày đặt</p>
                  <p className="font-semibold">{new Date(viewingOrder.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Thanh toán</p>
                  <p className="font-semibold uppercase">{viewingOrder.paymentMethod}</p>
                </div>
              </div>

              <h4 className="font-bold mb-3 border-b pb-2">Danh sách sản phẩm</h4>
              <div className="space-y-3 mb-6">
                {(viewingOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-gray-500">
                        {item.selectedColor ? `Màu: ${item.selectedColor} ` : ''}
                        {item.selectedSize ? `Size: ${item.selectedSize}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{item.quantity} x {Number(item.price).toLocaleString('vi-VN')}₫</p>
                      <p className="font-semibold text-primary-600">{(item.quantity * item.price).toLocaleString('vi-VN')}₫</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center font-bold text-lg">
                <span>Tổng cộng:</span>
                <span className="text-primary-600">{Number(viewingOrder.totalAmount).toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderUsers = () => {
    if (usersLoading) return <p className="text-gray-500">Đang tải người dùng...</p>
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Quản lý tài khoản</h2>
        {usersList.length === 0 ? (
          <p className="text-gray-500">Không tìm thấy người dùng nào.</p>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {usersList.map(u => (
              <div key={u.id} className="bg-white shadow rounded-lg p-3 border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-[11px] rounded-full font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Vai trò</p>
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeUserRole(u.id, u.role, e.target.value)}
                      className={`mt-1 w-full text-xs border rounded px-2 py-1 bg-white ${u.role === 'admin' ? 'border-purple-300 text-purple-700' : 'border-gray-300 text-gray-700'}`}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-gray-400">Ngày tham gia</p>
                    <p className="mt-1 text-gray-600">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => handleViewUser(u.id)} className="text-blue-500 hover:text-blue-700 text-xs border border-blue-500 px-2 py-1 rounded">Xem</button>
                  <button onClick={() => handleUserPasswordChange(u.id)} className="text-yellow-500 hover:text-yellow-700 text-xs border border-yellow-500 px-2 py-1 rounded">Đổi Pass</button>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                      className={`text-xs border px-2 py-1 rounded ${u.isActive ? 'text-amber-600 hover:text-amber-700 border-amber-500' : 'text-green-600 hover:text-green-700 border-green-500'}`}
                    >
                      {u.isActive ? 'Khóa' : 'Mở'}
                    </button>
                  )}
                  <button onClick={() => handleUserDelete(u.id)} className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded">Xóa</button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Tên người dùng</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Vai trò</th>
                  <th className="px-4 py-2 text-left">Trạng thái</th>
                  <th className="px-4 py-2 text-left">Ngày tham gia</th>
                  <th className="px-4 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">{u.id}</td>
                    <td className="px-4 py-2 font-semibold">{u.name}</td>
                    <td className="px-4 py-2 text-gray-600">{u.email}</td>
                    <td className="px-4 py-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeUserRole(u.id, u.role, e.target.value)}
                        className={`text-xs border rounded px-2 py-1 bg-white ${u.role === 'admin' ? 'border-purple-300 text-purple-700' : 'border-gray-300 text-gray-700'}`}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {u.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(u.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleViewUser(u.id)} className="text-blue-500 hover:text-blue-700 text-xs border border-blue-500 px-2 py-1 rounded mr-2">
                        Xem
                      </button>
                      <button onClick={() => handleUserPasswordChange(u.id)} className="text-yellow-500 hover:text-yellow-700 text-xs border border-yellow-500 px-2 py-1 rounded mr-2">
                        Đổi Pass
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                          className={`text-xs border px-2 py-1 rounded mr-2 ${u.isActive ? 'text-amber-600 hover:text-amber-700 border-amber-500' : 'text-green-600 hover:text-green-700 border-green-500'}`}
                        >
                          {u.isActive ? 'Khóa' : 'Mở'}
                        </button>
                      )}
                      <button onClick={() => handleUserDelete(u.id)} className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* Modal chi tiết User */}
        {showUserModal && viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Chi tiết tài khoản #{viewingUser.id}</h3>
                <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Tên người dùng</p>
                  <p className="font-semibold">{viewingUser.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <p className="font-semibold">{viewingUser.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Vai trò</p>
                  <p className="font-semibold uppercase text-primary-600">{viewingUser.role}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Ngày tham gia</p>
                  <p className="font-semibold">{new Date(viewingUser.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <h4 className="font-bold mb-3 border-b pb-2">Lịch sử đơn hàng ({viewingUser.orders?.length || 0})</h4>
              <div className="space-y-3 mb-6">
                {viewingUser.orders && viewingUser.orders.length > 0 ? (
                  viewingUser.orders.map((o, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium text-sm">Đơn hàng #{o.id}</p>
                        <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded-full mr-3 text-gray-600">{o.status}</span>
                        <span className="font-semibold text-primary-600">{Number(o.totalAmount).toLocaleString('vi-VN')}₫</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Tài khoản này chưa có đơn hàng nào.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderReviews = () => {
    if (reviewsLoading) return <p className="text-gray-500">Đang tải đánh giá...</p>
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Quản lý đánh giá</h2>
        {reviewsList.length === 0 ? (
          <p className="text-gray-500">Chưa có đánh giá nào.</p>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {reviewsList.map(review => (
              <div key={review.id} className="bg-white shadow rounded-lg p-3 border border-gray-100">
                <p className="font-semibold text-sm truncate">{review.productName || `Sản phẩm #${review.productId}`}</p>
                <p className="text-xs text-gray-500 mt-1">{review.userName}</p>
                <div className="flex text-yellow-500 text-sm mt-1">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                <p className="text-xs text-gray-600 mt-2 line-clamp-3">{review.comment || 'Không có nội dung'}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(review.createdAt).toLocaleString('vi-VN')}</p>
                <button onClick={() => handleReviewDelete(review.id)} className="mt-3 text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded">
                  Xóa
                </button>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Sản phẩm</th>
                  <th className="px-4 py-2 text-left">Khách hàng</th>
                  <th className="px-4 py-2 text-left">Đánh giá</th>
                  <th className="px-4 py-2 text-left">Nội dung</th>
                  <th className="px-4 py-2 text-left">Ngày tạo</th>
                  <th className="px-4 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reviewsList.map(review => (
                  <tr key={review.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-2 max-w-[150px] truncate" title={review.productName}>
                      {review.productName || `Sản phẩm #${review.productId}`}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-semibold">{review.userName}</div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex text-yellow-500 text-sm">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </td>
                    <td className="px-4 py-2 max-w-[250px] truncate" title={review.comment}>
                      {review.comment ? review.comment : <span className="text-gray-400 italic">Không có nội dung</span>}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => handleReviewDelete(review.id)} className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    )
  }

  const renderContacts = () => {
    if (contactsLoading) return <p className="text-gray-500">Đang tải liên hệ...</p>
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold mb-4">Quản lý tin nhắn liên hệ</h2>
        {contactsList.length === 0 ? (
          <p className="text-gray-500">Chưa có tin nhắn nào.</p>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {contactsList.map(contact => (
              <div key={contact.id} className="bg-white shadow rounded-lg p-3 border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{contact.name}</p>
                    <p className="text-xs text-blue-600 truncate">{contact.email}</p>
                    <p className="text-xs text-gray-500">{contact.phone}</p>
                  </div>
                  <select
                    value={contact.status}
                    onChange={(e) => handleContactStatusUpdate(contact.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded border outline-none font-medium ${contact.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        contact.status === 'read' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-green-50 text-green-600 border-green-200'
                      }`}
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="read">Đã xem</option>
                    <option value="replied">Phản hồi</option>
                  </select>
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-wrap mt-2 bg-gray-50 p-2 rounded border border-gray-100">{contact.message}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(contact.createdAt).toLocaleString('vi-VN')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => handleViewContact(contact)} className="text-blue-500 hover:text-blue-700 text-xs border border-blue-500 px-2 py-1 rounded">Xem</button>
                  <button onClick={() => handleContactDelete(contact.id)} className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded">Xóa</button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Khách hàng</th>
                  <th className="px-4 py-2 text-left">Nội dung tin nhắn</th>
                  <th className="px-4 py-2 text-left">Ngày gửi</th>
                  <th className="px-4 py-2 text-left">Trạng thái</th>
                  <th className="px-4 py-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contactsList.map(contact => (
                  <tr key={contact.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-2">
                      <div className="font-bold text-gray-800">{contact.name}</div>
                      <div className="text-xs text-blue-600">{contact.email}</div>
                      <div className="text-xs text-gray-500">{contact.phone}</div>
                      {contact.address && <div className="text-xs text-gray-400 italic truncate max-w-[150px]">{contact.address}</div>}
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-gray-700 whitespace-pre-wrap max-w-md bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                        {contact.message}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(contact.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <select
                        value={contact.status}
                        onChange={(e) => handleContactStatusUpdate(contact.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border outline-none font-medium ${contact.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            contact.status === 'read' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                              'bg-green-50 text-green-600 border-green-200'
                          }`}
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="read">Đã xem</option>
                        <option value="replied">Phản hồi</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleViewContact(contact)}
                        className="text-blue-500 hover:text-blue-700 text-xs border border-blue-500 px-2 py-1 rounded mr-2"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => handleContactDelete(contact.id)}
                        className="text-red-500 hover:text-red-700 text-xs border border-red-500 px-2 py-1 rounded"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* Modal chi tiết Liên hệ */}
        {showContactModal && viewingContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">✉️</span> Chi tiết liên hệ
                </h3>
                <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors">&times;</button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Người gửi</p>
                    <p className="font-bold text-gray-800">{viewingContact.name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Số điện thoại</p>
                    <p className="font-bold text-gray-800">{viewingContact.phone}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Email</p>
                  <p className="font-bold text-blue-600">{viewingContact.email}</p>
                </div>

                {viewingContact.address && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Địa chỉ</p>
                    <p className="text-gray-700 text-sm">{viewingContact.address}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-blue-400 mb-2">Nội dung tin nhắn</p>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed italic">
                    "{viewingContact.message}"
                  </p>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Ngày gửi</p>
                    <p className="text-gray-600 text-xs">{new Date(viewingContact.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Trạng thái</p>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${viewingContact.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        viewingContact.status === 'read' ? 'bg-blue-100 text-blue-600' :
                          'bg-green-100 text-green-600'
                      }`}>
                      {viewingContact.status === 'pending' ? 'Chờ xử lý' : viewingContact.status === 'read' ? 'Đã xem' : 'Đã phản hồi'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                {viewingContact.status !== 'replied' && (
                  <button
                    onClick={() => {
                      handleContactStatusUpdate(viewingContact.id, 'replied')
                      setShowContactModal(false)
                    }}
                    className="px-6 py-2 bg-[#5bcae8] text-white rounded-lg font-bold hover:bg-[#48accd] transition-shadow shadow-md hover:shadow-lg"
                  >
                    Đánh dấu đã phản hồi
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCoupons = () => {
    if (couponsLoading) return <p className="text-gray-500 italic p-8 text-center animate-pulse">Đang tải mã giảm giá...</p>

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">Quản lý khuyến mãi</h2>
            <p className="text-sm text-gray-500 mt-1">Tạo và quản lý các chương trình khuyến mãi bằng mã code</p>
          </div>
          <button
            onClick={handleAddCouponClick}
            className="bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center gap-2 hover:-translate-y-0.5"
          >
            <span className="text-xl">+</span> Thêm mã giảm giá
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã / Loại</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giá trị</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Điều kiện</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời hạn</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lượt dùng</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {couponsList.length > 0 ? couponsList.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded inline-block mb-1">{coupon.code}</div>
                      <div className="text-xs text-gray-400 capitalize">{coupon.type === 'percent' ? 'Phần trăm' : 'Cố định'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-700">
                        {coupon.type === 'percent' ? `${coupon.value}%` : `${Number(coupon.value).toLocaleString('vi-VN')}₫`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        Đơn từ: <span className="font-medium">{Number(coupon.minAmount).toLocaleString('vi-VN')}₫</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">Bắt đầu: {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                      <div className="text-xs text-red-500 font-medium">Kết thúc: {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('vi-VN') : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-700">{coupon.usedCount} / {coupon.usageLimit || '∞'}</div>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${coupon.usageLimit ? Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCouponClick(coupon)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleCouponDelete(coupon.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">Chưa có mã giảm giá nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coupon Modal */}
        {showCouponModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-extrabold text-gray-800">
                  {editingCoupon ? 'Chỉnh sửa mã' : 'Thêm mã giảm giá mới'}
                </h3>
                <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCouponSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Mã giảm giá (Ví dụ: GIAM50)</label>
                    <input
                      type="text"
                      required
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Loại giảm</label>
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-all"
                    >
                      <option value="fixed">Số tiền cố định (₫)</option>
                      <option value="percent">Phần trăm (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Giá trị giảm</label>
                    <input
                      type="number"
                      required
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Đơn hàng tối thiểu (₫)</label>
                    <input
                      type="number"
                      value={couponForm.minAmount}
                      onChange={(e) => setCouponForm({ ...couponForm, minAmount: e.target.value })}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Giới hạn lượt dùng</label>
                    <input
                      type="number"
                      value={couponForm.usageLimit}
                      onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-all"
                      placeholder="Để trống nếu không giới hạn"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={couponForm.startDate}
                      onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-all text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Ngày kết thúc</label>
                    <input
                      type="datetime-local"
                      value={couponForm.endDate}
                      onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-2.5 bg-primary-600 text-white rounded-xl font-extrabold shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all hover:-translate-y-0.5"
                  >
                    Lưu mã
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'overview': return renderOverview()
      case 'products': return renderProducts()
      case 'orders': return renderOrders()
      case 'users': return renderUsers()
      case 'reviews': return renderReviews()
      case 'contacts': return renderContacts()
      case 'coupons': return renderCoupons()
      default: return renderOverview()
    }
  }

  const menuItems = [
    { id: 'overview', label: 'Tổng quan hệ thống' },
    { id: 'products', label: 'Quản lý sản phẩm' },
    { id: 'orders', label: 'Quản lý đơn hàng' },
    { id: 'users', label: 'Quản lý tài khoản' },
    { id: 'reviews', label: 'Quản lý đánh giá' },
    { id: 'contacts', label: 'Quản lý liên hệ' },
    { id: 'coupons', label: 'Quản lý khuyến mãi' },
  ]

  return (
    <div className="relative flex min-h-screen bg-gray-50/50 overflow-hidden">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-xl shadow-gray-200/50 border-r border-gray-100 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 md:p-8 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600 tracking-tight">Quản trị hệ thống</h2>
          <p className="text-xs text-gray-400 mt-1 font-medium">Bảng điều khiển</p>
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-sm font-bold text-gray-700">{user?.name}</p>
            <p className="text-xs text-primary-600 font-medium mb-3">{String(user?.role || '').toLowerCase() === 'admin' ? 'Quản trị viên' : user?.role}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate('/')
                }}
                className="text-left text-xs text-gray-500 hover:text-primary-600 hover:underline font-medium transition-colors flex items-center gap-1"
              >
                &larr; Cửa hàng
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  logout()
                  navigate('/')
                }}
                className="text-left text-xs text-red-400 hover:text-red-600 hover:underline font-medium transition-colors flex items-center gap-1"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveMenu(item.id)
                setMobileMenuOpen(false)
              }}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all flex items-center ${activeMenu === item.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30 font-semibold translate-x-1'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-3 sm:p-4 md:p-8 overflow-auto lg:ml-0">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb / Title */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{menuItems.find((m) => m.id === activeMenu)?.label || 'Bảng điều khiển'}</h1>
              <p className="text-sm text-gray-500">
                Xin chào, {user?.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm"
            >
              <span className="text-base">☰</span>
              Menu
            </button>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard

