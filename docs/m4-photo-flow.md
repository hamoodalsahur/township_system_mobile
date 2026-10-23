# M4 photo evidence

This is a draft optional upload flow after a fictional report has been saved. Choose a non-personal sample image, re-encode it to a small JPEG, and upload once for management review. Do not share private photos publicly.

Install the SDK 57 dependencies locally first:

```
npx expo install expo-image-picker expo-image-manipulator
npx tsc --noEmit
npx expo start -c
```

Test the existing Map to Submit to success to Reports flow; test selecting a sample photo, explicitly uploading it, and confirming the backend receives it privately. Mock Demo must never send. Offline or uncertain outcomes must not auto-retry.

The dependency lockfile still needs regeneration and a commit before CI can pass. Keep this work unmerged until that and physical iPhone checks are complete.

## Capture directly from camera

The Submit form now has **Take Photo** and **Choose from Gallery** buttons before submission. The camera path requests permission when tapped and explains a denial without blocking the gallery option. Both paths use the same JPEG re-encoding, 200 kB preflight, optional preview and existing private upload after confirmed report creation. Camera access is user-initiated only; no automatic capture, GPS, operator key or publication. On an iPhone, check permission granted and denied paths, camera cancellation, retake, gallery fallback, submission, and management approval before the image appears in Reports.
