#[cfg(not(debug_assertions))]
use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};
use specta::Type;
#[cfg(debug_assertions)]
use std::{
    collections::HashMap,
    sync::{Mutex, OnceLock},
};

#[cfg(not(debug_assertions))]
const SERVICE_NAME: &str = "com.soarstarter.tauri-starter";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize, Serialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum SecureKey {
    AccessToken,
    RefreshToken,
    ShowcaseSecret,
}

#[cfg(not(debug_assertions))]
impl SecureKey {
    fn account(self) -> &'static str {
        match self {
            SecureKey::AccessToken => "access-token",
            SecureKey::RefreshToken => "refresh-token",
            SecureKey::ShowcaseSecret => "showcase-secret",
        }
    }
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[allow(dead_code)]
pub enum SecureStorageErrorCode {
    EncryptionUnavailable,
    StorageFailure,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct SecureStorageError {
    pub code: SecureStorageErrorCode,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct SecureGetResult {
    pub ok: bool,
    pub value: Option<String>,
    pub error: Option<SecureStorageError>,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct SecureMutationResult {
    pub ok: bool,
    pub error: Option<SecureStorageError>,
}

trait CredentialStore {
    fn get(&self, key: SecureKey) -> Result<Option<String>, SecureStorageError>;
    fn set(&mut self, key: SecureKey, value: &str) -> Result<(), SecureStorageError>;
    fn delete(&mut self, key: SecureKey) -> Result<(), SecureStorageError>;
}

#[cfg(not(debug_assertions))]
struct OsCredentialStore;

#[cfg(not(debug_assertions))]
impl OsCredentialStore {
    fn entry(key: SecureKey) -> Result<Entry, SecureStorageError> {
        Entry::new(SERVICE_NAME, key.account()).map_err(map_keyring_error)
    }
}

#[cfg(not(debug_assertions))]
impl CredentialStore for OsCredentialStore {
    fn get(&self, key: SecureKey) -> Result<Option<String>, SecureStorageError> {
        match Self::entry(key)?.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(KeyringError::NoEntry) => Ok(None),
            Err(error) => Err(map_keyring_error(error)),
        }
    }

    fn set(&mut self, key: SecureKey, value: &str) -> Result<(), SecureStorageError> {
        Self::entry(key)?
            .set_password(value)
            .map_err(map_keyring_error)
    }

    fn delete(&mut self, key: SecureKey) -> Result<(), SecureStorageError> {
        match Self::entry(key)?.delete_credential() {
            Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
            Err(error) => Err(map_keyring_error(error)),
        }
    }
}

#[cfg(debug_assertions)]
#[derive(Default)]
struct DevelopmentCredentialStore {
    values: HashMap<SecureKey, String>,
}

#[cfg(debug_assertions)]
impl CredentialStore for DevelopmentCredentialStore {
    fn get(&self, key: SecureKey) -> Result<Option<String>, SecureStorageError> {
        Ok(self.values.get(&key).cloned())
    }

    fn set(&mut self, key: SecureKey, value: &str) -> Result<(), SecureStorageError> {
        self.values.insert(key, value.to_owned());
        Ok(())
    }

    fn delete(&mut self, key: SecureKey) -> Result<(), SecureStorageError> {
        self.values.remove(&key);
        Ok(())
    }
}

#[cfg(debug_assertions)]
fn development_store() -> &'static Mutex<DevelopmentCredentialStore> {
    static STORE: OnceLock<Mutex<DevelopmentCredentialStore>> = OnceLock::new();
    STORE.get_or_init(|| Mutex::new(DevelopmentCredentialStore::default()))
}

#[cfg(not(debug_assertions))]
fn map_keyring_error(error: KeyringError) -> SecureStorageError {
    let code = match error {
        KeyringError::NoStorageAccess(_) | KeyringError::PlatformFailure(_) => {
            SecureStorageErrorCode::EncryptionUnavailable
        }
        _ => SecureStorageErrorCode::StorageFailure,
    };
    SecureStorageError {
        code,
        message: error.to_string(),
    }
}

fn secure_get_with_store(store: &impl CredentialStore, key: SecureKey) -> SecureGetResult {
    match store.get(key) {
        Ok(value) => SecureGetResult {
            ok: true,
            value,
            error: None,
        },
        Err(error) => SecureGetResult {
            ok: false,
            value: None,
            error: Some(error),
        },
    }
}

fn secure_set_with_store(
    store: &mut impl CredentialStore,
    key: SecureKey,
    value: &str,
) -> SecureMutationResult {
    match store.set(key, value) {
        Ok(()) => SecureMutationResult {
            ok: true,
            error: None,
        },
        Err(error) => SecureMutationResult {
            ok: false,
            error: Some(error),
        },
    }
}

fn secure_delete_with_store(
    store: &mut impl CredentialStore,
    key: SecureKey,
) -> SecureMutationResult {
    match store.delete(key) {
        Ok(()) => SecureMutationResult {
            ok: true,
            error: None,
        },
        Err(error) => SecureMutationResult {
            ok: false,
            error: Some(error),
        },
    }
}

#[tauri::command]
#[specta::specta]
pub fn secure_get(key: SecureKey) -> SecureGetResult {
    #[cfg(debug_assertions)]
    {
        let store = development_store()
            .lock()
            .expect("secure storage lock poisoned");
        secure_get_with_store(&*store, key)
    }
    #[cfg(not(debug_assertions))]
    {
        secure_get_with_store(&OsCredentialStore, key)
    }
}

#[tauri::command]
#[specta::specta]
pub fn secure_set(key: SecureKey, value: String) -> SecureMutationResult {
    #[cfg(debug_assertions)]
    {
        let mut store = development_store()
            .lock()
            .expect("secure storage lock poisoned");
        secure_set_with_store(&mut *store, key, &value)
    }
    #[cfg(not(debug_assertions))]
    {
        secure_set_with_store(&mut OsCredentialStore, key, &value)
    }
}

#[tauri::command]
#[specta::specta]
pub fn secure_delete(key: SecureKey) -> SecureMutationResult {
    #[cfg(debug_assertions)]
    {
        let mut store = development_store()
            .lock()
            .expect("secure storage lock poisoned");
        secure_delete_with_store(&mut *store, key)
    }
    #[cfg(not(debug_assertions))]
    {
        secure_delete_with_store(&mut OsCredentialStore, key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[derive(Default)]
    struct MemoryCredentialStore {
        values: HashMap<SecureKey, String>,
        unavailable: bool,
    }

    impl CredentialStore for MemoryCredentialStore {
        fn get(&self, key: SecureKey) -> Result<Option<String>, SecureStorageError> {
            if self.unavailable {
                return Err(SecureStorageError {
                    code: SecureStorageErrorCode::EncryptionUnavailable,
                    message: "unavailable".into(),
                });
            }
            Ok(self.values.get(&key).cloned())
        }

        fn set(&mut self, key: SecureKey, value: &str) -> Result<(), SecureStorageError> {
            self.values.insert(key, value.to_string());
            Ok(())
        }

        fn delete(&mut self, key: SecureKey) -> Result<(), SecureStorageError> {
            self.values.remove(&key);
            Ok(())
        }
    }

    #[test]
    fn stores_gets_and_deletes_known_keys() {
        let mut store = MemoryCredentialStore::default();

        assert!(matches!(
            secure_set_with_store(&mut store, SecureKey::AccessToken, "secret"),
            SecureMutationResult { ok: true, .. }
        ));
        assert!(matches!(
            secure_get_with_store(&store, SecureKey::AccessToken),
            SecureGetResult { ok: true, value: Some(value), .. } if value == "secret"
        ));
        assert!(matches!(
            secure_delete_with_store(&mut store, SecureKey::AccessToken),
            SecureMutationResult { ok: true, .. }
        ));
        assert!(matches!(
            secure_get_with_store(&store, SecureKey::AccessToken),
            SecureGetResult {
                ok: true,
                value: None,
                ..
            }
        ));
    }

    #[test]
    fn reports_keychain_unavailable_without_exposing_secret_values() {
        let store = MemoryCredentialStore {
            unavailable: true,
            ..Default::default()
        };

        assert!(matches!(
            secure_get_with_store(&store, SecureKey::RefreshToken),
            SecureGetResult {
                ok: false,
                error: Some(SecureStorageError {
                    code: SecureStorageErrorCode::EncryptionUnavailable,
                    ..
                }),
                ..
            }
        ));
    }

    #[cfg(debug_assertions)]
    #[test]
    fn development_commands_share_process_memory() {
        assert!(secure_delete(SecureKey::ShowcaseSecret).ok);
        assert!(secure_set(SecureKey::ShowcaseSecret, "secret".into()).ok);
        assert!(matches!(
            secure_get(SecureKey::ShowcaseSecret),
            SecureGetResult {
                ok: true,
                value: Some(value),
                ..
            } if value == "secret"
        ));
        assert!(secure_delete(SecureKey::ShowcaseSecret).ok);
        assert!(matches!(
            secure_get(SecureKey::ShowcaseSecret),
            SecureGetResult {
                ok: true,
                value: None,
                ..
            }
        ));
    }
}
