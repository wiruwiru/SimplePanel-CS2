import { db } from "@/lib/database"

let syncAllServersAdminsLock = false

export async function syncGroupFlagsToAdmins(groupId, oldGroupFlags = [], oldGroupImmunity = null) {
  try {
    const groupData = await db.query(
      `SELECT immunity FROM sa_groups WHERE id = ?`,
      [groupId]
    )
    const newGroupImmunity = groupData[0]?.immunity || 0

    const groupFlags = await db.query(
      `SELECT flag FROM sa_groups_flags WHERE group_id = ?`,
      [groupId]
    )
    const newGroupFlags = groupFlags.map(gf => gf.flag)

    const adminsInGroup = await db.query(
      `SELECT DISTINCT id, immunity FROM sa_admins WHERE group_id = ?`,
      [groupId]
    )

    for (const adminRow of adminsInGroup) {
      const adminId = Number(adminRow.id)
      const currentAdminImmunity = Number(adminRow.immunity) || 0

      const currentAdminFlags = await db.query(
        `SELECT flag FROM sa_admins_flags WHERE admin_id = ?`,
        [adminId]
      )
      const currentFlags = currentAdminFlags.map(af => af.flag)

      const customFlags = currentFlags.filter(flag => !oldGroupFlags.includes(flag))

      const hasCustomImmunity = oldGroupImmunity !== null && currentAdminImmunity !== Number(oldGroupImmunity)

      await db.query(`DELETE FROM sa_admins_flags WHERE admin_id = ?`, [adminId])

      const allFlagsToAdd = [...new Set([...newGroupFlags, ...customFlags])]
      for (const flag of allFlagsToAdd) {
        await db.query(
          `INSERT INTO sa_admins_flags (admin_id, flag) VALUES (?, ?)`,
          [adminId, flag]
        )
      }

      if (!hasCustomImmunity) {
        await db.query(
          `UPDATE sa_admins SET immunity = ? WHERE id = ?`,
          [newGroupImmunity, adminId]
        )
      }
    }

    return { success: true, updated: adminsInGroup.length }
  } catch (error) {
    console.error("Error syncing group flags to admins:", error)
    throw error
  }
}

