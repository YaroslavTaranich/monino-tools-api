import { createHash } from 'crypto';
import { User } from '../user/user.model';

export interface AdminProfile {
  id: number;
  name: string;
  role: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export function createSessionVersion(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex');
}

export function toAdminProfile(user: User): AdminProfile {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
  };
}
