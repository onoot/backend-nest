export interface Document {
  id: number;
  name: string;
  contentType: string;
  filename: string;
  visible: boolean;
  sort: number;
  productId: number | null;
}
