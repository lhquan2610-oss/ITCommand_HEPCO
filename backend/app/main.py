"""
FastAPI Application Entrypoint for HEPCO IT COMMAND CENTER (HICC V1.0).
Mounts REST API v1 routes and standardized error handling.
"""

from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.v1.routes import router as api_v1_router

app = FastAPI(
    title="HEPCO IT COMMAND CENTER (HICC V1.0)",
    description="On-Premise Network Inventory, Discovery & Monitoring System for HEPCO",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": str(exc),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HEPCO IT COMMAND CENTER API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


app.include_router(api_v1_router)
