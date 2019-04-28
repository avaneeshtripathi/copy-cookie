// When the popup Paste Button is clicked
const onCopyButtonClick = () => {
    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            chrome.cookies.getAll({ url: tab[0].url }, cookie => {
                localStorage.aviCookieData = JSON.stringify(cookie);
            });
        },
    );
    setTimeout(handlePopupUI, 200);
};

// When the popup Paste Button is clicked
const onPasteButtonClick = () => {
    const aviCookieData = localStorage.aviCookieData
        ? JSON.parse(localStorage.aviCookieData)
        : null;
    if (!aviCookieData)
        return alert('Oh Man! You need to copy the cookies first.');

    let domain = document.getElementById('domainInput').value.trim();
    if (!domain) domain = 'localhost';

    let validTabUrl = true;

    chrome.tabs.query(
        {
            status: 'complete',
            windowId: chrome.windows.WINDOW_ID_CURRENT,
            active: true,
        },
        tab => {
            if (tab[0].url) {
                chrome.cookies.getAll({ url: tab[0].url }, cookies => {
                    for (let i = 0; i < cookies.length; i++) {
                        chrome.cookies.remove({
                            url: tab[0].url + cookies[i].path,
                            name: cookies[i].name,
                        });
                    }
                });
                aviCookieData.forEach(({ name, value, path }, index) => {
                    try {
                        chrome.cookies.set({
                            url: tab[0].url,
                            name,
                            value,
                            path,
                            domain,
                        });
                    } catch (error) {
                        console.error(`There was an error: ${error}`);
                    }
                });
            } else {
                validTabUrl = false;
                return alert('Tab with invalid URL. Are you kidding me ???');
            }
        },
    );
    setTimeout(() => {
        if (validTabUrl) onResetButtonClick(true);
    }, 200);
};

// When the popup Reset Button is clicked
const onResetButtonClick = pasted => {
    localStorage.removeItem('aviCookieData');
    handlePopupUI(pasted);
};

const handlePopupUI = pasted => {
    const aviCookieData = localStorage.aviCookieData
        ? JSON.parse(localStorage.aviCookieData)
        : null;
    const containerElement = document.getElementById('container');
    containerElement.setAttribute('class', '');
    if (aviCookieData) {
        containerElement.classList.add('container2');
    } else {
        containerElement.classList.add('container1');
    }

    const successpasteLabel = document.getElementById('successPasteLabel');
    if (pasted) {
        successpasteLabel.setAttribute('style', 'display: block');
    } else {
        successpasteLabel.setAttribute('style', 'display: none');
    }
};

// When the popup HTML has loaded
window.addEventListener('load', event => {
    handlePopupUI();

    document
        .getElementById('copyButton')
        .addEventListener('click', onCopyButtonClick);
    document
        .getElementById('pasteButton')
        .addEventListener('click', onPasteButtonClick);
    document
        .getElementById('resetButton')
        .addEventListener('click', () => onResetButtonClick());
});
