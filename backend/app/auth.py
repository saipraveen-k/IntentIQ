import os
import logging
import firebase_admin
from firebase_admin import auth, credentials
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse

from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger("auth_middleware")

# Initialize Firebase Admin SDK
firebase_initialized = False
try:
    project_id = os.environ.get("FIREBASE_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT")
    private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
    client_email = os.environ.get("FIREBASE_CLIENT_EMAIL")

    if project_id and private_key and client_email:
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
        logger.info(f"Firebase Admin SDK initialized successfully for project {project_id}.")
    elif project_id and os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        try:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, options={'projectId': project_id})
            firebase_initialized = True
            logger.info("Firebase Admin SDK initialized with default credentials.")
        except Exception as e:
            logger.warning(f"Firebase default credentials initialization failed: {e}")
            firebase_initialized = False
    else:
        logger.info("Firebase credentials not configured. Using local/mock development authentication mode.")
        firebase_initialized = False
except Exception as e:
    logger.error(f"Error initializing Firebase Admin SDK: {e}")
    firebase_initialized = False

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
            is_mock_enabled = os.environ.get("AUTH_MOCK_MODE", "true" if not firebase_initialized else "false").lower() == "true"
            
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
                if is_mock_enabled:
                    # Mock authentication for local development and testing
                    if id_token.startswith("mock-"):
                        uid = id_token.replace("mock-", "")
                    else:
                        uid = "dev-user"
                    decoded_token = {
                        "uid": uid,
                        "email": f"{uid}@example.com",
                        "email_verified": True,
                        "admin": True
                    }
                    logger.debug(f"Mock authentication succeeded for UID: {uid}")
                else:
                    # Real Firebase Auth ID Token validation
                    if not firebase_initialized:
                        raise Exception("Firebase Admin SDK is not initialized. Please configure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in environment variables.")
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
