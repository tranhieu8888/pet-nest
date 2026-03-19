export type Subscriber = {
  _id: string;
  email: string;
  status: "active" | "unsubscribed";
  createdAt: string;
  updatedAt?: string;
};
