export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithoutPassword {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}