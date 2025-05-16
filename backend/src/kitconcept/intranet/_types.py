from dataclasses import dataclass
from typing import Protocol
from typing import TypedDict


AnswersKeycloak = TypedDict(
    "AnswersKeycloak",
    {
        "provider": str,
        "oidc-server_url": str,
        "oidc-realm_name": str,
        "oidc-client_id": str,
        "oidc-client_secret": str,
        "oidc-site-url": str,
        "oidc-scope": list[str],
    },
)

AnswersOIDC = TypedDict(
    "AnswersOIDC",
    {
        "provider": str,
        "oidc-issuer": str,
        "oidc-client_id": str,
        "oidc-client_secret": str,
        "oidc-site-url": str,
        "oidc-scope": list[str],
    },
)

AnswersAuthomatic = TypedDict(
    "AnswersAuthomatic",
    {
        "provider": str,
        "authomatic-client_id": str,
        "authomatic-client_secret": str,
        "authomatic-scope": list[str] | None,
    },
)


AuthAnswers = AnswersKeycloak | AnswersAuthomatic | AnswersOIDC


class AuthSetupHandler(Protocol):
    def __call__(self, answers: AuthAnswers) -> None: ...


@dataclass
class AuthenticationProvider:
    handler: AuthSetupHandler
    profiles: tuple[str]
