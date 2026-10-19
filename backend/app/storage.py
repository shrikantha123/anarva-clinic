"""Record storage contract and the production Supabase PostgREST adapter."""
import logging
import time
from typing import Protocol

import httpx

from app import db
from app.errors import AppError
from app.logging_setup import event, record_operation

logger = logging.getLogger("app.storage")


class RecordStore(Protocol):
    def health_check(self) -> None: ...

    def find(self, table: str, column: str, value: str) -> dict | None: ...

    def insert(self, table: str, record: dict) -> None: ...

    def list_all(self, table: str) -> list[dict]: ...

    def set_status(self, table: str, status: str, column: str, value: str) -> bool: ...

    def delete_old_records(self, table: str, days: int = 30) -> int: ...

    def close(self) -> None: ...


class SupabaseStore:
    """Use the server-only service-role key to access RLS-protected tables."""

    _filters = {
        db.PATIENTS: {"patient_id"},
        db.APPOINTMENTS: {"id", "appointment_id"},
    }

    def __init__(self, url: str, service_role_key: str, client: httpx.Client | None = None):
        headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }
        self._client = client or httpx.Client(
            base_url=f"{url.rstrip('/')}/rest/v1/",
            headers=headers,
            timeout=httpx.Timeout(20, connect=5),
            limits=httpx.Limits(
                max_connections=20,
                max_keepalive_connections=10,
                keepalive_expiry=60,
            ),
        )
        if client is not None:
            self._client.headers.update(headers)

    def _request(self, method: str, table: str, *, params: dict | None = None,
                 record: dict | None = None, prefer: str | None = None) -> list[dict]:
        if table not in self._filters:
            raise ValueError("Unknown record table")
        headers = {"Prefer": prefer} if prefer else None
        started = time.perf_counter()
        latency_ms = int((time.perf_counter() - started) * 1000)
        try:
            response = self._client.request(
                method, table, params=params, json=record, headers=headers
            )
            response.raise_for_status()
            rows = response.json() if response.content else []
        except (httpx.HTTPError, ValueError) as exc:
            event(
                logger,
                "database_request_failed",
                logging.WARNING,
                method=method,
                table=table,
                reason=type(exc).__name__,
                ms=latency_ms,
            )
            record_operation(
                "database",
                "failed",
                latency_ms=latency_ms,
                db_status="failed",
                route=f"/{table}",
                http_method=method,
                error_details=f"{type(exc).__name__}: {exc}",
            )
            raise AppError(503, "Database service is unavailable") from None
        event(
            logger,
            "database_request_ok",
            method=method,
            table=table,
            rows=len(rows),
            ms=latency_ms,
        )
        record_operation(
            "database",
            "success",
            latency_ms=latency_ms,
            db_status="success",
            route=f"/{table}",
            http_method=method,
        )
        return rows

    def health_check(self) -> None:
        self._request("GET", db.PATIENTS, params={"select": "patient_id", "limit": "1"})

    def find(self, table: str, column: str, value: str) -> dict | None:
        if column not in self._filters.get(table, set()):
            raise ValueError("Unknown record filter")
        rows = self._request(
            "GET", table,
            params={"select": "*", column: f"eq.{value}", "limit": "1"},
        )
        return rows[0] if rows else None

    def insert(self, table: str, record: dict) -> None:
        self._request("POST", table, record=record, prefer="return=minimal")

    def list_all(self, table: str) -> list[dict]:
        return self._request(
            "GET", table, params={"select": "*", "order": "created_at.desc"}
        )

    def set_status(self, table: str, status: str, column: str, value: str) -> bool:
        if column not in self._filters.get(table, set()):
            raise ValueError("Unknown record filter")
        rows = self._request(
            "PATCH", table,
            params={"select": column, column: f"eq.{value}"},
            record={"status": status}, prefer="return=representation",
        )
        return bool(rows)

    def delete_old_records(self, table: str, days: int = 30) -> int:
        """Delete records older than specified days from Supabase."""
        from datetime import datetime, timedelta
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

        try:
            # First, fetch old records
            old_records = self._request(
                "GET", table,
                params={"select": "*", "created_at": f"lt.{cutoff_date}"}
            )

            deleted_count = 0
            for record in old_records:
                # Get the appropriate ID column based on table
                id_column = "patient_id" if table == db.PATIENTS else "id"
                record_id = record.get(id_column)

                if record_id:
                    try:
                        # Use DELETE with the ID filter
                        response = self._client.request(
                            "DELETE", table,
                            params={id_column: f"eq.{record_id}"},
                            headers={"Prefer": "return=minimal"}
                        )
                        response.raise_for_status()
                        deleted_count += 1
                    except Exception as exc:
                        event(
                            logger,
                            "delete_record_failed",
                            logging.WARNING,
                            table=table,
                            id=record_id,
                            reason=type(exc).__name__,
                        )

            event(
                logger,
                "delete_old_records_success",
                logging.INFO,
                table=table,
                days=days,
                deleted_count=deleted_count,
            )
            return deleted_count
        except Exception as exc:
            event(
                logger,
                "delete_old_records_failed",
                logging.ERROR,
                table=table,
                days=days,
                reason=type(exc).__name__,
            )
            return 0

    def close(self) -> None:
        self._client.close()
