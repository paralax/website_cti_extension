document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');
    const addKeyBtn = document.getElementById('add-key-btn');
    const keyFormContainer = document.getElementById('key-form-container');
    const formTitle = document.getElementById('form-title');
    const keyIndexInput = document.getElementById('key-index');
    const keyNameInput = document.getElementById('key-name-input');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const cancelKeyBtn = document.getElementById('cancel-key-btn');
    const apiKeysTable = document.getElementById('api-keys-table').getElementsByTagName('tbody')[0];

    loadApiKeys();

    function migrateOldKey() {
        chrome.storage.local.get('geminiApiKey', (result) => {
            if (result.geminiApiKey) {
                const newKey = { name: 'Default', key: result.geminiApiKey };
                chrome.storage.local.set({ geminiApiKeys: [newKey] }, () => {
                    chrome.storage.local.remove('geminiApiKey', () => {
                        console.log('Old API key migrated.');
                        loadApiKeys();
                    });
                });
            }
        });
    }

    function loadApiKeys() {
        chrome.storage.local.get({ geminiApiKeys: [] }, (result) => {
            const keys = result.geminiApiKeys;
            if (keys.length === 0) {
                // Check if there is an old key to migrate
                migrateOldKey();
                return;
            }

            apiKeysTable.innerHTML = '';
            keys.forEach((apiKey, index) => {
                const row = apiKeysTable.insertRow();
                const nameCell = row.insertCell(0);
                const keyCell = row.insertCell(1);
                const actionsCell = row.insertCell(2);

                nameCell.textContent = apiKey.name;
                keyCell.textContent = '...'.concat(apiKey.key.slice(-4));

                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => editKey(index));
                actionsCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteKey(index));
                actionsCell.appendChild(deleteButton);
            });
        });
    }

    function showForm(title, index = '', name = '', key = '') {
        formTitle.textContent = title;
        keyIndexInput.value = index;
        keyNameInput.value = name;
        apiKeyInput.value = key;
        keyFormContainer.style.display = 'block';
    }

    function hideForm() {
        keyFormContainer.style.display = 'none';
        keyIndexInput.value = '';
        keyNameInput.value = '';
        apiKeyInput.value = '';
    }

    function editKey(index) {
        chrome.storage.local.get({ geminiApiKeys: [] }, (result) => {
            const key = result.geminiApiKeys[index];
            showForm('Edit API Key', index, key.name, key.key);
        });
    }

    function deleteKey(index) {
        if (confirm('Are you sure you want to delete this key?')) {
            chrome.storage.local.get({ geminiApiKeys: [] }, (result) => {
                let keys = result.geminiApiKeys;
                keys.splice(index, 1);
                chrome.storage.local.set({ geminiApiKeys: keys }, () => {
                    statusDiv.textContent = 'API key deleted.';
                    setTimeout(() => {
                        statusDiv.textContent = '';
                    }, 2000);
                    loadApiKeys();
                });
            });
        }
    }

    addKeyBtn.addEventListener('click', () => {
        showForm('Add API Key');
    });

    cancelKeyBtn.addEventListener('click', () => {
        hideForm();
    });

    saveKeyBtn.addEventListener('click', () => {
        const name = keyNameInput.value;
        const key = apiKeyInput.value;
        const index = keyIndexInput.value;

        if (name && key) {
            chrome.storage.local.get({ geminiApiKeys: [] }, (result) => {
                let keys = result.geminiApiKeys;
                if (index !== '') {
                    // Editing existing key
                    keys[index] = { name, key };
                } else {
                    // Adding new key
                    keys.push({ name, key });
                }

                chrome.storage.local.set({ geminiApiKeys: keys }, () => {
                    statusDiv.textContent = 'API key saved.';
                    setTimeout(() => {
                        statusDiv.textContent = '';
                    }, 2000);
                    hideForm();
                    loadApiKeys();
                });
            });
        } else {
            alert('Please fill in both name and key fields.');
        }
    });
});
