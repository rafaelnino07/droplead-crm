'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await getSupabaseServer()

    const email = String(formData.get('email'))
    const password = String(formData.get('password'))

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('LOGIN ERROR:', error)

        redirect(
            `/login?error=${encodeURIComponent(error.message)}`
        )
    }

    redirect('/onboarding')
}

export async function register(formData: FormData) {
    const supabase = await getSupabaseServer()

    const email = String(formData.get('email'))
    const password = String(formData.get('password'))

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error('REGISTER ERROR:', error)

        redirect(
            `/register?error=${encodeURIComponent(error.message)}`
        )
    }

    if (!data.session) {
        redirect(
            '/login?error=Usuario creado pero sin sesión activa'
        )
    }

    redirect('/dashboard')
}

export async function logout() {
    const supabase = await getSupabaseServer()

    await supabase.auth.signOut()

    redirect('/login')
}