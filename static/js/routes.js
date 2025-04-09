const debug = true; // Set to false in production

function getRouteTemplates() {
    const templates = document.getElementById('route-templates');
    if (!templates) {
        console.error('No route templates found');
        return null;
    }
    return templates;
}

function spinner(duration=3000, kill=false) {
    if (document.getElementById('spinner_container') && kill) {
        const spinnerContainer = document.getElementById('spinner_container');
        spinnerContainer.classList.toggle('show', false);
        setTimeout(() => {
            spinnerContainer.remove();
        }, 500);
        return;
    }
    if (document.getElementById('spinner_container') && !kill) {
        console.error('Spinner already exists');
        return;
    }

    const spinnerContainer = document.createElement('div');
    spinnerContainer.classList.add('spinner_container', 'hide');
    spinnerContainer.id = 'spinner_container';
    const spinnerElement = document.createElement('div');
    spinnerElement.classList.add('spinner');
    spinnerContainer.appendChild(spinnerElement);
    document.body.appendChild(spinnerContainer);

    // Add CSS for the spinner
    const style = document.createElement('style');
    style.textContent = `
    .spinner_container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        width: 65px;
        height: 65px;
        background-color: rgba(87, 0, 218, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999;
        opacity: 0;
        transition: opacity 0.5s ease, transform 0.5s ease;
        pointer-events: none;
    }
    
    .spinner_container.show {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
        pointer-events: auto;
    }
    
 
    .spinner {
        position: fixed;
        top: 50%;
        left: 50%;
        width: 50px;
        height: 50px;
        margin: -25px 0 0 -25px;
        border: 5px solid rgba(0, 0, 0, 0.1);
        border-top: 5px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        z-index: 1000;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        spinnerContainer.classList.toggle('show', true);
    }, 0);

    // Infinite spinner
    if (duration === 0) {
        return;
    }

    // Remove spinner after 3 seconds (example)
    setTimeout(() => {
        spinnerContainer.classList.toggle('show', false);
        setTimeout(() => {
            spinnerContainer.remove();
            style.remove();
        }, 500);
    }, duration);
}

async function renderTemplates(templates) {
    const pallete = document.getElementById('pallete');
    if (!pallete) {
        console.error('No pallete found');
        return null;
    }
    const clone = templates.content.cloneNode(true);
    const draggables = clone.querySelectorAll('.draggable');
    if (draggables.length > 0) {
        for (const draggable of draggables) {
            draggable.setAttribute('draggable', 'true');
            draggable.addEventListener('dragstart', function(event) {
                event.dataTransfer.setData('application/json', JSON.stringify({ id: draggable.id, parentID: "pallete" }));
            });
        }
    }
    pallete.appendChild(clone);
    if (debug) {
        console.log('Rendered templates:', templates);
    }
}

function getOptionValue(options, key, defaultValue) {
    if (!Array.isArray(options) || options.length === 0) {
        console.error('Options is not an array');
        return defaultValue;
    }
    if (debug) {
        console.log('Options:', options);
        console.log('Key:', key);
        console.log('Default value:', defaultValue);
    }
    const result = options.find(option => option.hasOwnProperty(key));
    if (debug) {
        console.log('Result:', result);
    }
    return result ? result[key] : defaultValue;
}

function collectChildIDs(element, childIDs = []) {
    if (!element) return childIDs;

    if (element.id === 'general_options') {
        // Skip the general options and workspace container 
        // Skip the general options container
        return childIDs;
    }

    // Add the current element's ID if it exists
    if (element.id) {
        childIDs.push(element.id);
    }

    // Recursively process all children
    if (element.children.length === 0) {
        // If there are no children, check if the element has a class name
        return childIDs;
    }
    for (const child of element.children) {
        collectChildIDs(child, childIDs);
    }

    return childIDs;
}

function returnProxyHandle(handleOptions, generalOptionsValues) {
    if (debug) {
        console.log('Handle options:', handleOptions);
        console.log('General options:', generalOptionsValues);
    }
    handle = {
        "handle": [
        {
            "handler": "subroute",
            "routes": [
            {
                "handle": [
                {
                    "handler": "reverse_proxy",
                    "upstreams": [
                    {
                        "dial": handleOptions.find(option => option.hasOwnProperty('proxyURL'))?.proxyURL
                    }
                    ]
                }
                ]
            }
            ]
        }
        ],
        "match": [
        {
            "host": [
            getOptionValue(generalOptionsValues, 'siteURL', null)
            ]
        }
        ],
        "terminal": true
    };
    return handle;
}

function returnStaticRouteHandle(handleOptions, generalOptionsValues) {
    if (debug) {
        console.log('Handle options:', handleOptions);
        console.log('General options:', generalOptionsValues);
    }
    const isBrowseable = handleOptions.find(option => option.hasOwnProperty('browseable'))?.browseable;
    const isFolderPath = getOptionValue(handleOptions, 'folderPath', null);

    let handle = {};
    if (isFolderPath) {
        handle = {
            "handle": [
              {
                "handler": "subroute",
                "routes": [
                  {
                    "handle": [
                      {
                        "handler": "vars",
                        "root": getOptionValue(handleOptions, 'folderPath', null)
                      },
                      {
                        "handler": "file_server",
                        "hide": [
                          "./Caddyfile"
                        ]
                      }
                    ]
                  }
                ]
              }
            ],
            "match": [
              {
                "host": [
                    getOptionValue(generalOptionsValues, 'siteURL', null)
                ]
              }
            ],
            "terminal": true
        };
    } else {
        handle = {
            "handle": [
              {
                "handler": "subroute",
                "routes": [
                  {
                    "handle": [
                      {
                        "handler": "file_server",
                        "hide": [
                          "./Caddyfile"
                        ]
                      }
                    ]
                  }
                ]
              }
            ],
            "match": [
              {
                "host": [
                    getOptionValue(generalOptionsValues, 'siteURL', null)?.siteURL
                ]
              }
            ],
            "terminal": true
        };
    }
    if (isBrowseable && isFolderPath) {
        // Add "browse" to the same object with "handler": "file_server"
        handle.handle[0].routes[0].handle[1] = {
            ...handle.handle[0].routes[0].handle[1],
            browse: {}
        };
    } else if (isBrowseable) {
        // Add "browse" to the same object with "handler": "file_server"
        handle.handle[0].routes[0].handle[0] = {
            ...handle.handle[0].routes[0].handle[0],
            browse: {}
        };
    }
    return handle;
}
    

function convertWorkspaceToHandle() {
    const workspace = document.getElementById('workspace');
    const handle_type = workspace.querySelector('#reverseproxy')?.id || workspace.querySelector('#staticroute')?.id;
    if (debug) {
        console.log('Handle type:', handle_type);
    }
    if (!workspace) {
        console.error('No workspace found');
        return null;
    }
    const generalOptionsContainer = workspace.querySelector('#general_options');
    if (!generalOptionsContainer) {
        console.error('No general options container found');
        return null;
    }
    const generalOptions = generalOptionsContainer.querySelectorAll('[data-handleinfo]');

    const generalOptionsValues = [];
    for (const option of generalOptions) {
        if (option.hasAttribute('data-handleinfo')) {
            let value;
            if (option.tagName === 'INPUT' && option.type === 'checkbox') {
                value = option.checked;
            } else if (option.tagName === 'TEXTAREA') {
                value = option.value;
            } else if (option.tagName === 'SELECT') {
                value = option.options[option.selectedIndex].value;
            } else {
                value = option.value;
            }
            if (debug) {
                console.log(`Handle info: ${option.id}, Value: ${value}`);
            }
            generalOptionsValues.push({ [option.id]: value });
        }
    }


    let handleOptions = [];
    for (const child of workspace.children) {
        if (child.id === 'general_options') {
            // Skip the general options container
            continue;
        }
        if (!child.tagName === 'DIV') {
            // Skip non-DIV elements, we are looking for "containers"
            continue;
        }
        console.log('Child:', child);
        const dataFields = child.querySelectorAll('[data-handleinfo]')
        console.log('Data:', dataFields);
        for (const option of dataFields) {
            let value;
            if (option.tagName === 'TEXTAREA') {
                value = option.value;
            } else if (option.tagName === 'INPUT' && option.type === 'checkbox') {
                value = option.checked;
            } else if (option.tagName === 'SELECT') {
                value = option.options[option.selectedIndex].value;
            } else {
                value = option.value;
            }
            if (debug) {
                console.log(`Handle info: ${option.id}, Value: ${value}`);
            }
            handleOptions.push({ [option.id]: value });
        }
        if (debug) {
            console.log('Handle options:', handleOptions);
        }

    }
    let handle = {};
    switch (handle_type) {
        case 'reverseproxy':
            handle = returnProxyHandle(handleOptions, generalOptionsValues);
            break;
        case 'staticroute':
            handle = returnStaticRouteHandle(handleOptions, generalOptionsValues);
            break;
        default:
            console.error('Unknown handle type:', handle_type);
            return null;
    }
    if (debug) {
        console.log('Handle:', handle);
    }
    return handle;
}



async function addHandleToCaddy(newHandle) {
    spinner(1000); // Show spinner
    if (newHandle === null) {
        console.error('No handle to add');
        return null;
    }
    const path = "apps/http/servers/srv0/routes"; // The configuration path

    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('/config/array', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path, items: [newHandle] }) // Send path and items
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                reject(new Error(`Server error: ${response.status} - ${errorDetails.error || 'Unknown error'}`));
                return;
            }

            const result = await response.json();
            console.log('Handle added successfully:', result);
            spinner(0, true); // Hide spinner
            resolve(result); // Resolve the promise with the result
        } catch (error) {
            console.error('Error adding handle:', error);
            spinner(0, true); // Hide spinner
            reject(error); // Reject the promise with the error
        }
    });
}

function handleDrop(event, dropzone, pallete) {
    event.preventDefault();
    // Check if we are still in the same dropzone
    console.log(event.dataTransfer);
    const data = JSON.parse(event.dataTransfer.getData('application/json'));
    if (debug) {
        console.log('Dropped data:', data);
    }
    // Handle the dropped data here
    if (data.parentID === dropzone.id) {
        if (debug) {
            console.log('Dropped in the same dropzone');
        }
        return; // Exit if dropped in the same dropzone
    }

    const droppedElement = document.getElementById(data.id);
    if (droppedElement) {
        if (droppedElement.classList.contains('enable-trash') && droppedElement.getElementsByClassName('trash-button').length === 0) {
            if (debug) {
                console.log('Dropped element is a trashable');
            }
            const trashButton = document.createElement('button');
            trashButton.classList.add('btn', 'btn-danger', 'trash-button', 'ms-auto');
            const trashIcon = document.createElement('i');
            trashIcon.classList.add('bi', 'bi-trash');
            trashButton.appendChild(trashIcon);
            droppedElement.children[0].appendChild(trashButton);
            droppedElement.classList.remove('enable-trash');
            if (droppedElement.hasAttribute('draggable')) {
                droppedElement.removeAttribute('draggable');
            }
            for (const child of pallete.children) {
                child.classList.toggle('draggable', false);
                if (child.hasAttribute('draggable')) {
                    child.removeAttribute('draggable');
                }
            }
            pallete.classList.toggle('inactive', true);

            trashButton.addEventListener('click', function() {
                droppedElement.classList.add('enable-trash');
                droppedElement.setAttribute('draggable', 'true');
                dropzone.removeChild(droppedElement);
                for (const child of pallete.children) {
                    child.classList.toggle('draggable', true);
                    child.setAttribute('draggable', 'true');
                }

                for (const element of droppedElement.getElementsByClassName('input-group')) {
                    for (const child of element.children) {
                        if (child.tagName === 'INPUT' || child.tagName === 'TEXTAREA') {
                            child.value = ''; // Reset the field value
                            if (debug) {
                                console.log(`Resetting target element with ID: ${child.id}`);
                            }
                        }
                    }
                }
                pallete.classList.toggle('inactive', false);
                trashButton.remove();
                if (debug) {
                    console.log(`Removed trash button from dropped element: ${droppedElement.id}`);
                }
                const parentElement = document.getElementById(data.parentID);
                if (parentElement) {
                    parentElement.appendChild(droppedElement);

                } else {
                    console.error('No parent element found with ID:', data.parentID);
                }
            });
        } else {
            if (debug) {
                console.log('Dropped element is not trashable');
            }
        }

        dropzone.appendChild(droppedElement);
        if (debug) {
            console.log('Dropped element:', droppedElement);
        }

    } else {
        console.error('No element found with ID:', data);
    }
}


function initDragDrop(dropzones, pallete) {
    // This is just a test of drag drop functionality
    if (dropzones.length > 0) {
        for (let i = 0; i < dropzones.length; i++) {
            const dropzone = dropzones[i];
            dropzone.addEventListener('dragover', function(event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            });
            dropzone.addEventListener('drop', (event) => handleDrop(event, dropzone, pallete));
                
        }
        console.log('Drag and drop initialized');
    }
}

async function adaptCaddyfile(caddyfile) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('/adapt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/caddyfile'
                },
                body: caddyfile
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                reject(new Error(`Server error: ${response.status} - ${errorDetails.error || 'Unknown error'}`));
                return;
            }
            // Check if the response is JSON
            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response, but got ${contentType}`);
            }
            const result = await response.json();
            console.log('Adapted Caddyfile:', result);
            resolve(result); // Resolve the promise with the result
        } catch (error) {
            console.error('Error adapting Caddyfile:', error);
            reject(error); // Reject the promise with the error
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.createBanner) {
        console.error('createBanner function is not defined');
        console.error('Ensure birdie.js is loaded before this script');
        return;
    }
    
    const templates = getRouteTemplates();
    renderTemplates(templates);

    const workspace = document.getElementById('workspace');
    const pallete = document.getElementById('pallete');
    if (!workspace || !pallete) {
        console.error('No workspace or pallete found');
        return null;
    } 
    
    // MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    // const observer = new MutationObserver(function(mutations) {
    //     for (const mutation of mutations) {
    //         if (mutation.type === 'childList') {
    //             console.log('Child list changed:', mutation);
    //             const jsonOutput = convertWorkspaceToHandle();
    //             const jsonOutputPre = document.getElementById('jsonOutput');
    //             if (jsonOutputPre) {
    //                 jsonOutputPre.textContent = JSON.stringify(jsonOutput, null, 2);
    //                 jsonOutputPre.classList.toggle('d-none', false);
    //             } else {
    //                 console.error('No JSON output element found');
    //             }
    //         }
    //     }
    // });
    // observer.observe(workspace, {
    //     childList: true,
    //     subtree: true
    // });

    // Any element with the ID 'dropzone' will be used as the drop target
    // Any element with the class 'draggable' will be draggable
    const dropzones = document.getElementsByClassName('dropzone');
    const resetButtons = document.getElementsByClassName('reset-button');

    if (debug) {
        console.log('Debug mode is enabled');
        console.log('Dropzones:', dropzones);
        console.log('Reset buttons:', resetButtons);
    }

    const resetContainers = document.getElementsByClassName('reset-fields');
    console.log('Reset containers:', resetContainers);
    for (const resetContainer of resetContainers) {
        if (debug) {
            console.log('Reset container:', resetContainer);
        }
    // Attach a single event listener to the parent container
        resetContainer.addEventListener('click', function(event) {
            // Check if the clicked element is a reset button
            let target;
            if (event.target.tagName === 'I' && event.target.parentElement.classList.contains('reset-button')) {
                if (debug) {
                    console.log('Clicked on an icon inside a reset button');
                }
                target = event.target.parentElement.getAttribute('data-target');
            } else if (event.target.classList.contains('reset-button')) {
                target = event.target.getAttribute('data-target');
            } else {
                if (debug) {
                    console.log('Clicked element is not a reset button');
                }
                return; // Exit if not a reset button
            }
            const targetElement = document.getElementById(target);
            if (targetElement) {
                targetElement.value = ''; // Reset the field value
                if (debug) {
                    console.log(`Resetting target element with ID: ${target}`);
                }
            } else if (debug) {
                console.error(`No element found with ID: ${target}`);
            }
        });
    }

    initDragDrop(dropzones, pallete);    
    const saveButton = document.getElementById('save-button');
    const clearButton = document.getElementById('clear-button');
    const previewButton = document.getElementById('preview-button');
    const jsonOutputPre = document.getElementById('jsonOutput');
    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            const newHandle = convertWorkspaceToHandle();
            try {
                const result = await addHandleToCaddy(newHandle);
                if (result === null) {
                    console.error('No result from addHandleToCaddy');
                    return;
                }
                createBanner('Handle added successfully!', 'success');
                for (const child of workspace.children) {
                    if (child.id === 'general_options') {
                        // Skip the general options container
                        continue;
                    }
                    child.remove();
                }
                const pallete = document.getElementById('pallete');
                pallete.innerHTML = ''; // Clear the pallete
                renderTemplates(templates); // Re-render the templates
            } catch (error) {
                console.error('Error adding handle:', error);
                createBanner(`Error adding handle!, error:${error}`, 'error', 0, true);
            }
        });
    } else {
        console.error('No save button found');
    }
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            const workspace = document.getElementById('workspace');
            if (workspace) {
                for (const child of workspace.children) {
                    if (child.id === 'general_options') {
                        // Skip the general options container
                        continue;
                    }
                    child.remove();
                }
            } else {
                console.error('No workspace found');
            }
        });
    } else {
        console.error('No clear button found');
    }
    if (previewButton) {
        previewButton.addEventListener('click', function() {
            const newHandle = convertWorkspaceToHandle();
            if (debug) {
                console.log('New handle:', newHandle);
            }
            jsonOutputPre.textContent = JSON.stringify(newHandle, null, 2);
            jsonOutputPre.classList.toggle('d-none', false);
        });
    } else {
        console.error('No preview button found');
    }
});


