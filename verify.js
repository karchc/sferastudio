// COMMENTED OUT - Test script to verify table names and structure
// const { createClient } = require("@supabase/supabase-js");
// require("dotenv").config({ path: ".env.local" });

// async function verifyTables() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (\!SUPABASE_URL || \!SUPABASE_ANON_KEY) {
    console.log("Missing Supabase credentials in .env.local");
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Table names we expect to have
  const tablesToCheck = [
    "answers",
    "match_items",
    "sequence_items",
    "drag_drop_items",
    "questions",
    "test_questions",
    "tests"
  ];
  
  console.log("Checking table existence and counts:");
  console.log("-----------------------------------");
  
  for (const tableName of tablesToCheck) {
    try {
      // First check if the table exists by trying to count records
      const { count, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });
        
      if (error) {
        console.log(`❌ Table ${tableName}: Error - ${error.message}`);
      } else {
        console.log(`✅ Table ${tableName}: ${count} records found`);
        
        // Check a sample record to confirm structure
        const { data: sample, error: sampleError } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);
          
        if (\!sampleError && sample && sample.length > 0) {
          console.log(`   Sample fields: ${Object.keys(sample[0]).join(", ")}`);
        }
      }
    } catch (e) {
      console.log(`❌ Table ${tableName}: Exception - ${e.message}`);
    }
  }
// }

// verifyTables().catch(console.error);
