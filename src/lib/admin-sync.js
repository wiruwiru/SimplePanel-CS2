import { db } from "@/lib/database"

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