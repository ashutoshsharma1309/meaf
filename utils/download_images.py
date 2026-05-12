"""Download a small set of leaf images from public PlantVillage mirrors on GitHub."""
import os
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = Path(__file__).resolve().parent.parent
DATASET = ROOT / "dataset"

BASES = [
    "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color",
]

CLASSES = {
    "Tomato_Early_Blight": ("Tomato___Early_blight", [
        "0c1b4d4c-9a9d-4a47-8c2a-3d2e1b3c4d5e___RS_Erly.B 6347.JPG",
    ]),
    "Tomato_Healthy": ("Tomato___healthy", []),
    "Potato_Early_Blight": ("Potato___Early_blight", []),
    "Potato_Healthy": ("Potato___healthy", []),
}

INDEX_URL = "https://api.github.com/repos/spMohanty/PlantVillage-Dataset/contents/raw/color/{folder}"


def list_remote_files(folder: str, limit: int = 12):
    """GitHub contents API caps at 1000 entries per page; paginate to get more."""
    import json
    files = []
    per_page = 100
    page = 1
    while len(files) < limit:
        url = INDEX_URL.format(folder=folder) + f"?per_page={per_page}&page={page}"
        req = Request(url, headers={"User-Agent": "demo"})
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        if not data:
            break
        for d in data:
            if d.get("name", "").lower().endswith((".jpg", ".jpeg", ".png")):
                files.append(d["download_url"])
        if len(data) < per_page:
            break
        page += 1
    return files[:limit]


def download(url: str, out_path: Path):
    if out_path.exists() and out_path.stat().st_size > 1024:
        return True
    req = Request(url, headers={"User-Agent": "demo"})
    try:
        with urlopen(req, timeout=30) as resp:
            data = resp.read()
        out_path.write_bytes(data)
        return True
    except (URLError, HTTPError, TimeoutError) as e:
        print(f"  ! failed: {url[:80]}  -> {e}")
        return False


def main(per_class: int = 1500):
    for local_name, (remote_folder, _) in CLASSES.items():
        out_dir = DATASET / local_name
        out_dir.mkdir(parents=True, exist_ok=True)
        existing = list(out_dir.glob("*.jpg")) + list(out_dir.glob("*.png"))
        if len(existing) >= per_class:
            print(f"[skip] {local_name} already has {len(existing)} images")
            continue
        print(f"[fetch] listing {remote_folder} ...")
        try:
            urls = list_remote_files(remote_folder, limit=per_class)
        except Exception as e:
            print(f"  ! listing failed: {e}")
            continue
        print(f"  found {len(urls)} urls; downloading...")
        for i, url in enumerate(urls):
            ext = ".jpg" if url.lower().endswith((".jpg", ".jpeg")) else ".png"
            out = out_dir / f"{local_name}_{i:03d}{ext}"
            ok = download(url, out)
            if ok:
                print(f"  + {out.name}")
            time.sleep(0.15)


if __name__ == "__main__":
    main()
