export const bans = [
  {
    id: 1,
    type: 'ban',
    player: 'Player123',
    steamId: 'STEAM_0:1:12345678',
    reason: 'Cheating - Aimbot detected',
    admin: 'Admin_Carlos',
    duration: 'Permanente',
    date: '2025-11-07 14:30',
    server: '[ARG - CS2] RETAKE #1',
    status: 'active'
  },
  {
    id: 2,
    type: 'ban',
    player: 'Hacker999',
    steamId: 'STEAM_0:1:99999999',
    reason: 'Wallhack',
    admin: 'Admin_Carlos',
    duration: 'Permanente',
    date: '2025-11-07 12:00',
    server: '[ARG - CS2] AUTOMIX #1',
    status: 'active'
  },
  {
    id: 3,
    type: 'ban',
    player: 'Cheater007',
    steamId: 'STEAM_0:1:77777777',
    reason: 'Aimbot + Triggerbot',
    admin: 'Admin_Juan',
    duration: '30 días',
    date: '2025-11-07 10:20',
    server: '[ARG - CS2] RETAKE #2',
    status: 'active'
  },
  {
    id: 4,
    type: 'ban',
    player: 'BadPlayer',
    steamId: 'STEAM_0:1:11111111',
    reason: 'Griefing - Team killing',
    admin: 'Admin_Maria',
    duration: '7 días',
    date: '2025-11-05 16:45',
    server: '[ARG - CS2] ARENA',
    status: 'active'
  },
  {
    id: 5,
    type: 'ban',
    player: 'Toxic_Kid',
    steamId: 'STEAM_0:0:55555555',
    reason: 'Multiple offenses',
    admin: 'Admin_Pedro',
    duration: '14 días',
    date: '2025-11-04 09:15',
    server: '[ARG - CS2] RETAKE #3',
    status: 'active'
  },
  {
    id: 6,
    type: 'ban',
    player: 'SpinBotter',
    steamId: 'STEAM_0:1:88888888',
    reason: 'Rage hacking',
    admin: 'Admin_Carlos',
    duration: 'Permanente',
    date: '2025-11-03 18:30',
    server: '[ARG - CS2] AUTOMIX #2',
    status: 'active'
  },
  {
    id: 7,
    type: 'ban',
    player: 'AFK_Master',
    steamId: 'STEAM_0:0:33333333',
    reason: 'AFK durante partidas',
    admin: 'Admin_Juan',
    duration: '3 días',
    date: '2025-11-02 14:20',
    server: '[ARG - CS2] AUTOMIX #1',
    status: 'active'
  },
  {
    id: 8,
    type: 'ban',
    player: 'OldCheater',
    steamId: 'STEAM_0:1:22222222',
    reason: 'Speedhack',
    admin: 'Admin_Juan',
    duration: '30 días',
    date: '2025-10-15 11:30',
    server: '[ARG - CS2] FFA DM',
    status: 'expired'
  }
];

export const mutes = [
  {
    id: 1,
    type: 'mute',
    player: 'ToxicPlayer',
    steamId: 'STEAM_0:0:54321000',
    reason: 'Spam en chat de voz',
    admin: 'Admin_Juan',
    duration: '24 horas',
    date: '2025-11-07 13:15',
    server: '[ARG - CS2] RETAKE #1',
    status: 'active'
  },
  {
    id: 2,
    type: 'mute',
    player: 'Rager456',
    steamId: 'STEAM_0:0:45678000',
    reason: 'Lenguaje ofensivo',
    admin: 'Admin_Maria',
    duration: '12 horas',
    date: '2025-11-07 11:45',
    server: '[ARG - CS2] AUTOMIX #1',
    status: 'active'
  },
  {
    id: 3,
    type: 'mute',
    player: 'Flamer99',
    steamId: 'STEAM_0:0:33333000',
    reason: 'Insultos a otros jugadores',
    admin: 'Admin_Carlos',
    duration: '48 horas',
    date: '2025-11-06 15:30',
    server: '[ARG - CS2] RETAKE #2',
    status: 'active'
  },
  {
    id: 4,
    type: 'mute',
    player: 'SpamBot',
    steamId: 'STEAM_0:0:66666000',
    reason: 'Spam de mensajes en texto',
    admin: 'Admin_Juan',
    duration: '6 horas',
    date: '2025-11-07 08:20',
    server: '[ARG - CS2] ARENA',
    status: 'active'
  },
  {
    id: 5,
    type: 'mute',
    player: 'MusicSpammer',
    steamId: 'STEAM_0:1:77777000',
    reason: 'Reproduciendo música en voz',
    admin: 'Admin_Pedro',
    duration: '24 horas',
    date: '2025-11-06 20:10',
    server: '[ARG - CS2] RETAKE #3',
    status: 'active'
  },
  {
    id: 6,
    type: 'mute',
    player: 'OldToxic',
    steamId: 'STEAM_0:0:88888000',
    reason: 'Acoso verbal',
    admin: 'Admin_Maria',
    duration: '24 horas',
    date: '2025-11-05 10:00',
    server: '[ARG - CS2] FFA DM',
    status: 'expired'
  }
];

export const getAllSanctions = () => {
  return [...bans, ...mutes].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const getActiveBansCount = () => bans.filter(b => b.status === 'active').length;
export const getActiveMutesCount = () => mutes.filter(m => m.status === 'active').length;