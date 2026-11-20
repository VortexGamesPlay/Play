/** Amis, visites et cadeaux (Phase 6). Toutes les règles sont vérifiées par le serveur. */
import type { GameState } from '@core/types';
import { withSession } from './supabase';

export interface Friend { friend_id: string; name: string; dex: number; tower: number; wins: number; last_seen: string | null; gift_sent_today: boolean; gift_waiting: boolean }
export interface FriendCreature { uid: string; speciesId: string; mutations: string[]; hue: number; nickname: string | null; level: number; favorite: boolean }
export interface FriendSanctuary { name: string; sanctuary: Partial<GameState['sanctuary']>; creatures: FriendCreature[]; dex: number; creatureCount: number }

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const client = await withSession();
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const myFriendCode = () => rpc<string>('my_friend_code');
export const addFriend = (code: string) => rpc<string>('add_friend', { code });
export const removeFriend = (friend: string) => rpc<void>('remove_friend', { friend });
export const listFriends = () => rpc<Friend[]>('list_friends');
export const sendGift = (friend: string) => rpc<boolean>('send_gift', { friend });
export const claimGifts = () => rpc<number>('claim_gifts');
export const friendSanctuary = (friend: string) => rpc<FriendSanctuary | null>('friend_sanctuary', { friend });
