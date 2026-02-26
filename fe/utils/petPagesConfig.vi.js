const pagesConfig = {
    homepage:{
  banner: {
    title: "Chào mừng đến với PetNest1!",
    description: "Nơi mua sắm cho thú cưng của bạn.",
  },
  shopByPet: {
    title: "Mua sắm theo thú cưng",
    description: "Lựa chọn sản phẩm phù hợp cho từng loại thú cưng của bạn",
  },
  popularCategories: {
    title: "Danh mục phổ biến",
    description: "Khám phá các sản phẩm chất lượng cho thú cưng của bạn",
  },
  bestSelling: {
    title: "Sản phẩm bán chạy nhất",
    description: "Khám phá những sản phẩm được yêu thích nhất của chúng tôi, được lựa chọn bởi hàng nghìn khách hàng hài lòng.",
    linkText: "Xem tất cả",
  },
  whyShop: {
    title: "Tại sao chọn PetNest?",
    description: "Chúng tôi cam kết mang đến trải nghiệm mua sắm tốt nhất cho bạn và thú cưng của bạn",
  },
  newsletter: {
    title: "Đăng ký nhận thông báo",
    description: "Nhận thông tin về sản phẩm mới và khuyến mãi đặc biệt",
    placeholder: "Email của bạn",
    button: "Đăng ký",
  },
  
},
blog: {
  searchPlaceholder: "Tìm kiếm bài viết...",
  backToHome: "Quay về trang chủ",
  readMore: "Đọc thêm",

},
blogdetail: {
  loading: "Đang tải bài viết...",
  error: {
    title: "Rất tiếc! Đã xảy ra lỗi",
    notFound: "Không tìm thấy bài viết"
  },
  backToBlog: "Quay về Blog",
  suggestedReading: "Bài viết liên quan"
},
bannerManagement: {
  title: "Quản lý Banner",
  addNewButton: "Thêm Banner Mới",
  search: {
    placeholder: "Tìm kiếm banner...",
    statusPlaceholder: "Trạng thái"
  },
  table: {
    headers: {
      no: "STT",
      title: "Tiêu đề",
      description: "Mô tả",
      status: "Trạng thái",
      startDate: "Ngày bắt đầu",
      actions: "Thao tác"
    }
  },
  form: {
    addTitle: "Thêm Banner Mới",
    editTitle: "Chỉnh sửa Banner",
    fields: {
      title: "Tiêu đề",
      description: "Mô tả",
      image: "Hình ảnh Banner",
      status: "Trạng thái",
      startDate: "Ngày bắt đầu",
      endDate: "Ngày kết thúc",
      link: "Liên kết"
    },
    buttons: {
      cancel: "Hủy",
      save: "Lưu thay đổi",
      add: "Thêm Banner"
    }
  },
  detail: {
    title: "Chi tiết Banner",
    closeButton: "Đóng"
  },
  pagination: {
    previous: "Trước",
    next: "Tiếp"
  },
  loading: "Đang tải...",
  uploadingProgress: "Đang tải lên: "
},
blogManagement: {
  title: "Quản lý Blog",
  addNewButton: "Thêm Blog Mới",
  search: {
    placeholder: "Tìm kiếm blog..."
  },
  table: {
    headers: {
      no: "STT",
      title: "Tiêu đề",
      description: "Mô tả",
      tag: "Thẻ",
      createdAt: "Ngày tạo",
      actions: "Thao tác"
    }
  },
  form: {
    addTitle: "Thêm Blog Mới",
    editTitle: "Chỉnh sửa Blog",
    fields: {
      title: "Tiêu đề",
      description: "Mô tả",
      tag: "Thẻ",
      images: "Hình ảnh Blog"
    },
    buttons: {
      cancel: "Hủy",
      save: "Lưu thay đổi",
      add: "Thêm Blog"
    },
    uploading: "Đang tải lên"
  },
  detail: {
    title: "Chi tiết Blog",
    fields: {
      title: "Tiêu đề",
      description: "Mô tả",
      tag: "Thẻ",
      createdAt: "Ngày tạo",
      images: "Hình ảnh"
    },
    closeButton: "Đóng"
  },
  pagination: {
    previous: "Trước",
    next: "Tiếp"
  }
},
reviewManagement: {
  title: "Quản lý Đánh giá",
  search: {
    placeholder: "Tìm kiếm sản phẩm...",
    ratingPlaceholder: "Lọc theo đánh giá"
  },
  table: {
    headers: {
      productName: "Tên sản phẩm",
      averageRating: "Đánh giá trung bình",
      totalComments: "Tổng bình luận"
    }
  },
  commentsDialog: {
    title: "Bình luận cho",
    ratingFilter: {
      all: "Tất cả đánh giá",
      five: "5 Sao",
      four: "4 Sao",
      three: "3 Sao",
      two: "2 Sao",
      one: "1 Sao"
    }
  },
  pagination: {
    showing: "Hiển thị {start} đến {end} trong tổng số {total} sản phẩm",
    previous: "Trước",
    next: "Tiếp"
  }
},
userManagement: {
  title: "Quản lý Người dùng",
  addNewButton: "Thêm Người dùng Mới",
  editTitle: "Chỉnh sửa Người dùng",
  search: {
    placeholder: "Tìm kiếm người dùng...",
    rolePlaceholder: "Lọc theo vai trò"
  },
  table: {
    headers: {
      no: "STT",
      name: "Họ và Tên",
      email: "Email",
      role: "Vai trò",
      active: "Hoạt động",
      status: "Trạng thái",
      actions: "Thao tác"
    }
  },
  form: {
    addTitle: "Thêm Người dùng Mới",
    editTitle: "Chỉnh sửa Người dùng",
    fields: {
      name: "Họ và Tên",
      email: "Email",
      password: "Mật khẩu",
      phone: "Số điện thoại",
      dob: "Ngày sinh",
      role: "Vai trò",
      address: "Địa chỉ",
      street: "Đường",
      city: "Thành phố",
      state: "Tỉnh/Bang",
      postalCode: "Mã bưu chính",
      country: "Quốc gia"
    },
    addAddress: "Thêm Địa chỉ Khác",
    buttons: {
      cancel: "Hủy",
      save: "Lưu Thay đổi",
      add: "Thêm Người dùng"
    }
  },
  status: {
    active: "Đang hoạt động",
    inactive: "Không hoạt động",
    verified: "Đã xác minh",
    unverified: "Chưa xác minh"
  },
  detail: {
    title: "Chi tiết Người dùng",
    phone: "Số điện thoại",
    dob: "Ngày sinh",
    role: "Vai trò",
    status: "Trạng thái",
    addresses: "Địa chỉ",
    accountInfo: "Thông tin Tài khoản",
    createdAt: "Ngày tạo",
    updatedAt: "Cập nhật lần cuối"
  },
  pagination: {
    previous: "Trước",
    next: "Tiếp"
  },
  loading: "Đang tải...",
  error: "Lỗi:"
},
changepass: {
  title: "Đổi Mật Khẩu",
  description: "Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật tài khoản của bạn",
  fields: {
    currentPassword: {
      label: "Mật khẩu hiện tại",
      placeholder: "Nhập mật khẩu hiện tại"
    },
    newPassword: {
      label: "Mật khẩu mới",
      placeholder: "Nhập mật khẩu mới"
    },
    confirmPassword: {
      label: "Xác nhận mật khẩu mới",
      placeholder: "Nhập lại mật khẩu mới"
    }
  },
  button: {
    submit: "Đổi Mật Khẩu",
    loading: "Đang xử lý..."
  },
  success: "Đổi mật khẩu thành công!",
  errors: {
    requiredCurrent: "Vui lòng nhập mật khẩu hiện tại",
    requiredNew: "Vui lòng nhập mật khẩu mới",
    minLength: "Mật khẩu phải có ít nhất 8 ký tự",
    pattern: "Mật khẩu phải chứa chữ hoa, chữ thường và số",
    requiredConfirm: "Vui lòng xác nhận mật khẩu mới",
    notMatch: "Mật khẩu xác nhận không khớp",
    changeError: "Có lỗi xảy ra khi đổi mật khẩu",
    wrongCurrent: "Mật khẩu hiện tại không đúng",
    tokenInvalid: "Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại.",
    tryAgain: "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại."
  }
},
userProfilePage: {
  notFoundToken: "Không tìm thấy token",
  notUpdatedAddress: "Chưa cập nhật địa chỉ",
  fetchError: "Không thể tải thông tin profile. Vui lòng thử lại sau.",
  retry: "Thử lại",
  memberSince: "Thành viên từ {joinDate}",
  changePassword: "Thay đổi mật khẩu",
  cancel: "Hủy",
  edit: "Chỉnh sửa",
  name: "Họ và tên",
  email: "Email",
  phone: "Số điện thoại",
  address: "Địa chỉ",
  joinDate: "Ngày tham gia",
  save: "Lưu thay đổi"
},
header: {
  brand: {
    short: "P",
    full: "Pet Nest"
  },
  search: {
    placeholder: "Tìm kiếm sản phẩm, thương hiệu và nhiều hơn nữa...",
    mobilePlaceholder: "Tìm kiếm sản phẩm..."
  },
  cart: {
    title: "Sản phẩm mới nhất",
    empty: "Giỏ hàng của bạn đang trống",
    viewCart: "Xem giỏ hàng"
  },
  notifications: {
    title: "Thông báo",
    viewAll: "Xem tất cả thông báo"
  },
  user: {
    login: "Đăng nhập",
    signup: "Đăng ký",
    myProfile: "Trang cá nhân",
    myOrders: "Đơn hàng của tôi",
    wishlist: "Yêu thích",
    settings: "Cài đặt",
    requestSupport: "Yêu cầu hỗ trợ",
    logout: "Đăng xuất"
  },
  language: {
    vi: "VI",
    en: "EN"
  }
},
cart: {
  continueShopping: "Tiếp tục mua sắm",
  emptyTitle: "Giỏ hàng trống",
  emptyDesc: "Bạn chưa có sản phẩm nào trong giỏ hàng",
  startShopping: "Bắt đầu mua sắm",
  title: "Giỏ hàng",
  productCount: "{count} sản phẩm",
  selectAll: "Chọn tất cả ({selected}/{total})",
  selectedTotal: "Tổng tiền đã chọn",
  selected: "✓ Đã chọn",
  pricePerProduct: "{price} / sản phẩm",
  selectedCount: "Đã chọn {count} sản phẩm",
  addToFavorite: "Thêm vào yêu thích",
  buyNow: "Mua ngay ({count})",
  error: "Lỗi"
},
categoryPage: {
  breadcrumb: {
    home: "Trang chủ",
    products: "Sản phẩm"
  },
  sidebar: {
    category: "Danh mục",
    price: "Giá",
    brand: "Thương hiệu",
    findBrandPlaceholder: "Tìm thương hiệu",
    showLess: "Ẩn bớt",
    showMore: "+ {count} thêm",
    customerRating: "Đánh giá khách hàng"
  },
  sort: {
    results: "{count} kết quả",
    sortBy: "Sắp xếp theo",
    relevance: "Liên quan",
    priceLow: "Giá: Thấp đến Cao",
    priceHigh: "Giá: Cao đến Thấp",
    rating: "Đánh giá khách hàng",
    newest: "Mới nhất",
    bestselling: "Bán chạy nhất"
  },
  pagination: {
    previous: "Trước",
    next: "Tiếp"
  },
  product: {
    price: "{price}₫",
    addToWishlist: "Thêm vào yêu thích"
  }
},

productDetail: {
  uncategorized: "Chưa phân loại",
  quantity: "Số lượng",
  addToCart: "Thêm vào giỏ hàng",
  adding: "Đang thêm...",
  outOfStock: "Sản phẩm hết hàng",
  left: "Còn lại:",
  freeShipping: "Miễn phí vận chuyển",
  warranty: "Bảo hành 2 năm",
  returns: "Đổi trả trong 30 ngày",
  customerReviews: "Đánh giá của khách hàng",
  ratingOverview: "Tổng quan đánh giá",
  basedOnReviews: "Dựa trên {n} đánh giá",
  verifiedPurchase: "Đã mua hàng",
  reviewImageAlt: "Ảnh đánh giá",
  userFallback: "Người dùng",
  avatarFallback: "U",
  productNotFound: "Không tìm thấy sản phẩm",
  addToCartSuccess: "Thêm sản phẩm vào giỏ hàng thành công!",
  addToCartFail: "Thêm sản phẩm vào giỏ hàng thất bại",
  quantityGreaterThanZero: "Số lượng phải lớn hơn 0",
  selectedVariantNotFound: "Không tìm thấy biến thể đã chọn",
  loading: "Đang tải...",
  errorFetching: "Lỗi khi tải sản phẩm:",
  addToWishlist: "Thêm vào yêu thích",
  cancel: "Hủy",
  reviewForm: {
    title: "Viết đánh giá",
    subtitle: "Chia sẻ trải nghiệm của bạn với sản phẩm này",
    rating: "Đánh giá",
    titleField: "Tiêu đề đánh giá",
    titlePlaceholder: "Tóm tắt trải nghiệm của bạn",
    comment: "Đánh giá",
    commentPlaceholder: "Hãy cho chúng tôi biết về trải nghiệm của bạn với sản phẩm này...",
    images: "Hình ảnh (tùy chọn)",
    submit: "Gửi đánh giá",
    submitting: "Đang gửi...",
    success: "Gửi đánh giá thành công!",
    error: "Gửi đánh giá thất bại. Vui lòng thử lại.",
    required: "Trường này là bắt buộc",
    minRating: "Vui lòng chọn đánh giá",
    minCommentLength: "Đánh giá phải có ít nhất 10 ký tự"
  },
  unreviewedSection: {
    title: "Bạn đã mua sản phẩm này",
    subtitle: "Chia sẻ trải nghiệm để giúp khách hàng khác",
    writeReview: "Viết đánh giá",
    purchasedOn: "Đã mua vào {date}"
  }
},
bestSellingPage: {
  breadcrumb: {
    home: "Trang chủ",
    products: "Sản phẩm"
  },
  sidebar: {
    category: "Danh mục",
    price: "Giá",
    min: "Tối thiểu",
    max: "Tối đa",
    brand: "Thương hiệu",
    findBrandPlaceholder: "Tìm thương hiệu",
    showLess: "Ẩn bớt",
    showMore: "+ {count} thêm",
    customerRating: "Đánh giá khách hàng"
  },
  sort: {
    results: "{count} kết quả",
    sortBy: "Sắp xếp theo",
    relevance: "Liên quan",
    priceLow: "Giá: Thấp đến Cao",
    priceHigh: "Giá: Cao đến Thấp",
    rating: "Đánh giá khách hàng",
    newest: "Mới nhất",
    bestselling: "Bán chạy nhất"
  },
  pagination: {
    previous: "Trước",
    next: "Tiếp"
  },
  product: {
    price: "{price}₫",
    addToWishlist: "Thêm vào yêu thích"
  },
  loading: "Đang tải...",
  error: {
    fetch: "Không thể tải sản phẩm bán chạy",
    general: "Đã xảy ra lỗi khi tải dữ liệu"
  },
  searchPlaceholder: "Tìm theo tên hoặc danh mục..."
},
searchPage: {
  breadcrumb: {
    home: "Trang chủ",
    products: "Sản phẩm"
  },
  sidebar: {
    category: "Danh mục",
    all: "Tất cả",
    price: "Giá",
    min: "Tối thiểu",
    max: "Tối đa",
    brand: "Thương hiệu",
    findBrandPlaceholder: "Tìm thương hiệu",
    showLess: "Ẩn bớt",
    showMore: "+ {count} thêm",
    customerRating: "Đánh giá khách hàng"
  },
  sort: {
    results: "{count} kết quả",
    sortBy: "Sắp xếp theo",
    relevance: "Liên quan",
    priceLow: "Giá: Thấp đến Cao",
    priceHigh: "Giá: Cao đến Thấp",
    rating: "Đánh giá khách hàng",
    newest: "Mới nhất",
    bestselling: "Bán chạy nhất"
  },
  pagination: {
    previous: "Trước",
    next: "Tiếp"
  },
  product: {
    price: "{price}₫",
    addToWishlist: "Thêm vào yêu thích"
  }
},
statistics: {
  pageTitle: "Thống kê Doanh thu & Lãi",
  pageDescription: "Phân tích hiệu suất sản phẩm và doanh thu",
  filter: {
    title: "Bộ lọc",
    fromDate: "Từ ngày",
    toDate: "Đến ngày",
    sortBy: "Sắp xếp theo",
    limit: "Số lượng hiển thị",
    top5: "Top 5",
    top10: "Top 10",
    top20: "Top 20",
    top50: "Top 50"
  },
  summary: {
    totalRevenue: "Tổng Doanh thu",
    totalProfit: "Tổng Lãi",
    totalQuantity: "Tổng Số lượng"
  },
  tabs: {
    bestSelling: "Sản phẩm bán chạy",
    slowSelling: "Sản phẩm bán chậm",
    revenueOverTime: "Doanh thu theo thời gian"
  },
  bestSelling: {
    title: "Sản phẩm có doanh thu cao nhất",
    description: "Danh sách sản phẩm mang lại doanh thu và lãi cao nhất"
  },
  slowSelling: {
    title: "Sản phẩm bán chậm",
    description: "Danh sách sản phẩm có doanh thu thấp nhất"
  },
  revenueOverTime: {
    title: "Doanh thu theo thời gian",
    description: "Biểu đồ doanh thu theo thời gian",
    timePeriod: "Chu kỳ thời gian",
    byDay: "Theo ngày",
    byWeek: "Theo tuần",
    byMonth: "Theo tháng"
  },
  loading: "Đang tải dữ liệu...",
  table: {
    product: "Sản phẩm",
    quantity: "Số lượng bán",
    revenue: "Doanh thu",
    cost: "Chi phí",
    profit: "Lãi",
    profitMargin: "Tỷ lệ lãi",
    orderCount: "Số đơn hàng"
  }
},
userstatistics: {
  pageTitle: "Dashboard Quản Lý Người Dùng",
  filter: "Bộ lọc",
  export: "Xuất báo cáo",
  totalUsers: "Tổng khách hàng",
  currentMonthUsers: "Khách hàng tháng này",
  potentialCustomers: "Khách hàng tiềm năng",
  loyalCustomers: "Khách hàng thân quen",
  registrationStats: {
    title: "Thống Kê Đăng Ký Người Dùng",
    description: "Theo dõi số lượng người dùng đăng ký theo thời gian",
    monthly: "Theo tháng",
    yearly: "Theo năm"
  },
  tabs: {
    potential: "Khách Hàng Tiềm Năng",
    topBuyers: "Mua Hàng Nhiều Nhất",
    cancellation: "Phân Tích Hủy Đơn"
  },
  searchPlaceholder: "Tìm kiếm khách hàng...",
  table: {
    customer: "Khách hàng",
    email: "Email",
    phone: "Điện Thoại",
    createdAt: "Ngày đăng ký tài khoản",
    ranking: "Xếp hạng",
    orders: "Số đơn hàng",
    totalSpent: "Tổng chi tiêu",
    avgOrder: "Trung bình/đơn",
    totalOrders: "Tổng đơn",
    cancelledOrders: "Đơn hủy",
    cancelRate: "Tỷ lệ hủy",
    mainReason: "Lý do chính"
  },
  pagination: {
    show: "Hiển thị",
    of: "của",
    results: "kết quả",
    page: "Trang",
    previous: "Trước",
    next: "Tiếp"
  },
  details: {
    cancellationTitle: "Chi Tiết Khách Hàng Hủy Đơn",
    cancellationDesc: "Thông tin chi tiết về các khách hàng có tỷ lệ hủy đơn cao"
  }
},
voucherManagement: {
  title: "Quản lý Voucher",
  addNewButton: "Tạo Voucher Mới",
  form: {
    addTitle: "Tạo Voucher Mới",
    editTitle: "Chỉnh sửa Voucher",
    fields: {
      code: "Mã Voucher",
      discountAmount: "Số tiền giảm giá",
      discountPercent: "Phần trăm giảm giá",
      validFrom: "Thời gian bắt đầu",
      validTo: "Thời gian kết thúc",
      usageLimit: "Số lần sử dụng tối đa"
    },
    buttons: {
      cancel: "Hủy",
      add: "Tạo Voucher",
      save: "Cập nhật Voucher"
    }
  },
  search: {
    placeholder: "Tìm kiếm voucher..."
  },
  table: {
    headers: {
      no: "STT",
      code: "Mã Voucher",
      discount: "Giảm giá",
      validTime: "Thời gian hiệu lực",
      usage: "Số lần sử dụng",
      actions: "Thao tác"
    },
    validFrom: "Từ:",
    validTo: "Đến:",
    edit: "Chỉnh sửa",
    delete: "Xóa"
  },
  error: {
    fetch: "Lỗi khi tải danh sách voucher",
    duplicateCode: "Mã voucher đã tồn tại",
    invalidStartDate: "Thời gian bắt đầu phải từ ngày hôm nay trở đi",
    create: "Lỗi khi tạo voucher",
    discountType: "Chỉ được nhập một loại giảm giá",
    update: "Lỗi khi cập nhật voucher",
    delete: "Lỗi khi xóa voucher"
  },
  success: {
    create: "Tạo voucher thành công",
    update: "Cập nhật voucher thành công",
    delete: "Xóa voucher thành công"
  },
  confirm: {
    delete: "Bạn có chắc chắn muốn xóa voucher này?"
  },
  pagination: {
    previous: "Trước",
    next: "Sau"
  }
},
suportRequest: {
  pageTitle: "Danh sách yêu cầu Hỗ trợ",
  search: {
    placeholder: "Tìm kiếm theo tiêu đề, mô tả...",
    statusPlaceholder: "Trạng thái",
    all: "Tất cả"
  },
  table: {
    headers: {
      no: "STT",
      title: "Tiêu đề",
      description: "Mô tả",
      createdAt: "Ngày giao",
      status: "Trạng thái",
      actions: "Thao tác"
    },
    noData: "Không có request nào phù hợp."
  },
  status: {
    new: "Mới",
    processing: "Đang xử lý",
    resolved: "Đã xử lý",
    rejected: "Từ chối"
  },
  priority: {
    urgent: "Khẩn cấp",
    high: "Cao",
    normal: "Bình thường"
  },
  detail: {
    title: "Chi tiết Yêu cầu hỗ trợ",
    fields: {
      title: "Tiêu đề",
      noTitle: "(Không có)",
      content: "Nội dung",
      status: "Trạng thái",
      priority: "Mức độ ưu tiên",
      handler: "Người xử lý",
      noHandler: "(Chưa có)",
      createdAt: "Ngày tạo",
      updatedAt: "Ngày cập nhật",
      response: "Phản hồi",
      internalNote: "Ghi chú nội bộ"
    },
    buttons: {
      save: "Lưu",
      cancel: "Huỷ",
      close: "Đóng"
    },
    updateStatus: "Cập nhật trạng thái"
  },
  actions: {
    viewDetail: "Xem chi tiết"
  },
  loading: "Đang tải dữ liệu...",
  pagination: {
    previous: "Trước",
    next: "Sau"
  }
},
checkout : {
  title: "Thanh toán",
  productTitle: "Sản phẩm",
  productDescription: "Xem lại sản phẩm trước khi thanh toán",
  productQuantity: "SL: {item.quantity}",
  addressTitle: "Địa chỉ giao hàng",
  addressDescription: "Chọn địa chỉ giao hàng hoặc thêm địa chỉ mới",
  savedAddresses: "Địa chỉ đã lưu",
  defaultAddress: "Mặc định",
  editAddressTitle: "Chỉnh sửa địa chỉ",
  streetLabel: "Đường",
  cityLabel: "Thành phố",
  stateLabel: "Tỉnh/Thành",
  postalCodeLabel: "Mã bưu điện",
  saveChanges: "Lưu thay đổi",
  cancel: "Hủy",
  addNewAddress: "Thêm địa chỉ mới",
  addNewAddressTitle: "Thêm địa chỉ mới",
  streetPlaceholder: "Số nhà, tên đường",
  cityPlaceholder: "Thành phố",
  statePlaceholder: "Tỉnh/Thành",
  postalCodePlaceholder: "Mã bưu điện",
  saveAddress: "Lưu địa chỉ",
  saveAndSetDefault: "Lưu và đặt làm mặc định",
  shippingTitle: "Phương thức vận chuyển",
  shippingDescription: "Chọn phương thức vận chuyển phù hợp",
  shippingStandard: "Giao hàng tiêu chuẩn",
  shippingStandardDesc: "3-5 ngày - 30.000₫",
  shippingExpress: "Giao hàng nhanh",
  shippingExpressDesc: "1-2 ngày - 50.000₫",
  orderSummaryTitle: "Tổng đơn hàng",
  subtotal: "Tạm tính",
  shippingFee: "Phí vận chuyển",
  tax: "Thuế (10%)",
  total: "Tổng cộng",
  paymentTitle: "Phương thức thanh toán",
  paymentDescription: "Chọn phương thức thanh toán",
  paymentCreditCard: "Thẻ tín dụng/ghi nợ",
  paymentCreditCardDesc: "Visa, Mastercard, JCB",
  paymentCOD: "Thanh toán khi nhận hàng (COD)",
  paymentCODDesc: "Thanh toán bằng tiền mặt",
  processing: "Đang xử lý...",
  placeOrder: "Đặt hàng",
  errorSelectAddress: "Vui lòng chọn địa chỉ giao hàng!",
  errorSelectPayment: "Vui lòng chọn phương thức thanh toán!",
  errorCreatePayment: "Không thể tạo thanh toán. Vui lòng thử lại!",
  errorPlaceOrder: "Có lỗi xảy ra khi đặt hàng!",
  errorUpdateAddress: "Cập nhật địa chỉ thất bại!"
},
orderManagement: {
  title: "Quản lý đơn hàng",
  searchPlaceholder: "Tìm kiếm đơn hàng...",
  allStatus: "Tất cả trạng thái",
  updateStatus: "Cập nhật trạng thái",
  updateSelected: "Cập nhật đã chọn",
  importCSV: "Nhập người dùng bằng CSV",
  table: {
    no: "STT",
    orderId: "Mã đơn hàng",
    customer: "Khách hàng",
    totalAmount: "Tổng tiền",
    status: "Trạng thái",
    date: "Ngày",
    actions: "Thao tác",
    viewDetails: "Xem chi tiết",
    editOrder: "Chỉnh sửa đơn"
  },
  pagination: {
    previous: "Trước",
    next: "Tiếp"
  },
  form: {
    updateOrderStatus: "Cập nhật trạng thái đơn hàng",
    orderStatus: "Trạng thái đơn hàng",
    saveChanges: "Lưu thay đổi",
    cancel: "Hủy"
  },
  detail: {
    orderItems: "Sản phẩm trong đơn",
    shippingAddress: "Địa chỉ giao hàng",
    orderInformation: "Thông tin đơn hàng",
    createdAt: "Ngày tạo",
    lastUpdated: "Cập nhật lần cuối"
  },
  dialog: {
    cancelDetail: "Chi tiết đơn hủy",
    returnDetail: "Chi tiết đơn trả",
    returnRequestDetail: "Chi tiết yêu cầu trả hàng",
    cancelRequestDetail: "Chi tiết yêu cầu hủy hàng",
    orderDetail: "Chi tiết đơn hàng"
  },
  return: {
    product: "Sản phẩm:",
    quantity: "Số lượng:",
    reason: "Lý do:",
    noReason: "Không có lý do",
    reject: "Từ chối",
    accept: "Chấp nhận",
    returnedSuccess: "Đơn hàng đã được trả thành công.",
    cancelled: "Đơn hàng đã bị hủy."
  },
  rejectReason: {
    title: "Lý do từ chối trả hàng",
    inputLabel: "Vui lòng nhập lý do từ chối:",
    confirm: "Xác nhận từ chối",
    close: "Đóng",
    reasonForOrder: "Lý do từ chối cho đơn hàng #",
    noReasonProvided: "Không có lý do được cung cấp."
  }
},
orderDashboard: {
  stats: {
    totalOrders: "Tổng số đơn hàng",
    noDataLastMonth: "Không có dữ liệu từ tháng trước",
    percentFromLastMonth: "% so với tháng trước",
    totalRevenue: "Tổng doanh thu",
    totalRevenueCompleted: "Tổng doanh thu đơn hoàn thành",
    revenueCurrentMonth: "Doanh thu tháng này",
    noRevenueCurrentMonth: "Không có doanh thu tháng này",
    percentFromLastYear: "% so với năm trước",
    revenueCurrentYear: "Doanh thu năm nay",
    noDataLastYear: "Không có dữ liệu từ năm trước"
  },
  recommendation: {
    title: "🤔 Which products should we import?",
    description: "AI-powered recommendations based on sales data, stock levels, and market trends",
    import: "Should import",
    noImport: "No import",
    currentStock: "Current Stock",
    units: "units",
    monthlySales: "Monthly Sales",
    brand: "Brand",
    suggestQuantity: "Suggest Quantity",
    importType: "Import Type",
    why: "Why:",
    whyImport: "Low stock with high demand - recommended to import",
    whyNoImport: "Stock levels are adequate"
  },
  orderStatus: {
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    cancelled: "Đã hủy",
    completed: "Hoàn thành",
    returned: "Đã trả hàng"
  },
  charts: {
    monthlyOrders: "Đơn hàng theo tháng",
    monthlyOrdersDesc: "Số lượng đơn hàng theo từng tháng",
    orders: "Đơn hàng",
    orderStatusDistribution: "Phân bố trạng thái đơn hàng",
    year: "Năm",
    month: "Tháng",
    months: [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ],
    tooltip: "{name}: {value} đơn"
  },
  tables: {
    bestSelling: "Top 5 sản phẩm bán chạy",
    worstSelling: "Top 5 sản phẩm bán chậm",
    loading: "Đang tải...",
    name: "Tên",
    brand: "Thương hiệu",
    price: "Giá",
    sold: "Đã bán"
  }
},
manageProduct: {
  title: "Quản lý Sản phẩm",
  addNewButton: "Thêm Sản phẩm Mới",
  editTitle: "Chỉnh sửa Sản phẩm",
  search: {
    placeholder: "Tìm kiếm sản phẩm..."
  },
  table: {
    headers: {
      no: "STT",
      name: "Tên",
      brand: "Thương hiệu",
      description: "Mô tả",
      categories: "Danh mục",
      actions: "Thao tác"
    }
  },
  form: {
    addTitle: "Thêm Sản phẩm Mới",
    editTitle: "Chỉnh sửa Sản phẩm",
    fields: {
      name: "Tên",
      brand: "Thương hiệu",
      description: "Mô tả",
      categories: "Danh mục",
      childCategory: "Danh mục con",
      grandchildCategory: "Danh mục cháu"
    },
    buttons: {
      cancel: "Hủy",
      save: "Lưu thay đổi",
      add: "Thêm Sản phẩm"
    },
    error: {
      requiredName: "Tên và mô tả là bắt buộc",
      requiredCategory: "Vui lòng chọn ít nhất một danh mục cha",
      failedUpdate: "Cập nhật sản phẩm thất bại",
      failedCreate: "Tạo sản phẩm thất bại"
    }
  },
  variant: {
    title: "Quản lý Biến thể",
    addNewButton: "Thêm Biến thể Mới",
    editTitle: "Chỉnh sửa Biến thể",
    table: {
      headers: {
        no: "STT",
        attributes: "Thuộc tính",
        sellPrice: "Giá bán",
        totalQuantity: "Tổng số lượng",
        images: "Hình ảnh",
        actions: "Thao tác"
      }
    },
    form: {
      addTitle: "Thêm Biến thể Mới",
      editTitle: "Chỉnh sửa Biến thể",
      fields: {
        images: "Hình ảnh",
        attributes: "Thuộc tính",
        parentAttributes: "Thuộc tính cha",
        childAttributes: "Thuộc tính con",
        sellPrice: "Giá bán"
      },
      buttons: {
        cancel: "Hủy",
        save: "Cập nhật Biến thể",
        add: "Thêm Biến thể"
      },
      error: {
        requiredImage: "Vui lòng thêm ít nhất một hình ảnh",
        requiredParentAttr: "Vui lòng chọn thuộc tính cha",
        requiredChildAttr: "Vui lòng chọn thuộc tính con",
        requiredPrice: "Vui lòng nhập giá hợp lệ",
        failedAdd: "Thêm biến thể thất bại",
        failedUpdate: "Cập nhật biến thể thất bại"
      }
    },
    deleteDialog: {
      title: "Xóa Biến thể",
      content: "Bạn có chắc chắn muốn xóa biến thể này? Hành động này không thể hoàn tác.",
      cancel: "Hủy",
      delete: "Xóa"
    },
    empty: "Không tìm thấy biến thể nào cho sản phẩm này",
    loading: "Đang tải biến thể..."
  },
  import: {
    title: "Quản lý Lô nhập hàng",
    addNewButton: "Thêm Lô nhập hàng Mới",
    editTitle: "Chỉnh sửa Lô nhập hàng",
    table: {
      headers: {
        no: "STT",
        importDate: "Ngày nhập",
        quantity: "Số lượng",
        costPrice: "Giá vốn",
        totalValue: "Tổng giá trị",
        actions: "Thao tác"
      }
    },
    form: {
      addTitle: "Thêm Lô nhập hàng Mới",
      editTitle: "Chỉnh sửa Lô nhập hàng",
      fields: {
        importDate: "Ngày nhập",
        quantity: "Số lượng",
        costPrice: "Giá vốn"
      },
      buttons: {
        cancel: "Hủy",
        add: "Thêm Lô",
        save: "Cập nhật Lô"
      },
      error: {
        requiredQuantity: "Số lượng phải lớn hơn 0",
        requiredCostPrice: "Giá vốn phải lớn hơn 0",
        failedAdd: "Thêm lô nhập hàng thất bại",
        failedUpdate: "Cập nhật lô nhập hàng thất bại"
      }
    },
    deleteDialog: {
      title: "Xóa Lô nhập hàng",
      content: "Bạn có chắc chắn muốn xóa lô nhập hàng này? Hành động này không thể hoàn tác.",
      cancel: "Hủy",
      delete: "Xóa"
    },
    empty: "Không tìm thấy lô nhập hàng nào cho biến thể này",
    loading: "Đang tải lô nhập hàng...",
    summary: {
      totalQuantity: "Tổng số lượng",
      averageCostPrice: "Giá vốn trung bình",
      totalInventoryValue: "Tổng giá trị tồn kho",
      profitMargin: "Tỷ lệ lãi"
    },
    sellPrice: {
      label: "Giá bán:",
      saving: "Đang lưu..."
    }
  },
  deleteDialog: {
    title: "Xóa Sản phẩm",
    content: "Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này cũng sẽ xóa tất cả biến thể và không thể hoàn tác.",
    cancel: "Hủy",
    delete: "Xóa",
    deleting: "Đang xóa..."
  },
  pagination: {
    previous: "Trước",
    next: "Tiếp"
  },
  loading: "Đang tải...",
  error: "Lỗi:"
},
manaCategory:{
  title: "Quản lý Danh mục",
  addNewButton: "Thêm Danh mục Mới",
  editTitle: "Chỉnh sửa Danh mục",
  childCategoriesTitle: "Danh mục con - {name}",
  table: {
    headers: {
      no: "STT",
      name: "Tên",
      description: "Mô tả",
      image: "Hình ảnh",
      actions: "Thao tác"
    }
  },
  form: {
    name: "Tên",
    description: "Mô tả",
    image: "Ảnh danh mục",
    cancel: "Hủy",
    save: "Lưu thay đổi",
    saving: "Đang lưu...",
    add: "Thêm Danh mục",
    adding: "Đang thêm..."
  },
  dialog: {
    deleteTitle: "Xóa Danh mục",
    deleteContent: "Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.",
    delete: "Xóa",
    deleting: "Đang xóa...",
    close: "Đóng"
  },
  button: {
    manageChildren: "Quản lý Danh mục con",
    edit: "Chỉnh sửa Danh mục",
    delete: "Xóa Danh mục"
  },
  search: {
    placeholder: "Tìm kiếm danh mục..."
  },
  loading: "Đang tải...",
  loadingChildren: "Đang tải danh mục con...",
  noChildren: "Không có danh mục con",
  uploading: "Đang tải lên: {progress}%",
  error: "Lỗi: {error}",
  errors: {
    nameRequired: "Tên là bắt buộc",
    updateFailed: "Cập nhật danh mục thất bại",
    createFailed: "Tạo danh mục thất bại",
    fetchChildrenFailed: "Lấy danh mục con thất bại",
    deleteFailed: "Xóa danh mục thất bại",
    fetchFailed: "Lấy danh mục thất bại",
    saveFailed: "Lưu danh mục thất bại"
  }
},
manageAttribute: {
  title: "Quản lý Thuộc tính",
  addNewButton: "Thêm Thuộc tính",
  editTitle: "Chỉnh sửa Thuộc tính",
  deleteTitle: "Xóa Thuộc tính",
  deleteConfirm: "Bạn có chắc chắn muốn xóa thuộc tính này? Hành động này không thể hoàn tác.",
  delete: "Xóa",
  deleting: "Đang xóa...",
  close: "Đóng",
  table: {
    headers: {
      no: "STT",
      value: "Giá trị",
      description: "Mô tả",
      categories: "Danh mục",
      actions: "Thao tác"
    }
  },
  search: {
    placeholder: "Tìm kiếm thuộc tính..."
  },
  form: {
    value: "Giá trị",
    description: "Mô tả",
    parent: "Thuộc tính cha",
    categories: "Danh mục",
    noParent: "Không có cha",
    cancel: "Hủy",
    save: "Lưu",
    add: "Thêm Thuộc tính",
    error: {
      requiredValue: "Giá trị là bắt buộc",
      failedSave: "Lưu thuộc tính thất bại",
      failedDelete: "Xóa thuộc tính thất bại"
    }
  },
  child: {
    title: "Thuộc tính con của: {parent}",
    add: "Thêm Thuộc tính con",
    noChild: "Không có thuộc tính con",
    loading: "Đang tải thuộc tính con..."
  },
  loading: "Đang tải...",
  error: "Lỗi: {error}"
},
productOverview: {
  pageTitle: "Tổng Quan Sản Phẩm",
  pageDescription: "Thống kê chi tiết về sản phẩm trong cửa hàng.",
  filter: {
    activeCategory: "Đang lọc theo danh mục:",
    clear: "Xóa bộ lọc"
  },
  stats: {
    totalProducts: {
      title: "Tổng Sản Phẩm",
      description: "Tổng số sản phẩm đang có"
    },
    lowStock: {
      title: "Sản Phẩm Sắp Hết Hàng",
      description: "Số lượng biến thể có tồn kho <= 10"
    }
  },
  charts: {
    byCategory: {
      title: "Sản Phẩm Theo Danh Mục",
      description: "Nhấp vào một danh mục để lọc toàn bộ trang."
    },
    byBrand: {
      title: "Sản Phẩm Theo Thương Hiệu"
    }
  },
  lowStockTable: {
    title: "Sản Phẩm Tồn Kho Thấp",
    searchPlaceholder: "Tìm kiếm sản phẩm tồn kho thấp...",
    columns: {
      image: "Hình Ảnh",
      name: "Tên Sản Phẩm",
      quantity: "Số Lượng Còn Lại"
    }
  }
},
adminSidebar: {
  dashboard: "Bảng điều khiển",
  version: "v1.0.0",
  application: "Ứng dụng",
  other: "Khác",
  switchToEnglish: "Switch to English",
  switchToVietnamese: "Chuyển sang Tiếng Việt",
  userName: "John Doe", // hoặc để động
  userEmail: "john@example.com", // hoặc để động
  profile: "Trang cá nhân",
  settings: "Cài đặt",
  logout: "Đăng xuất",
  users: "Người dùng",
  manageProduct: "Quản lý Sản phẩm",
  manageCategory: "Quản lý Danh mục",
  manageAttribute: "Quản lý Thuộc tính",
  settings: "Cài đặt",
  search: "Tìm kiếm"
}
};

export default pagesConfig;
