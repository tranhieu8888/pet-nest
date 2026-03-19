export interface BlogImage {
  url: string;
  public_id: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  description: string;
  tag: string;
  image: BlogImage;
  createdAt: string;
  updatedAt?: string;
  views?: number;
}
