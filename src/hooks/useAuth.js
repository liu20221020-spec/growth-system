import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(undefined) // undefined = 加载中

  useEffect(() => {
    // 初始 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    // 监听 auth 变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    user: session?.user ?? null,
    loading: session === undefined,
  }
}
