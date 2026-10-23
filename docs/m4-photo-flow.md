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
