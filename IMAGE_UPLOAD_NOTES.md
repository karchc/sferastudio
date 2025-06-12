# Image Upload Implementation Notes

## Current Implementation

The image upload functionality for questions has been implemented with the following features:

### Database Schema
- Uses existing `media_url` column in the `questions` table
- Stores image data as text (base64 data URLs for now)

### Frontend Features
- **Upload Interface**: Drag-and-drop or click-to-upload in question form
- **Image Preview**: Shows uploaded image with remove option
- **Replace Functionality**: Can replace existing images
- **Flexible Display**: Questions can have images or not - fully optional

### Backend Support
- **API Endpoints**: Both creation and update endpoints support `media_url`
- **Question Management**: Images display in admin manage page
- **Test Taking**: Images display in test interface for users

## Current Storage Method

For MVP/development, images are stored as base64 data URLs directly in the database. This approach:

✅ **Pros:**
- Simple implementation
- No external dependencies
- Works immediately
- Good for prototyping

⚠️ **Limitations:**
- Not suitable for production at scale
- Large database size with many images
- Slower query performance with large images

## Production Recommendations

For production deployment, consider upgrading to cloud storage:

### Option 1: Supabase Storage
```javascript
// Upload to Supabase Storage bucket
const { data, error } = await supabase.storage
  .from('question-images')
  .upload(`questions/${questionId}/${file.name}`, file)

// Store the public URL in media_url
const mediaUrl = `${supabaseUrl}/storage/v1/object/public/question-images/${data.path}`
```

### Option 2: AWS S3 / Cloudinary
- Upload images to cloud storage
- Store public URLs in `media_url` field
- Add image optimization and CDN benefits

### Option 3: Keep Current for Small Scale
If you have limited images and small user base, the current implementation may be sufficient.

## File Types Supported

Currently supports: PNG, JPG, GIF up to 10MB (configurable)

## Usage in Components

### Admin Question Form
- Add/replace/remove images
- Live preview
- Validation

### Question Display (Admin)
- Thumbnails in question list
- Full size in edit mode

### Test Taking Interface
- Full image display for test takers
- Responsive sizing
- Alt text for accessibility

## Future Enhancements

1. **Image Compression**: Reduce file sizes before storage
2. **Multiple Images**: Support multiple images per question
3. **Image Editing**: Basic crop/resize functionality
4. **Lazy Loading**: Optimize performance for image-heavy tests
5. **CDN Integration**: Faster global image delivery