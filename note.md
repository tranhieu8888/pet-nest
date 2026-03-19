1) pets
Lưu thông tin thú cưng của khách hàng.
{
  _id: ObjectId,
  customerId: ObjectId, // ref users, role = 1
  name: "Milu",
  type: "dog", // dog | cat
  breed: "Poodle",
  gender: "female", // male | female | unknown
  age: 2,
  weight: 4.5,
  note: "Bé hơi nhát, sợ tiếng máy sấy",
  createdAt: ISODate(),
  updatedAt: ISODate()
}
Ý nghĩa
- 1 customer có thể có nhiều thú cưng
- khi đặt lịch spa, customer chọn 1 pet từ collection này

2) spa_services
Lưu dịch vụ spa.
{
  _id: ObjectId,
  name: "Cắt tỉa lông thú cưng",
  slug: "cat-tia-long-thu-cung",
  category: "grooming", // spa | cleaning | grooming | coloring
  description: "Cắt tỉa lông gọn gàng cho chó mèo",
  petTypes: ["dog", "cat"],
  price: 150000,
  durationMinutes: 60,
  isActive: true,
  createdBy: ObjectId, // admin
  updatedBy: ObjectId,
  createdAt: ISODate(),
  updatedAt: ISODate()
}

3) spa_bookings
Lưu lịch đặt spa.
{
  _id: ObjectId,
  bookingCode: "SPA001",
  customerId: ObjectId, // ref users, role = 1
  petId: ObjectId,      // ref pets
  serviceId: ObjectId,  // ref spa_services
  staffId: ObjectId,    // ref users, role = 2
  customerSnapshot: {
    name: "Nguyễn Phú Anh",
    phone: "0862126326",
    email: "phuanhpro11@gmail.com"
  },
  petSnapshot: {
    name: "Milu",
    type: "dog",
    breed: "Poodle",
    age: 2,
    weight: 4.5,
    note: "Bé hơi nhát"
  },
  serviceSnapshot: {
    name: "Cắt tỉa lông thú cưng",
    category: "grooming",
    price: 150000,
    durationMinutes: 60
  },
  staffSnapshot: {
    name: "Phú Anh",
    phone: "0912345678"
  },
  appointmentDate: ISODate("2026-03-20"),
  appointmentTime: "09:00",
  status: "pending",
  // pending | confirmed | completed | cancelled
  paymentStatus: "unpaid",
  // unpaid | paid
  note: "Làm nhẹ nhàng, bé sợ tiếng ồn",
  createdAt: ISODate(),
  updatedAt: ISODate()
}

Quan hệ giữa các collection
users
Dùng bảng sẵn có:
- admin quản lý dịch vụ
- customer tạo pet và đặt lịch
- staff nhận lịch chăm sóc

pets
- thuộc về customer
- dùng cho booking

spa_services
- dịch vụ được admin tạo

spa_bookings
- nối customer + pet + service + staff