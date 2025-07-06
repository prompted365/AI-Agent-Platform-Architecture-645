import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://enqtippieycwkdxbiitj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucXRpcHBpZXljd2tkeGJpaXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzQwMzUsImV4cCI6MjA2NzQxMDAzNX0.8XKJWiBsKveYlfep8vuf4vdGLmypajusQZ-d-L5Dpoc'

if(SUPABASE_URL == 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY == '<ANON_KEY>' ){
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})