console.log("TESTE RODANDO")

import { supabase } from './supabase.js'

async function testConnection() {
  const { data, error } = await supabase
    .from('services')
    .select('*')

  console.log('SERVICES:', data)
  console.log('ERROR:', error)
}

testConnection()