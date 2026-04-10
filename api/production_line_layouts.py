from __future__ import annotations

from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.production_line_layout_service import ProductionLineLayoutService

router = APIRouter(prefix="/api/production-line/layouts", tags=["production-line-layouts"])

BASE_DIR = Path(__file__).resolve().parent.parent
layout_service = ProductionLineLayoutService(BASE_DIR / "temp" / "production_line_layouts")


class ScenePlacementPayload(BaseModel):
    id: str
    assetId: str
    assetName: str
    assetFilename: str
    assetUrl: str
    position: tuple[float, float, float]
    rotation: tuple[float, float, float]
    scale: float
    source: Literal["manual", "agent"]
    createdAt: str


class ChatMessagePayload(BaseModel):
    id: str
    role: Literal["assistant", "user"]
    content: str
    createdAt: str


class LayoutMutationPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    placements: list[ScenePlacementPayload]
    messages: list[ChatMessagePayload]
    status_text: str = Field(default="", max_length=500)


@router.get("")
def list_layouts(keyword: str = Query(default="")) -> dict:
    return layout_service.list_layouts(keyword)


@router.get("/{layout_id}")
def get_layout(layout_id: str) -> dict:
    try:
        return {"item": layout_service.get_layout(layout_id)}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Layout not found.")


@router.post("")
def create_layout(payload: LayoutMutationPayload) -> dict:
    item = layout_service.create_layout(
        name=payload.name,
        placements=[item.model_dump(mode="json") for item in payload.placements],
        messages=[item.model_dump(mode="json") for item in payload.messages],
        status_text=payload.status_text,
    )
    return {"item": item}


@router.put("/{layout_id}")
def update_layout(layout_id: str, payload: LayoutMutationPayload) -> dict:
    try:
        item = layout_service.update_layout(
            layout_id=layout_id,
            name=payload.name,
            placements=[item.model_dump(mode="json") for item in payload.placements],
            messages=[item.model_dump(mode="json") for item in payload.messages],
            status_text=payload.status_text,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Layout not found.")

    return {"item": item}


@router.delete("/{layout_id}")
def delete_layout(layout_id: str) -> dict:
    try:
        layout_service.delete_layout(layout_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Layout not found.")

    return {"success": True, "id": layout_id}
