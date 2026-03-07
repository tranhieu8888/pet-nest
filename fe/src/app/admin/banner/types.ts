export interface Banner {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  status: "active" | "inactive";
  startDate: string;
  endDate?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerSubmitData {
  title: string;
  description?: string;
  image?: File;
  status: "active" | "inactive";
  startDate: string;
  endDate?: string;
  link?: string;
}
