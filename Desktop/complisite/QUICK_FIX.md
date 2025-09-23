# 🚀 Quick Fix for Image Loading

## **Immediate Solution (5 minutes)**

### **Step 1: Make Bucket Public (Fastest)**
1. Go to **Supabase Dashboard** → **Storage**
2. Click on your **`evidence` bucket**
3. Go to **Settings** tab
4. **Enable "Public"** access
5. **Save changes**

### **Step 2: Test the Fix**
1. **Refresh your checklist page**
2. **Try uploading a photo**
3. **Images should now display immediately!**

---

## **Alternative: Use Signed URLs (More Secure)**

If you prefer to keep the bucket private, the signed URL approach I implemented should work. The current code in your checklist page now uses:

```typescript
// This creates secure, time-limited URLs
const { data: signedUrlData } = await supabase.storage
  .from('evidence')
  .createSignedUrl(`checklist-evidence/${fileName}`, 3600)
```

---

## **Production Setup (Optional)**

For a production-ready setup with proper security:

### **Step 1: Run Database Schema**
```sql
-- Copy and paste the contents of database-simple.sql
-- into your Supabase SQL Editor and run it
```

### **Step 2: Update Storage Policies**
1. Go to **Storage** → **evidence bucket** → **Policies**
2. Add these policies:

**Policy 1: Allow authenticated users to view evidence**
- **Operation**: SELECT
- **Target roles**: authenticated
- **Policy definition**: `bucket_id = 'evidence'`

**Policy 2: Allow authenticated users to upload evidence**
- **Operation**: INSERT  
- **Target roles**: authenticated
- **Policy definition**: `bucket_id = 'evidence'`

---

## **Expected Result**

After either fix, you should see:
- ✅ **Photos upload successfully**
- ✅ **Images display in the gallery**
- ✅ **Click to view full-size images**
- ✅ **Photos persist across page reloads**

The signed URL approach is already implemented in your code, so it should work once the database tables are created!
