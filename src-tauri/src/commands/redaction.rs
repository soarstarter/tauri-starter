use regex::Regex;
use std::sync::OnceLock;

fn sensitive_value_pattern() -> &'static Regex {
    static PATTERN: OnceLock<Regex> = OnceLock::new();
    PATTERN.get_or_init(|| {
        Regex::new(
            r"(?i)((?:password|secret|token|api[_-]?key|cookie|session|credential|pin)\s*[=:]\s*)([^\s,;&]+)",
        )
        .expect("valid sensitive value regex")
    })
}

fn authorization_value_pattern() -> &'static Regex {
    static PATTERN: OnceLock<Regex> = OnceLock::new();
    PATTERN.get_or_init(|| {
        Regex::new(r"(?i)(authorization\s*[=:]\s*)([^\s,;&]+)").expect("valid authorization regex")
    })
}

fn bearer_value_pattern() -> &'static Regex {
    static PATTERN: OnceLock<Regex> = OnceLock::new();
    PATTERN.get_or_init(|| {
        Regex::new(r"(?i)(bearer\s+)([a-z0-9._~+/=-]+)").expect("valid bearer regex")
    })
}

fn url_credentials_pattern() -> &'static Regex {
    static PATTERN: OnceLock<Regex> = OnceLock::new();
    PATTERN.get_or_init(|| {
        Regex::new(r"(?i)(https?://)[^/\s:@]+:[^/\s@]+@").expect("valid url credentials regex")
    })
}

pub fn redact_string(value: &str) -> String {
    let value = authorization_value_pattern().replace_all(value, |captures: &regex::Captures| {
        let prefix = captures.get(1).map_or("", |value| value.as_str());
        let credential = captures.get(2).map_or("", |value| value.as_str());
        if credential.eq_ignore_ascii_case("bearer") {
            captures
                .get(0)
                .map_or("", |value| value.as_str())
                .to_string()
        } else {
            format!("{prefix}[redacted]")
        }
    });
    let value = sensitive_value_pattern().replace_all(&value, "${1}[redacted]");
    let value = bearer_value_pattern().replace_all(&value, "${1}[redacted]");
    url_credentials_pattern()
        .replace_all(&value, "${1}[redacted]@")
        .into_owned()
}

#[cfg(test)]
mod tests {
    use super::redact_string;

    #[test]
    fn redacts_inline_secrets_and_bearer_tokens() {
        assert_eq!(
            redact_string("password=hunter2 api_key=abc Authorization: Bearer token-123"),
            "password=[redacted] api_key=[redacted] Authorization: Bearer [redacted]"
        );
    }

    #[test]
    fn redacts_url_credentials() {
        assert_eq!(
            redact_string("https://user:pass@example.com/path"),
            "https://[redacted]@example.com/path"
        );
    }
}
