from kitconcept.intranet.ai_edit import config


def test_incomplete_configuration_is_explained_once(monkeypatch, caplog):
    monkeypatch.setattr(config, "ai_edit_enabled", lambda: True)
    monkeypatch.setattr(config, "_warned", False)
    monkeypatch.setenv(config.ENV_URL, "http://llm.invalid")
    monkeypatch.delenv(config.ENV_CHAT_MODEL, raising=False)
    assert config.get_ai_edit_config() is None
    assert config.get_ai_edit_config() is None
    [message] = [r.getMessage() for r in caplog.records]
    assert "KITCONCEPT_SOLR_LLM_CHAT_MODEL" in message


def test_chat_timeout_from_the_environment(monkeypatch):
    monkeypatch.setattr(config, "ai_edit_enabled", lambda: True)
    monkeypatch.setenv(config.ENV_URL, "http://llm.invalid")
    monkeypatch.setenv(config.ENV_CHAT_MODEL, "test")
    monkeypatch.delenv(config.ENV_TIMEOUT, raising=False)
    assert config.get_ai_edit_config().chat_timeout == config.CHAT_TIMEOUT
    monkeypatch.setenv(config.ENV_TIMEOUT, "300")
    assert config.get_ai_edit_config().chat_timeout == 300.0
    # Not a positive number: the default
    monkeypatch.setenv(config.ENV_TIMEOUT, "soon")
    assert config.get_ai_edit_config().chat_timeout == config.CHAT_TIMEOUT
