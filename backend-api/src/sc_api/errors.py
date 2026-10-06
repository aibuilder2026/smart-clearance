"""Every error the API answers is JSON in one shape, the one the frontend's transport reads:
{"message": str, "fields"?: {field: message}} (frontend/api/src/http.ts)."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

log = logging.getLogger("sc_api")


class ApiError(Exception):
    """A refusal the API explains: 401, 403, 404, 409 or 422, in words a person reads."""

    def __init__(self, status: int, message: str, fields: dict[str, str] | None = None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.fields = fields or {}


def not_found(what: str) -> ApiError:
    return ApiError(404, f"No such {what}.")


def body(message: str, fields: dict[str, str] | None = None) -> dict:
    return {"message": message, **({"fields": fields} if fields else {})}


def _field_name(loc: tuple) -> str:
    parts = [str(p) for p in loc if p not in ("body", "query", "path")]
    return parts[0] if parts else "body"


def install(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api(_: Request, e: ApiError):
        return JSONResponse(body(e.message, e.fields), status_code=e.status)

    @app.exception_handler(RequestValidationError)
    async def _invalid(_: Request, e: RequestValidationError):
        fields: dict[str, str] = {}
        for err in e.errors():
            fields.setdefault(_field_name(tuple(err.get("loc", ()))), str(err.get("msg", "Invalid value.")))
        return JSONResponse(body("Check the highlighted fields.", fields), status_code=422)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, e: StarletteHTTPException):
        message = {404: "Not found.", 405: "Method not allowed.", 401: "Sign in to the console first."}.get(
            e.status_code, str(e.detail)
        )
        return JSONResponse(body(message), status_code=e.status_code, headers=getattr(e, "headers", None))

    @app.exception_handler(RateLimitExceeded)
    async def _limited(_: Request, e: RateLimitExceeded):
        return JSONResponse(body("Too many tries. Wait a minute, then try again."), status_code=429)

    @app.exception_handler(Exception)
    async def _crash(request: Request, e: Exception):
        log.exception("unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(body("Something went wrong on our side. Try again."), status_code=500)
