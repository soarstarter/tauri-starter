# Security Policy

## Supported versions

Security fixes are made on the `main` branch and included in the next release. Older releases are not patched
separately.

## Reporting a vulnerability

Please do not open a public issue for security problems.

Report it privately through GitHub instead: open the repository's **Security** tab and choose **Report a
vulnerability**. Include the affected version or commit, the platform, steps to reproduce, and the impact you expect.

You can expect an acknowledgement within a few days. Once a fix is ready, we will publish it and credit you in the
advisory unless you prefer to stay anonymous.

## Scope

In scope: the code in this repository, including the Rust commands, the capability files, the content security policy,
external-link handling, log redaction, and secure storage.

Out of scope: vulnerabilities in Tauri, the system WebView, Rust crates, npm packages, or other dependencies themselves
(report those upstream), and issues that require an attacker to already control the user's machine.
