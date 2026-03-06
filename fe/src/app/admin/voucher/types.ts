export interface Voucher {
  _id: string;
  code: string;
  discountAmount?: number;
  discountPercent?: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  minOrderValue?: number;
  isActive: boolean;
}
