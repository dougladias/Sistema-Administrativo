import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/user';

export function authorize(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !roles.includes(user.role as UserRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}