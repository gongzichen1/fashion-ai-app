# models/data_store.py - 数据存储模型（简化版，使用文件存储）

import json
import os
from datetime import datetime


class DataStore:
    """简单的文件数据存储"""

    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)

    def _get_file_path(self, collection: str) -> str:
        """获取集合文件路径"""
        return os.path.join(self.data_dir, f'{collection}.json')

    def _load_collection(self, collection: str) -> list:
        """加载集合数据"""
        file_path = self._get_file_path(collection)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []

    def _save_collection(self, collection: str, data: list):
        """保存集合数据"""
        file_path = self._get_file_path(collection)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def insert(self, collection: str, document: dict) -> str:
        """插入文档"""
        data = self._load_collection(collection)
        document['created_at'] = datetime.now().isoformat()
        document['updated_at'] = datetime.now().isoformat()
        data.append(document)
        self._save_collection(collection, data)
        return document.get('id')

    def find_one(self, collection: str, query: dict) -> dict:
        """查找单个文档"""
        data = self._load_collection(collection)
        for doc in data:
            match = True
            for key, value in query.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                return doc
        return None

    def find_many(self, collection: str, query: dict = None, limit: int = 10) -> list:
        """查找多个文档"""
        data = self._load_collection(collection)
        if not query:
            return data[:limit]

        results = []
        for doc in data:
            match = True
            for key, value in query.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                results.append(doc)
                if len(results) >= limit:
                    break
        return results

    def update_one(self, collection: str, query: dict, update: dict) -> bool:
        """更新单个文档"""
        data = self._load_collection(collection)
        for i, doc in enumerate(data):
            match = True
            for key, value in query.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                doc.update(update)
                doc['updated_at'] = datetime.now().isoformat()
                data[i] = doc
                self._save_collection(collection, data)
                return True
        return False

    def delete_one(self, collection: str, query: dict) -> bool:
        """删除单个文档"""
        data = self._load_collection(collection)
        for i, doc in enumerate(data):
            match = True
            for key, value in query.items():
                if doc.get(key) != value:
                    match = False
                    break
            if match:
                data.pop(i)
                self._save_collection(collection, data)
                return True
        return False


# 全局数据存储实例
db = DataStore()