export async function syncAdminFlagsWithGroup(adminId, groupId, customFlags = [], customImmunity = null) {
  try {
    let groupFlags = []
    let groupImmunity = null

    if (groupId) {
      const groupFlagsResult = await db.query(
        `SELECT flag FROM sa_groups_flags WHERE group_id = ?`,
        [groupId]
      )
      groupFlags = groupFlagsResult.map(gf => gf.flag)

      const groupData = await db.query(
        `SELECT immunity FROM sa_groups WHERE id = ?`,
        [groupId]
      )
      groupImmunity = groupData[0]?.immunity || 0
    }

    await db.query(`DELETE FROM sa_admins_flags WHERE admin_id = ?`, [adminId])

    const allFlags = [...new Set([...groupFlags, ...customFlags])]
    for (const flag of allFlags) {
      await db.query(
        `INSERT INTO sa_admins_flags (admin_id, flag) VALUES (?, ?)`,
        [adminId, flag]
      )
    }

    if (customImmunity === null && groupImmunity !== null) {
      await db.query(
        `UPDATE sa_admins SET immunity = ? WHERE id = ?`,
        [groupImmunity, adminId]
      )
    } else if (customImmunity !== null) {
      await db.query(
        `UPDATE sa_admins SET immunity = ? WHERE id = ?`,
        [customImmunity, adminId]
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Error syncing admin flags with group:", error)
    throw error
  }
}

export async function syncServerGroupAdmins(serverGroupId, oldServerIds = [], newServerIds = []) {
  try {
    if (oldServerIds.length === 0) {
      const groupServers = await db.query(
        `SELECT server_id FROM sp_server_group_servers WHERE server_group_id = ?`,
        [serverGroupId]
      )
      oldServerIds = groupServers.map(s => Number(s.server_id))
    }

    if (newServerIds.length === 0) {
      const groupServers = await db.query(
        `SELECT server_id FROM sp_server_group_servers WHERE server_group_id = ?`,
        [serverGroupId]
      )
      newServerIds = groupServers.map(s => Number(s.server_id))
    }

    const oldServerIdsSorted = [...oldServerIds].sort()
    const newServerIdsSorted = [...newServerIds].sort()

    const allAdmins = await db.query(`
      SELECT DISTINCT player_steamid, player_name, group_id, immunity
      FROM sa_admins
      WHERE player_steamid != 0
    `)

    const adminsInGroup = []
    
    for (const admin of allAdmins) {
      const steamId = String(admin.player_steamid)
      
      const adminServers = await db.query(
        `SELECT DISTINCT server_id FROM sa_admins WHERE player_steamid = ? AND server_id IS NOT NULL`,
        [steamId]
      )
      const adminServerIds = adminServers.map(s => Number(s.server_id)).sort()
      
      const adminServerIdsSorted = [...adminServerIds].sort()
      if (oldServerIdsSorted.length > 0 && adminServerIdsSorted.length === oldServerIdsSorted.length && adminServerIdsSorted.every((id, idx) => id === oldServerIdsSorted[idx])) {
        adminsInGroup.push({
          steamId: steamId,
          name: admin.player_name,
          groupId: admin.group_id ? Number(admin.group_id) : null,
          immunity: admin.immunity,
          currentServerIds: adminServerIds
        })
      }
    }

    for (const admin of adminsInGroup) {
      const adminRecord = await db.query(
        `SELECT id, flags FROM (
          SELECT sa.id, GROUP_CONCAT(saf.flag) as flags
          FROM sa_admins sa
          LEFT JOIN sa_admins_flags saf ON sa.id = saf.admin_id
          WHERE sa.player_steamid = ?
          GROUP BY sa.id
          LIMIT 1
        ) as admin_flags`,
        [admin.steamId]
      )

      const flags = adminRecord[0]?.flags ? adminRecord[0].flags.split(',') : []
      const sampleAdminId = adminRecord[0]?.id

      const addedServers = newServerIds.filter(serverId => !oldServerIds.includes(serverId))
      for (const serverId of addedServers) {
        const existing = await db.query(
          `SELECT id FROM sa_admins WHERE player_steamid = ? AND server_id = ?`,
          [admin.steamId, serverId]
        )

        if (!existing || existing.length === 0) {
          const result = await db.query(
            `INSERT INTO sa_admins (player_name, player_steamid, immunity, server_id, ends, group_id, created)
             VALUES (?, ?, ?, ?, NULL, ?, NOW())`,
            [admin.name, admin.steamId, admin.immunity || 0, serverId, admin.groupId]
          )

          const newAdminId = Number(result.insertId)
          if (sampleAdminId) {
            await syncAdminFlagsWithGroup(newAdminId, admin.groupId, flags, admin.immunity)
          }
        }
      }

      const removedServers = oldServerIds.filter(serverId =>
        !newServerIds.includes(serverId)
      )

      if (removedServers.length > 0) {
        await db.query(
          `DELETE FROM sa_admins 
           WHERE player_steamid = ? AND server_id IN (${removedServers.map(() => '?').join(',')})`,
          [admin.steamId, ...removedServers]
        )
      }
    }

    return { success: true, updated: adminsInGroup.length }
  } catch (error) {
    console.error("Error syncing server group admins:", error)
    throw error
  }
}

export async function syncAllServersAdmins(newServerId = null) {
  if (syncAllServersAdminsLock) {
    return { success: true, updated: 0, skipped: true, reason: "Already running" }
  }

  syncAllServersAdminsLock = true

  try {
    const allServers = await db.query(`SELECT id FROM sa_servers`)
    const allServerIds = allServers.map(s => Number(s.id))

    if (allServerIds.length === 0) {
      syncAllServersAdminsLock = false
      return { success: true, updated: 0 }
    }

    const allAdmins = await db.query(`
      SELECT DISTINCT player_steamid, player_name, group_id, immunity
      FROM sa_admins
      WHERE player_steamid != 0
    `)

    const allServersAdmins = []

    for (const admin of allAdmins) {
      const steamId = String(admin.player_steamid)
      
      const adminServers = await db.query(
        `SELECT DISTINCT server_id FROM sa_admins WHERE player_steamid = ? AND server_id IS NOT NULL`,
        [steamId]
      )
      const adminServerIds = adminServers.map(s => Number(s.server_id))
      const allServerIdsSorted = [...allServerIds].sort()
      const adminServerIdsSorted = [...adminServerIds].sort()
      
      if (adminServerIds.length > 0) {
        const hasAllServers = adminServerIdsSorted.length === allServerIdsSorted.length && adminServerIdsSorted.every((id, idx) => id === allServerIdsSorted[idx])

        const hasAllExceptNew = newServerId && adminServerIds.length === allServerIds.length - 1 && !adminServerIds.includes(newServerId) && allServerIds.filter(id => id !== newServerId).every(id => adminServerIds.includes(id))

        const missingCount = allServerIds.length - adminServerIds.length
        const hasAlmostAllServers = missingCount > 0 && missingCount <= Math.max(1, Math.floor(allServerIds.length * 0.05)) && adminServerIds.length >= Math.floor(allServerIds.length * 0.95) && allServerIds.filter(id => !adminServerIds.includes(id)).length === missingCount

        if (hasAllServers || hasAllExceptNew || hasAlmostAllServers) {
          allServersAdmins.push({
            steamId: steamId,
            name: admin.player_name,
            groupId: admin.group_id ? Number(admin.group_id) : null,
            immunity: admin.immunity,
            currentServerIds: adminServerIds
          })
        }
      }
    }

    for (const admin of allServersAdmins) {
      const adminRecord = await db.query(
        `SELECT id, flags FROM (
          SELECT sa.id, GROUP_CONCAT(saf.flag) as flags
          FROM sa_admins sa
          LEFT JOIN sa_admins_flags saf ON sa.id = saf.admin_id
          WHERE sa.player_steamid = ?
          GROUP BY sa.id
          LIMIT 1
        ) as admin_flags`,
        [admin.steamId]
      )

      const flags = adminRecord[0]?.flags ? adminRecord[0].flags.split(',') : []
      const sampleAdminId = adminRecord[0]?.id

      const serversToCheck = newServerId ? [newServerId] : allServerIds

      const missingServers = serversToCheck.filter(serverId => 
        !admin.currentServerIds.includes(serverId)
      )

      for (const serverId of missingServers) {
        const existingCheck = await db.query(
          `SELECT id FROM sa_admins WHERE player_steamid = ? AND server_id = ? LIMIT 1`,
          [admin.steamId, serverId]
        )

        if (existingCheck && existingCheck.length > 0) {
          const existingAdminId = Number(existingCheck[0].id)
          if (sampleAdminId) {
            const existingFlags = await db.query(
              `SELECT COUNT(*) as count FROM sa_admins_flags WHERE admin_id = ?`,
              [existingAdminId]
            )

            if (existingFlags[0]?.count === 0) {
              await syncAdminFlagsWithGroup(existingAdminId, admin.groupId, flags, admin.immunity)
            }
          }
          continue
        }

        try {
          const result = await db.query(
            `INSERT INTO sa_admins (player_name, player_steamid, immunity, server_id, ends, group_id, created)
             VALUES (?, ?, ?, ?, NULL, ?, NOW())`,
            [admin.name, admin.steamId, admin.immunity || 0, serverId, admin.groupId]
          )

          const newAdminId = Number(result.insertId)
          if (sampleAdminId) {
            await syncAdminFlagsWithGroup(newAdminId, admin.groupId, flags, admin.immunity)
          }
        } catch (insertError) {
          const duplicateCheck = await db.query(
            `SELECT id FROM sa_admins WHERE player_steamid = ? AND server_id = ? LIMIT 1`,
            [admin.steamId, serverId]
          )

          if (duplicateCheck && duplicateCheck.length > 0) {
            const existingAdminId = Number(duplicateCheck[0].id)
            if (sampleAdminId) {
              const existingFlags = await db.query(
                `SELECT COUNT(*) as count FROM sa_admins_flags WHERE admin_id = ?`,
                [existingAdminId]
              )

              if (existingFlags[0]?.count === 0) {
                await syncAdminFlagsWithGroup(existingAdminId, admin.groupId, flags, admin.immunity)
              }
            }
          } else {
            console.warn(`Failed to insert admin permission for ${admin.steamId} on server ${serverId}:`, insertError.message)
          }
        }
      }
    }

    return { success: true, updated: allServersAdmins.length }
  } catch (error) {
    console.error("Error syncing all servers admins:", error)
    throw error
  } finally {
    syncAllServersAdminsLock = false
  }
}