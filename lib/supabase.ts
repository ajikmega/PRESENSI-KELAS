
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dycirnwgtclslzgpxylb.supabase.co';
const supabaseAnonKey = 'sb_publishable_LQmDYBCkIO4976_yXdzKqQ_vEfV5ltT'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
