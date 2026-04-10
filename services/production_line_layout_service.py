from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any


LAYOUT_VERSION = 1


class ProductionLineLayoutService:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def list_layouts(self, keyword: str = "") -> dict[str, Any]:
        normalized_keyword = keyword.strip().lower()
        items: list[dict[str, Any]] = []

        for file_path in self._iter_layout_files():
            layout = self._read_layout_file(file_path)
            if normalized_keyword and normalized_keyword not in layout["name"].lower():
                continue
            items.append(self._build_summary(layout))

        items.sort(key=lambda item: item["updated_at"], reverse=True)
        return {"items": items, "total": len(items)}

    def get_layout(self, layout_id: str) -> dict[str, Any]:
        return self._read_layout_file(self._resolve_layout_path(layout_id))

    def create_layout(self, name: str, placements: list[dict[str, Any]], messages: list[dict[str, Any]], status_text: str) -> dict[str, Any]:
        now = self._timestamp()
        layout = self._build_layout(
            layout_id=self._create_layout_id(),
            name=name,
            placements=placements,
            messages=messages,
            status_text=status_text,
            created_at=now,
            updated_at=now,
        )
        self._write_layout_file(self._resolve_layout_path(layout["id"]), layout)
        return layout

    def update_layout(
        self,
        layout_id: str,
        name: str,
        placements: list[dict[str, Any]],
        messages: list[dict[str, Any]],
        status_text: str,
    ) -> dict[str, Any]:
        file_path = self._resolve_layout_path(layout_id)
        current = self._read_layout_file(file_path)
        layout = self._build_layout(
            layout_id=layout_id,
            name=name,
            placements=placements,
            messages=messages,
            status_text=status_text,
            created_at=current["created_at"],
            updated_at=self._timestamp(),
        )
        self._write_layout_file(file_path, layout)
        return layout

    def delete_layout(self, layout_id: str) -> None:
        file_path = self._resolve_layout_path(layout_id)
        if not file_path.exists():
            raise FileNotFoundError(layout_id)
        file_path.unlink()

    def _build_layout(
        self,
        layout_id: str,
        name: str,
        placements: list[dict[str, Any]],
        messages: list[dict[str, Any]],
        status_text: str,
        created_at: str,
        updated_at: str,
    ) -> dict[str, Any]:
        clean_name = name.strip()
        return {
            "id": layout_id,
            "version": LAYOUT_VERSION,
            "name": clean_name,
            "created_at": created_at,
            "updated_at": updated_at,
            "scene": {
                "placements": placements,
            },
            "conversation": {
                "messages": messages,
                "status_text": status_text,
            },
            "summary": {
                "placement_count": len(placements),
                "message_count": len(messages),
            },
        }

    def _build_summary(self, layout: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": layout["id"],
            "name": layout["name"],
            "created_at": layout["created_at"],
            "updated_at": layout["updated_at"],
            "placement_count": layout["summary"]["placement_count"],
            "message_count": layout["summary"]["message_count"],
        }

    def _iter_layout_files(self) -> list[Path]:
        return sorted(self.base_dir.glob("*.json"))

    def _resolve_layout_path(self, layout_id: str) -> Path:
        safe_layout_id = Path(layout_id).stem
        if safe_layout_id != layout_id:
            raise FileNotFoundError(layout_id)
        return self.base_dir / f"{safe_layout_id}.json"

    def _read_layout_file(self, file_path: Path) -> dict[str, Any]:
        if not file_path.exists():
            raise FileNotFoundError(file_path.stem)
        with file_path.open("r", encoding="utf-8") as file:
            return json.load(file)

    def _write_layout_file(self, file_path: Path, layout: dict[str, Any]) -> None:
        with file_path.open("w", encoding="utf-8") as file:
            json.dump(layout, file, ensure_ascii=False, indent=2)

    def _create_layout_id(self) -> str:
        return f"layout_{uuid.uuid4().hex[:12]}"

    def _timestamp(self) -> str:
        return datetime.now().astimezone().isoformat()
