"""
MinIO Client Utility Class
Provides CRUD operations for MinIO object storage
"""

from minio import Minio
from minio.error import S3Error
from typing import Optional, List, BinaryIO
import os
from io import BytesIO
from datetime import timedelta


class MinIOClient:
    """MinIO client class that encapsulates common MinIO operations"""
    
    def __init__(
        self,
        endpoint: str = "localhost:9000",
        access_key: str = "minioadmin",
        secret_key: str = "minioadmin",
        secure: bool = False
    ):
        """
        Initialize MinIO client
        
        Args:
            endpoint: MinIO service address
            access_key: Access key
            secret_key: Secret key
            secure: Whether to use HTTPS
        """
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
    
    def create_bucket(self, bucket_name: str) -> bool:
        """
        Create a bucket
        
        Args:
            bucket_name: Bucket name
            
        Returns:
            bool: True if created successfully, False if already exists or failed
        """
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                print(f"✓ Bucket '{bucket_name}' created successfully")
                return True
            else:
                print(f"! Bucket '{bucket_name}' already exists")
                return False
        except S3Error as e:
            print(f"✗ Failed to create bucket: {e}")
            return False
    
    def delete_bucket(self, bucket_name: str) -> bool:
        """
        Delete a bucket (must be empty)
        
        Args:
            bucket_name: Bucket name
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            self.client.remove_bucket(bucket_name)
            print(f"✓ Bucket '{bucket_name}' deleted successfully")
            return True
        except S3Error as e:
            print(f"✗ Failed to delete bucket: {e}")
            return False
    
    def list_buckets(self) -> List[str]:
        """
        List all buckets
        
        Returns:
            List[str]: List of bucket names
        """
        try:
            buckets = self.client.list_buckets()
            bucket_names = [bucket.name for bucket in buckets]
            print(f"✓ Found {len(bucket_names)} bucket(s)")
            return bucket_names
        except S3Error as e:
            print(f"✗ Failed to list buckets: {e}")
            return []
    
    def upload_file(
        self,
        bucket_name: str,
        object_name: str,
        file_path: str,
        content_type: Optional[str] = None
    ) -> bool:
        """
        Upload a file to MinIO
        
        Args:
            bucket_name: Bucket name
            object_name: Object name (storage path)
            file_path: Local file path
            content_type: File MIME type
            
        Returns:
            bool: True if uploaded successfully
        """
        try:
            # Ensure bucket exists
            if not self.client.bucket_exists(bucket_name):
                self.create_bucket(bucket_name)
            
            # Upload file
            self.client.fput_object(
                bucket_name,
                object_name,
                file_path,
                content_type=content_type
            )
            print(f"✓ File '{file_path}' uploaded successfully to '{bucket_name}/{object_name}'")
            return True
        except S3Error as e:
            print(f"✗ Failed to upload file: {e}")
            return False
    
    def upload_data(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: Optional[str] = None
    ) -> bool:
        """
        Upload binary data to MinIO
        
        Args:
            bucket_name: Bucket name
            object_name: Object name (storage path)
            data: Binary data
            content_type: Data MIME type
            
        Returns:
            bool: True if uploaded successfully
        """
        try:
            # Ensure bucket exists
            if not self.client.bucket_exists(bucket_name):
                self.create_bucket(bucket_name)
            
            # Upload data
            data_stream = BytesIO(data)
            self.client.put_object(
                bucket_name,
                object_name,
                data_stream,
                length=len(data),
                content_type=content_type
            )
            print(f"✓ Data uploaded successfully to '{bucket_name}/{object_name}'")
            return True
        except S3Error as e:
            print(f"✗ Failed to upload data: {e}")
            return False
    
    def download_file(
        self,
        bucket_name: str,
        object_name: str,
        file_path: str
    ) -> bool:
        """
        Download a file from MinIO
        
        Args:
            bucket_name: Bucket name
            object_name: Object name
            file_path: Local file path to save
            
        Returns:
            bool: True if downloaded successfully
        """
        try:
            self.client.fget_object(bucket_name, object_name, file_path)
            print(f"✓ File '{bucket_name}/{object_name}' downloaded successfully to '{file_path}'")
            return True
        except S3Error as e:
            print(f"✗ Failed to download file: {e}")
            return False
    
    def download_data(self, bucket_name: str, object_name: str) -> Optional[bytes]:
        """
        Download data from MinIO to memory
        
        Args:
            bucket_name: Bucket name
            object_name: Object name
            
        Returns:
            Optional[bytes]: File data, None if failed
        """
        try:
            response = self.client.get_object(bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            print(f"✓ Data '{bucket_name}/{object_name}' downloaded successfully")
            return data
        except S3Error as e:
            print(f"✗ Failed to download data: {e}")
            return None
    
    def delete_object(self, bucket_name: str, object_name: str) -> bool:
        """
        Delete an object
        
        Args:
            bucket_name: Bucket name
            object_name: Object name
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            self.client.remove_object(bucket_name, object_name)
            print(f"✓ Object '{bucket_name}/{object_name}' deleted successfully")
            return True
        except S3Error as e:
            print(f"✗ Failed to delete object: {e}")
            return False
    
    def list_objects(
        self,
        bucket_name: str,
        prefix: Optional[str] = None,
        recursive: bool = True
    ) -> List[str]:
        """
        List objects in a bucket
        
        Args:
            bucket_name: Bucket name
            prefix: Object name prefix (for filtering)
            recursive: Whether to list recursively
            
        Returns:
            List[str]: List of object names
        """
        try:
            objects = self.client.list_objects(
                bucket_name,
                prefix=prefix,
                recursive=recursive
            )
            object_names = [obj.object_name for obj in objects]
            print(f"✓ Found {len(object_names)} object(s) in '{bucket_name}'")
            return object_names
        except S3Error as e:
            print(f"✗ Failed to list objects: {e}")
            return []
    
    def object_exists(self, bucket_name: str, object_name: str) -> bool:
        """
        Check if an object exists
        
        Args:
            bucket_name: Bucket name
            object_name: Object name
            
        Returns:
            bool: True if exists
        """
        try:
            self.client.stat_object(bucket_name, object_name)
            return True
        except S3Error:
            return False
    
    def get_object_info(self, bucket_name: str, object_name: str) -> Optional[dict]:
        """
        Get object information
        
        Args:
            bucket_name: Bucket name
            object_name: Object name
            
        Returns:
            Optional[dict]: Object information dictionary
        """
        try:
            stat = self.client.stat_object(bucket_name, object_name)
            info = {
                "bucket_name": stat.bucket_name,
                "object_name": stat.object_name,
                "size": stat.size,
                "etag": stat.etag,
                "content_type": stat.content_type,
                "last_modified": stat.last_modified,
                "metadata": stat.metadata
            }
            print(f"✓ Retrieved object info for '{bucket_name}/{object_name}' successfully")
            return info
        except S3Error as e:
            print(f"✗ Failed to get object info: {e}")
            return None
    
    def get_presigned_url(
        self,
        bucket_name: str,
        object_name: str,
        expires: timedelta = timedelta(hours=1)
    ) -> Optional[str]:
        """
        Generate a presigned URL (for temporary access)
        
        Args:
            bucket_name: Bucket name
            object_name: Object name
            expires: Expiration time
            
        Returns:
            Optional[str]: Presigned URL
        """
        try:
            url = self.client.presigned_get_object(bucket_name, object_name, expires)
            print(f"✓ Presigned URL generated successfully")
            return url
        except S3Error as e:
            print(f"✗ Failed to generate presigned URL: {e}")
            return None
    
    def copy_object(
        self,
        source_bucket: str,
        source_object: str,
        dest_bucket: str,
        dest_object: str
    ) -> bool:
        """
        Copy an object
        
        Args:
            source_bucket: Source bucket
            source_object: Source object name
            dest_bucket: Destination bucket
            dest_object: Destination object name
            
        Returns:
            bool: True if copied successfully
        """
        try:
            from minio.commonconfig import CopySource
            
            # Ensure destination bucket exists
            if not self.client.bucket_exists(dest_bucket):
                self.create_bucket(dest_bucket)
            
            # Copy object
            self.client.copy_object(
                dest_bucket,
                dest_object,
                CopySource(source_bucket, source_object)
            )
            print(f"✓ Object copied successfully: '{source_bucket}/{source_object}' -> '{dest_bucket}/{dest_object}'")
            return True
        except S3Error as e:
            print(f"✗ Failed to copy object: {e}")
            return False


