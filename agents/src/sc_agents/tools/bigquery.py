"""BigQuery: the history the agents analyse, one dataset per environment (infra/prod analytics.tf; the schemas are in
infra/prod/bigquery/). Postgres stays the record; nothing here is personal.

- The Data agent loads the DMS exports with load jobs (free): `stock_snapshots`, `secondary_sales`, `shelf_counts`.
  A file already loaded (its `source_file` is in the table) is not loaded again, and the queries count a day's row once
  however often it was loaded.
- The Watcher reads sell-through, the Valuer recent prices, Outreach the day-7 shelf counts.
- `channel_prices` gains a row for each awarded price (deal.closed) and each scheme sent; `impact_ledger` a row per
  exit of a cleared batch; `agent_runs` a row per agent run. These are streaming inserts with row ids, so a retried
  insert is not doubled.
"""

import asyncio
from functools import cached_property
from typing import Any, Protocol

from sc_agents.settings import Settings

TABLES = ("secondary_sales", "stock_snapshots", "shelf_counts", "channel_prices", "impact_ledger", "agent_runs")


class Warehouse(Protocol):
    async def loaded(self, table: str, source_file: str) -> bool:
        """whether a file's rows are in a table already"""
        ...

    async def load(self, table: str, rows: list[dict[str, Any]]) -> int:
        """a load job appending rows; how many went in"""
        ...

    async def insert(self, table: str, rows: list[dict[str, Any]], row_ids: list[str] | None = None) -> None:
        """a streaming insert (deduplicated by row id)"""
        ...

    async def price_history(self, client: str, sku: str, *, days: int = 90) -> list[dict[str, Any]]:
        """recent prices paid for an SKU, by channel: n, avgPrice, avgPctOfMrp, lastOn, lastPrice"""
        ...

    async def sales_means(
        self, client: str, *, window: int = 28, until: str | None = None
    ) -> dict[tuple[str, str], float]:
        """units a day by (distributor, SKU), over the last `window` days of the loaded history up to `until` (the
        journey's day, ISO). A story replayed from its own calendar leaves later days loaded by earlier replays"""
        ...

    async def sales_days(self, client: str) -> int:
        """how many days of secondary sales are loaded"""
        ...

    async def shelf_counts(self, client: str, ref: str) -> list[dict[str, Any]]:
        """the latest count of each kirana's scheme packs left: [{kirana, left}]"""
        ...

    async def files_loaded(self, client: str) -> set[str]:
        """every export file loaded for a client"""
        ...


