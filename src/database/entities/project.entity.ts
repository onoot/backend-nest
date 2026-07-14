export interface Project {
  id: number;
  name: string;
  description: string;
  photo: string;
  visible: boolean;
  sort: number;
  projectCategoryId: number | null;
}
