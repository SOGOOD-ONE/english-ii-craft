import json, glob

reading_files = sorted(glob.glob("./src/content/reading/*.json"))
translation_files = sorted(glob.glob("./src/content/translation/*.json"))

print(f"Reading files: {len(reading_files)}")
print(f"Translation files: {len(translation_files)}")

