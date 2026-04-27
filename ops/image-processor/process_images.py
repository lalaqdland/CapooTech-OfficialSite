#!/usr/bin/env python3
"""
Image Processing Script for CapooTech Official Site

Features:
1. Auto-rename images with timestamp (prevents overwriting)
2. Auto-convert to WebP format
3. Auto-compress/optimize images
4. Update photos.json references

Usage:
    python process_images.py [--dry-run]
"""

import os
import sys
import json
import shutil
import hashlib
import argparse
from datetime import datetime
from pathlib import Path
from PIL import Image


class ImageProcessor:
    SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'}
    TARGET_FORMAT = 'WEBP'
    TARGET_QUALITY = 85
    MAX_WIDTH = 1920
    MAX_HEIGHT = 1920

    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.repo_root = Path(__file__).resolve().parents[2]
        self.images_dir = self.repo_root / 'images' / 'capoo'
        self.photos_json_path = self.repo_root / 'data' / 'photos.json'
        
        if self.dry_run:
            print("[DRY RUN] No actual changes will be made")
        print(f"Repository root: {self.repo_root}")
        print(f"Images directory: {self.images_dir}")
        print(f"Photos JSON: {self.photos_json_path}")

    def load_photos_json(self):
        """Load and parse photos.json"""
        if not self.photos_json_path.exists():
            print(f"Warning: {self.photos_json_path} does not exist")
            return {'gallery': []}
        
        with open(self.photos_json_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def save_photos_json(self, data):
        """Save photos.json"""
        if self.dry_run:
            print(f"[DRY RUN] Would save to {self.photos_json_path}")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            return
        
        with open(self.photos_json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved updated {self.photos_json_path}")

    def get_gallery_urls(self, data):
        """Extract all image URLs from gallery data"""
        gallery = data.get('gallery', [])
        urls = []
        
        for item in gallery:
            if isinstance(item, str):
                urls.append(item)
            elif isinstance(item, dict):
                url = item.get('url') or item.get('image') or item.get('src')
                if url:
                    urls.append(url)
        
        return urls

    def normalize_url(self, url):
        """Normalize URL to relative path"""
        if url.startswith('/images/capoo/'):
            return url[len('/images/capoo/'):]
        elif url.startswith('images/capoo/'):
            return url[len('images/capoo/'):]
        return url

    def get_file_hash(self, filepath):
        """Calculate MD5 hash of file content"""
        hash_md5 = hashlib.md5()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def generate_new_filename(self, original_name, index=0):
        """Generate a new unique filename with timestamp"""
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        
        base = Path(original_name).stem
        ext = '.webp'
        
        if index > 0:
            new_name = f'capoo-{timestamp}-{index:02d}{ext}'
        else:
            new_name = f'capoo-{timestamp}{ext}'
        
        return new_name

    def needs_processing(self, filepath):
        """Check if file needs processing"""
        path = Path(filepath)
        
        if path.suffix.lower() not in self.SUPPORTED_FORMATS:
            return False
        
        if path.name.startswith('capoo-') and path.suffix.lower() == '.webp':
            return False
        
        return True

    def process_image(self, src_path, dest_path):
        """Process a single image: convert to WebP, resize, compress"""
        try:
            with Image.open(src_path) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'RGBA':
                        background.paste(img, mask=img.split()[3])
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                original_width, original_height = img.size
                aspect_ratio = original_width / original_height
                
                if original_width > self.MAX_WIDTH or original_height > self.MAX_HEIGHT:
                    if aspect_ratio > 1:
                        new_width = self.MAX_WIDTH
                        new_height = int(new_width / aspect_ratio)
                    else:
                        new_height = self.MAX_HEIGHT
                        new_width = int(new_height * aspect_ratio)
                    
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    print(f"  Resized: {original_width}x{original_height} -> {new_width}x{new_height}")
                
                if self.dry_run:
                    print(f"[DRY RUN] Would save to {dest_path}")
                else:
                    img.save(
                        dest_path,
                        self.TARGET_FORMAT,
                        quality=self.TARGET_QUALITY,
                        optimize=True,
                        method=6
                    )
                    print(f"  Saved: {dest_path}")
                
                return True
                
        except Exception as e:
            print(f"  Error processing {src_path}: {e}")
            return False

    def run(self):
        """Main processing logic"""
        print("\n" + "=" * 60)
        print("Starting Image Processing")
        print("=" * 60)
        
        if not self.images_dir.exists():
            print(f"Error: Images directory {self.images_dir} does not exist")
            return 1
        
        photos_data = self.load_photos_json()
        gallery_urls = self.get_gallery_urls(photos_data)
        
        print(f"\nFound {len(gallery_urls)} images in photos.json")
        
        image_files = []
        for f in self.images_dir.iterdir():
            if f.is_file() and f.suffix.lower() in self.SUPPORTED_FORMATS:
                image_files.append(f)
        
        print(f"Found {len(image_files)} image files in {self.images_dir}")
        
        files_to_process = []
        existing_processed = {}
        
        for img_file in image_files:
            if self.needs_processing(img_file):
                files_to_process.append(img_file)
            else:
                file_hash = self.get_file_hash(img_file)
                existing_processed[file_hash] = img_file.name
        
        print(f"\n{len(files_to_process)} files need processing")
        print(f"{len(existing_processed)} files are already processed (WebP format)")
        
        url_mapping = {}
        processed_count = 0
        skipped_count = 0
        
        for idx, src_file in enumerate(files_to_process):
            print(f"\nProcessing: {src_file.name}")
            
            src_hash = self.get_file_hash(src_file)
            
            if src_hash in existing_processed:
                print(f"  Duplicate found (same content as {existing_processed[src_hash]})")
                
                old_url = f"/images/capoo/{src_file.name}"
                new_url = f"/images/capoo/{existing_processed[src_hash]}"
                url_mapping[old_url] = new_url
                url_mapping[src_file.name] = existing_processed[src_hash]
                
                if not self.dry_run:
                    src_file.unlink()
                    print(f"  Deleted duplicate: {src_file.name}")
                else:
                    print(f"[DRY RUN] Would delete duplicate: {src_file.name}")
                skipped_count += 1
                continue
            
            new_filename = self.generate_new_filename(src_file.name, idx)
            dest_file = self.images_dir / new_filename
            
            while dest_file.exists():
                idx += 1
                new_filename = self.generate_new_filename(src_file.name, idx)
                dest_file = self.images_dir / new_filename
            
            print(f"  New name: {new_filename}")
            
            success = self.process_image(src_file, dest_file)
            
            if success:
                old_url = f"/images/capoo/{src_file.name}"
                new_url = f"/images/capoo/{new_filename}"
                url_mapping[old_url] = new_url
                url_mapping[src_file.name] = new_filename
                
                dest_hash = self.get_file_hash(dest_file)
                existing_processed[dest_hash] = new_filename
                
                if not self.dry_run and src_file != dest_file:
                    if src_file.suffix.lower() != '.webp':
                        src_file.unlink()
                        print(f"  Deleted original: {src_file.name}")
                
                processed_count += 1
            else:
                print(f"  Failed to process: {src_file.name}")
        
        print(f"\n" + "=" * 60)
        print("Updating photos.json references")
        print("=" * 60)
        
        if url_mapping:
            print(f"URL mappings to update: {len(url_mapping)}")
            for old, new in url_mapping.items():
                print(f"  {old} -> {new}")
            
            gallery = photos_data.get('gallery', [])
            updated_gallery = []
            
            for item in gallery:
                if isinstance(item, str):
                    normalized = self.normalize_url(item)
                    if item in url_mapping:
                        updated_gallery.append(url_mapping[item])
                        print(f"  Updated: {item} -> {url_mapping[item]}")
                    elif normalized in url_mapping:
                        new_url = f"/images/capoo/{url_mapping[normalized]}"
                        updated_gallery.append(new_url)
                        print(f"  Updated: {item} -> {new_url}")
                    else:
                        updated_gallery.append(item)
                elif isinstance(item, dict):
                    updated_item = item.copy()
                    for key in ['url', 'image', 'src']:
                        if key in updated_item:
                            old_val = updated_item[key]
                            normalized = self.normalize_url(old_val)
                            if old_val in url_mapping:
                                updated_item[key] = url_mapping[old_val]
                                print(f"  Updated {key}: {old_val} -> {url_mapping[old_val]}")
                            elif normalized in url_mapping:
                                new_val = f"/images/capoo/{url_mapping[normalized]}"
                                updated_item[key] = new_val
                                print(f"  Updated {key}: {old_val} -> {new_val}")
                    updated_gallery.append(updated_item)
                else:
                    updated_gallery.append(item)
            
            photos_data['gallery'] = updated_gallery
            self.save_photos_json(photos_data)
        else:
            print("No URL mappings needed")
        
        print("\n" + "=" * 60)
        print("Processing Summary")
        print("=" * 60)
        print(f"Total files processed: {processed_count}")
        print(f"Duplicates skipped/deleted: {skipped_count}")
        print(f"URL mappings created: {len(url_mapping)}")
        
        if self.dry_run:
            print("\n[DRY RUN] No changes were actually made")
        
        return 0


def main():
    parser = argparse.ArgumentParser(
        description='Process and optimize images for CapooTech Official Site'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    
    args = parser.parse_args()
    
    dry_run = args.dry_run or os.environ.get('DRY_RUN', '').lower() == 'true'
    
    processor = ImageProcessor(dry_run=dry_run)
    return processor.run()


if __name__ == '__main__':
    sys.exit(main())
