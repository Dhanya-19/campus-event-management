import os
import zipfile

dist_dir = "dist"
output_zip = "campusconnect-frontend.zip"

with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(dist_dir):
        for file in files:
            full_path = os.path.join(root, file)
            archive_path = os.path.relpath(full_path, dist_dir)
            archive_path = archive_path.replace("\\", "/")
            zf.write(full_path, archive_path)

print(f"Created {output_zip}")