# Example usage
if __name__ == "__main__":
    # Initialize client
    minio_client = MinIOClient(
        endpoint="localhost:9000",
        access_key="minioadmin",
        secret_key="minioadmin",
        secure=False
    )
    
    # Create bucket
    bucket_name = "test-bucket"
    minio_client.create_bucket(bucket_name)
    
    # List all buckets
    buckets = minio_client.list_buckets()
    print(f"Bucket list: {buckets}")
    
    # Upload text data
    test_data = b"Hello, MinIO! This is a test file."
    minio_client.upload_data(
        bucket_name,
        "test.txt",
        test_data,
        content_type="text/plain"
    )
    
    # List objects
    objects = minio_client.list_objects(bucket_name)
    print(f"Object list: {objects}")
    
    # Get object info
    info = minio_client.get_object_info(bucket_name, "test.txt")
    print(f"Object info: {info}")
    
    # Download data
    downloaded_data = minio_client.download_data(bucket_name, "test.txt")
    print(f"Downloaded data: {downloaded_data.decode('utf-8')}")
    
    # Generate presigned URL
    url = minio_client.get_presigned_url(bucket_name, "test.txt")
    print(f"Presigned URL: {url}")
    
    # Delete object
    minio_client.delete_object(bucket_name, "test.txt")
    
    # Delete bucket
    minio_client.delete_bucket(bucket_name)
