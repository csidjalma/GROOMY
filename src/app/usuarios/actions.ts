'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';

export interface Usuario {
  id: number;
  us_nome: string;
  us_login: string;
  us_senha: string;
  us_menu1: number;
  us_menu2: number;
  us_menu3: number;
  us_menu4: number;
  us_menu5: number;
  us_menu6: number;
  us_menu7: number;
  us_menu8: number;
  us_menu9: number;
  us_menu10: number;
  us_menu11: number;
  us_menu12: number;
  us_menu13: number;
  us_menu14: number;
  us_menu15: number;
  us_menu16: number;
  us_menu17: number;
  us_menu18: number;
  us_menu19: number;
  us_menu20: number;
  us_data: string | null;
  us_expira: number;
  us_periodo: number | null;
  usuario: string | null;
  altera: string | null;
}

// Simple Caesar Cipher (Shift +20) for legacy VFP compatibility
function encryptPassword(password: string): string {
  if (!password) return '';
  let result = '';
  for (let i = 0; i < password.length; i++) {
    result += String.fromCharCode(password.charCodeAt(i) + 20);
  }
  return result;
}

function decryptPassword(encrypted: string): string {
  if (!encrypted) return '';
  let result = '';
  for (let i = 0; i < encrypted.length; i++) {
    result += String.fromCharCode(encrypted.charCodeAt(i) - 20);
  }
  return result;
}

export async function getUsuarios(): Promise<Usuario[]> {
  try {
    const users = await query<Usuario[]>('SELECT * FROM usuarios ORDER BY us_nome ASC');
    return users.map(u => ({
      ...u,
      // We decrypt password for editing ease on screen
      us_senha: decryptPassword(u.us_senha)
    }));
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    throw new Error('Erro ao listar usuários');
  }
}

export async function createUsuario(data: Omit<Usuario, 'id' | 'altera' | 'usuario'>, currentUser: string) {
  try {
    const encryptedSenha = encryptPassword(data.us_senha);
    const sql = `
      INSERT INTO usuarios (
        us_nome, us_login, us_senha,
        us_menu1, us_menu2, us_menu3, us_menu4, us_menu5,
        us_menu6, us_menu7, us_menu8, us_menu9, us_menu10,
        us_menu11, us_menu12, us_menu13, us_menu14, us_menu15,
        us_menu16, us_menu17, us_menu18, us_menu19, us_menu20,
        us_data, us_expira, us_periodo, usuario, altera
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, NOW()
      )
    `;
    const params = [
      data.us_nome.toUpperCase(),
      data.us_login.toUpperCase(),
      encryptedSenha,
      data.us_menu1 ? 1 : 0,
      data.us_menu2 ? 1 : 0,
      data.us_menu3 ? 1 : 0,
      data.us_menu4 ? 1 : 0,
      data.us_menu5 ? 1 : 0,
      data.us_menu6 ? 1 : 0,
      data.us_menu7 ? 1 : 0,
      data.us_menu8 ? 1 : 0,
      data.us_menu9 ? 1 : 0,
      data.us_menu10 ? 1 : 0,
      data.us_menu11 ? 1 : 0,
      data.us_menu12 ? 1 : 0,
      data.us_menu13 ? 1 : 0,
      data.us_menu14 ? 1 : 0,
      data.us_menu15 ? 1 : 0,
      data.us_menu16 ? 1 : 0,
      data.us_menu17 ? 1 : 0,
      data.us_menu18 ? 1 : 0,
      data.us_menu19 ? 1 : 0,
      data.us_menu20 ? 1 : 0,
      data.us_data || null,
      data.us_expira ? 1 : 0,
      data.us_periodo || null,
      currentUser.toUpperCase()
    ];
    await query(sql, params);
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating usuario:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'Este login já está cadastrado.' };
    }
    return { success: false, error: 'Erro ao criar usuário.' };
  }
}

export async function updateUsuario(id: number, data: Omit<Usuario, 'id' | 'altera' | 'usuario'>, currentUser: string) {
  try {
    const encryptedSenha = encryptPassword(data.us_senha);
    const sql = `
      UPDATE usuarios SET
        us_nome = ?,
        us_login = ?,
        us_senha = ?,
        us_menu1 = ?, us_menu2 = ?, us_menu3 = ?, us_menu4 = ?, us_menu5 = ?,
        us_menu6 = ?, us_menu7 = ?, us_menu8 = ?, us_menu9 = ?, us_menu10 = ?,
        us_menu11 = ?, us_menu12 = ?, us_menu13 = ?, us_menu14 = ?, us_menu15 = ?,
        us_menu16 = ?, us_menu17 = ?, us_menu18 = ?, us_menu19 = ?, us_menu20 = ?,
        us_data = ?,
        us_expira = ?,
        us_periodo = ?,
        usuario = ?,
        altera = NOW()
      WHERE id = ?
    `;
    const params = [
      data.us_nome.toUpperCase(),
      data.us_login.toUpperCase(),
      encryptedSenha,
      data.us_menu1 ? 1 : 0,
      data.us_menu2 ? 1 : 0,
      data.us_menu3 ? 1 : 0,
      data.us_menu4 ? 1 : 0,
      data.us_menu5 ? 1 : 0,
      data.us_menu6 ? 1 : 0,
      data.us_menu7 ? 1 : 0,
      data.us_menu8 ? 1 : 0,
      data.us_menu9 ? 1 : 0,
      data.us_menu10 ? 1 : 0,
      data.us_menu11 ? 1 : 0,
      data.us_menu12 ? 1 : 0,
      data.us_menu13 ? 1 : 0,
      data.us_menu14 ? 1 : 0,
      data.us_menu15 ? 1 : 0,
      data.us_menu16 ? 1 : 0,
      data.us_menu17 ? 1 : 0,
      data.us_menu18 ? 1 : 0,
      data.us_menu19 ? 1 : 0,
      data.us_menu20 ? 1 : 0,
      data.us_data || null,
      data.us_expira ? 1 : 0,
      data.us_periodo || null,
      currentUser.toUpperCase(),
      id
    ];
    await query(sql, params);
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating usuario:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'Este login já está em uso.' };
    }
    return { success: false, error: 'Erro ao atualizar usuário.' };
  }
}

export async function deleteUsuario(id: number) {
  try {
    await query('DELETE FROM usuarios WHERE id = ?', [id]);
    revalidatePath('/usuarios');
    return { success: true };
  } catch (error) {
    console.error('Error deleting usuario:', error);
    return { success: false, error: 'Erro ao excluir usuário.' };
  }
}
