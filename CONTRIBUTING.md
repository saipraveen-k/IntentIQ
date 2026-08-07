# Contributing to IntentIQ

Thank you for your interest in contributing to **IntentIQ**! We welcome contributions to our AI-powered multi-intent recommendation engine.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) at all times.

---

## How to Contribute

### 1. Reporting Bugs
- Open a GitHub Issue detailing the steps to reproduce the issue.
- Include environment metadata (Python version, Node version, OS).

### 2. Feature Requests
- Propose new features via GitHub Discussions or Issues.
- Outline the technical motivation and proposed AI agent architecture.

### 3. Pull Requests
1. Fork the repository and create a feature branch (`git checkout -b feature/my-feature`).
2. Ensure code follows SOLID principles and repository patterns.
3. Run test and verification suites before submitting:
   ```bash
   # Backend Verification
   cd backend && python verify_pipeline.py

   # Frontend Build Check
   cd frontend && npm run build
   ```
4. Commit your changes and open a Pull Request targeting `main`.

---

## License
By contributing to IntentIQ, you agree that your contributions will be licensed under the [MIT License](LICENSE).
