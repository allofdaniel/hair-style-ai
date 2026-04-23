const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lxbdegbsriisiekvnpbk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET_NAME = 'hairstyles';

async function ensureBucketExists() {
  console.log('Checking if bucket exists...');

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    return false;
  }

  const bucketExists = buckets.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/gif', 'image/jpeg', 'image/png', 'image/webp']
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }
    console.log('Bucket created successfully!');
  } else {
    console.log('Bucket already exists');
  }

  return true;
}

// Convert Korean filename to URL-safe slug
function toSafeFilename(filename) {
  // Remove extension
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);

  // Replace Korean text with transliterated/URL-encoded version
  // For simplicity, we'll encode non-ASCII characters
  const safeName = encodeURIComponent(name)
    .replace(/%20/g, '-')
    .replace(/%/g, '_');

  return safeName + ext;
}

async function uploadFile(localPath, remotePath, mimeType) {
  const fileBuffer = fs.readFileSync(localPath);

  // Make the remote path URL-safe
  const pathParts = remotePath.split('/');
  const safePath = pathParts.map((part, idx) => {
    if (idx === pathParts.length - 1) {
      return toSafeFilename(part);
    }
    return part;
  }).join('/');

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(safePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    console.error(`Error uploading ${safePath}:`, error.message);
    return { success: false, safePath };
  }

  // Store mapping for later use
  fileMapping[remotePath] = safePath;

  return { success: true, safePath };
}

function getRemotePath(localPath, baseDir) {
  const relativePath = path.relative(baseDir, localPath);
  // Convert Windows backslashes to forward slashes and normalize
  return relativePath.replace(/\\/g, '/');
}

async function uploadDirectory(dirPath, remotePrefix, mimeType) {
  const files = fs.readdirSync(dirPath);
  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const result = await uploadDirectory(fullPath, `${remotePrefix}/${file}`, mimeType);
      uploaded += result.uploaded;
      failed += result.failed;
    } else {
      const ext = path.extname(file).toLowerCase();
      let fileMimeType = mimeType;

      if (ext === '.gif') fileMimeType = 'image/gif';
      else if (ext === '.jpg' || ext === '.jpeg') fileMimeType = 'image/jpeg';
      else if (ext === '.png') fileMimeType = 'image/png';
      else continue;

      const remotePath = `${remotePrefix}/${file}`;
      process.stdout.write(`Uploading: ${file}... `);

      const result = await uploadFile(fullPath, remotePath, fileMimeType);
      if (result.success) {
        console.log(`OK -> ${result.safePath}`);
        uploaded++;
      } else {
        console.log('FAILED');
        failed++;
      }
    }
  }

  return { uploaded, failed };
}

// Store mapping of original paths to safe paths
const fileMapping = {};

async function main() {
  console.log('=== Supabase Image Upload Script ===\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Bucket: ${BUCKET_NAME}\n`);

  // Ensure bucket exists
  const bucketReady = await ensureBucketExists();
  if (!bucketReady) {
    console.error('Failed to setup bucket');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');

  // Upload GIF files
  console.log('\n=== Uploading GIF files ===');
  const gifDir = path.join(projectRoot, 'hairstyle-images', 'gif');
  if (fs.existsSync(gifDir)) {
    const gifResult = await uploadDirectory(gifDir, 'gif', 'image/gif');
    console.log(`GIF: ${gifResult.uploaded} uploaded, ${gifResult.failed} failed`);
  } else {
    console.log('GIF directory not found');
  }

  // Upload JPG files from hairstyle-images (Korean names)
  console.log('\n=== Uploading reference JPGs (Korean names) ===');
  const refDir = path.join(projectRoot, 'hairstyle-images');
  if (fs.existsSync(refDir)) {
    const jpgFiles = fs.readdirSync(refDir).filter(f => f.endsWith('.jpg'));
    let uploaded = 0;
    let failed = 0;

    for (const file of jpgFiles) {
      const fullPath = path.join(refDir, file);
      const remotePath = `reference/${file}`;
      process.stdout.write(`Uploading: ${file}... `);

      const result = await uploadFile(fullPath, remotePath, 'image/jpeg');
      if (result.success) {
        console.log(`OK -> ${result.safePath}`);
        uploaded++;
      } else {
        console.log('FAILED');
        failed++;
      }
    }
    console.log(`Reference JPGs: ${uploaded} uploaded, ${failed} failed`);
  }

  // Upload public/hairstyles
  console.log('\n=== Uploading public hairstyles ===');
  const publicDir = path.join(projectRoot, 'public', 'hairstyles');
  if (fs.existsSync(publicDir)) {
    const publicResult = await uploadDirectory(publicDir, 'thumbnails', 'image/jpeg');
    console.log(`Public hairstyles: ${publicResult.uploaded} uploaded, ${publicResult.failed} failed`);
  } else {
    console.log('Public hairstyles directory not found');
  }

  console.log('\n=== Upload Complete ===');
  console.log(`\nPublic URL format: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/<path>`);

  // Save the mapping to a JSON file
  const mappingPath = path.join(__dirname, 'supabase-file-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(fileMapping, null, 2));
  console.log(`\nFile mapping saved to: ${mappingPath}`);
  console.log(`Total files mapped: ${Object.keys(fileMapping).length}`);
}

main().catch(console.error);
