const debug = true; // Set to false in production

function getRouteTemplates() {
    const templates = document.getElementById('route-templates');
    if (!templates) {
        console.error('No route templates found');
        return null;
    }
    return templates;
}

function renderTemplates(templates) {
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
    const generalOptions = generalOptionsContainer.querySelectorAll('[data-handleinfo]');

    const generalOptionsValues = [];
    for (const option of generalOptions) {
        if (option.hasAttribute('data-handleinfo')) {
            let value;
            if (option.type === 'checkbox') {
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
    if (debug) {
        console.log('General options:', generalOptionsValues.find(x => x.id === 'siteURL'));
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
            }
            else if (option.tagName === 'SELECT') {
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
    if (handle_type === 'reverseproxy') {
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
                generalOptionsValues.find(option => option.hasOwnProperty('siteURL'))?.siteURL
                ]
            }
            ],
            "terminal": true
        };
    }
    if (debug) {
        console.log('Handle:', handle);
    }
    return handle;
}


function convertToHandle(elements) {
   
}

async function addHandleToCaddy(newHandle) {
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
            resolve(result); // Resolve the promise with the result
        } catch (error) {
            console.error('Error adding handle:', error);
            reject(error); // Reject the promise with the error
        }
    });
}

// Call the function (e.g., on a button click)
// document.getElementById('addHandleButton').addEventListener('click', addHandleToCaddy);

document.addEventListener('DOMContentLoaded', function() {
    if (!window.createBanner) {
        console.error('createBanner function is not defined');
        console.error('Ensure birdie.js is loaded before this script');
        return;
    }
    
    const templates = getRouteTemplates();
    renderTemplates(templates);

    const workspace = document.getElementById('workspace');
    if (!workspace) {
        console.error('No workspace found');
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

    // This is just a test of drag drop functionality
    if (dropzones.length > 0) {
        for (let i = 0; i < dropzones.length; i++) {
            const dropzone = dropzones[i];
            dropzone.addEventListener('dragover', function(event) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            });
            dropzone.addEventListener('drop', function(event) {
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
                        droppedElement.attributes.removeNamedItem('draggable');

                        trashButton.addEventListener('click', function() {
                            droppedElement.classList.add('enable-trash');
                            droppedElement.setAttribute('draggable', 'true');
                            dropzone.removeChild(droppedElement);

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
            });
        }
        console.log('Drag and drop initialized');
    }
    const saveButton = document.getElementById('save-button');
    const clearButton = document.getElementById('clear-button');
    const previewButton = document.getElementById('preview-button');
    const jsonOutputPre = document.getElementById('jsonOutput');
    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            const newHandle = convertWorkspaceToHandle();
            if (debug) {
                console.log('New handle:', newHandle);
            }
            try {
                const result = await addHandleToCaddy(newHandle);
                createBanner('Handle added successfully!', 'success');
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