class BigQueryWarehouse:
    def __init__(self, settings: Settings):
        self.project = settings.google_cloud_project
        self.dataset = settings.bq_dataset
        self.location = settings.bq_location
        self._schemas: dict[str, Any] = {}

    @cached_property
    def client(self):
        from google.cloud import bigquery

        from sc_agents.gcp import credentials

        return bigquery.Client(project=self.project, credentials=credentials(), location=self.location)

    def t(self, table: str) -> str:
        assert table in TABLES or table == "agent_evals", table
        return f"`{self.project}.{self.dataset}.{table}`"

    def _query(self, sql: str, **params: Any) -> list[dict[str, Any]]:
        from google.cloud import bigquery

        types = {int: "INT64", float: "FLOAT64", str: "STRING"}
        config = bigquery.QueryJobConfig(
            query_parameters=[bigquery.ScalarQueryParameter(k, types[type(v)], v) for k, v in params.items()]
        )
        return [dict(r.items()) for r in self.client.query(sql, job_config=config).result()]

    async def query(self, sql: str, **params: Any) -> list[dict[str, Any]]:
        return await asyncio.to_thread(self._query, sql, **params)

    async def loaded(self, table: str, source_file: str) -> bool:
        rows = await self.query(f"SELECT COUNT(*) AS n FROM {self.t(table)} WHERE source_file = @f", f=source_file)
        return bool(rows and rows[0]["n"])

    def _load(self, table: str, rows: list[dict[str, Any]]) -> int:
        from google.cloud import bigquery

        ref = f"{self.project}.{self.dataset}.{table}"
        if table not in self._schemas:
            self._schemas[table] = self.client.get_table(ref).schema
        config = bigquery.LoadJobConfig(
            schema=self._schemas[table],
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        )
        job = self.client.load_table_from_json(rows, ref, job_config=config)
        job.result(timeout=120)
        return int(job.output_rows or len(rows))

    async def load(self, table: str, rows: list[dict[str, Any]]) -> int:
        if not rows:
            return 0
        return await asyncio.to_thread(self._load, table, rows)

    def _insert(self, table: str, rows: list[dict[str, Any]], row_ids: list[str] | None) -> None:
        errors = self.client.insert_rows_json(f"{self.project}.{self.dataset}.{table}", rows, row_ids=row_ids)
        if errors:
            raise RuntimeError(f"BigQuery refused rows for {table}: {str(errors)[:300]}")

    async def insert(self, table: str, rows: list[dict[str, Any]], row_ids: list[str] | None = None) -> None:
        if rows:
            await asyncio.to_thread(self._insert, table, rows, row_ids)

    async def price_history(self, client: str, sku: str, *, days: int = 90) -> list[dict[str, Any]]:
        t = self.t("channel_prices")
        rows = await self.query(
            f"""
            SELECT channel, COUNT(*) AS n, ROUND(AVG(price_per_unit), 2) AS avg_price,
                   ROUND(AVG(pct_of_mrp), 3) AS avg_pct, MAX(priced_on) AS last_on,
                   ARRAY_AGG(price_per_unit ORDER BY priced_on DESC, recorded_at DESC LIMIT 1)[OFFSET(0)] AS last_price
            FROM {t}
            WHERE client_id = @client AND sku_id = @sku
              AND priced_on >= DATE_SUB((SELECT MAX(priced_on) FROM {t} WHERE client_id = @client), INTERVAL @days DAY)
            GROUP BY channel ORDER BY channel""",
            client=client,
            sku=sku,
            days=days,
        )
        return [
            {
                "channel": r["channel"],
                "n": int(r["n"]),
                "avgPrice": float(r["avg_price"]),
                "avgPctOfMrp": float(r["avg_pct"]) if r["avg_pct"] is not None else None,
                "lastOn": r["last_on"].isoformat() if r["last_on"] else None,
                "lastPrice": float(r["last_price"]),
            }
            for r in rows
        ]

    async def sales_means(
        self, client: str, *, window: int = 28, until: str | None = None
    ) -> dict[tuple[str, str], float]:
        t = self.t("secondary_sales")
        upto = "AND sale_date <= DATE(@until)" if until else ""
        bound = {"until": until} if until else {}
        rows = await self.query(
            f"""
            WITH sales AS (
              SELECT * FROM {t} WHERE client_id = @client {upto}
              QUALIFY ROW_NUMBER() OVER (
                PARTITION BY distributor_id, pincode, sku_id, sale_date ORDER BY loaded_at DESC) = 1
            ), bounds AS (SELECT MAX(sale_date) AS last_day, MIN(sale_date) AS first_day FROM sales)
            SELECT distributor_id, sku_id,
                   SUM(units) / (DATE_DIFF(ANY_VALUE(b.last_day),
                     GREATEST(ANY_VALUE(b.first_day), DATE_SUB(ANY_VALUE(b.last_day), INTERVAL @window - 1 DAY)),
                     DAY) + 1) AS per_day
            FROM sales s CROSS JOIN bounds b
            WHERE s.sale_date > DATE_SUB(b.last_day, INTERVAL @window DAY)
            GROUP BY distributor_id, sku_id""",
            client=client,
            window=window,
            **bound,
        )
        return {(r["distributor_id"], r["sku_id"]): float(r["per_day"]) for r in rows}

    async def sales_days(self, client: str) -> int:
        rows = await self.query(
            f"SELECT COUNT(DISTINCT sale_date) AS n FROM {self.t('secondary_sales')} WHERE client_id = @client",
            client=client,
        )
        return int(rows[0]["n"]) if rows else 0

    async def shelf_counts(self, client: str, ref: str) -> list[dict[str, Any]]:
        rows = await self.query(
            f"""
            SELECT kirana_id, units_left FROM {self.t("shelf_counts")}
            WHERE client_id = @client AND batch_ref = @ref
            QUALIFY ROW_NUMBER() OVER (PARTITION BY kirana_id ORDER BY counted_on DESC, loaded_at DESC) = 1
            ORDER BY kirana_id""",
            client=client,
            ref=ref,
        )
        return [{"kirana": r["kirana_id"], "left": int(r["units_left"])} for r in rows]

    async def files_loaded(self, client: str) -> set[str]:
        parts = " UNION DISTINCT ".join(
            f"SELECT source_file FROM {self.t(t)} WHERE client_id = @client AND source_file IS NOT NULL"
            for t in ("stock_snapshots", "secondary_sales", "shelf_counts")
        )
        return {r["source_file"] for r in await self.query(parts, client=client)}
