import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Single source of truth for turning a Supabase session into { user, profile } state.
  // Deactivated accounts are signed out here and never exposed as a truthy `user` —
  // this runs both from the initial getSession() and from onAuthStateChange, so a
  // deactivated account can't slip through via whichever one resolves first.
  async function establishSession(session) {
    if (!session?.user) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return { blocked: false }
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileRow?.is_active === false) {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setLoading(false)
      return { blocked: true }
    }

    setUser(session.user)
    setProfile(profileRow || null)
    setLoading(false)
    return { blocked: false }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => establishSession(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { establishSession(session) }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    return { data, error }
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) return { data, error }

    const { blocked } = await establishSession(data.session)
    if (blocked) {
      return { data: null, error: { message: 'Tu cuenta ha sido desactivada. Contacta a un administrador.' } }
    }

    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
