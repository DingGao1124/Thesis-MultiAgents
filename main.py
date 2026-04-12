from __future__ import annotations

import os
import shutil
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.production_line_layouts import router as production_line_layout_router

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    def load_dotenv(*args, **kwargs) -> bool:
        return False


load_dotenv(override=True)

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
ALLOWED_MODEL_EXTENSIONS = {".glb", ".gltf"}

MODELS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Multi-Agent Backend", version="0.1.0")

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:11124")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/api/assets/models/file",
    StaticFiles(directory=str(MODELS_DIR)),
    name="model-files",
)
app.include_router(production_line_layout_router)


def format_file_size(size_bytes: int) -> str:
    value = float(size_bytes)
    units = ["B", "KB", "MB", "GB"]
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.2f} {unit}"
        value /= 1024
    return f"{size_bytes} B"


def build_model_payload(file_path: Path) -> dict:
    stat = file_path.stat()
    return {
        "id": file_path.name,
        "name": file_path.stem,
        "filename": file_path.name,
        "format": file_path.suffix.replace(".", "").upper(),
        "size_bytes": stat.st_size,
        "size_label": format_file_size(stat.st_size),
        "updated_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "url": f"/api/assets/models/file/{quote(file_path.name)}",
    }


def iter_model_files() -> list[Path]:
    return sorted(
        [
            path
            for path in MODELS_DIR.iterdir()
            if path.is_file() and path.suffix.lower() in ALLOWED_MODEL_EXTENSIONS
        ],
        key=lambda item: item.stat().st_mtime,
        reverse=True,
    )


def validate_model_name(model_name: str) -> Path:
    safe_name = Path(model_name).name
    if safe_name != model_name:
        raise HTTPException(status_code=400, detail="Invalid model name.")

    file_path = MODELS_DIR / safe_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Model file not found.")
    return file_path


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/api/assets/models")
def list_models() -> dict:
    assets: list[dict] = []
    skipped_files: list[dict] = []

    for file_path in iter_model_files():
        try:
            assets.append(build_model_payload(file_path))
        except OSError as exc:
            skipped_files.append({"filename": file_path.name, "reason": str(exc)})

    return {
        "items": assets,
        "total": len(assets),
        "skipped": skipped_files,
    }


@app.post("/api/assets/models/upload")
async def upload_model(file: UploadFile = File(...)) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name.")

    file_name = Path(file.filename).name
    extension = Path(file_name).suffix.lower()
    if extension not in ALLOWED_MODEL_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .glb and .gltf files are supported.")

    target_path = MODELS_DIR / file_name
    if target_path.exists():
        raise HTTPException(status_code=409, detail="A model with the same name already exists.")

    with target_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"item": build_model_payload(target_path)}


@app.delete("/api/assets/models/{model_name:path}")
def delete_model(model_name: str) -> dict:
    file_path = validate_model_name(model_name)
    file_path.unlink()
    return {"success": True, "filename": file_path.name}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
