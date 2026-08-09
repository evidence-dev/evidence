"""Publish results from a Jupyter notebook into an Evidence page.

Evidence compiles any ``.ipynb`` under ``pages/`` into a page. Markdown cells
are already Evidence markdown, so components and SQL blocks work without this
module. Use it when a *Python value* needs to reach the page:

    import evidence

    evidence.frontmatter(title="Revenue")
    evidence.data(df, "revenue")               # -> `revenue` on the page
    evidence.md("<BarChart data={revenue} x=month y=revenue/>")

Everything is emitted through a single mimetype,
``application/vnd.evidence.v1+json``, which Evidence understands and every other
notebook front end ignores. Nothing here is required: a cell can emit the same
payload with ``IPython.display.display(payload, raw=True)``.

This module has no dependencies. pandas is used when present and is not needed
otherwise — a list of dicts works everywhere a DataFrame does.
"""

from __future__ import annotations

import base64
import datetime as _dt
import decimal
import math
import os
import warnings

__all__ = [
    "data", "md", "markdown", "component", "frontmatter", "ref", "table",
    "cube", "cube_meta", "MIME",
]

MIME = "application/vnd.evidence.v1+json"

#: Datasets are inlined into the generated page, so a very large frame makes a
#: very large page. Aggregate first; this is the point at which we say so.
ROW_WARNING_THRESHOLD = 20_000


def _display(payload):
    """Emit one Evidence payload."""
    try:
        from IPython.display import display
    except ImportError as exc:  # pragma: no cover - only outside a kernel
        raise RuntimeError(
            "evidence.py must run inside a Jupyter kernel (IPython is not available)"
        ) from exc

    display({MIME: payload}, raw=True)


def _clean(value):
    """Coerce a Python value into something JSON can represent losslessly enough.

    Notebooks carry numpy scalars, pandas timestamps, Decimals and NaN, none of
    which survive a strict JSON encoder. NaN in particular would produce an
    ``.ipynb`` that is not valid JSON, so it is removed here rather than later.
    """
    if value is None:
        return None

    if isinstance(value, bool):
        return value

    if isinstance(value, (int,)) and not isinstance(value, bool):
        return value

    if isinstance(value, float):
        return value if math.isfinite(value) else None

    if isinstance(value, str):
        return value

    if isinstance(value, decimal.Decimal):
        as_float = float(value)
        return as_float if math.isfinite(as_float) else None

    if isinstance(value, (_dt.datetime, _dt.date, _dt.time)):
        return value.isoformat()

    if isinstance(value, _dt.timedelta):
        return value.total_seconds()

    if isinstance(value, (bytes, bytearray)):
        return base64.b64encode(bytes(value)).decode("ascii")

    # numpy scalars, pandas NA/NaT, and anything else that mimics them.
    item = getattr(value, "item", None)
    if callable(item) and getattr(value, "shape", ()) == ():
        try:
            return _clean(item())
        except Exception:  # pragma: no cover - exotic dtypes
            pass

    if _is_missing(value):
        return None

    if isinstance(value, dict):
        return {str(k): _clean(v) for k, v in value.items()}

    if isinstance(value, (list, tuple, set, frozenset)):
        return [_clean(v) for v in value]

    tolist = getattr(value, "tolist", None)
    if callable(tolist):
        try:
            return _clean(tolist())
        except Exception:  # pragma: no cover
            pass

    return str(value)


def _is_missing(value) -> bool:
    """True for pandas NA / NaT and numpy NaN, without importing pandas."""
    try:
        import pandas as pd
    except ImportError:
        return False
    try:
        result = pd.isna(value)
    except (TypeError, ValueError):
        return False
    return result is True


def _is_dataframe(obj) -> bool:
    return hasattr(obj, "columns") and hasattr(obj, "to_dict") and hasattr(obj, "dtypes")


def _date_columns(frame) -> list:
    """Columns Evidence should revive as JavaScript Dates.

    Date axes and time-series components need real Dates, not ISO strings, so
    the column names are carried alongside the rows.
    """
    try:
        from pandas.api.types import is_datetime64_any_dtype
    except ImportError:
        return []

    columns = []
    for name in frame.columns:
        try:
            if is_datetime64_any_dtype(frame[name]):
                columns.append(str(name))
        except Exception:  # pragma: no cover - unusual index types
            continue
    return columns


def _to_rows(dataset):
    """Normalise a DataFrame, a list of dicts or a dict of columns into rows."""
    if _is_dataframe(dataset):
        frame = dataset.reset_index() if dataset.index.name is not None else dataset
        rows = frame.to_dict(orient="records")
        return [{str(k): _clean(v) for k, v in row.items()} for row in rows], _date_columns(frame)

    if isinstance(dataset, dict):
        # dict of column -> values
        keys = list(dataset.keys())
        length = max((len(v) for v in dataset.values()), default=0)
        rows = [{str(k): _clean(dataset[k][i]) for k in keys} for i in range(length)]
        return rows, []

    rows = []
    for row in dataset or []:
        if isinstance(row, dict):
            rows.append({str(k): _clean(v) for k, v in row.items()})
        else:
            rows.append({"value": _clean(row)})
    return rows, []


def data(dataset, name: str, dates=None):
    """Publish a dataset to the page under ``name``.

    The name becomes a variable available to every Evidence component on the
    page::

        evidence.data(df, "revenue")
        # then, in a markdown cell:
        # <BarChart data={revenue} x=month y=revenue/>

    :param dataset: a pandas DataFrame, a list of dicts, or a dict of columns
    :param name: the page variable to bind — must be a valid identifier
    :param dates: column names to revive as JavaScript Dates; detected
        automatically for pandas datetime columns
    """
    rows, detected_dates = _to_rows(dataset)

    if len(rows) > ROW_WARNING_THRESHOLD:
        warnings.warn(
            f"evidence.data('{name}') published {len(rows):,} rows. Datasets are "
            "inlined into the page — aggregate in the notebook, or write to a "
            "source and query it with SQL instead.",
            stacklevel=2,
        )

    _display(
        {
            "kind": "dataset",
            "name": name,
            "rows": rows,
            "dates": sorted({*(dates or []), *detected_dates}),
        }
    )
    return dataset


