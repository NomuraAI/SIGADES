import { supabase } from '../integrations/supabase/client';
import { User } from '../types';

export const userService = {
  /**
   * Mengambil user berdasarkan username dan password.
   * Karena ini bersifat statis/demo, kita melakukan pengecekan langsung.
   */
  async login(username: string, password: string): Promise<User | null> {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
      console.log(`Attempting login for: ${cleanUsername}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanUsername)
        .eq('password', cleanPassword)
        .maybeSingle();

      if (error) {
        console.error('Database Auth Error:', error.message);
        return null;
      }

      if (!data) {
        console.warn('Login failed: No user found with those credentials.');
        return null;
      }

      return {
        id: data.id,
        username: data.username,
        role: data.role,
        name: data.name
      } as User;
    } catch (err) {
      console.error('Auth Service Exception:', err);
      return null;
    }
  }
};
