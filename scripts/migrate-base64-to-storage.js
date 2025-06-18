#!/usr/bin/env node

/**
 * Migration script to convert base64 images in questions to Supabase Storage
 * This script will:
 * 1. Find all questions with base64 images in media_url
 * 2. Upload each image to Supabase Storage
 * 3. Update the media_url with the new storage URL
 * 4. Keep a backup log of the migration
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Supabase configuration
const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
const STORAGE_BUCKET = 'question-media';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// Migration log
const migrationLog = {
  startTime: new Date().toISOString(),
  processedQuestions: [],
  errors: [],
  totalProcessed: 0,
  totalErrors: 0
};

/**
 * Convert base64 to buffer and detect image type
 */
function parseBase64Image(dataUrl) {
  const matches = dataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image format');
  }
  
  return {
    type: matches[1],
    buffer: Buffer.from(matches[2], 'base64')
  };
}

/**
 * Upload image to Supabase Storage
 */
async function uploadToStorage(imageBuffer, fileName, contentType) {
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${fileName}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString()
      },
      body: imageBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fileName}`;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Update question with new media URL
 */
async function updateQuestionMediaUrl(questionId, newUrl) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      media_url: newUrl
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Database update failed: ${response.status} - ${errorText}`);
  }
}

/**
 * Get all questions with base64 images
 */
async function getQuestionsWithBase64Images() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?media_url=like.data:image*&select=id,text,media_url`, {
    headers
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.status}`);
  }

  return await response.json();
}

/**
 * Process a single question
 */
async function processQuestion(question) {
  try {
    console.log(`Processing question ${question.id}: "${question.text.substring(0, 50)}..."`);
    
    // Parse base64 image
    const { type, buffer } = parseBase64Image(question.media_url);
    
    // Generate unique filename
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const fileName = `question-${question.id}-${hash}.${type}`;
    
    // Upload to storage
    console.log(`  Uploading ${fileName} (${buffer.length} bytes)`);
    const storageUrl = await uploadToStorage(buffer, fileName, `image/${type}`);
    
    // Update database
    console.log(`  Updating database with new URL: ${storageUrl}`);
    await updateQuestionMediaUrl(question.id, storageUrl);
    
    // Log success
    migrationLog.processedQuestions.push({
      questionId: question.id,
      questionText: question.text.substring(0, 100),
      originalSize: question.media_url.length,
      newUrl: storageUrl,
      fileName: fileName,
      processedAt: new Date().toISOString()
    });
    
    migrationLog.totalProcessed++;
    console.log(`  ✅ Successfully processed question ${question.id}`);
    
  } catch (error) {
    console.error(`  ❌ Error processing question ${question.id}:`, error.message);
    migrationLog.errors.push({
      questionId: question.id,
      questionText: question.text.substring(0, 100),
      error: error.message,
      errorAt: new Date().toISOString()
    });
    migrationLog.totalErrors++;
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  try {
    console.log('🚀 Starting base64 to storage migration...\n');
    
    // Get all questions with base64 images
    console.log('📋 Fetching questions with base64 images...');
    const questions = await getQuestionsWithBase64Images();
    console.log(`Found ${questions.length} questions to migrate\n`);
    
    if (questions.length === 0) {
      console.log('✅ No questions found with base64 images. Migration complete!');
      return;
    }
    
    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`\n[${i + 1}/${questions.length}] Processing question ${question.id}`);
      await processQuestion(question);
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Complete migration log
    migrationLog.endTime = new Date().toISOString();
    migrationLog.duration = new Date(migrationLog.endTime) - new Date(migrationLog.startTime);
    
    // Save migration log
    const logFileName = `migration-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const logPath = path.join(__dirname, logFileName);
    fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully processed: ${migrationLog.totalProcessed}`);
    console.log(`❌ Errors: ${migrationLog.totalErrors}`);
    console.log(`📄 Migration log saved to: ${logPath}`);
    
    if (migrationLog.totalErrors > 0) {
      console.log('\n⚠️  Some questions failed to migrate. Check the log file for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };