export interface Blog {
  _id: string;
  title: string;
  description: string;
  tag: string;
  images: { url: string }[];
  createdAt: string;
}
