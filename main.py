from fastapi import FastAPI
from lib.parser_service import MinerUService, ModelVersion
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(override=True)
