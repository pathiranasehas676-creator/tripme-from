import requests
import json
import os

BASE_URL = "http://localhost:8000/api"

def verify_phase7():
    print("--- 1. Fetching Districts ---")
    districts = requests.get(f"{BASE_URL}/districts").json()
    did = districts[0]['id']
    
    cat_res = requests.get(f"{BASE_URL}/districts/{did}/categories").json()
    cid = cat_res[0]['id']

    print(f"Using District ID: {did}, Category ID: {cid}")

    print("\n--- 2. Adding 'Approved' Place for Export ---")
    place_data = {
        "country": "Sri Lanka",
        "district_id": did,
        "category_id": cid,
        "name": "Export Test Place",
        "status": "approved", # Explicitly setting status for export test
        "source_id": "manual_verify_script"
    }
    res = requests.post(f"{BASE_URL}/places", data=place_data)
    print("Add Place Response:", res.json())

    print("\n--- 3. Testing JSON Export ---")
    export_json = requests.get(f"{BASE_URL}/export/places.json?status=approved").json()
    print(f"JSON Export Count: {len(export_json)}")
    assert len(export_json) >= 1
    assert export_json[0]['name'] == "Export Test Place"
    assert export_json[0]['source_id'] == "manual_verify_script"

    print("\n--- 4. Testing CSV Export ---")
    export_csv = requests.get(f"{BASE_URL}/export/places.csv?status=approved")
    print(f"CSV Export Status: {export_csv.status_code}")
    assert export_csv.status_code == 200
    assert "Export Test Place" in export_csv.text

    print("\n--- 5. Testing KB Generator ---")
    # Need to run it as a subprocess or locally if DB is accessible
    import subprocess
    os.chdir("backend")
    subprocess.run(["python", "generate_kb.py"])
    
    assert os.path.exists("tripme_kb.json")
    assert os.path.exists("tripme_kb.dart")
    
    with open("tripme_kb.json", "r") as f:
        kb = json.load(f)
        assert len(kb) >= 1
        print(f"KB File verified with {len(kb)} entries.")

    print("\n--- PHASE 7 VERIFIED SUCCESSFULLY ---")

if __name__ == "__main__":
    verify_phase7()
