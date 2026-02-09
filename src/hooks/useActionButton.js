import { useState, useCallback, useRef } from 'react'

export function useActionButton(action, options = {}) {
  const { cooldownMs = 1000 } = options
  const [isLoading, setIsLoading] = useState(false)
  const [isCooldown, setIsCooldown] = useState(false)
  const cooldownTimeoutRef = useRef(null)
  const isLoadingRef = useRef(false)
  const isCooldownRef = useRef(false)

  isLoadingRef.current = isLoading
  isCooldownRef.current = isCooldown

  const actionRef = useRef(action)
  actionRef.current = action

  const execute = useCallback(async (...args) => {
    if (isLoadingRef.current || isCooldownRef.current) {
      return
    }

    try {
      setIsLoading(true)
      isLoadingRef.current = true
      await actionRef.current(...args)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
      
      setIsCooldown(true)
      isCooldownRef.current = true
      
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current)
      }
      
      cooldownTimeoutRef.current = setTimeout(() => {
        setIsCooldown(false)
        isCooldownRef.current = false
        cooldownTimeoutRef.current = null
      }, cooldownMs)
    }
  }, [cooldownMs])

  const cleanup = useCallback(() => {
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current)
      cooldownTimeoutRef.current = null
    }
  }, [])

  return {
    execute,
    isLoading,
    isDisabled: isLoading || isCooldown,
    cleanup
  }
}