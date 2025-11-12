CREATE TABLE IF NOT EXISTS `sp_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `steam_id` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `steam_id` (`steam_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `sp_visibility_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `server_id` bigint(20) unsigned NOT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `sp_server_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `color` varchar(7) DEFAULT '#6B7280',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `sp_server_group_servers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `server_group_id` int(11) NOT NULL,
  `server_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_server_in_group` (`server_group_id`, `server_id`),
  CONSTRAINT `fk_server_group` FOREIGN KEY (`server_group_id`) REFERENCES `sp_server_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_server` FOREIGN KEY (`server_id`) REFERENCES `sa_servers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `sp_permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `flag` varchar(255) NOT NULL UNIQUE,
  `description` varchar(500) NOT NULL,
  `is_custom` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `flag_unique` (`flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `sp_permissions` (`flag`, `description`, `is_custom`) VALUES
('@css/reservation', 'Reserved slot access.', 0),
('@css/generic', 'Generic admin.', 0),
('@css/kick', 'Kick other players.', 0),
('@css/ban', 'Ban other players.', 0),
('@css/unban', 'Remove bans.', 0),
('@css/vip', 'General VIP status.', 0),
('@css/slay', 'Slay/harm other players.', 0),
('@css/slap', 'Slap players', 0),
('@css/changemap', 'Change the map.', 0),
('@css/cvar', 'Change most cvars.', 0),
('@css/config', 'Execute config files.', 0),
('@css/chat', 'Special chat privileges.', 0),
('@css/vote', 'Start or create votes.', 0),
('@css/password', 'Set a password on the server.', 0),
('@css/rcon', 'Use RCON commands.', 0),
('@css/cheats', 'Change sv_cheats or use cheating commands.', 0),
('@css/root', 'Magically enables all flags and ignores immunity values.', 0),
('@css/permban', 'Ban other players for permanently.', 0),
('@css/permmute', 'Mute other players for permanently.', 0),
('@css/showip', 'Show players IP in css_who and css_players commands.', 0),

('@web/root', 'Full web access to all features', 0),
('@web/access', 'Access to admin panel', 0),

('@web/admin.create', 'Web-only: Permission to create an admin.', 0),
('@web/admin.edit', 'Web-only: Permission to edit an admin.', 0),
('@web/admin.delete', 'Web-only: Permission to delete an admin.', 0),

('@web/ban.view', 'Web-only: Permission to view bans.', 0),
('@web/ban.add', 'Web-only: Permission to create a ban.', 0),
('@web/ban.edit', 'Web-only: Permission to edit a ban.', 0),
('@web/ban.unban', 'Web-only: Permission to unban a user.', 0),
('@web/ban.remove', 'Web-only: Permission to remove ban record.', 0),
('@web/ban.edit.own', 'Web-only: Permission to edit own bans.', 0),
('@web/ban.unban.own', 'Web-only: Permission to unban own bans.', 0),
('@web/ban.remove.own', 'Web-only: Permission to remove own ban records.', 0),

('@web/mute.view', 'Web-only: Permission to view mutes.', 0),
('@web/mute.add', 'Web-only: Permission to create a mute.', 0),
('@web/mute.edit', 'Web-only: Permission to edit a mute.', 0),
('@web/mute.unmute', 'Web-only: Permission to unmute a user.', 0),
('@web/mute.remove', 'Web-only: Permission to remove mute record.', 0),
('@web/mute.edit.own', 'Web-only: Permission to edit own mutes.', 0),
('@web/mute.unmute.own', 'Web-only: Permission to unmute own mutes.', 0),
('@web/mute.remove.own', 'Web-only: Permission to remove own mute records.', 0),

('@web/group.create', 'Web-only: Permission to create a group.', 0),
('@web/group.edit', 'Web-only: Permission to edit a group.', 0),
('@web/group.delete', 'Web-only: Permission to delete a group.', 0),

('@web/search.players', 'Web-only: Permission to search players and IPs.', 0),
('@web/chatlogs.view', 'Web-only: Permission to view chatlogs.', 0)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);