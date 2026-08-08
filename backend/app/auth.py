import os
import logging
import firebase_admin
from firebase_admin import auth, credentials
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("auth_middleware")

# Initialize Firebase Admin SDK
firebase_initialized = False
try:
    project_id = os.environ.get("FIREBASE_PROJECT_ID")
    private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
    client_email = os.environ.get("FIREBASE_CLIENT_EMAIL")

    if project_id and private_key and client_email:
        # replace escaped newlines in private key
        formatted_private_key = private_key.replace("\\n", "\n")
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "private_key": formatted_private_key,
            "client_email": client_email,
            "token_url": "https://oauth2.googleapis.com/token",
        })
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully.")
    else:
        # Try to initialize with default credentials, or fallback to mock mode
        try:
            firebase_admin.initialize_app()
            firebase_initialized = True
            logger.info("Firebase Admin SDK initialized with default credentials.")
        except Exception:
            logger.warning(
                "Firebase Admin SDK not initialized: credentials not provided. "
                "Falling back to mock authentication mode (tokens starting with 'mock-' will be accepted)."
            )
except Exception as e:
    logger.error(f"Error initializing Firebase Admin SDK: {e}")

class FirebaseAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Paths that require authentication
        # Keep options/preflight requests open
        is_protected = any(path.startswith(p) for p in [
            "/api/v1/recommendations/feed",
            "/api/v1/search/semantic",
            "/api/v1/bundle",
            "/api/v1/event",
            "/api/v1/user/stats",
            "/api/v1/admin/events"
        ])
        
        if is_protected and request.method != "OPTIONS":
            auth_header = request.headers.get("Authorization")
            is_mock_enabled = os.environ.get("AUTH_MOCK_MODE") == "true"
            
            if is_mock_enabled:
                if not auth_header or not auth_header.startswith("Bearer "):
                    id_token = "mock-default-user"
                else:
                    id_token = auth_header.split(" ")[1]
            else:
                if not auth_header or not auth_header.startswith("Bearer "):
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Missing or invalid authorization header"}
                    )
                id_token = auth_header.split(" ")[1]
                if id_token.startswith("mock-"):
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Mock tokens are disabled in production mode"}
                    )

            try:
                if is_mock_enabled and id_token.startswith("mock-"):
                    # Mock authentication for local development and testing
                    # Extracts UID from mock token, e.g. mock-user123 -> uid: user123
                    uid = id_token.replace("mock-", "") if id_token.startswith("mock-") else "mock-default-user"
                    decoded_token = {
                        "uid": uid,
                        "email": f"{uid}@example.com",
                        "email_verified": "unverified" not in uid.lower(),
                        "admin": uid.lower().endswith("admin") or uid == "admin"
                    }
                    logger.debug(f"Mock authentication succeeded for UID: {uid}")
                else:
                    # Real Firebase Auth ID Token validation
                    if not firebase_initialized:
                        raise Exception("Firebase Admin SDK is not initialized")
                    decoded_token = auth.verify_id_token(id_token)
                
                # Check email verification
                if not decoded_token.get("email_verified", False):
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Email not verified"}
                    )
                
                # Attach user info to request state
                request.state.user = decoded_token
                request.state.uid = decoded_token.get("uid")
                
            except Exception as e:
                logger.error(f"Firebase token verification failed: {e}")
                return JSONResponse(
                    status_code=401,
                    content={"detail": f"Token verification failed: {str(e)}"}
                )
        
        # If not protected or verification succeeded, proceed to endpoint
        response = await call_next(request)
        return response
