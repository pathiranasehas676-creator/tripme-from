import requests
import json
import os

BASE_URL = "http://localhost:8000/api"

def verify_images():
    print("--- Testing Image Management ---")
    
    # Get a place to work with
    places = requests.get(f"{BASE_URL}/places").json()
    if not places:
        print("No places found.")
        return
        
    place = places[0]
    place_id = place['id']
    print(f"Testing Place ID: {place_id} ({place['name']})")
    
    # 1. Post a test image
    print("1. Adding test image...")
    # Create a valid minimal GIF
    valid_gif = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
    with open("test_img.gif", "wb") as f:
        f.write(valid_gif)
        
    with open("test_img.gif", "rb") as f:
        files = {'images': ('test_img.gif', f, 'image/gif')}
        data = {'captions': json.dumps(["Test Caption"])}
        res = requests.post(f"{BASE_URL}/places/{place_id}/images", files=files, data=data)

        
    print("Add Response:", res.status_code)
    try:
        added = res.json()
        print(added)
        image_id = added['added_images'][0]['id']
    except Exception as e:
        print("Failed to parse add response:", e)
        return
        
    # 2. Set new image as cover
    print("2. Setting new image as cover...")
    res = requests.patch(f"{BASE_URL}/places/{place_id}/images/{image_id}/cover")
    print("Cover Response:", res.status_code)
    
    # Get images to verify cover
    updated_places = requests.get(f"{BASE_URL}/places").json()
    p = [p for p in updated_places if p['id'] == place_id][0]
    cover_imgs = [img for img in p['images'] if img['is_cover'] == 1]
    print(f"Cover images found: {len(cover_imgs)}")
    
    # 3. Delete the image
    print("3. Deleting image...")
    res = requests.delete(f"{BASE_URL}/places/{place_id}/images/{image_id}")
    print("Delete Response:", res.status_code)
    
    os.remove("test_img.jpg")
    print("\n✅ Image Management Verification Complete!")

if __name__ == "__main__":
    verify_images()
