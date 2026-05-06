import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://djzczgabtbnxyyfguise.supabase.co'
const supabaseKey = 'sb_publishable_ja6fB1NeJq3kQ2ZTVzPZXA__ii6zj-0'

export const supabase = createClient(supabaseUrl, supabaseKey)