const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGES_DIR = path.join(__dirname, 'images');

// Ensure sharp is installed
try {
    require.resolve('sharp');
} catch (e) {
    console.log('sharp library is not installed. Installing sharp locally...');
    try {
        execSync('npm install sharp --no-save', { stdio: 'inherit' });
        console.log('sharp installed successfully!\n');
    } catch (err) {
        console.error('Failed to install sharp. Please run "npm install sharp" manually.', err);
        process.exit(1);
    }
}

const sharp = require('sharp');

async function main() {
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`Images directory not found at: ${IMAGES_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(IMAGES_DIR);
    console.log(`Found ${files.length} items in images directory.`);
    
    let totalBytesBefore = 0;
    let totalBytesAfter = 0;

    for (const file of files) {
        const filePath = path.join(IMAGES_DIR, file);
        const stat = fs.statSync(filePath);
        
        if (!stat.isFile()) continue;

        const ext = path.extname(file).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
            continue; // Skip other files like .webp or logos if we want
        }

        // Skip logo.png as it's already tiny and has transparency requirements
        if (file === 'logo.png') {
            console.log(`[Skipping] ${file} (Logo)`);
            continue;
        }

        const sizeBefore = stat.size;
        totalBytesBefore += sizeBefore;

        const tempFilePath = path.join(IMAGES_DIR, `temp_${file}`);
        
        try {
            console.log(`[Optimizing] ${file} (${(sizeBefore / 1024).toFixed(1)} KB)...`);
            
            let pipeline = sharp(filePath);
            
            if (ext === '.jpg' || ext === '.jpeg') {
                pipeline = pipeline.jpeg({
                    quality: 82,
                    progressive: true,
                    mozjpeg: true
                });
            } else if (ext === '.png') {
                pipeline = pipeline.png({
                    quality: 80,
                    compressionLevel: 9,
                    palette: true
                });
            }

            await pipeline.toFile(tempFilePath);
            
            const sizeAfter = fs.statSync(tempFilePath).size;
            totalBytesAfter += sizeAfter;

            // Replace original file with optimized
            fs.unlinkSync(filePath);
            fs.renameSync(tempFilePath, filePath);

            const savedPercent = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1);
            console.log(`[Done] ${file}: ${(sizeBefore / 1024).toFixed(1)} KB -> ${(sizeAfter / 1024).toFixed(1)} KB (Saved ${savedPercent}%)`);
        } catch (err) {
            console.error(`[Error] Failed to optimize ${file}:`, err);
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    }

    const totalSavedMB = ((totalBytesBefore - totalBytesAfter) / (1024 * 1024)).toFixed(2);
    const totalSavedPercent = ((totalBytesBefore - totalBytesAfter) / totalBytesBefore * 100).toFixed(1);
    
    console.log('\n=========================================');
    console.log('IMAGE OPTIMIZATION COMPLETE!');
    console.log(`Total size before: ${(totalBytesBefore / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Total size after:  ${(totalBytesAfter / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Total savings:     ${totalSavedMB} MB (${totalSavedPercent}% smaller)`);
    console.log('=========================================');
}

main();