def md(text: str):
    """Emit Evidence markdown verbatim — components, SQL blocks and prose.

    This is the escape hatch for markup that has to be *computed*::

        evidence.md(f"## {region} — {len(df):,} orders")
    """
    _display({"kind": "markdown", "value": str(text)})


#: Spelled-out alias for :func:`md`.
markdown = md


def ref(name: str) -> dict:
    """Reference a published dataset from a component prop.

    Props are otherwise literals, so a dataset has to be marked as a reference
    to be passed by name rather than by value::

        evidence.data(df, "revenue")
        evidence.component("BigValue", data=evidence.ref("revenue"), value="total")
    """
    return {"__evidence_ref__": str(name)}


def component(name: str, **props):
    """Render an Evidence component with props computed in Python::

    evidence.component(
        "BigValue", data=evidence.ref("revenue"), value="total", title="Revenue"
    )
    """
    _display({"kind": "component", "name": name, "props": _clean(props)})


def frontmatter(**values):
    """Set page frontmatter — ``title``, ``description``, ``og``, and the rest.

    Equivalent to the ``---`` block at the top of a ``.md`` page. Notebook-level
    ``metadata.evidence`` does the same thing without running a cell.
    """
    _display({"kind": "frontmatter", "value": _clean(values)})


def table(dataset, name: str, **props):
    """Publish a dataset and render it as a ``DataTable`` in one step."""
    data(dataset, name)
    component("DataTable", data=ref(name), **props)


# --------------------------------------------------------------------------
# Cube — the semantic layer
# --------------------------------------------------------------------------
#
# A notebook that recomputes a metric in pandas has quietly forked it. Pulling
# from Cube instead means the number in the notebook is the number on every
# dashboard, by construction.

CUBE_API_URL = os.environ.get("CUBE_API_URL", "http://localhost:4000")
CUBE_API_TOKEN = os.environ.get("CUBE_API_TOKEN")


def cube(
    query: dict,
    api_url: str | None = None,
    token: str | None = None,
    timeout: float = 60.0,
):
    """Run a Cube query and return the result as a DataFrame.

    ``query`` is a Cube REST query — the same JSON the exploration surface and
    every other Cube client sends::

        df = evidence.cube({
            "measures": ["orders.revenue"],
            "dimensions": ["orders.region"],
            "timeDimensions": [{"dimension": "orders.ordered_at", "granularity": "month"}],
            "segments": ["orders.not_cancelled"],
        })

    Columns come back under their Cube member names (``orders.revenue``).
    Measures are cast to numbers and time dimensions to datetimes, because Cube
    sends both as strings.

    Requires no dependencies beyond the standard library; pandas is used for the
    return value when it is installed, and a list of dicts is returned when it
    is not.
    """
    import json
    import time
    import urllib.error
    import urllib.request

    base = (api_url or CUBE_API_URL).rstrip("/")
    if base.endswith("/cubejs-api/v1"):
        base = base[: -len("/cubejs-api/v1")]

    headers = {"Content-Type": "application/json"}
    bearer = token or CUBE_API_TOKEN
    if bearer:
        headers["Authorization"] = bearer

    payload = json.dumps({"query": query}).encode("utf-8")
    deadline = time.monotonic() + timeout

    while True:
        request = urllib.request.Request(
            f"{base}/cubejs-api/v1/load", data=payload, headers=headers, method="POST"
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            raise RuntimeError(f"Cube returned {exc.code}: {detail[:400]}") from exc

        # Cube answers 200 with this while a query warms, and expects a retry.
        if body.get("error") == "Continue wait":
            if time.monotonic() > deadline:
                raise TimeoutError("Cube query did not complete in time")
            time.sleep(0.7)
            continue
        if body.get("error"):
            raise RuntimeError(f"Cube error: {body['error']}")
        break

    # A regular query answers flat; compare-date-range and blending wrap in
    # `results`. Both shapes are live in Cube 1.7.
    result = body["results"][0] if isinstance(body.get("results"), list) else body
    rows = result.get("data", [])
    annotation = result.get("annotation", {})

    measures = set(annotation.get("measures", {}))
    times = set(annotation.get("timeDimensions", {}))

    try:
        import pandas as pd
    except ImportError:
        return rows

    frame = pd.DataFrame(rows)
    for column in frame.columns:
        if column in measures:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")
        elif column in times or column.rsplit(".", 1)[-1] in {
            "year", "quarter", "month", "week", "day", "hour",
        }:
            frame[column] = pd.to_datetime(frame[column], errors="coerce")
    return frame


def cube_meta(api_url: str | None = None, token: str | None = None) -> dict:
    """Return Cube's data model — cubes, measures, dimensions, segments.

    Useful for discovering member names without leaving the notebook::

        for c in evidence.cube_meta()["cubes"]:
            print(c["name"], [m["name"] for m in c["measures"]])
    """
    import json
    import urllib.request

    base = (api_url or CUBE_API_URL).rstrip("/")
    if base.endswith("/cubejs-api/v1"):
        base = base[: -len("/cubejs-api/v1")]

    headers = {}
    bearer = token or CUBE_API_TOKEN
    if bearer:
        headers["Authorization"] = bearer

    request = urllib.request.Request(f"{base}/cubejs-api/v1/meta", headers=headers)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))
