import { createClient } from '@supabase/supabase-js'

export const createSupabaseClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL as string
    const supabaseKey = process.env.SUPABASE_PRIVATE_KEY as string
    const supabase = createClient(supabaseUrl, supabaseKey)
    return supabase
}