import { usersApi } from '@/lib/api';

export const userService = {
  async getTotalUsers(): Promise<number> {
    try {
      const users = await usersApi.getAll();
      return users.length;
    } catch (error) {
      console.error('Error fetching users:', error);
      return 0;
    }
  },

  async getUserStats() {
    try {
      const users = await usersApi.getAll();
      const total = users.length;
      const active = users.filter(user => user.status === 'active').length;
      const inactive = total - active;
      
      return {
        total,
        active,
        inactive,
        activePercentage: Math.round((active / total) * 100) || 0
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        activePercentage: 0
      };
    }
  }
};
