"""
MinerU Service Client
Provides document parsing and Knowledge Information Extraction (KIE) services
"""

import os
import requests
import time
from typing import Optional, List, Dict, Any, Union, TYPE_CHECKING
from pathlib import Path
from enum import Enum

if TYPE_CHECKING:
    try:
        from mineru_kie_sdk import MineruKIEClient  # type: ignore
    except ImportError:
        pass


class ModelVersion(str, Enum):
    """MinerU model version options"""

    PIPELINE = "pipeline"
    VLM = "vlm"
    MINERU_HTML = "MinerU-HTML"


class TaskState(str, Enum):
    """Task processing states"""

    DONE = "done"
    PENDING = "pending"
    RUNNING = "running"
    FAILED = "failed"
    CONVERTING = "converting"
    WAITING_FILE = "waiting-file"


class MinerUService:
    """MinerU service client for document parsing and extraction"""

    def __init__(
        self,
        api_token: Optional[str] = None,
        base_url: str = "https://mineru.net/api/v4",
    ):
        """
        Initialize MinerU service client

        Args:
            api_token: API token from MinerU official website.
                      If None, will try to read from MINERU_API_KEY env var
            base_url: Base API URL, default is v4 API endpoint
        """
        self.api_token = api_token or os.getenv("MINERU_API_KEY")
        if not self.api_token:
            raise ValueError(
                "API token is required. Set MINERU_API_KEY env var or pass api_token parameter"
            )

        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_token}",
        }

    def _make_request(
        self,
        method: str,
        endpoint: str,
        json_data: Optional[Dict[str, Any]] = None,
        timeout: int = 30,
    ) -> Dict[str, Any]:
        """
        Make HTTP request to MinerU API

        Args:
            method: HTTP method (GET, POST, PUT)
            endpoint: API endpoint path
            json_data: Request body data
            timeout: Request timeout in seconds

        Returns:
            Response JSON data

        Raises:
            requests.RequestException: If request fails
            ValueError: If API returns error code
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                json=json_data,
                timeout=timeout,
            )
            response.raise_for_status()
            result = response.json()

            # Check API error codes
            if result.get("code") != 0:
                error_msg = result.get("msg", "Unknown error")
                error_code = result.get("code")
                print(f"✗ API error [{error_code}]: {error_msg}")
                raise ValueError(f"API error [{error_code}]: {error_msg}")

            return result
        except requests.RequestException as e:
            print(f"✗ Request failed: {e}")
            raise

    # ==================== Single File Parsing ====================

    def create_task(
        self,
        url: str,
        model_version: Union[str, ModelVersion] = ModelVersion.VLM,
        is_ocr: bool = False,
        enable_formula: bool = True,
        enable_table: bool = True,
        language: str = "ch",
        data_id: Optional[str] = None,
        page_ranges: Optional[str] = None,
        callback: Optional[str] = None,
        seed: Optional[str] = None,
        extra_formats: Optional[List[str]] = None,
    ) -> str:
        """
        Create a single file parsing task via URL

        Args:
            url: File URL (supports .pdf, .doc, .docx, .ppt, .pptx, .png, .jpg, .jpeg, .html)
            model_version: Model version (pipeline, vlm, or MinerU-HTML for HTML files)
            is_ocr: Whether to enable OCR functionality (default: False)
            enable_formula: Whether to enable formula recognition (default: True)
            enable_table: Whether to enable table recognition (default: True)
            language: Document language (default: "ch")
            data_id: Data ID for business identification (optional)
            page_ranges: Page range string, e.g., "1-600" or "2,4-6" (optional)
            callback: Callback URL for result notification (optional)
            seed: Random string for callback signature verification (required if callback provided)
            extra_formats: Additional export formats: ["docx", "html", "latex"] (optional)

        Returns:
            Task ID string

        Example:
            task_id = service.create_task(
                url="https://example.com/document.pdf",
                model_version=ModelVersion.VLM
            )
        """
        # Auto-detect model version for HTML files
        if url.lower().endswith(".html") and model_version != ModelVersion.MINERU_HTML:
            model_version = ModelVersion.MINERU_HTML
            print("! Auto-detected HTML file, using MinerU-HTML model")

        data = {
            "url": url,
            "model_version": (
                model_version.value
                if isinstance(model_version, ModelVersion)
                else model_version
            ),
        }

        # Add optional parameters
        if is_ocr:
            data["is_ocr"] = is_ocr
        if not enable_formula:
            data["enable_formula"] = enable_formula
        if not enable_table:
            data["enable_table"] = enable_table
        if language != "ch":
            data["language"] = language
        if data_id:
            data["data_id"] = data_id
        if page_ranges:
            data["page_ranges"] = page_ranges
        if callback:
            data["callback"] = callback
            if seed:
                data["seed"] = seed
            else:
                raise ValueError("seed parameter is required when callback is provided")
        if extra_formats:
            data["extra_formats"] = extra_formats

        result = self._make_request("POST", "/extract/task", json_data=data)
        task_id = result["data"]["task_id"]
        print(f"✓ Task created successfully: {task_id}")
        return task_id

    def get_task_result(self, task_id: str) -> Dict[str, Any]:
        """
        Get parsing task result

        Args:
            task_id: Task ID returned from create_task()

        Returns:
            Task result dictionary containing:
            - task_id: Task ID
            - data_id: Data ID (if provided)
            - state: Task state (done, pending, running, failed, converting)
            - full_zip_url: Result archive URL (when state=done)
            - err_msg: Error message (when state=failed)
            - extract_progress: Progress info (when state=running)
                - extracted_pages: Number of pages parsed
                - total_pages: Total pages
                - start_time: Start time

        Example:
            result = service.get_task_result(task_id)
            if result["state"] == "done":
                download_url = result["full_zip_url"]
        """
        result = self._make_request("GET", f"/extract/task/{task_id}")
        return result["data"]

    def wait_for_task(
        self, task_id: str, timeout: int = 600, poll_interval: int = 5
    ) -> Dict[str, Any]:
        """
        Wait for task completion with polling

        Args:
            task_id: Task ID to wait for
            timeout: Maximum wait time in seconds (default: 600)
            poll_interval: Polling interval in seconds (default: 5)

        Returns:
            Final task result dictionary

        Raises:
            TimeoutError: If task doesn't complete within timeout
        """
        start_time = time.time()

        while True:
            result = self.get_task_result(task_id)
            state = result.get("state")

            if state == TaskState.DONE:
                print(f"✓ Task {task_id} completed successfully")
                return result
            elif state == TaskState.FAILED:
                error_msg = result.get("err_msg", "Unknown error")
                print(f"✗ Task {task_id} failed: {error_msg}")
                return result

            # Check timeout
            elapsed = time.time() - start_time
            if elapsed >= timeout:
                raise TimeoutError(
                    f"Task {task_id} did not complete within {timeout} seconds"
                )

            # Show progress if available
            if state == TaskState.RUNNING and "extract_progress" in result:
                progress = result["extract_progress"]
                extracted = progress.get("extracted_pages", 0)
                total = progress.get("total_pages", 0)
                print(f"! Task {task_id} running: {extracted}/{total} pages processed")

            time.sleep(poll_interval)

    def download_results(self, zip_url: str, output_path: Union[str, Path]) -> bool:
        """
        Download parsing results ZIP file

        Args:
            zip_url: Full ZIP URL from task result (full_zip_url field)
            output_path: Local path to save the ZIP file

        Returns:
            True if downloaded successfully, False otherwise

        Example:
            result = service.wait_for_task(task_id)
            if result["state"] == "done":
                service.download_results(result["full_zip_url"], "results.zip")
        """
        output_path = Path(output_path)

        try:
            response = requests.get(zip_url, stream=True, timeout=300)
            response.raise_for_status()

            # Create output directory if needed
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Download file
            total_size = int(response.headers.get("content-length", 0))
            downloaded = 0

            with open(output_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(
                                f"\r! Downloading: {percent:.1f}%", end="", flush=True
                            )

            print(f"\n✓ Results downloaded to: {output_path}")
            return True
        except Exception as e:
            print(f"\n✗ Failed to download results: {e}")
            return False

    # ==================== Batch File Upload and Parsing ====================

    def batch_upload_files(
        self,
        files: List[Dict[str, Any]],
        file_paths: List[Union[str, Path]],
        model_version: Union[str, ModelVersion] = ModelVersion.VLM,
        enable_formula: bool = True,
        enable_table: bool = True,
        language: str = "ch",
        callback: Optional[str] = None,
        seed: Optional[str] = None,
        extra_formats: Optional[List[str]] = None,
    ) -> str:
        """
        Batch upload files and create parsing tasks

        Args:
            files: List of file metadata dicts, each containing:
                - name: File name (required)
                - data_id: Data ID (optional)
                - is_ocr: Enable OCR (optional)
                - page_ranges: Page ranges (optional)
            file_paths: List of local file paths to upload
            model_version: Model version (default: vlm)
            enable_formula: Enable formula recognition (default: True)
            enable_table: Enable table recognition (default: True)
            language: Document language (default: "ch")
            callback: Callback URL (optional)
            seed: Random string for callback (required if callback provided)
            extra_formats: Additional export formats (optional)

        Returns:
            Batch ID string

        Example:
            batch_id = service.batch_upload_files(
                files=[{"name": "doc1.pdf", "data_id": "doc1"}],
                file_paths=["/path/to/doc1.pdf"],
                model_version=ModelVersion.VLM
            )
        """
        if len(files) != len(file_paths):
            raise ValueError("files and file_paths must have the same length")

        if len(files) > 200:
            raise ValueError("Cannot request more than 200 files at once")

        # Auto-detect model version for HTML files
        html_files = [f for f in files if f["name"].lower().endswith(".html")]
        if html_files and model_version != ModelVersion.MINERU_HTML:
            model_version = ModelVersion.MINERU_HTML
            print("! Auto-detected HTML files, using MinerU-HTML model")

        data = {
            "files": files,
            "model_version": (
                model_version.value
                if isinstance(model_version, ModelVersion)
                else model_version
            ),
        }

        if not enable_formula:
            data["enable_formula"] = enable_formula
        if not enable_table:
            data["enable_table"] = enable_table
        if language != "ch":
            data["language"] = language
        if callback:
            data["callback"] = callback
            if seed:
                data["seed"] = seed
            else:
                raise ValueError("seed parameter is required when callback is provided")
        if extra_formats:
            data["extra_formats"] = extra_formats

        # Request upload URLs
        result = self._make_request("POST", "/file-urls/batch", json_data=data)
        batch_id = result["data"]["batch_id"]
        upload_urls = result["data"]["file_urls"]

        print(f"✓ Got {len(upload_urls)} upload URLs for batch {batch_id}")

        # Upload files
        for i, (file_path, upload_url) in enumerate(zip(file_paths, upload_urls)):
            file_path = Path(file_path)
            if not file_path.exists():
                print(f"✗ File not found: {file_path}")
                continue

            try:
                with open(file_path, "rb") as f:
                    upload_response = requests.put(upload_url, data=f, timeout=300)
                    upload_response.raise_for_status()
                    print(f"✓ Uploaded {file_path.name} ({i+1}/{len(file_paths)})")
            except Exception as e:
                print(f"✗ Failed to upload {file_path.name}: {e}")

        print(f"✓ Batch upload completed: {batch_id}")
        return batch_id

    # ==================== Batch URL Parsing ====================

    def batch_create_tasks(
        self,
        files: List[Dict[str, Any]],
        model_version: Union[str, ModelVersion] = ModelVersion.VLM,
        enable_formula: bool = True,
        enable_table: bool = True,
        language: str = "ch",
        callback: Optional[str] = None,
        seed: Optional[str] = None,
        extra_formats: Optional[List[str]] = None,
    ) -> str:
        """
        Create batch parsing tasks from URLs

        Args:
            files: List of file metadata dicts, each containing:
                - url: File URL (required)
                - data_id: Data ID (optional)
                - is_ocr: Enable OCR (optional)
                - page_ranges: Page ranges (optional)
            model_version: Model version (default: vlm)
            enable_formula: Enable formula recognition (default: True)
            enable_table: Enable table recognition (default: True)
            language: Document language (default: "ch")
            callback: Callback URL (optional)
            seed: Random string for callback (required if callback provided)
            extra_formats: Additional export formats (optional)

        Returns:
            Batch ID string

        Example:
            batch_id = service.batch_create_tasks(
                files=[{"url": "https://example.com/doc.pdf", "data_id": "doc1"}],
                model_version=ModelVersion.VLM
            )
        """
        if len(files) > 200:
            raise ValueError("Cannot request more than 200 files at once")

        # Auto-detect model version for HTML files
        html_files = [f for f in files if f.get("url", "").lower().endswith(".html")]
        if html_files and model_version != ModelVersion.MINERU_HTML:
            model_version = ModelVersion.MINERU_HTML
            print("! Auto-detected HTML files, using MinerU-HTML model")

        data = {
            "files": files,
            "model_version": (
                model_version.value
                if isinstance(model_version, ModelVersion)
                else model_version
            ),
        }

        if not enable_formula:
            data["enable_formula"] = enable_formula
        if not enable_table:
            data["enable_table"] = enable_table
        if language != "ch":
            data["language"] = language
        if callback:
            data["callback"] = callback
            if seed:
                data["seed"] = seed
            else:
                raise ValueError("seed parameter is required when callback is provided")
        if extra_formats:
            data["extra_formats"] = extra_formats

        result = self._make_request("POST", "/extract/task/batch", json_data=data)
        batch_id = result["data"]["batch_id"]
        print(f"✓ Batch tasks created: {batch_id}")
        return batch_id

    def batch_get_results(self, batch_id: str) -> Dict[str, Any]:
        """
        Get batch parsing results

        Args:
            batch_id: Batch ID returned from batch_create_tasks() or batch_upload_files()

        Returns:
            Batch result dictionary containing:
            - batch_id: Batch ID
            - extract_result: List of result dicts, each containing:
                - file_name: File name
                - state: Task state
                - full_zip_url: Result archive URL (when done)
                - err_msg: Error message (when failed)
                - data_id: Data ID
                - extract_progress: Progress info (when running)

        Example:
            results = service.batch_get_results(batch_id)
            for result in results["extract_result"]:
                if result["state"] == "done":
                    print(f"✓ {result['file_name']} completed")
        """
        result = self._make_request("GET", f"/extract-results/batch/{batch_id}")
        return result["data"]

    def wait_for_batch(
        self, batch_id: str, timeout: int = 1800, poll_interval: int = 10
    ) -> Dict[str, Any]:
        """
        Wait for batch completion with polling

        Args:
            batch_id: Batch ID to wait for
            timeout: Maximum wait time in seconds (default: 1800)
            poll_interval: Polling interval in seconds (default: 10)

        Returns:
            Final batch result dictionary

        Raises:
            TimeoutError: If batch doesn't complete within timeout
        """
        start_time = time.time()

        while True:
            result = self.batch_get_results(batch_id)
            extract_results = result.get("extract_result", [])

            # Check if all tasks are done or failed
            states = [r.get("state") for r in extract_results]
            all_done = all(s in [TaskState.DONE, TaskState.FAILED] for s in states)

            if all_done:
                done_count = sum(1 for s in states if s == TaskState.DONE)
                failed_count = sum(1 for s in states if s == TaskState.FAILED)
                print(
                    f"✓ Batch {batch_id} completed: {done_count} succeeded, {failed_count} failed"
                )
                return result

            # Check timeout
            elapsed = time.time() - start_time
            if elapsed >= timeout:
                running_count = sum(1 for s in states if s == TaskState.RUNNING)
                raise TimeoutError(
                    f"Batch {batch_id} did not complete within {timeout} seconds. "
                    f"{running_count} tasks still running"
                )

            # Show progress
            running_count = sum(1 for s in states if s == TaskState.RUNNING)
            if running_count > 0:
                print(
                    f"! Batch {batch_id}: {running_count} tasks running, {len(states) - running_count} completed"
                )

            time.sleep(poll_interval)

    # ==================== KIE (Knowledge Information Extraction) ====================

    def create_kie_client(
        self,
        pipeline_id: str,
        base_url: str = "https://mineru.net/api/kie",
        timeout: int = 30,
    ) -> "MineruKIEClient":
        """
        Create a KIE client instance

        Args:
            pipeline_id: Pipeline ID from MinerU KIE platform
            base_url: KIE API base URL (default: https://mineru.net/api/kie)
            timeout: Request timeout in seconds

        Returns:
            MineruKIEClient instance

        Note:
            This requires the mineru-kie-sdk package to be installed.
            Install with: pip install mineru-kie-sdk
        """
        try:
            from mineru_kie_sdk import MineruKIEClient  # type: ignore
        except ImportError:
            raise ImportError(
                "mineru-kie-sdk package is required for KIE functionality. "
                "Install with: pip install mineru-kie-sdk"
            )

        return MineruKIEClient(
            base_url=base_url, pipeline_id=pipeline_id, timeout=timeout
        )


# ==================== Example Usage ====================

if __name__ == "__main__":
    # Initialize service
    service = MinerUService()

    # Example 1: Single file parsing from URL
    print("\n=== Example 1: Single File Parsing ===")
    try:
        task_id = service.create_task(
            url="https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
            model_version=ModelVersion.VLM,
        )

        # Wait for completion
        result = service.wait_for_task(task_id, timeout=300)
        if result["state"] == "done":
            print(f"✓ Download URL: {result['full_zip_url']}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Example 2: Batch URL parsing
    print("\n=== Example 2: Batch URL Parsing ===")
    try:
        batch_id = service.batch_create_tasks(
            files=[
                {
                    "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
                    "data_id": "doc1",
                }
            ],
            model_version=ModelVersion.VLM,
        )

        # Wait for batch completion
        results = service.wait_for_batch(batch_id, timeout=600)
        for result in results["extract_result"]:
            print(f"File: {result['file_name']}, State: {result['state']}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Example 3: KIE client (if SDK is installed)
    print("\n=== Example 3: KIE Client ===")
    try:
        kie_client = service.create_kie_client(pipeline_id="your-pipeline-id")
        print("✓ KIE client created successfully")
        print(
            "  Use kie_client.upload_file() and kie_client.get_result() to process documents"
        )
    except ImportError as e:
        print(f"! KIE SDK not installed: {e}")
    except Exception as e:
        print(f"✗ Error: {e}")


if __name__ == "__main__":
    service = MinerUService()

    batch_id = service.batch_upload_files(
        files=[
            {"name": "image.jpg", "data_id": "img-a", "is_ocr": True},
        ],
        file_paths=[
            Path("./image.png"),
        ],
        model_version=ModelVersion.PIPELINE,
        language="ch",
    )

    results = service.wait_for_batch(batch_id, timeout=1200)

    print(results)
