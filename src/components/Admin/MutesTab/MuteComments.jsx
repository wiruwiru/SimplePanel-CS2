"use client"

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Plus, Pencil, Trash2 } from 'lucide-react'
import { useI18n } from "@/contexts/I18nContext"
import { Button } from "@/components/UI/button"
import { useAuth } from "@/contexts/AuthContext"
import { formatDate } from "@/utils/formatters"
import { addToast } from "@heroui/react"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/UI/alert-dialog"

export function MuteComments({ muteId }) {
  const { t } = useI18n()
  const { user, hasFlag } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editComment, setEditComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteAlert, setDeleteAlert] = useState({ open: false, comment: null })
  const apiPath = '/api/admin/sanctions/mutes/comments'

  const fetchComments = useCallback(async () => {
    if (!muteId) return
    try {
      setLoading(true)
      const response = await fetch(`${apiPath}?muteId=${muteId}`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }, [muteId, apiPath])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  useEffect(() => {
    const handleShowAddForm = (event) => {
      if (event.detail.muteId === muteId) {
        setShowAddForm(true)
      }
    }
    window.addEventListener('showAddCommentForm', handleShowAddForm)
    return () => window.removeEventListener('showAddCommentForm', handleShowAddForm)
  }, [muteId])

  const addPermission = '@web/mute.comment.add'
  const deletePermission = '@web/mute.comment.delete'
  
  const canAddComment = user?.flags ? (user.flags.includes('@web/root') || user.flags.includes(addPermission)) : false

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          muteId: muteId,
          comment: newComment.trim()
        })
      })

      if (response.ok) {
        setNewComment('')
        setShowAddForm(false)
        await fetchComments()
        addToast({ title: t('admin_lists.comment_added_success'), color: 'success', variant: 'solid' })
      } else {
        const error = await response.json()
        addToast({ title: error.error || t('admin_lists.comment_add_error'), color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      addToast({ title: t('admin_lists.comment_add_error'), color: 'danger', variant: 'solid' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editComment.trim() || submitting) return

    try {
      setSubmitting(true)
      const response = await fetch(apiPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          comment: editComment.trim()
        })
      })

      if (response.ok) {
        setEditingId(null)
        setEditComment('')
        await fetchComments()
        addToast({ title: t('admin_lists.comment_updated_success'), color: 'success', variant: 'solid' })
      } else {
        const error = await response.json()
        addToast({ title: error.error || t('admin_lists.comment_update_error'), color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      addToast({ title: t('admin_lists.comment_update_error'), color: 'danger', variant: 'solid' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (comment) => {
    setDeleteAlert({ open: true, comment })
  }

  const handleDeleteConfirm = async () => {
    const comment = deleteAlert.comment
    if (!comment) return

    try {
      const response = await fetch(`${apiPath}?id=${comment.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchComments()
        addToast({ title: t('admin_lists.comment_deleted_success'), color: 'success', variant: 'solid' })
      } else {
        const error = await response.json()
        addToast({ title: error.error || t('admin_lists.comment_delete_error'), color: 'danger', variant: 'solid' })
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      addToast({ title: t('admin_lists.comment_delete_error'), color: 'danger', variant: 'solid' })
    } finally {
      setDeleteAlert({ open: false, comment: null })
    }
  }

  const startEdit = (comment) => {
    setEditingId(comment.id)
    setEditComment(comment.comment)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditComment('')
  }

  const canEditComment = (comment) => {
    if (!user?.steamId) return false
    return String(comment.admin_steamid) === String(user.steamId)
  }

  const canDelete = (comment) => {
    if (hasFlag('@web/root')) return true
    if (hasFlag(deletePermission)) return true
    const ownPermission = `${deletePermission}.own`
    if (hasFlag(ownPermission) && user?.steamId && String(comment.admin_steamid) === String(user.steamId)) {
      return true
    }
    
    return false
  }

  const formatCommentDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      let date
      if (typeof dateString === 'string') {
        date = new Date(dateString)
      } else if (dateString instanceof Date) {
        date = dateString
      } else {
        date = new Date(dateString)
      }
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString)
        return 'N/A'
      }
      return formatDate(date, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting comment date:', error, dateString)
      return 'N/A'
    }
  }

  const isCommentEdited = (comment) => {
    if (!comment.created_at || !comment.updated_at) return false
    try {
      const created = new Date(comment.created_at)
      const updated = new Date(comment.updated_at)
      
      if (isNaN(created.getTime()) || isNaN(updated.getTime())) return false
      
      const diff = Math.abs(updated.getTime() - created.getTime())
      return diff > 2000
    } catch {
      return false
    }
  }

  if (loading) {
    return null
  }

  if (comments.length === 0 && !showAddForm) {
    return null
  }

  return (
    <div className="mt-3 pt-3 border-t border-zinc-700" data-mute-id={muteId}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">{t('admin_lists.comments') || 'Comments'} ({comments.length})</span>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-3 p-3 bg-zinc-900 rounded border border-zinc-700">
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t('admin_lists.comment_placeholder') || 'Write a comment...'} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="3"/>
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() || submitting} className="bg-blue-600 hover:bg-blue-700 text-white">{t('common.save') || 'Save'}</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowAddForm(false); setNewComment('') }} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">{t('common.cancel') || 'Cancel'}</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="p-2.5 bg-zinc-900 rounded border border-zinc-700">
            {editingId === comment.id ? (
              <div>
                <textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows="3"/>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => handleEditComment(comment.id)} disabled={!editComment.trim() || submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {t('common.save') || 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.comment}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{comment.admin_name || 'Admin'}</span>
                    <span>•</span>
                    <span>{formatCommentDate(comment.created_at)}</span>
                    {isCommentEdited(comment) && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-600">{t('admin_lists.edited') || 'Edited'}</span>
                        <span>{formatCommentDate(comment.updated_at)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {canEditComment(comment) && (
                      <Button size="sm" variant="ghost" onClick={() => startEdit(comment)} className="h-6 px-2 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800">
                        <Pencil className="size-3" />
                      </Button>
                    )}
                    {canDelete(comment) && (
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(comment)} className="h-6 px-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800">
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {comments.length === 0 && !showAddForm && canAddComment && (
          <div className="text-center py-4 text-zinc-500 text-sm">
            {t('admin_lists.no_comments') || 'No comments'}
          </div>
        )}
      </div>

      <AlertDialog open={deleteAlert.open} onOpenChange={(open) => setDeleteAlert({ open, comment: null })}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">{t('admin_lists.delete_comment_confirm_title') || '¿Eliminar comentario?'}</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {t('admin_lists.delete_comment_confirm_description') || '¿Estás seguro de que deseas eliminar este comentario?'} {t('admin_lists.delete_comment_confirm_warning') || 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlert({ open: false, comment: null })} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}