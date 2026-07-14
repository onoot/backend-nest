export interface Review {
  id: number;
  name: string;
  photo: string | null;
  company: string;
  message: string;
  sort: number;
  visible: boolean;
}
