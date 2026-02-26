const pagesConfig = {
    homepage: {
      banner: {
        title: "Welcome to PetNest1!",
        description: "The shopping place for your pet.",
      },
      shopByPet: {
        title: "Shop by Pet",
        description: "Choose the right products for each type of your pet.",
      },
      popularCategories: {
        title: "Popular Categories",
        description: "Discover quality products for your pet.",
      },
      bestSelling: {
        title: "Best Selling Products",
        description: "Explore our most popular products, loved by thousands of satisfied customers.",
        linkText: "View All",
      },
      whyShop: {
        title: "Why Choose PetNest?",
        description: "We are committed to providing the best shopping experience for you and your pet.",
      },
      newsletter: {
        title: "Subscribe to Our Newsletter",
        description: "Get updates on new products and special promotions.",
        placeholder: "Your email",
        button: "Subscribe",
      }
    },
    blog: {
      searchPlaceholder: "Search for articles...",
      backToHome: "Back to homepage",
      readMore: "Read more"
    },
    blogdetail: {
      loading: "Loading article...",
      error: {
        title: "Oops! An error occurred",
        notFound: "Article not found"
      },
      backToBlog: "Back to Blog",
      suggestedReading: "Related Articles"
    },
    bannerManagement: {
      title: "Banner Management",
      addNewButton: "Add New Banner",
      search: {
        placeholder: "Search banners...",
        statusPlaceholder: "Status"
      },
      table: {
        headers: {
          no: "No.",
          title: "Title",
          description: "Description",
          status: "Status",
          startDate: "Start Date",
          actions: "Actions"
        }
      },
      form: {
        addTitle: "Add New Banner",
        editTitle: "Edit Banner",
        fields: {
          title: "Title",
          description: "Description",
          image: "Banner Image",
          status: "Status",
          startDate: "Start Date",
          endDate: "End Date",
          link: "Link"
        },
        buttons: {
          cancel: "Cancel",
          save: "Save Changes",
          add: "Add Banner"
        }
      },
      detail: {
        title: "Banner Details",
        closeButton: "Close"
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      },
      loading: "Loading...",
      uploadingProgress: "Uploading: "
    },
    blogManagement: {
      title: "Blog Management",
      addNewButton: "Add New Blog",
      search: {
        placeholder: "Search blogs..."
      },
      table: {
        headers: {
          no: "No.",
          title: "Title",
          description: "Description",
          tag: "Tag",
          createdAt: "Created At",
          actions: "Actions"
        }
      },
      form: {
        addTitle: "Add New Blog",
        editTitle: "Edit Blog",
        fields: {
          title: "Title",
          description: "Description",
          tag: "Tag",
          images: "Blog Images"
        },
        buttons: {
          cancel: "Cancel",
          save: "Save Changes",
          add: "Add Blog"
        },
        uploading: "Uploading"
      },
      detail: {
        title: "Blog Details",
        fields: {
          title: "Title",
          description: "Description",
          tag: "Tag",
          createdAt: "Created At",
          images: "Images"
        },
        closeButton: "Close"
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      }
    },
    reviewManagement: {
      title: "Review Management",
      search: {
        placeholder: "Search products...",
        ratingPlaceholder: "Filter by rating"
      },
      table: {
        headers: {
          productName: "Product Name",
          averageRating: "Average Rating",
          totalComments: "Total Comments"
        }
      },
      commentsDialog: {
        title: "Comments for",
        ratingFilter: {
          all: "All Ratings",
          five: "5 Stars",
          four: "4 Stars",
          three: "3 Stars",
          two: "2 Stars",
          one: "1 Star"
        }
      },
      pagination: {
        showing: "Showing {start} to {end} of {total} products",
        previous: "Previous",
        next: "Next"
      }
    },
    userManagement: {
      title: "User Management",
      addNewButton: "Add New User",
      editTitle: "Edit User",
      search: {
        placeholder: "Search users...",
        rolePlaceholder: "Filter by role"
      },
      table: {
        headers: {
          no: "No.",
          name: "Name",
          email: "Email",
          role: "Role",
          active: "Active",
          status: "Status",
          actions: "Actions"
        }
      },
      form: {
        addTitle: "Add New User",
        editTitle: "Edit User",
        fields: {
          name: "Name",
          email: "Email",
          password: "Password",
          phone: "Phone",
          dob: "Date of Birth",
          role: "Role",
          address: "Address",
          street: "Street",
          city: "City",
          state: "State",
          postalCode: "Postal Code",
          country: "Country"
        },
        addAddress: "Add Another Address",
        buttons: {
          cancel: "Cancel",
          save: "Save Changes",
          add: "Add User"
        }
      },
      status: {
        active: "Active",
        inactive: "Inactive",
        verified: "Verified",
        unverified: "Unverified"
      },
      detail: {
        title: "User Details",
        phone: "Phone",
        dob: "Date of Birth",
        role: "Role",
        status: "Status",
        addresses: "Addresses",
        accountInfo: "Account Information",
        createdAt: "Created At",
        updatedAt: "Last Updated"
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      },
      loading: "Loading...",
      error: "Error:"
    },
    changepass: {
      title: "Change Password",
      description: "Enter your current and new password to update your account",
      fields: {
        currentPassword: {
          label: "Current Password",
          placeholder: "Enter current password"
        },
        newPassword: {
          label: "New Password",
          placeholder: "Enter new password"
        },
        confirmPassword: {
          label: "Confirm New Password",
          placeholder: "Re-enter new password"
        }
      },
      button: {
        submit: "Change Password",
        loading: "Processing..."
      },
      success: "Password changed successfully!",
      errors: {
        requiredCurrent: "Please enter your current password",
        requiredNew: "Please enter your new password",
        minLength: "Password must be at least 8 characters",
        pattern: "Password must contain uppercase, lowercase letters and a number",
        requiredConfirm: "Please confirm your new password",
        notMatch: "Confirmation password does not match",
        changeError: "An error occurred while changing the password",
        wrongCurrent: "Current password is incorrect",
        tokenInvalid: "Token is invalid or expired. Please log in again.",
        tryAgain: "An error occurred while changing the password. Please try again."
      }
    },
    userProfilePage: {
      notFoundToken: "Token not found",
      notUpdatedAddress: "Address not updated",
      fetchError: "Unable to load profile information. Please try again later.",
      retry: "Retry",
      memberSince: "Member since {joinDate}",
      changePassword: "Change Password",
      cancel: "Cancel",
      edit: "Edit",
      name: "Full Name",
      email: "Email",
      phone: "Phone Number",
      address: "Address",
      joinDate: "Join Date",
      save: "Save Changes"
    },
    header: {
      brand: {
        short: "P",
        full: "Pet Nest"
      },
      search: {
        placeholder: "Search for products, brands, and more...",
        mobilePlaceholder: "Search for products..."
      },
      cart: {
        title: "Cart ({count} items)",
        empty: "Your cart is empty",
        viewCart: "View cart"
      },
      notifications: {
        title: "Notifications",
        viewAll: "View all notifications"
      },
      user: {
        login: "Login",
        signup: "Sign Up",
        myProfile: "My Profile",
        myOrders: "My Orders",
        wishlist: "Wishlist",
        settings: "Settings",
        requestSupport: "Request Support",
        logout: "Logout"
      },
      language: {
        vi: "VI",
        en: "EN"
      }
    },
    cart: {
      continueShopping: "Continue shopping",
      emptyTitle: "Cart is empty",
      emptyDesc: "You have no items in your cart",
      startShopping: "Start shopping",
      title: "Shopping Cart",
      productCount: "{count} items",
      selectAll: "Select all ({selected}/{total})",
      selectedTotal: "Selected total",
      selected: "✓ Selected",
      pricePerProduct: "{price} / item",
      selectedCount: "{count} items selected",
      addToFavorite: "Add to favorites",
      buyNow: "Buy now ({count})",
      error: "Error"
    },
    categoryPage: {
      breadcrumb: {
        home: "Home",
        products: "Products"
      },
      sidebar: {
        category: "Category",
        price: "Price",
        brand: "Brand",
        findBrandPlaceholder: "Find a brand",
        showLess: "Show less",
        showMore: "+ {count} more",
        customerRating: "Customer Rating"
      },
      sort: {
        results: "{count} Results",
        sortBy: "Sort By",
        relevance: "Relevance",
        priceLow: "Price: Low to High",
        priceHigh: "Price: High to Low",
        rating: "Customer Rating",
        newest: "Newest",
        bestselling: "Best Selling"
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      },
      product: {
        price: "${price}",
        addToWishlist: "Add to wishlist"
      }
    },
    productDetail: {
      uncategorized: "Uncategorized",
      quantity: "Quantity",
      addToCart: "Add to Cart",
      adding: "Adding...",
      outOfStock: "Out of stock",
      left: "Left:",
      freeShipping: "Free Shipping",
      warranty: "2 Year Warranty",
      returns: "30 Day Returns",
      customerReviews: "Customer Reviews",
      ratingOverview: "Rating Overview",
      basedOnReviews: "Based on {n} reviews",
      verifiedPurchase: "Verified Purchase",
      reviewImageAlt: "Review image",
      userFallback: "User",
      avatarFallback: "U",
      productNotFound: "Product not found",
      addToCartSuccess: "Product added to cart successfully!",
      addToCartFail: "Failed to add product to cart",
      quantityGreaterThanZero: "Quantity must be greater than 0",
      selectedVariantNotFound: "Selected variant not found",
      loading: "Loading...",
      errorFetching: "Error fetching product:",
      addToWishlist: "Add to wishlist",
      cancel: "Cancel",
      reviewForm: {
        title: "Write a Review",
        subtitle: "Share your experience with this product",
        rating: "Rating",
        titleField: "Review Title",
        titlePlaceholder: "Summarize your experience",
        comment: "Review",
        commentPlaceholder: "Tell us about your experience with this product...",
        images: "Images (optional)",
        submit: "Submit Review",
        submitting: "Submitting...",
        success: "Review submitted successfully!",
        error: "Failed to submit review. Please try again.",
        required: "This field is required",
        minRating: "Please select a rating",
        minCommentLength: "Review must be at least 10 characters long"
      },
      unreviewedSection: {
        title: "You purchased this product",
        subtitle: "Share your experience to help other customers",
        writeReview: "Write a Review",
        purchasedOn: "Purchased on {date}"
      }
    },
    bestSellingPage: {
      breadcrumb: {
        home: "Home",
        products: "Products"
      },
      sidebar: {
        category: "Category",
        price: "Price",
        min: "Min",
        max: "Max",
        brand: "Brand",
        findBrandPlaceholder: "Find a brand",
        showLess: "Show less",
        showMore: "+ {count} more",
        customerRating: "Customer Rating"
      },
      sort: {
        results: "{count} Results",
        sortBy: "Sort By",
        relevance: "Relevance",
        priceLow: "Price: Low to High",
        priceHigh: "Price: High to Low",
        rating: "Customer Rating",
        newest: "Newest",
        bestselling: "Best Selling"
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      },
      product: {
        price: "{price} ₫",
        addToWishlist: "Add to wishlist"
      },
      loading: "Loading...",
      error: {
        fetch: "Failed to fetch best-selling products",
        general: "An error occurred while fetching data"
      },
      searchPlaceholder: "Search by name or category..."
    },
    searchPage: {
      breadcrumb: {
        home: "Home",
        products: "Products"
      },
      sidebar: {
        category: "Category",
        all: "All",
        price: "Price",
        min: "Min",
        max: "Max",
        brand: "Brand",
        findBrandPlaceholder: "Find a brand",
        showLess: "Show less",
        showMore: "+ {count} more",
        customerRating: "Customer Rating"
      },
      sort: {
        results: "{count} Results",
        sortBy: "Sort By",
        relevance: "Relevance",
        priceLow: "Price: Low to High",
        priceHigh: "Price: High to Low",
        rating: "Customer Rating",
        newest: "Newest",
        bestselling: "Best Selling"
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      },
      product: {
        price: "{price}₫",
        addToWishlist: "Add to wishlist"
      }
    },
    statistics: {
      pageTitle: "Revenue & Profit Statistics",
      pageDescription: "Analyze product performance and revenue",
      filter: {
        title: "Filters",
        fromDate: "From date",
        toDate: "To date",
        sortBy: "Sort by",
        limit: "Display limit",
        top5: "Top 5",
        top10: "Top 10",
        top20: "Top 20",
        top50: "Top 50"
      },
      summary: {
        totalRevenue: "Total Revenue",
        totalProfit: "Total Profit",
        totalQuantity: "Total Quantity"
      },
      tabs: {
        bestSelling: "Best Selling Products",
        slowSelling: "Slow Selling Products",
        revenueOverTime: "Revenue Over Time"
      },
      bestSelling: {
        title: "Top Revenue Products",
        description: "List of products with highest revenue and profit"
      },
      slowSelling: {
        title: "Slow Selling Products",
        description: "List of products with lowest revenue"
      },
      revenueOverTime: {
        title: "Revenue Over Time",
        description: "Revenue chart over time",
        timePeriod: "Time period",
        byDay: "By day",
        byWeek: "By week",
        byMonth: "By month"
      },
      loading: "Loading data...",
      table: {
        product: "Product",
        quantity: "Quantity Sold",
        revenue: "Revenue",
        cost: "Cost",
        profit: "Profit",
        profitMargin: "Profit Margin",
        orderCount: "Order Count"
      }
    },
    userstatistics: {
      pageTitle: "User Management Dashboard",
      filter: "Filter",
      export: "Export report",
      totalUsers: "Total customers",
      currentMonthUsers: "Customers this month",
      potentialCustomers: "Potential customers",
      loyalCustomers: "Loyal customers",
      registrationStats: {
        title: "User Registration Statistics",
        description: "Track the number of user registrations over time",
        monthly: "Monthly",
        yearly: "Yearly"
      },
      tabs: {
        potential: "Potential Customers",
        topBuyers: "Top Buyers",
        cancellation: "Cancellation Analysis"
      },
      searchPlaceholder: "Search customers...",
      table: {
        customer: "Customer",
        email: "Email",
        phone: "Phone",
        createdAt: "Account Created",
        ranking: "Ranking",
        orders: "Orders",
        totalSpent: "Total Spent",
        avgOrder: "Avg/Order",
        totalOrders: "Total Orders",
        cancelledOrders: "Cancelled Orders",
        cancelRate: "Cancel Rate",
        mainReason: "Main Reason"
      },
      pagination: {
        show: "Show",
        of: "of",
        results: "results",
        page: "Page",
        previous: "Previous",
        next: "Next"
      },
      details: {
        cancellationTitle: "Customer Cancellation Details",
        cancellationDesc: "Detailed information about customers with high cancellation rates"
      }
    },
    voucherManagement: {
      title: "Voucher Management",
      addNewButton: "Add New Voucher",
      form: {
        addTitle: "Add New Voucher",
        editTitle: "Edit Voucher",
        fields: {
          code: "Voucher Code",
          discountAmount: "Discount Amount",
          discountPercent: "Discount Percent",
          validFrom: "Start Time",
          validTo: "End Time",
          usageLimit: "Usage Limit"
        },
        buttons: {
          cancel: "Cancel",
          add: "Create Voucher",
          save: "Update Voucher"
        }
      },
      search: {
        placeholder: "Search voucher..."
      },
      table: {
        headers: {
          no: "No.",
          code: "Voucher Code",
          discount: "Discount",
          validTime: "Validity Period",
          usage: "Usage",
          actions: "Actions"
        },
        validFrom: "From:",
        validTo: "To:",
        edit: "Edit",
        delete: "Delete"
      },
      error: {
        fetch: "Error loading voucher list",
        duplicateCode: "Voucher code already exists",
        invalidStartDate: "Start time must be today or later",
        create: "Error creating voucher",
        discountType: "Only one type of discount can be entered",
        update: "Error updating voucher",
        delete: "Error deleting voucher"
      },
      success: {
        create: "Voucher created successfully",
        update: "Voucher updated successfully",
        delete: "Voucher deleted successfully"
      },
      confirm: {
        delete: "Are you sure you want to delete this voucher?"
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      }
    },
    suportRequest: {
      pageTitle: "Support Request List",
      search: {
        placeholder: "Search by title, description...",
        statusPlaceholder: "Status",
        all: "All"
      },
      table: {
        headers: {
          no: "No.",
          title: "Title",
          description: "Description",
          createdAt: "Created Date",
          status: "Status",
          actions: "Actions"
        },
        noData: "No matching requests found."
      },
      status: {
        new: "New",
        processing: "Processing",
        resolved: "Resolved",
        rejected: "Rejected"
      },
      priority: {
        urgent: "Urgent",
        high: "High",
        normal: "Normal"
      },
      detail: {
        title: "Support Request Detail",
        fields: {
          title: "Title",
          noTitle: "(None)",
          content: "Content",
          status: "Status",
          priority: "Priority",
          handler: "Handler",
          noHandler: "(None)",
          createdAt: "Created At",
          updatedAt: "Updated At",
          response: "Response",
          internalNote: "Internal Note"
        },
        buttons: {
          save: "Save",
          cancel: "Cancel",
          close: "Close"
        },
        updateStatus: "Update status"
      },
      actions: {
        viewDetail: "View detail"
      },
      loading: "Loading data...",
      pagination: {
        previous: "Previous",
        next: "Next"
      }
    },
    checkout : {
      title: "Checkout",
      productTitle: "Product(s)",
      productDescription: "Review your products before checkout",
      productQuantity: "Qty: {item.quantity}",
      addressTitle: "Shipping Address",
      addressDescription: "Select a shipping address or add a new one",
      savedAddresses: "Saved Addresses",
      defaultAddress: "Default",
      editAddressTitle: "Edit Address",
      streetLabel: "Street",
      cityLabel: "City",
      stateLabel: "State/Province",
      postalCodeLabel: "Postal Code",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      addNewAddress: "Add New Address",
      addNewAddressTitle: "Add New Address",
      streetPlaceholder: "House number, street name",
      cityPlaceholder: "City",
      statePlaceholder: "State/Province",
      postalCodePlaceholder: "Postal Code",
      saveAddress: "Save Address",
      saveAndSetDefault: "Save & Set as Default",
      shippingTitle: "Shipping Method",
      shippingDescription: "Choose a suitable shipping method",
      shippingStandard: "Standard Shipping",
      shippingStandardDesc: "3-5 days - 30,000₫",
      shippingExpress: "Express Shipping",
      shippingExpressDesc: "1-2 days - 50,000₫",
      orderSummaryTitle: "Order Summary",
      subtotal: "Subtotal",
      shippingFee: "Shipping Fee",
      tax: "Tax (10%)",
      total: "Total",
      paymentTitle: "Payment Method",
      paymentDescription: "Select a payment method",
      paymentCreditCard: "Credit/Debit Card",
      paymentCreditCardDesc: "Visa, Mastercard, JCB",
      paymentCOD: "Cash on Delivery (COD)",
      paymentCODDesc: "Pay with cash",
      processing: "Processing...",
      placeOrder: "Place Order",
      errorSelectAddress: "Please select a shipping address!",
      errorSelectPayment: "Please select a payment method!",
      errorCreatePayment: "Unable to create payment. Please try again!",
      errorPlaceOrder: "An error occurred while placing the order!",
      errorUpdateAddress: "Failed to update address!"
    },
    orderManagement: {
        title: "Order Management",
        searchPlaceholder: "Search orders...",
        allStatus: "All Status",
        updateStatus: "Update status",
        updateSelected: "Update Selected",
        importCSV: "Import User with CSV",
        table: {
          no: "No",
          orderId: "Order ID",
          customer: "Customer",
          totalAmount: "Total Amount",
          status: "Status",
          date: "Date",
          actions: "Actions",
          viewDetails: "View Details",
          editOrder: "Edit Order"
        },
        pagination: {
          previous: "Previous",
          next: "Next"
        },
        form: {
          updateOrderStatus: "Update Order Status",
          orderStatus: "Order Status",
          saveChanges: "Save Changes",
          cancel: "Cancel"
        },
        detail: {
          orderItems: "Order Items",
          shippingAddress: "Shipping Address",
          orderInformation: "Order Information",
          createdAt: "Created At",
          lastUpdated: "Last Updated"
        },
        dialog: {
          cancelDetail: "Cancel Order Detail",
          returnDetail: "Return Order Detail",
          returnRequestDetail: "Return Request Detail",
          cancelRequestDetail: "Cancel Request Detail",
          orderDetail: "Order Detail"
        },
        return: {
          product: "Product:",
          quantity: "Quantity:",
          reason: "Reason:",
          noReason: "No reason",
          reject: "Reject",
          accept: "Accept",
          returnedSuccess: "Order has been returned successfully.",
          cancelled: "Order has been cancelled."
        },
        rejectReason: {
          title: "Reason for rejecting return",
          inputLabel: "Please enter the reason for rejection:",
          confirm: "Confirm rejection",
          close: "Close",
          reasonForOrder: "Reason for rejection for order #",
          noReasonProvided: "No reason provided."
        }
      
    },
    orderDashboard: {
      stats: {
        totalOrders: "Total Orders",
        noDataLastMonth: "No data from last month",
        percentFromLastMonth: "% from last month",
        totalRevenue: "Total Revenue",
        totalRevenueCompleted: "total revenue order completed",
        revenueCurrentMonth: "Revenue Current Month",
        noRevenueCurrentMonth: "No revenue current month",
        percentFromLastYear: "% from last year",
        revenueCurrentYear: "Revenue Current Years",
        noDataLastYear: "No data from last year"
      },
      recommendation: {
        title: "🤔 Which products should we import?",
        description: "AI-powered recommendations based on sales data, stock levels, and market trends",
        import: "Import",
        noImport: "No Import",
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
      charts: {
        monthlyOrders: "Monthly Orders",
        monthlyOrdersDesc: "Order volume by month",
        orders: "Orders",
        orderStatusDistribution: "Order Status Distribution",
        year: "Year",
        month: "Month",
        months: [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ],
        tooltip: "{name}: {value} orders"
      },
      tables: {
        bestSelling: "Top 5 Best-Selling Products",
        worstSelling: "Top 5 Worst-Selling Products",
        loading: "Loading...",
        name: "Name",
        brand: "Brand",
        price: "Price",
        sold: "Sold"
      },
      orderStatus: {
        pending: "Pending",
        processing: "Processing",
        shipping: "Shipping",
        cancelled: "Cancelled",
        completed: "Completed",
        returned: "Returned"
      }
    },
    manageProduct: {
      title: "Product Management",
      addNewButton: "Add New Product",
      editTitle: "Edit Product",
      search: {
        placeholder: "Search products..."
      },
      table: {
        headers: {
          no: "No.",
          name: "Name",
          brand: "Brand",
          description: "Description",
          categories: "Categories",
          actions: "Actions"
        }
      },
      form: {
        addTitle: "Add New Product",
        editTitle: "Edit Product",
        fields: {
          name: "Name",
          brand: "Brand",
          description: "Description",
          categories: "Categories",
          childCategory: "Child Category",
          grandchildCategory: "Grandchild Category"
        },
        buttons: {
          cancel: "Cancel",
          save: "Save Changes",
          add: "Add Product"
        },
        error: {
          requiredName: "Name and description are required",
          requiredCategory: "Please select at least one parent category",
          failedUpdate: "Failed to update product",
          failedCreate: "Failed to create product"
        }
      },
      variant: {
        title: "Manage Variants",
        addNewButton: "Add New Variant",
        editTitle: "Edit Variant",
        table: {
          headers: {
            no: "No.",
            attributes: "Attributes",
            sellPrice: "Sell Price",
            totalQuantity: "Total Quantity",
            images: "Images",
            actions: "Actions"
          }
        },
        form: {
          addTitle: "Add New Variant",
          editTitle: "Edit Variant",
          fields: {
            images: "Images",
            attributes: "Attributes",
            parentAttributes: "Parent Attributes",
            childAttributes: "Child Attributes",
            sellPrice: "Sell Price"
          },
          buttons: {
            cancel: "Cancel",
            save: "Update Variant",
            add: "Add Variant"
          },
          error: {
            requiredImage: "Please add at least one image",
            requiredParentAttr: "Please select a parent attribute",
            requiredChildAttr: "Please select a child attribute",
            requiredPrice: "Please enter a valid price",
            failedAdd: "Failed to add variant",
            failedUpdate: "Failed to update variant"
          }
        },
        deleteDialog: {
          title: "Delete Variant",
          content: "Are you sure you want to delete this variant? This action cannot be undone.",
          cancel: "Cancel",
          delete: "Delete"
        },
        empty: "No variants found for this product",
        loading: "Loading variants..."
      },
      import: {
        title: "Manage Import Batches",
        addNewButton: "Add New Import Batch",
        editTitle: "Edit Import Batch",
        table: {
          headers: {
            no: "No.",
            importDate: "Import Date",
            quantity: "Quantity",
            costPrice: "Cost Price",
            totalValue: "Total Value",
            actions: "Actions"
          }
        },
        form: {
          addTitle: "Add New Import Batch",
          editTitle: "Edit Import Batch",
          fields: {
            importDate: "Import Date",
            quantity: "Quantity",
            costPrice: "Cost Price"
          },
          buttons: {
            cancel: "Cancel",
            add: "Add Batch",
            save: "Update Batch"
          },
          error: {
            requiredQuantity: "Quantity must be greater than 0",
            requiredCostPrice: "Cost price must be greater than 0",
            failedAdd: "Failed to add import batch",
            failedUpdate: "Failed to update import batch"
          }
        },
        deleteDialog: {
          title: "Delete Import Batch",
          content: "Are you sure you want to delete this import batch? This action cannot be undone.",
          cancel: "Cancel",
          delete: "Delete"
        },
        empty: "No import batches found for this variant",
        loading: "Loading import batches...",
        summary: {
          totalQuantity: "Total Quantity",
          averageCostPrice: "Average Cost Price",
          totalInventoryValue: "Total Inventory Value",
          profitMargin: "Profit Margin"
        },
        sellPrice: {
          label: "Sell Price:",
          saving: "Saving..."
        }
      },
      deleteDialog: {
        title: "Delete Product",
        content: "Are you sure you want to delete this product? This action will also delete all its variants and cannot be undone.",
        cancel: "Cancel",
        delete: "Delete",
        deleting: "Deleting..."
      },
      pagination: {
        previous: "Previous",
        next: "Next"
      },
      loading: "Loading...",
      error: "Error:"
    },
    manaCategory: {
      title: "Category Management",
      addNewButton: "Add New Category",
      editTitle: "Edit Category",
      childCategoriesTitle: "Child Categories - {name}",
      table: {
        headers: {
          no: "No.",
          name: "Name",
          description: "Description",
          image: "Image",
          actions: "Actions"
        }
      },
      form: {
        name: "Name",
        description: "Description",
        image: "Category Image",
        cancel: "Cancel",
        save: "Save Changes",
        saving: "Saving...",
        add: "Add Category",
        adding: "Adding..."
      },
      dialog: {
        deleteTitle: "Delete Category",
        deleteContent: "Are you sure you want to delete this category? This action cannot be undone.",
        delete: "Delete",
        deleting: "Deleting...",
        close: "Close"
      },
      button: {
        manageChildren: "Manage Child Categories",
        edit: "Edit Category",
        delete: "Delete Category"
      },
      search: {
        placeholder: "Search categories..."
      },
      loading: "Loading...",
      loadingChildren: "Loading child categories...",
      noChildren: "No child categories found",
      uploading: "Uploading: {progress}%",
      error: "Error: {error}",
      errors: {
        nameRequired: "Name is required",
        updateFailed: "Failed to update category",
        createFailed: "Failed to create category",
        fetchChildrenFailed: "Failed to fetch child categories",
        deleteFailed: "Failed to delete category",
        fetchFailed: "Failed to fetch categories",
        saveFailed: "Failed to save category"
      }
    },
    manageAttribute: {
      title: "Attribute Management",
      addNewButton: "Add Attribute",
      editTitle: "Edit Attribute",
      deleteTitle: "Delete Attribute",
      deleteConfirm: "Are you sure you want to delete this attribute? This action cannot be undone.",
      delete: "Delete",
      deleting: "Deleting...",
      close: "Close",
      table: {
        headers: {
          no: "No.",
          value: "Value",
          description: "Description",
          categories: "Categories",
          actions: "Actions"
        }
      },
      search: {
        placeholder: "Search attributes..."
      },
      form: {
        value: "Value",
        description: "Description",
        parent: "Parent Attribute",
        categories: "Categories",
        noParent: "No parent",
        cancel: "Cancel",
        save: "Save",
        add: "Add Attribute",
        error: {
          requiredValue: "Value is required",
          failedSave: "Failed to save attribute",
          failedDelete: "Failed to delete attribute"
        }
      },
      child: {
        title: "Child Attributes of: {parent}",
        add: "Add Child Attribute",
        noChild: "No child attributes found",
        loading: "Loading child attributes..."
      },
      loading: "Loading...",
      error: "Error: {error}"
    },
    productOverview: {
      pageTitle: "Product Overview",
      pageDescription: "Detailed statistics about products in the store.",
      filter: {
        activeCategory: "Filtering by category:",
        clear: "Clear filter"
      },
      stats: {
        totalProducts: {
          title: "Total Products",
          description: "Total number of products available"
        },
        lowStock: {
          title: "Low Stock Products",
          description: "Number of variants with stock <= 10"
        }
      },
      charts: {
        byCategory: {
          title: "Products by Category",
          description: "Click a category to filter the whole page."
        },
        byBrand: {
          title: "Products by Brand"
        }
      },
      lowStockTable: {
        title: "Low Stock Products",
        searchPlaceholder: "Search low stock products...",
        columns: {
          image: "Image",
          name: "Product Name",
          quantity: "Remaining Quantity"
        }
      }
    },
      adminSidebar: {
        dashboard: "Dashboard",
        version: "v1.0.0",
        application: "Application",
        other: "Other",
        switchToEnglish: "Switch to English",
        switchToVietnamese: "Chuyển sang Tiếng Việt",
        userName: "John Doe", // hoặc để động
        userEmail: "john@example.com", // hoặc để động
        profile: "Profile",
        settings: "Settings",
        logout: "Log out",
        users: "Users",
        manageProduct: "Manage Product",
        manageCategory: "Manage Category",
        manageAttribute: "Manage Attribute",
        search: "Search"
      }
  };
  
  export default pagesConfig;
  