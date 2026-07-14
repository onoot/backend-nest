export interface Product {
  id: number;
  sku: string;
  description: string;
  categoryId: number | null;
  sort: number;
  visible: boolean;
}
