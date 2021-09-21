export interface Shared {
  user: string;
  access: Access;
}

type Access = 'edit' | 'view';
