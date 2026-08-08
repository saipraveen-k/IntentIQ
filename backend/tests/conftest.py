import os
import asyncio
import pytest

@pytest.fixture(scope="session", autouse=True)
def set_env():
    os.environ["AUTH_MOCK_MODE"] = "true"

@pytest.fixture(scope="session", autouse=True)
def run_startup():
    # Set mock auth mode before importing app to make sure it's applied
    os.environ["AUTH_MOCK_MODE"] = "true"
    from app.main import startup_event
    
    # Run the startup event synchronously during session setup
    loop = asyncio.get_event_loop()
    loop.run_until_complete(startup_event())
