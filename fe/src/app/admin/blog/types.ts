export interface BlogImage {
  url: string;
  public_id: string;
}

export interface Blog {
  _id: string;
  title: string;
  description: string;
  tag: string;
  images: BlogImage[];
  createdAt: string;
}
