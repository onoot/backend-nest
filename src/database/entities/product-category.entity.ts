export interface ProductCategory {
  id: number;
  name: string;
  photo: string | null;
  parentId: number | null;
  sort: number;
  visible: boolean;
}
