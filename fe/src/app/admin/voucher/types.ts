export interface Voucher {
  _id: string;
  code: string;
  discountAmount: number;
  discountPercent: number;
  minOrderValue: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isDelete: boolean;
  createdAt?: string;
  updatedAt?: string;
}