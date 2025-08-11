// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const snippetForm = document.getElementById('snippet-form');
    const snippetTitle = document.getElementById('snippet-title');
    const snippetCategory = document.getElementById('snippet-category');
    const snippetContent = document.getElementById('snippet-content');
    const categoriesContainer = document.getElementById('categories-container');
    const messageBox = document.getElementById('message-box');
    const loadingMessage = document.getElementById('loading-message');

    // Subject Management Modal elements
    const manageSubjectsBtn = document.getElementById('manage-subjects-btn');
    const subjectModal = document.getElementById('subject-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const subjectListContainer = document.getElementById('subject-list');
    const addSubjectForm = document.getElementById('add-subject-form');
    const newSubjectNameInput = document.getElementById('new-subject-name');
    const loadingSubjectsMessage = document.getElementById('loading-subjects-message');
    const subjectMessageBox = document.getElementById('subject-message-box');

    // Array to store current categories (subjects)
    let currentSubjects = [];

    // --- Utility Functions ---

    // Function to display messages to the user (main form)
    function showMessage(message, type = 'success') {
        messageBox.textContent = message;
        messageBox.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-yellow-100', 'text-yellow-800');
        if (type === 'success') {
            messageBox.classList.add('bg-green-100', 'text-green-800');
        } else if (type === 'error') {
            messageBox.classList.add('bg-red-100', 'text-red-800');
        } else if (type === 'warning') {
            messageBox.classList.add('bg-yellow-100', 'text-yellow-800');
        }
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 5000);
    }

    // Function to display messages to the user (subject modal)
    function showSubjectMessage(message, type = 'success') {
        subjectMessageBox.textContent = message;
        subjectMessageBox.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-yellow-100', 'text-yellow-800');
        if (type === 'success') {
            subjectMessageBox.classList.add('bg-green-100', 'text-green-800');
        } else if (type === 'error') {
            subjectMessageBox.classList.add('bg-red-100', 'text-red-800');
        } else if (type === 'warning') {
            subjectMessageBox.classList.add('bg-yellow-100', 'text-yellow-800');
        }
        setTimeout(() => {
            subjectMessageBox.classList.add('hidden');
        }, 5000);
    }

    // Helper function to escape HTML to prevent XSS
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // --- Subject Management Functions ---

    // Fetches subjects from the backend and updates the UI
    async function fetchSubjects() {
        loadingSubjectsMessage.classList.remove('hidden');
        snippetCategory.innerHTML = '<option value="default" disabled selected>Loading Subjects...</option>'; // Reset dropdown
        try {
            const response = await fetch('/api/subjects');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const subjects = await response.json();
            currentSubjects = subjects.map(s => s.name); // Store subject names
            populateSubjectDropdown(); // Update the dropdown
            populateSubjectListModal(subjects); // Update the modal list
        } catch (error) {
            console.error('Error fetching subjects:', error);
            showSubjectMessage('Failed to load subjects. Please refresh.', 'error');
            snippetCategory.innerHTML = '<option value="default" disabled selected>Error loading subjects</option>';
            subjectListContainer.innerHTML = '<p class="text-red-500 text-center">Error loading subjects.</p>';
        } finally {
            loadingSubjectsMessage.classList.add('hidden');
        }
    }

    // Populates the dropdown for creating new snippets
    function populateSubjectDropdown() {
        snippetCategory.innerHTML = '<option value="default" disabled selected>Select a Subject</option>';
        currentSubjects.forEach(subjectName => {
            const option = document.createElement('option');
            option.value = subjectName;
            option.textContent = subjectName;
            snippetCategory.appendChild(option);
        });
    }

    // Populates the list of subjects in the management modal
    function populateSubjectListModal(subjects) {
        subjectListContainer.innerHTML = ''; // Clear existing list
        if (subjects.length === 0) {
            subjectListContainer.innerHTML = '<p class="text-gray-500 text-center">No subjects added yet. Add one below!</p>';
            return;
        }
        subjects.forEach(subject => {
            const subjectDiv = document.createElement('div');
            subjectDiv.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2 last:mb-0';
            subjectDiv.innerHTML = `
                <span class="text-gray-700 font-medium">${escapeHTML(subject.name)}</span>
                <button
                    class="delete-subject-btn bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-md transition duration-200 ease-in-out"
                    data-id="${subject.id}"
                    data-name="${escapeHTML(subject.name)}"
                >
                    Delete
                </button>
            `;
            subjectListContainer.appendChild(subjectDiv);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-subject-btn').forEach(button => {
            button.addEventListener('click', handleDeleteSubject);
        });
    }

    // Handles adding a new subject
    addSubjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newSubjectName = newSubjectNameInput.value.trim();

        if (!newSubjectName) {
            showSubjectMessage('Subject name cannot be empty.', 'warning');
            return;
        }
        if (currentSubjects.map(s => s.toLowerCase()).includes(newSubjectName.toLowerCase())) {
            showSubjectMessage('Subject with this name already exists (case-insensitive).', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSubjectName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            showSubjectMessage(`Subject '${newSubjectName}' added!`, 'success');
            newSubjectNameInput.value = '';
            fetchSubjects(); // Refresh subjects list and dropdown
            fetchSnippets(); // Refresh snippets to account for potential new categories
        } catch (error) {
            console.error('Error adding subject:', error);
            showSubjectMessage(`Failed to add subject: ${error.message}.`, 'error');
        }
    });

    // Handles deleting a subject
    async function handleDeleteSubject(event) {
        const subjectId = event.target.dataset.id;
        const subjectName = event.target.dataset.name;

        // In a real app, you'd have a confirmation dialog here.
        // For simplicity, we'll proceed directly.
        // Replace with custom modal if needed, not alert().
        
        try {
            // Check if any snippets are associated with this subject first
            const checkResponse = await fetch(`/api/snippets/by-subject/${encodeURIComponent(subjectName)}`);
            if (!checkResponse.ok) {
                throw new Error(`HTTP error! status: ${checkResponse.status}`);
            }
            const associatedSnippets = await checkResponse.json();

            if (associatedSnippets.length > 0) {
                showSubjectMessage(`Cannot delete subject '${subjectName}'. It still has ${associatedSnippets.length} associated gist(s). Please reassign or delete gists in this subject first.`, 'error');
                return;
            }

            // If no associated snippets, proceed with deletion
            const response = await fetch(`/api/subjects/${subjectId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            showSubjectMessage(`Subject '${subjectName}' deleted!`, 'success');
            fetchSubjects(); // Refresh subjects list and dropdown
            fetchSnippets(); // Refresh snippets to remove deleted category section
        } catch (error) {
            console.error('Error deleting subject:', error);
            showSubjectMessage(`Failed to delete subject: ${error.message}.`, 'error');
        }
    }


    // --- Gist Management Functions ---

    // Function to fetch and display all snippets, grouped by category
    async function fetchSnippets() {
        loadingMessage.classList.remove('hidden');
        categoriesContainer.innerHTML = ''; // Clear existing content

        try {
            const response = await fetch('/api/snippets');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const snippets = await response.json();

            // Group snippets by category (using currentSubjects for order)
            const groupedSnippets = currentSubjects.reduce((acc, cat) => {
                acc[cat] = [];
                return acc;
            }, {});

            // Add 'Uncategorized' for snippets whose category might have been deleted or doesn't exist
            groupedSnippets['Uncategorized'] = [];

            snippets.forEach(snippet => {
                const category = snippet.category || 'Uncategorized';
                if (currentSubjects.includes(category)) { // Check if the category is still valid
                    groupedSnippets[category].push(snippet);
                } else {
                    groupedSnippets['Uncategorized'].push(snippet); // Assign to uncategorized if category isn't known
                }
            });

            let hasAnyGists = false;

            // Render each category section based on currentSubjects order
            currentSubjects.forEach(category => {
                // Ensure there's always a section, even if no gists
                renderCategorySection(category, groupedSnippets[category] || []);
                if (groupedSnippets[category] && groupedSnippets[category].length > 0) {
                    hasAnyGists = true;
                }
            });

            // Render Uncategorized section if there are any uncategorized gists
            if (groupedSnippets['Uncategorized'] && groupedSnippets['Uncategorized'].length > 0) {
                renderCategorySection('Uncategorized', groupedSnippets['Uncategorized']);
                hasAnyGists = true;
            }

            // Display messages based on overall gist and subject status
            if (!hasAnyGists && currentSubjects.length > 0) {
                categoriesContainer.innerHTML = '<p class="text-gray-500 text-center p-4">No gists yet. Be the first to create one!</p>';
            } else if (!hasAnyGists && currentSubjects.length === 0) {
                categoriesContainer.innerHTML = '<p class="text-gray-500 text-center p-4">No subjects defined yet. Please add subjects via "Manage Subjects" to organize your gists.</p>';
            }
            
            // Attach event listeners to all 'Add Code' buttons
            document.querySelectorAll('.add-code-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const selectedCategory = event.target.dataset.category;
                    snippetCategory.value = selectedCategory; // Pre-select the category
                    snippetTitle.focus(); // Put focus on the title input
                    snippetForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    showMessage(`Adding new gist to '${selectedCategory}' subject.`, 'success');
                });
            });

        } catch (error) {
            console.error('Error fetching snippets:', error);
            showMessage('Failed to load gists. Please try again.', 'error');
            categoriesContainer.innerHTML = '<p class="text-red-500 text-center p-4">Error loading gists.</p>';
        } finally {
            loadingMessage.classList.add('hidden');
        }
    }

    // Helper to render a single category section
    function renderCategorySection(categoryName, snippets) {
        const categorySection = document.createElement('div');
        categorySection.className = 'bg-white p-4 rounded-lg shadow-md border border-gray-200';
        categorySection.innerHTML = `
            <h3 class="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">${escapeHTML(categoryName)}</h3>
            <div id="snippets-for-${categoryName.toLowerCase().replace(/\s/g, '-')}" class="flex flex-col gap-3">
                <!-- Snippets for this category will go here -->
            </div>
            <button
                class="add-code-button bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 mt-4 w-full"
                data-category="${escapeHTML(categoryName)}"
            >
                + Add Code to ${escapeHTML(categoryName)}
            </button>
        `;
        categoriesContainer.appendChild(categorySection);

        const currentCategorySnippetsContainer = categorySection.querySelector(`#snippets-for-${categoryName.toLowerCase().replace(/\s/g, '-')}`);
        
        if (snippets && snippets.length > 0) {
            snippets.forEach(snippet => {
                const snippetDiv = document.createElement('div');
                snippetDiv.className = 'bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm transition transform hover:scale-[1.01] hover:shadow-md';
                
                const formattedDate = new Date(snippet.created_at).toLocaleString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });

                snippetDiv.innerHTML = `
                    <h4 class="text-md font-semibold text-gray-800 mb-1">${escapeHTML(snippet.title || 'No Title')}</h4>
                    <pre class="text-gray-700 whitespace-pre-wrap break-words text-sm sm:text-base font-mono mb-2 p-2 bg-gray-100 rounded-md overflow-x-auto">${escapeHTML(snippet.content)}</pre>
                    <p class="text-xs text-gray-500 text-right">ID: ${snippet.id} | ${formattedDate}</p>
                `;
                currentCategorySnippetsContainer.appendChild(snippetDiv);
            });
        } else {
            currentCategorySnippetsContainer.innerHTML = `<p class="text-gray-500 text-center py-2">No gists in this subject yet.</p>`;
        }
    }


    // Handle form submission to create a new snippet
    snippetForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = snippetTitle.value.trim();
        const category = snippetCategory.value;
        const content = snippetContent.value.trim();

        if (!title) {
            showMessage('Please enter a title for your gist.', 'warning');
            return;
        }
        if (category === 'default') {
            showMessage('Please select a subject for your gist.', 'warning');
            return;
        }
        if (!content) {
            showMessage('Please enter some content for your gist.', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/snippets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, category, content }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const newSnippet = await response.json();
            console.log('Snippet created:', newSnippet);
            showMessage('Gist saved successfully!', 'success');
            // Clear the form fields
            snippetTitle.value = '';
            snippetCategory.value = 'default';
            snippetContent.value = '';
            fetchSnippets(); // Refresh the list of snippets
        } catch (error) {
            console.error('Error creating snippet:', error);
            showMessage(`Failed to save gist: ${error.message}.`, 'error');
        }
    });

    // --- Modal Event Listeners ---
    manageSubjectsBtn.addEventListener('click', () => {
        subjectModal.classList.remove('hidden');
        fetchSubjects(); // Refresh the list in the modal when opened
    });

    closeModalBtn.addEventListener('click', () => {
        subjectModal.classList.add('hidden');
        subjectMessageBox.classList.add('hidden'); // Clear any messages in the modal
    });

    // Close modal if user clicks outside of it
    subjectModal.addEventListener('click', (event) => {
        if (event.target === subjectModal) {
            subjectModal.classList.add('hidden');
            subjectMessageBox.classList.add('hidden');
        }
    });

    // Initial fetch of subjects and snippets when the page loads
    fetchSubjects(); // Fetch subjects first to populate dropdown
    fetchSnippets(); // Then fetch snippets
});
