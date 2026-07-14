export interface Manager {
  id: number;
  username: string;
  password: string;
  active: boolean;
  lastActive: Date;
  createdAt: Date;
}
